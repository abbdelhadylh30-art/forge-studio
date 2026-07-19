import { describe, it, expect } from "vitest";
import { isPrivateIP } from "./url-guard";

describe("isPrivateIP", () => {
  // SWEBOK KA 4 §2.3 (code-based testing) — table-driven boundary tests.
  it("rejects loopback IPv4", () => {
    expect(isPrivateIP("127.0.0.1")).toBe(true);
    expect(isPrivateIP("127.255.255.254")).toBe(true);
  });

  it("rejects RFC1918 private ranges", () => {
    expect(isPrivateIP("10.0.0.1")).toBe(true);
    expect(isPrivateIP("10.255.255.255")).toBe(true);
    expect(isPrivateIP("172.16.0.1")).toBe(true);
    expect(isPrivateIP("172.31.255.255")).toBe(true);
    expect(isPrivateIP("192.168.1.1")).toBe(true);
    expect(isPrivateIP("192.168.0.0")).toBe(true);
  });

  it("rejects link-local (169.254.x.x — AWS/GCP metadata)", () => {
    expect(isPrivateIP("169.254.169.254")).toBe(true);
    expect(isPrivateIP("169.254.0.1")).toBe(true);
  });

  it("rejects CGNAT (100.64.0.0/10)", () => {
    expect(isPrivateIP("100.64.0.1")).toBe(true);
    expect(isPrivateIP("100.127.255.255")).toBe(true);
  });

  it("rejects benchmarking (198.18.0.0/15)", () => {
    expect(isPrivateIP("198.18.0.1")).toBe(true);
    expect(isPrivateIP("198.19.255.255")).toBe(true);
  });

  it("rejects multicast and reserved (224+)", () => {
    expect(isPrivateIP("224.0.0.1")).toBe(true);
    expect(isPrivateIP("240.0.0.1")).toBe(true);
    expect(isPrivateIP("255.255.255.255")).toBe(true);
  });

  it("rejects IPv6 loopback / link-local / unique-local", () => {
    expect(isPrivateIP("::1")).toBe(true);
    expect(isPrivateIP("::")).toBe(true);
    expect(isPrivateIP("fe80::1")).toBe(true);
    expect(isPrivateIP("fc00::1")).toBe(true);
    expect(isPrivateIP("fd00::1")).toBe(true);
  });

  it("accepts public IPv4 addresses", () => {
    expect(isPrivateIP("8.8.8.8")).toBe(false);
    expect(isPrivateIP("1.1.1.1")).toBe(false);
    expect(isPrivateIP("172.32.0.1")).toBe(false); // just outside 172.16/12
    expect(isPrivateIP("172.15.0.1")).toBe(false);
    expect(isPrivateIP("192.169.0.1")).toBe(false); // 192.169 is public
  });

  it("accepts IPv4-mapped IPv6 of public addresses", () => {
    expect(isPrivateIP("::ffff:8.8.8.8")).toBe(false);
    expect(isPrivateIP("::ffff:127.0.0.1")).toBe(true);
  });

  it("returns false for non-IP strings (deferred to DNS lookup)", () => {
    expect(isPrivateIP("example.com")).toBe(false);
    expect(isPrivateIP("not-an-ip")).toBe(false);
  });
});
