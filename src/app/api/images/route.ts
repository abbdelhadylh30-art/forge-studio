// ─────────────────────────────────────────────────────────────────────────────
// /api/images — image library: AI-generated + user uploads.
//
// GET    /api/images                     → 200 { images: ImageAsset[] }
//   ImageAsset: { name, url, bytes, createdAt, usedBy: string[] (project names) }
//   On serverless the library spans TWO roots:
//     • /tmp/uploads          → runtime uploads, served at /api/uploads/<name>
//     • public/uploads (ro)   → template-bundled images, served at /uploads/<name>
// POST   /api/images                     → 200 { ok: true, url }
//   body: multipart/form-data with a `file` field (PNG / JPG / WebP, ≤ 2MB)
//   — writes to the writable root (public/uploads locally, /tmp/uploads on
//     serverless, where the app FS is read-only)
// DELETE /api/images?url=/uploads/lf-x.png (or /api/uploads/lf-x.png)
//   → 200 { ok: true, deleted } | 409 { error, usedBy } (image still referenced
//     by a project config) | 400 (invalid url) | 404 (file missing)
// ─────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server"
import { readdir, stat, unlink, writeFile, mkdir } from "node:fs/promises"
import path from "node:path"
import { db } from "@/lib/db"
import { guard, HttpError } from "@/lib/landing/server"
import { bundledDir, isServerless, publicUrl, uploadDir } from "@/lib/landing/uploads"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// only serve/delete files we know the shape of — blocks path traversal
const URL_RE = /^\/(api\/)?uploads\/([a-z0-9][a-z0-9-]*)\.(png|jpe?g|webp)$/i
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024

interface ImageAsset {
  name: string
  url: string
  bytes: number
  createdAt: string
  usedBy: string[]
}

interface UploadRoot {
  dir: string
  urlFor: (name: string) => string
}

/** Roots that make up the visible library. */
function libraryRoots(): UploadRoot[] {
  if (isServerless()) {
    return [
      { dir: uploadDir(), urlFor: (n) => `/api/uploads/${n}` }, // runtime (writable)
      { dir: bundledDir(), urlFor: (n) => `/uploads/${n}` }, // template-bundled (read-only)
    ]
  }
  return [{ dir: bundledDir(), urlFor: (n) => `/uploads/${n}` }]
}

async function listImages(): Promise<ImageAsset[]> {
  const projects = await db.site.findMany({ select: { name: true, config: true } })
  const assets: ImageAsset[] = []

  for (const root of libraryRoots()) {
    const entries = await readdir(root.dir).catch(() => [] as string[])
    const files = entries.filter((f) => URL_RE.test(`/uploads/${f}`))
    for (const name of files) {
      const url = root.urlFor(name)
      const info = await stat(path.join(root.dir, name)).catch(() => null)
      assets.push({
        name,
        url,
        bytes: info?.size ?? 0,
        createdAt: (info?.mtime ?? new Date()).toISOString(),
        usedBy: projects.filter((p) => p.config.includes(url)).map((p) => p.name),
      })
    }
  }
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
    const dir = uploadDir()
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()))
    return NextResponse.json({ ok: true, url: publicUrl(name) })
  })
}

export async function DELETE(req: NextRequest) {
  return guard(async () => {
    const url = req.nextUrl.searchParams.get("url") ?? ""
    const match = URL_RE.exec(url)
    if (!match) throw new HttpError(400, "Invalid 'url' — must be /uploads/<name>.<png|jpg|webp>")

    const name = `${match[2]}.${match[3]}`

    // block deletion while any project still references the image (either URL shape)
    const usedBy: string[] = []
    const projects = await db.site.findMany({ select: { name: true, config: true } })
    for (const p of projects) {
      if (p.config.includes(`/uploads/${name}`) || p.config.includes(`/api/uploads/${name}`)) {
        usedBy.push(p.name)
      }
    }
    if (usedBy.length > 0) {
      return NextResponse.json(
        { error: `Image is still used by ${usedBy.length} project${usedBy.length === 1 ? "" : "s"}`, usedBy },
        { status: 409 }
      )
    }

    // try every root that could hold the file (writable root first)
    const candidates = [uploadDir(), bundledDir()].filter(
      (dir, i, arr) => arr.indexOf(dir) === i
    )
    let deleted = false
    for (const dir of candidates) {
      try {
        await unlink(path.join(dir, name))
        deleted = true
        break
      } catch (e) {
        const code = (e as NodeJS.ErrnoException)?.code
        if (code === "EACCES" || code === "EROFS" || code === "EPERM") {
          throw new HttpError(403, "Image is read-only on this deployment")
        }
      }
    }
    if (!deleted) throw new HttpError(404, "Image file not found")
    return NextResponse.json({ ok: true, deleted: `/uploads/${name}` })
  })
}
