import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.mock factories are hoisted to the top of the file, so they can't reference
// ordinary let/const declarations. vi.hoisted() runs at hoist time.
const { lookupMock } = vi.hoisted(() => ({ lookupMock: vi.fn() }));
vi.mock("node:dns/promises", () => ({ default: { lookup: lookupMock }, lookup: lookupMock }));

import { assertPublicUrl, UrlGuardError, isPrivateIP } from "./url-guard";

beforeEach(() => lookupMock.mockReset());

describe("assertPublicUrl — protocol validation", () => {
  it("rejects non-URL strings", async () => {
    await expect(assertPublicUrl("not-a-url")).rejects.toThrow(UrlGuardError);
    await expect(assertPublicUrl("not-a-url")).rejects.toThrow("Invalid URL");
  });

  it("rejects non-http protocols", async () => {
    await expect(assertPublicUrl("ftp://example.com")).rejects.toThrow("Only http/https");
    await expect(assertPublicUrl("file:///etc/passwd")).rejects.toThrow("Only http/https");
    await expect(assertPublicUrl("javascript:alert(1)")).rejects.toThrow();
  });
});

describe("assertPublicUrl — literal IP in URL", () => {
  it("rejects a literal private IPv4 (no DNS lookup needed)", async () => {
    await expect(assertPublicUrl("http://127.0.0.1/admin")).rejects.toThrow("private IP");
    await expect(assertPublicUrl("http://10.0.0.1/")).rejects.toThrow("private IP");
    await expect(assertPublicUrl("http://192.168.1.1/")).rejects.toThrow("private IP");
    await expect(assertPublicUrl("http://169.254.169.254/")).rejects.toThrow("private IP");
    // Confirm DNS was NOT consulted for literal IPs.
    expect(lookupMock).not.toHaveBeenCalled();
  });

  it("accepts a literal public IPv4", async () => {
    const u = await assertPublicUrl("http://8.8.8.8/");
    expect(u.hostname).toBe("8.8.8.8");
  });
});

describe("assertPublicUrl — hostname resolution", () => {
  it("accepts a hostname that resolves to a public IP", async () => {
    lookupMock.mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }]);
    const u = await assertPublicUrl("https://example.com/");
    expect(u.hostname).toBe("example.com");
    expect(lookupMock).toHaveBeenCalledTimes(1);
  });

  it("rejects a hostname that resolves to a private IP", async () => {
    lookupMock.mockResolvedValueOnce([{ address: "10.1.2.3", family: 4 }]);
    await expect(assertPublicUrl("https://internal.example.com/")).rejects.toThrow("private IP");
  });

  it("rejects a hostname that resolves to loopback", async () => {
    lookupMock.mockResolvedValueOnce([{ address: "127.0.0.1", family: 4 }]);
    await expect(assertPublicUrl("https://localhost/")).rejects.toThrow("private IP");
  });

  it("rejects a hostname that resolves to link-local (metadata IP)", async () => {
    lookupMock.mockResolvedValueOnce([{ address: "169.254.169.254", family: 4 }]);
    await expect(assertPublicUrl("https://metadata.google.internal/")).rejects.toThrow("private IP");
  });

  it("rejects when DNS resolution fails", async () => {
    lookupMock.mockRejectedValueOnce(new Error("ENOTFOUND"));
    await expect(assertPublicUrl("https://nonexistent.invalid/")).rejects.toThrow("DNS resolution failed");
  });

  it("rejects when DNS returns no records", async () => {
    lookupMock.mockResolvedValueOnce([]);
    await expect(assertPublicUrl("https://empty.example.com/")).rejects.toThrow("no records");
  });

  it("rejects if ANY resolved address is private (mixed records)", async () => {
    lookupMock.mockResolvedValueOnce([
      { address: "93.184.216.34", family: 4 }, // public
      { address: "10.0.0.1", family: 4 },      // private — must reject
    ]);
    await expect(assertPublicUrl("https://mixed.example.com/")).rejects.toThrow("private IP");
  });
});

describe("isPrivateIP (re-exported sanity checks)", () => {
  // A few spot-checks; the full boundary table is in url-guard.test.ts.
  it("flags AWS metadata IP", () => {
    expect(isPrivateIP("169.254.169.254")).toBe(true);
  });
  it("flags localhost", () => {
    expect(isPrivateIP("127.0.0.1")).toBe(true);
  });
  it("passes public DNS", () => {
    expect(isPrivateIP("1.1.1.1")).toBe(false);
  });
});
