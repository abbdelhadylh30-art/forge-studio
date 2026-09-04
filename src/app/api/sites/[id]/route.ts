// ─────────────────────────────────────────────────────────────────────────────
// /api/sites/[id] — get / patch / delete
//
// GET    /api/sites/[id]  → 200 ProjectWithConfig | 404
// PATCH  /api/sites/[id]  → 200 ProjectWithConfig | 404
//        body: { name?: string, config?: unknown }  (config normalized if given)
// DELETE /api/sites/[id]  → 200 { ok: true } | 404   (cascades views/events/deploys)
// ─────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { normalizeConfig } from "@/lib/landing/yaml"
import { guard, HttpError, readJsonBody, str, toWithConfig } from "@/lib/landing/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return guard(async () => {
    const { id } = await params
    const project = await db.site.findUnique({ where: { id } })
    if (!project) throw new HttpError(404, "Project not found")
    return NextResponse.json(toWithConfig(project))
  })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return guard(async () => {
    const { id } = await params
    const project = await db.site.findUnique({ where: { id } })
    if (!project) throw new HttpError(404, "Project not found")

    const body = await readJsonBody(req)
    const data: { name?: string; config?: string } = {}

    if (body.name !== undefined) {
      const name = str(body.name)?.trim().slice(0, 80) ?? ""
      if (!name) throw new HttpError(400, "Field 'name' must be a non-empty string")
      data.name = name
    }
    if (body.config !== undefined && body.config !== null) {
      data.config = JSON.stringify(normalizeConfig(body.config))
    }

    const updated = Object.keys(data).length
      ? await db.site.update({ where: { id }, data })
      : project // no-op patch → return current
    return NextResponse.json(toWithConfig(updated))
  })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return guard(async () => {
    const { id } = await params
    const existing = await db.site.findUnique({ where: { id }, select: { id: true } })
    if (!existing) throw new HttpError(404, "Project not found")
    await db.site.delete({ where: { id } }) // relations cascade
    return NextResponse.json({ ok: true })
  })
}
