// ─────────────────────────────────────────────────────────────────────────────
// /api/ai/image — generate an image with the z-ai SDK and store it under
// public/uploads so the config can reference a stable URL.
//
// POST /api/ai/image
// body: { prompt: string, size?: "1024x1024" | "768x1344" | "864x1152" |
//        "1344x768" | "1152x864" | "1440x768" | "768x1440" (default 1344x768) }
// → 200 { url: "/uploads/lf-<hex>.png" } | 400 | 500
// ─────────────────────────────────────────────────────────────────────────────
import ZAI from "z-ai-web-dev-sdk"
import { NextRequest, NextResponse } from "next/server"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { randomBytes } from "node:crypto"
import { guard, HttpError, readJsonBody, str } from "@/lib/landing/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SIZES = ["1024x1024", "768x1344", "864x1152", "1344x768", "1152x864", "1440x768", "768x1440"] as const
type ImgSize = (typeof SIZES)[number]

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads")

export async function POST(req: NextRequest) {
  return guard(async () => {
    const body = await readJsonBody(req)
    const prompt = str(body.prompt)?.trim()
    if (!prompt) throw new HttpError(400, "Field 'prompt' is required (non-empty string)")
    if (prompt.length > 600) throw new HttpError(400, "Prompt too long (max 600 chars)")
    const size = str(body.size) as ImgSize
    if (size && !SIZES.includes(size)) throw new HttpError(400, `Invalid 'size' — must be one of: ${SIZES.join(", ")}`)

    const zai = await ZAI.create()
    // transient SDK hiccups happen — one automatic retry
    let base64: string | undefined
    let lastError = "unknown error"
    for (let attempt = 0; attempt < 2 && !base64; attempt++) {
      try {
        const response = await zai.images.generations.create({
          prompt,
          // the SDK's type union is stale (lists 1440x720/720x1440 which the
          // API rejects for not being multiples of 32) — cast to the valid set
          size: (size ?? "1344x768") as "1024x1024" | "768x1344" | "864x1152" | "1344x768" | "1152x864",
        })
        base64 = response.data?.[0]?.base64
        if (!base64) lastError = "empty response"
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e)
      }
    }
    if (!base64) throw new HttpError(500, `Image generation failed (${lastError}) — try again`)

    const buffer = Buffer.from(base64, "base64")
    await mkdir(UPLOAD_DIR, { recursive: true })
    const filename = `lf-${randomBytes(6).toString("hex")}.png`
    await writeFile(path.join(UPLOAD_DIR, filename), buffer)

    return NextResponse.json({ url: `/uploads/${filename}`, bytes: buffer.length })
  })
}
