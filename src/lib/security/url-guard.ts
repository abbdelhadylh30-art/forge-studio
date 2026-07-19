/**
 * SSRF guard — rejects URLs that resolve to private / loopback / link-local IPs.
 *
 * SWEBOK KA 3 §4.5 (Error Handling) + KA 2 §2.7 (Security): defense-in-depth
 * for the server-side URL proxy. Without this, an attacker could ask the
 * proxy to fetch http://169.254.169.254/ (cloud metadata) or
 * http://127.0.0.1:3000/api/... (internal service enumeration).
 *
 * The check is done by resolving the hostname to its IP(s) and rejecting any
 * IP in the private/loopback/link-local/reserved ranges. This blocks the
 * common SSRF vectors. DNS-rebinding attacks (where the IP changes between
 * resolution and request) are NOT fully mitigated here — for full protection,
 * also pin the resolved IP for the actual fetch (left as a TODO).
 */

import dns from "node:dns/promises";
import net from "node:net";

export class UrlGuardError extends Error {
  constructor(public reason: string) {
    super(reason);
    this.name = "UrlGuardError";
  }
}

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

/** True if an IPv4 or IPv6 string is in a private / reserved range. */
export function isPrivateIP(ip: string): boolean {
  // IPv6 loopback / link-local / unique-local
  if (ip === "::1" || ip === "::") return true;
  if (ip.startsWith("fe80:") || ip.startsWith("fc") || ip.startsWith("fd")) return true;
  // IPv4-mapped IPv6
  const v4 = ip.includes(":") ? ip.replace(/^::ffff:/, "") : ip;
  if (!net.isIPv4(v4)) return false;
  const parts = v4.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return false;
  const [a, b] = parts;
  if (a === 0) return true;            // 0.0.0.0/8
  if (a === 10) return true;           // 10.0.0.0/8
  if (a === 100 && b >= 64 && b <= 127) return true;  // 100.64.0.0/10 (CGNAT)
  if (a === 127) return true;          // 127.0.0.0/8
  if (a === 169 && b === 254) return true;             // 169.254.0.0/16 (link-local)
  if (a === 172 && b >= 16 && b <= 31) return true;    // 172.16.0.0/12
  if (a === 192 && b === 0) return true;               // 192.0.0.0/24
  if (a === 192 && b === 168) return true;             // 192.168.0.0/16
  if (a === 198 && (b === 18 || b === 19)) return true;// 198.18.0.0/15
  if (a >= 224) return true;          // multicast (224.0.0.0/4) + reserved (240.0.0.0/4)
  return false;
}

/**
 * Validate a URL string and assert its hostname resolves to a public IP.
 * Throws UrlGuardError on any rejection.
 */
export async function assertPublicUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new UrlGuardError("Invalid URL");
  }
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    throw new UrlGuardError("Only http/https URLs allowed");
  }
  const host = parsed.hostname;
  if (net.isIP(host)) {
    if (isPrivateIP(host)) throw new UrlGuardError("URL points to a private IP");
    return parsed;
  }
  let addrs: string[];
  try {
    const records = await dns.lookup(host, { all: true });
    addrs = records.map((r) => r.address);
  } catch {
    throw new UrlGuardError("DNS resolution failed");
  }
  if (addrs.length === 0) throw new UrlGuardError("DNS returned no records");
  for (const addr of addrs) {
    if (isPrivateIP(addr)) {
      throw new UrlGuardError(`Hostname resolves to a private IP (${addr})`);
    }
  }
  return parsed;
}
