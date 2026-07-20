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
    return NextResponse.json({ error: "Please enter a URL to audit." }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = await assertPublicUrl(url);
  } catch (e) {
    if (e instanceof UrlGuardError) {
      // Translate the technical guard reason into a user-friendly message.
      const reason = e.reason.toLowerCase();
      let friendly: string;
      if (reason.includes("invalid")) {
        friendly = "That doesn't look like a valid URL. Try something like stripe.com or https://example.com.";
      } else if (reason.includes("http")) {
        friendly = "Only http:// and https:// URLs are supported.";
      } else if (reason.includes("private")) {
        friendly = "For security, we can't audit private or local network addresses. Try a public website.";
      } else if (reason.includes("dns") || reason.includes("resolution")) {
        friendly = "Couldn't find that website. Check the address and try again.";
      } else {
        friendly = "That URL can't be audited. Please try a different one.";
      }
      return NextResponse.json({ error: friendly }, { status: 400 });
    }
    return NextResponse.json({ error: "That doesn't look like a valid URL. Try something like stripe.com or https://example.com." }, { status: 400 });
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
      const reason = res.status === 404 ? "That page doesn't exist (404)."
        : res.status === 403 ? "That page is blocked (403) — the site refuses to allow automated access."
        : res.status >= 500 ? "That site is having problems right now (server error). Try again later."
        : `Couldn't reach that page (HTTP ${res.status}).`;
      return NextResponse.json({ error: reason }, { status: 502 });
    }
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return NextResponse.json(
        { error: "That URL doesn't return a web page. Make sure it's an HTML page, not a file or image." },
        { status: 415 }
      );
    }

    const raw = await res.text();
    if (raw.length > MAX_BYTES) {
      return NextResponse.json(
        { error: "That page is too large to audit (over 5 MB). Try a simpler page." },
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
      return NextResponse.json({ error: "That site took too long to respond (>8s). Try again or use a different URL." }, { status: 504 });
    }
    // DNS / connection errors — translate to friendly text
    const msg = err?.message ?? "";
    if (/ENOTFOUND|EAI_AGAI|getaddrinfo|ENXIO/i.test(msg)) {
      return NextResponse.json({ error: "Couldn't find that website. Check the address and try again." }, { status: 502 });
    }
    if (/ECONNREFUSED|ECONNRESET|ETIMEDOUT/i.test(msg)) {
      return NextResponse.json({ error: "Couldn't connect to that site. It may be down or blocking audits." }, { status: 502 });
    }
    return NextResponse.json(
      { error: "Couldn't fetch that page. Check the URL and try again." },
      { status: 502 }
    );
  }
}
