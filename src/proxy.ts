// ─────────────────────────────────────────────────────────────────────────────
// Studio passcode gate (Next 16 proxy — formerly middleware).
//
// When STUDIO_PASSCODE is set (hosting dashboard env var), every studio
// surface requires the forge-studio-key cookie; visitors are redirected to
// /unlock. When unset the gate is fully inert — local dev and pre-config
// deployments behave exactly as before.
//
// Always public (published pages must work for anonymous visitors):
//   /p/<slug>            published landing pages
//   /api/sites GET       published-page hydration + list retry
//   /api/leads POST      form submissions from published pages
//   /api/analytics/track published-page tracking beacons
//   /api/og, /api/uploads, /uploads, /api/feedback, /api/health
//   static assets (icons, manifest, robots, sitemap, sw.js)
// ─────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server"

export const COOKIE_NAME = "forge-studio-key"

const PUBLIC_PATTERNS: readonly RegExp[] = [
  /^\/p\/.+/, // published landing pages
  /^\/unlock/, // the unlock page itself
  /^\/api\/unlock$/, // POST target
  /^\/api\/analytics\/track/, // published-page tracking beacons
  /^\/api\/og/, // OG images for published meta
  /^\/api\/uploads\//, // runtime-served images referenced by published pages
  /^\/api\/health$/,
  /^\/api\/feedback$/, // feedback widget (rate-limited in-route)
  /^\/uploads\//, // bundled template images referenced by published pages
  /^\/icon\.svg$/,
  /^\/icons\//,
  /^\/logo\.svg$/,
  /^\/manifest\.webmanifest$/,
  /^\/robots\.txt$/,
  /^\/sitemap\.xml$/,
  /^\/sw\.js$/,
  /^\/favicon\.ico$/,
]

/** Method-scoped public grants (read-only hydration for published pages). */
function isPublic(method: string, path: string): boolean {
  if (PUBLIC_PATTERNS.some((re) => re.test(path))) return true
  if (/^\/api\/sites(\/|$)/.test(path) && method === "GET") return true
  if (path === "/api/leads" && method === "POST") return true
  return false
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input))
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

/** Branch-free comparison over equal-length hex strings. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export default async function proxy(req: NextRequest) {
  const passcode = process.env.STUDIO_PASSCODE?.trim()
  if (!passcode) return NextResponse.next() // gate disabled

  const path = req.nextUrl.pathname
  if (isPublic(req.method, path)) return NextResponse.next()

  const expected = await sha256Hex(passcode)
  const provided = req.cookies.get(COOKIE_NAME)?.value
  if (provided && safeEqual(provided, expected)) return NextResponse.next()

  if (path.startsWith("/api/")) {
    return NextResponse.json({ error: "Studio is locked — unlock via /unlock." }, { status: 401 })
  }

  const url = req.nextUrl.clone()
  url.pathname = "/unlock"
  url.search = ""
  url.searchParams.set("from", path)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|_next/webpack).*)"],
}
