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
      choices: [{ message: { content: JSON.stringify(["A great headline"]) } }],
    });
    const res = await POST(makeReq({}));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.variants).toEqual(["A great headline"]);
  });

  it("accepts a tone parameter", async () => {
    createMock.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(["Bold variant"]) } }],
    });
    const res = await POST(makeReq({ type: "headline", tone: "bold" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tone).toBe("bold");
    expect(body.variants).toEqual(["Bold variant"]);
  });

  it("defaults tone to confident", async () => {
    createMock.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(["Confident variant"]) } }],
    });
    const res = await POST(makeReq({ type: "headline" }));
    const body = await res.json();
    expect(body.tone).toBe("confident");
  });
});

describe("POST /api/ai-copy — happy path", () => {
  it("returns 3 AI-generated variants as an array", async () => {
    createMock.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(["Variant 1", "Variant 2", "Variant 3"]) } }],
    });
    const res = await POST(makeReq({ type: "cta", current: "click here" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.variants).toEqual(["Variant 1", "Variant 2", "Variant 3"]);
  });

  it("trims surrounding quotes from each variant", async () => {
    createMock.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(['"Get Started Free"', '"Try Now"']) } }],
    });
    const res = await POST(makeReq({ type: "cta" }));
    const body = await res.json();
    expect(body.variants).toEqual(["Get Started Free", "Try Now"]);
  });

  it("dedupes variants", async () => {
    createMock.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(["Same", "Same", "Different"]) } }],
    });
    const res = await POST(makeReq({ type: "headline" }));
    const body = await res.json();
    expect(body.variants).toEqual(["Same", "Different"]);
  });

  it("parses newline-separated fallback when JSON parse fails", async () => {
    createMock.mockResolvedValueOnce({
      choices: [{ message: { content: "First variant\nSecond variant\nThird variant" } }],
    });
    const res = await POST(makeReq({ type: "headline" }));
    const body = await res.json();
    expect(body.variants).toHaveLength(3);
    expect(body.variants[0]).toBe("First variant");
  });
});

describe("POST /api/ai-copy — fallback path (KA 4 §2.3 regression)", () => {
  it("returns fallback variants when the SDK throws", async () => {
    createMock.mockRejectedValueOnce(new Error("model overloaded"));
    const res = await POST(makeReq({ type: "headline" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.variants).toBeTruthy();
    expect(Array.isArray(body.variants)).toBe(true);
    expect(body.variants.length).toBeGreaterThan(0);
    expect(body.warning).toMatch(/unavailable|AI service/i);
  });

  it("returns fallback variants when the SDK returns an empty response", async () => {
    createMock.mockResolvedValueOnce({ choices: [{ message: { content: "" } }] });
    const res = await POST(makeReq({ type: "headline" }));
    const body = await res.json();
    expect(body.variants).toBeTruthy();
    expect(Array.isArray(body.variants)).toBe(true);
    expect(body.variants.length).toBeGreaterThan(0);
    expect(body.warning).toBeTruthy();
  });

  it("returns fallback variants when createMock throws synchronously", async () => {
    createMock.mockRejectedValueOnce(new Error("module not found"));
    const res = await POST(makeReq({ type: "cta" }));
    const body = await res.json();
    expect(body.variants).toBeTruthy();
    expect(Array.isArray(body.variants)).toBe(true);
    expect(body.variants.length).toBeGreaterThan(0);
    expect(body.warning).toMatch(/unavailable|AI service/i);
  });
});

describe("POST /api/ai-copy — rate limiting (KA 3 §4.3)", () => {
  it("allows up to 10 requests per minute per IP", async () => {
    createMock.mockResolvedValue({ choices: [{ message: { content: JSON.stringify(["x"]) } }] });
    for (let i = 0; i < 10; i++) {
      const res = await POST(makeReq({ type: "headline" }));
      expect(res.status).toBe(200);
    }
  });

  it("blocks the 11th request with 429", async () => {
    createMock.mockResolvedValue({ choices: [{ message: { content: JSON.stringify(["x"]) } }] });
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
