/**
 * PixelForge v19 — Server-side URL fetch (CORS-safe proxy)
 *
 * SWEBOK KA 2 §2.7 (Security) + KA 3 §4.5 (Fault Tolerance):
 *   - SSRF guard rejects private/loopback/link-local IPs (url-guard.ts)
 *   - Active-content strip neutralizes scripts, on* handlers, javascript: URIs,
 *     <object>/<embed>/<base>, meta-refresh (sanitize.ts)
 *   - 8s timeout, content-type allowlist, size cap
 *
 * The fetched HTML is rendered in a sandboxed iframe (no allow-scripts) on the
 * client; the server-side strip here is defense-in-depth.
 */

import { NextRequest, NextResponse } from "next/server";
import { assertPublicUrl, UrlGuardError } from "@/lib/security/url-guard";
import { stripActiveContent } from "@/lib/security/sanitize";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB cap

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = await assertPublicUrl(url);
  } catch (e) {
    if (e instanceof UrlGuardError) {
      return NextResponse.json({ error: e.reason }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(parsed.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ForgeStudio/1.0; +https://github.com/forge-studio)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Fetch failed: ${res.status} ${res.statusText}` },
        { status: 502 }
      );
    }
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return NextResponse.json(
        { error: `URL did not return HTML (got ${contentType || "unknown"})` },
        { status: 415 }
      );
    }

    const raw = await res.text();
    if (raw.length > MAX_BYTES) {
      return NextResponse.json(
        { error: `Response too large (${raw.length} bytes; cap is ${MAX_BYTES})` },
        { status: 413 }
      );
    }
    const sanitized = stripActiveContent(raw);
    return NextResponse.json({
      url: parsed.toString(),
      finalUrl: res.url || parsed.toString(),
      html: sanitized,
      size: sanitized.length,
    });
  } catch (e: unknown) {
    const err = e as { name?: string; message?: string };
    if (err?.name === "AbortError") {
      return NextResponse.json({ error: "Fetch timed out (>8s)" }, { status: 504 });
    }
    return NextResponse.json(
      { error: `Fetch failed: ${err?.message ?? "unknown error"}` },
      { status: 502 }
    );
  }
}
