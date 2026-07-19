import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { _resetRateLimitForTests } from "@/lib/security/rate-limit";

// vi.mock factories are hoisted; use vi.hoisted for shared mock state.
const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }));
vi.mock("z-ai-web-dev-sdk", () => ({
  default: { create: async () => ({ chat: { completions: { create: createMock } } }) },
}));

import { POST } from "./route";

beforeEach(() => {
  createMock.mockReset();
  _resetRateLimitForTests();
});

function makeReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/ai-copy", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/ai-copy — input validation", () => {
  it("returns 400 for invalid JSON body", async () => {
    const req = new NextRequest("http://localhost:3000/api/ai-copy", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when type is not in the enum", async () => {
    const res = await POST(makeReq({ type: "evil" }));
    expect(res.status).toBe(400);
  });

  it("defaults type to headline when omitted", async () => {
    createMock.mockResolvedValueOnce({
      choices: [{ message: { content: "A great headline" } }],
    });
    const res = await POST(makeReq({}));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.text).toBe("A great headline");
  });
});

describe("POST /api/ai-copy — happy path", () => {
  it("returns the AI-generated text", async () => {
    createMock.mockResolvedValueOnce({
      choices: [{ message: { content: "Start Building Today" } }],
    });
    const res = await POST(makeReq({ type: "cta", current: "click here" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.text).toBe("Start Building Today");
  });

  it("trims surrounding quotes from the response", async () => {
    createMock.mockResolvedValueOnce({
      choices: [{ message: { content: `"Get Started Free"` } }],
    });
    const res = await POST(makeReq({ type: "cta" }));
    const body = await res.json();
    expect(body.text).toBe("Get Started Free");
  });
});

describe("POST /api/ai-copy — fallback path (KA 4 §2.3 regression)", () => {
  // Regression: the fallback path when the SDK throws was untested.
  it("returns a fallback when the SDK throws", async () => {
    createMock.mockRejectedValueOnce(new Error("model overloaded"));
    const res = await POST(makeReq({ type: "headline" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.text).toBeTruthy(); // a curated fallback
    expect(body.warning).toMatch(/unavailable|AI service/i);
  });

  it("returns a fallback when the SDK returns an empty response", async () => {
    createMock.mockResolvedValueOnce({ choices: [{ message: { content: "" } }] });
    const res = await POST(makeReq({ type: "headline" }));
    const body = await res.json();
    expect(body.text).toBeTruthy();
    expect(body.warning).toBeTruthy();
  });

  it("returns a fallback when createMock throws synchronously (import-failure simulation)", async () => {
    // Simulate the SDK module failing to load by making the chat call reject.
    createMock.mockRejectedValueOnce(new Error("module not found"));
    const res = await POST(makeReq({ type: "cta" }));
    const body = await res.json();
    expect(body.text).toBeTruthy();
    expect(body.warning).toMatch(/unavailable|AI service/i);
  });
});

describe("POST /api/ai-copy — rate limiting (KA 3 §4.3)", () => {
  it("allows up to 10 requests per minute per IP", async () => {
    createMock.mockResolvedValue({ choices: [{ message: { content: "x" } }] });
    for (let i = 0; i < 10; i++) {
      const res = await POST(makeReq({ type: "headline" }));
      expect(res.status).toBe(200);
    }
  });

  it("blocks the 11th request with 429", async () => {
    createMock.mockResolvedValue({ choices: [{ message: { content: "x" } }] });
    for (let i = 0; i < 10; i++) {
      await POST(makeReq({ type: "headline" }));
    }
    const res = await POST(makeReq({ type: "headline" }));
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toMatch(/rate limit/i);
    expect(res.headers.get("retry-after")).toBeTruthy();
  });
});
