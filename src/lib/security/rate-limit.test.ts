import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, getClientIp, _resetRateLimitForTests } from "./rate-limit";

beforeEach(() => _resetRateLimitForTests());

describe("checkRateLimit — sliding window", () => {
  it("allows requests up to the limit", () => {
    for (let i = 0; i < 5; i++) {
      const r = checkRateLimit({ key: "user:1", limit: 5, windowMs: 1000 });
      expect(r.allowed).toBe(true);
    }
  });

  it("blocks the (limit+1)th request within the window", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit({ key: "user:2", limit: 5, windowMs: 1000 });
    }
    const r = checkRateLimit({ key: "user:2", limit: 5, windowMs: 1000 });
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
    expect(r.retryAfterMs).toBeGreaterThan(0);
  });

  it("reports remaining correctly", () => {
    expect(checkRateLimit({ key: "user:3", limit: 3, windowMs: 1000 }).remaining).toBe(2);
    expect(checkRateLimit({ key: "user:3", limit: 3, windowMs: 1000 }).remaining).toBe(1);
    expect(checkRateLimit({ key: "user:3", limit: 3, windowMs: 1000 }).remaining).toBe(0);
  });

  it("isolates buckets per key", () => {
    // Exhaust user:A's bucket.
    for (let i = 0; i < 3; i++) {
      checkRateLimit({ key: "user:A", limit: 3, windowMs: 1000 });
    }
    expect(checkRateLimit({ key: "user:A", limit: 3, windowMs: 1000 }).allowed).toBe(false);
    // user:B is unaffected.
    expect(checkRateLimit({ key: "user:B", limit: 3, windowMs: 1000 }).allowed).toBe(true);
  });

  it("replenishes after the window expires", async () => {
    // Use a short window so the test runs fast.
    for (let i = 0; i < 2; i++) {
      checkRateLimit({ key: "user:4", limit: 2, windowMs: 50 });
    }
    expect(checkRateLimit({ key: "user:4", limit: 2, windowMs: 50 }).allowed).toBe(false);
    // Wait for the window to slide past.
    await new Promise((r) => setTimeout(r, 80));
    expect(checkRateLimit({ key: "user:4", limit: 2, windowMs: 50 }).allowed).toBe(true);
  });

  it("retryAfterMs is bounded by the window size", () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit({ key: "user:5", limit: 3, windowMs: 1000 });
    }
    const r = checkRateLimit({ key: "user:5", limit: 3, windowMs: 1000 });
    expect(r.allowed).toBe(false);
    expect(r.retryAfterMs).toBeLessThanOrEqual(1000);
    expect(r.retryAfterMs).toBeGreaterThan(0);
  });
});

describe("getClientIp", () => {
  it("prefers X-Forwarded-For (first IP in the list)", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "203.0.113.1, 10.0.0.1" },
    });
    expect(getClientIp(req)).toBe("203.0.113.1");
  });

  it("falls back to X-Real-IP", () => {
    const req = new Request("https://example.com", {
      headers: { "x-real-ip": "198.51.100.5" },
    });
    expect(getClientIp(req)).toBe("198.51.100.5");
  });

  it("falls back to a localhost sentinel when no headers are present", () => {
    const req = new Request("https://example.com");
    expect(getClientIp(req)).toBe("127.0.0.1");
  });

  it("trims whitespace from XFF", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "  203.0.113.7  , 10.0.0.1" },
    });
    expect(getClientIp(req)).toBe("203.0.113.7");
  });
});
