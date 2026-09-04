// ─────────────────────────────────────────────────────────────────────────────
// /api/sites/[id]/duplicate
//
// POST /api/sites/[id]/duplicate → 201 ProjectWithConfig | 404
//      name = "<original> copy" (≤80 chars), new unique slug, config copied verbatim
// ─────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { guard, HttpError, toWithConfig, uniqueSlug } from "@/lib/landing/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return guard(async () => {
    const { id } = await params
    const original = await db.site.findUnique({ where: { id } })
    if (!original) throw new HttpError(404, "Project not found")

    const name = `${original.name} copy`.slice(0, 80)
    const slug = await uniqueSlug(name)
    const project = await db.site.create({
      data: { name, slug, config: original.config },
    })
    return NextResponse.json(toWithConfig(project), { status: 201 })
  })
}
