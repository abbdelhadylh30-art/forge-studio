import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Zero-dependency liveness probe used by the client ConnectionGuard to detect
 * dev-server restarts / crashes and self-heal the page (see
 * src/components/forge/shared/ConnectionGuard.tsx). Deliberately touches NO
 * database or store — it answers exactly one question: "is the app alive?".
 */
export async function GET() {
  return NextResponse.json(
    { ok: true, uptime: Math.round(process.uptime()), pid: process.pid },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function HEAD() {
  return new NextResponse(null, { status: 200, headers: { "cache-control": "no-store" } });
}
