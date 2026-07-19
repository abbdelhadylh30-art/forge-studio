import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.mock factories are hoisted; use vi.hoisted for shared mock state.
const { fetchMock, lookupMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  lookupMock: vi.fn(),
}));
vi.stubGlobal("fetch", fetchMock);
vi.mock("node:dns/promises", () => ({ default: { lookup: lookupMock }, lookup: lookupMock }));

import { GET } from "./route";
import { NextRequest } from "next/server";

beforeEach(() => {
  fetchMock.mockReset();
  lookupMock.mockReset();
  lookupMock.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]); // public by default
});

function makeReq(url: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/fetch-url?url=${encodeURIComponent(url)}`);
}

describe("GET /api/fetch-url — input validation", () => {
  it("returns 400 when the url param is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/fetch-url");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/missing url/i);
  });

  it("returns 400 for a non-URL string", async () => {
    const res = await GET(makeReq("not-a-url"));
    expect(res.status).toBe(400);
  });

  it("returns 400 for a non-http protocol", async () => {
    const res = await GET(makeReq("ftp://example.com"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/http\/https/i);
  });
});

describe("GET /api/fetch-url — SSRF guard", () => {
  it("rejects a literal private IP (127.0.0.1)", async () => {
    const res = await GET(makeReq("http://127.0.0.1:3000/admin"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/private IP/i);
    // fetch must NOT have been called.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects AWS metadata IP (169.254.169.254)", async () => {
    const res = await GET(makeReq("http://169.254.169.254/latest/meta-data/"));
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a hostname that resolves to a private IP", async () => {
    lookupMock.mockResolvedValueOnce([{ address: "10.0.0.1", family: 4 }]);
    const res = await GET(makeReq("https://internal.example.com/"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/private IP|resolves/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("GET /api/fetch-url — fetch behavior", () => {
  it("returns sanitized HTML for a valid public URL", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("<html><head></head><body><h1>Hi</h1><script>alert(1)</script></body></html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      })
    );
    const res = await GET(makeReq("https://example.com/"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.html).toContain("<h1>Hi</h1>");
    // Script must be stripped by the sanitizer.
    expect(body.html).not.toContain("<script");
    expect(body.html).not.toContain("alert(1)");
  });

  it("returns 502 when fetch fails (non-OK status)", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("Not Found", { status: 404, headers: { "content-type": "text/html" } })
    );
    const res = await GET(makeReq("https://example.com/missing"));
    expect(res.status).toBe(502);
  });

  it("returns 415 when the response is not HTML", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("{}", { status: 200, headers: { "content-type": "application/json" } })
    );
    const res = await GET(makeReq("https://example.com/api"));
    expect(res.status).toBe(415);
    const body = await res.json();
    expect(body.error).toMatch(/did not return HTML/i);
  });

  it("returns 413 when the response exceeds the 5MB cap", async () => {
    // Build a response body just over 5MB.
    const huge = "x".repeat(5 * 1024 * 1024 + 100);
    fetchMock.mockResolvedValueOnce(
      new Response(huge, { status: 200, headers: { "content-type": "text/html" } })
    );
    const res = await GET(makeReq("https://example.com/huge"));
    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body.error).toMatch(/too large/i);
  });
});
