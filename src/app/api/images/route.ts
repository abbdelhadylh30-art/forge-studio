// ─────────────────────────────────────────────────────────────────────────────
// /api/images — image library (public/uploads): AI-generated + user uploads
//
// GET    /api/images                     → 200 { images: ImageAsset[] }
//   ImageAsset: { name, url, bytes, createdAt, usedBy: string[] (project names) }
// POST   /api/images                     → 200 { ok: true, url }
//   body: multipart/form-data with a `file` field (PNG / JPG / WebP, ≤ 2MB)
//   — user uploads (e.g. brand logos) land in the same library
// DELETE /api/images?url=/uploads/lf-x.png
//   → 200 { ok: true, deleted } | 409 { error, usedBy } (image still referenced
//     by a project config) | 400 (invalid url) | 404 (file missing)
// ─────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server"
import { mkdir, readdir, stat, unlink, writeFile } from "node:fs/promises"
import path from "node:path"
import { db } from "@/lib/db"
import { guard, HttpError } from "@/lib/landing/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads")
// only serve/delete files we know the shape of — blocks path traversal
const URL_RE = /^\/uploads\/([a-z0-9][a-z0-9-]*)\.(png|jpe?g|webp)$/i
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024

interface ImageAsset {
  name: string
  url: string
  bytes: number
  createdAt: string
  usedBy: string[]
}

async function listImages(): Promise<ImageAsset[]> {
  let entries: string[]
  try {
    entries = await readdir(UPLOAD_DIR)
  } catch {
    return [] // no uploads dir yet
  }
  const files = entries.filter((f) => URL_RE.test(`/uploads/${f}`))
  const projects = await db.site.findMany({ select: { name: true, config: true } })

  const assets = await Promise.all(
    files.map(async (name) => {
      const url = `/uploads/${name}`
      const info = await stat(path.join(UPLOAD_DIR, name)).catch(() => null)
      return {
        name,
        url,
        bytes: info?.size ?? 0,
        createdAt: (info?.mtime ?? new Date()).toISOString(),
        usedBy: projects.filter((p) => p.config.includes(url)).map((p) => p.name),
      } satisfies ImageAsset
    })
  )
  return assets.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function GET() {
  return guard(async () => NextResponse.json({ images: await listImages() }))
}

/** Upload a user image (e.g. brand logo) into the library. */
export async function POST(req: NextRequest) {
  return guard(async () => {
    const form = await req.formData().catch(() => null)
    if (!form) throw new HttpError(400, "Expected multipart/form-data with a 'file' field")
    const file = form.get("file")
    if (!(file instanceof File)) throw new HttpError(400, "Missing 'file' field")
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      throw new HttpError(400, "Unsupported file type — use PNG, JPG or WebP")
    }
    if (file.size > MAX_UPLOAD_BYTES) throw new HttpError(400, "File too large — max 2MB")

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"
    const name = `lf-${crypto.randomUUID().slice(0, 12)}.${ext}`
    await mkdir(UPLOAD_DIR, { recursive: true })
    await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()))
    return NextResponse.json({ ok: true, url: `/uploads/${name}` })
  })
}

export async function DELETE(req: NextRequest) {
  return guard(async () => {
    const url = req.nextUrl.searchParams.get("url") ?? ""
    const match = URL_RE.exec(url)
    if (!match) throw new HttpError(400, "Invalid 'url' — must be /uploads/<name>.<png|jpg|webp>")

    // block deletion while any project still references the image
    const usedBy: string[] = []
    const projects = await db.site.findMany({ select: { name: true, config: true } })
    for (const p of projects) if (p.config.includes(url)) usedBy.push(p.name)
    if (usedBy.length > 0) {
      return NextResponse.json(
        { error: `Image is still used by ${usedBy.length} project${usedBy.length === 1 ? "" : "s"}`, usedBy },
        { status: 409 }
      )
    }

    const target = path.join(UPLOAD_DIR, match[1] + "." + match[2])
    await unlink(target).catch(() => {
      throw new HttpError(404, "Image file not found")
    })
    return NextResponse.json({ ok: true, deleted: url })
  })
}
