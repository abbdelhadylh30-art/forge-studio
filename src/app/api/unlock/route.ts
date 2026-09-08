import { NextRequest, NextResponse } from "next/server"
import { createHash, timingSafeEqual } from "node:crypto"
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const COOKIE_NAME = "forge-studio-key"
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex")
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/unlock — { passcode } → sets the httpOnly studio cookie.
// Mirrors the proxy's cookie contract: value = sha256(STUDIO_PASSCODE).
// Rate-limited per IP; 501 when no passcode is configured.
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const passcode = process.env.STUDIO_PASSCODE?.trim()
  if (!passcode) {
    return NextResponse.json({ error: "No passcode is configured on this deployment." }, { status: 501 })
  }

  const ip = getClientIp(req)
  const rl = checkRateLimit({ key: `unlock:${ip}`, limit: 10, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts — try again in a minute." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    )
  }

  const body = (await req.json().catch(() => null)) as { passcode?: unknown } | null
  const attempt = typeof body?.passcode === "string" ? body.passcode : ""

  const expected = Buffer.from(sha256Hex(passcode), "hex")
  const provided = Buffer.from(sha256Hex(attempt), "hex")
  const ok = expected.length === provided.length && timingSafeEqual(expected, provided)
  if (!ok) {
    return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, sha256Hex(passcode), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  })
  return res
}
