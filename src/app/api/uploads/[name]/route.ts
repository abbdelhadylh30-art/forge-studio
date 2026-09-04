// ─────────────────────────────────────────────────────────────────────────────
// GET /api/uploads/:name — serve a runtime-uploaded image.
//
// On serverless hosts (Vercel) new uploads are written to /tmp/uploads because
// the app filesystem is read-only; this route streams them back. Locally it is
// unused (uploads are plain static files under /uploads/*) but works anyway,
// which keeps the two environments code-path compatible.
// ─────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { uploadDir } from "@/lib/landing/uploads"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const NAME_RE = /^[a-z0-9][a-z0-9-]*\.(png|jpe?g|webp)$/i
const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params
  if (!NAME_RE.test(name)) {
    return NextResponse.json({ error: "Invalid image name" }, { status: 400 })
  }
  const ext = name.split(".").pop()?.toLowerCase() ?? ""
  try {
    const buf = await readFile(path.join(uploadDir(), name))
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "content-type": MIME[ext] ?? "application/octet-stream",
        "cache-control": "public, max-age=3600",
      },
    })
  } catch {
    return NextResponse.json({ error: "Image not found" }, { status: 404 })
  }
}
