// ─────────────────────────────────────────────────────────────────────────────
// /api/sites/[id] — get / patch / delete
//
// GET    /api/sites/[id]  → 200 ProjectWithConfig | 404
// PATCH  /api/sites/[id]  → 200 ProjectWithConfig
//        body: { name?: string, config?: unknown, slug?: string }
//        UPSERT semantics: when the project is missing on THIS serverless
//        instance (per-instance SQLite — the row lives on another lambda), the
//        PATCH re-creates it with the same id instead of 404ing. Client saves
//        therefore re-materialize the project wherever the traffic lands, and
//        the "project vanished after create" class of failure disappears.
//        The optional `slug` is used only on this recreate path (the browser
//        sends its known slug; a conflict gets a -2/-3 suffix).
// DELETE /api/sites/[id]  → 200 { ok: true } | 404   (cascades views/events/deploys)
// ─────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { normalizeConfig } from "@/lib/landing/yaml"
import { guard, HttpError, readJsonBody, str, toWithConfig, uniqueSlug } from "@/lib/landing/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Recreate a project this instance has never seen (same id as the client's copy). */
async function recreateMissing(
  id: string,
  name: string,
  slug: string | undefined,
  configJson: string
) {
  // explicit id keeps the client, the local registry and the server in
  // agreement; cap the length so junk ids can't bloat rows
  const safeId = id.slice(0, 64)
  const finalSlug = await uniqueSlug(slug && slug.trim() ? slug.trim().slice(0, 80) : name)
  return db.site.create({
    data: { id: safeId, name, slug: finalSlug, config: configJson },
  })
}

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

    const body = await readJsonBody(req)
    const name = str(body.name)?.trim().slice(0, 80) ?? ""
    const slugHint = str(body.slug)?.trim().slice(0, 80)
    let configJson: string | undefined
    if (body.config !== undefined && body.config !== null) {
      configJson = JSON.stringify(normalizeConfig(body.config))
    }

    // Recreate path — this instance lost (or never had) the row. A PATCH always
    // carries the full current state from the client, so it can rebuild it.
    if (!project) {
      if (!name) throw new HttpError(400, "Field 'name' is required to re-create a missing project")
      const created = await recreateMissing(
        id,
        name,
        slugHint,
        configJson ?? JSON.stringify(normalizeConfig({}))
      )
      return NextResponse.json(toWithConfig(created))
    }

    // Normal update path (unchanged behavior)
    const data: { name?: string; config?: string } = {}
    if (body.name !== undefined) {
      if (!name) throw new HttpError(400, "Field 'name' must be a non-empty string")
      data.name = name
    }
    if (configJson !== undefined) {
      data.config = configJson
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
