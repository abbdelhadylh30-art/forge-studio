// ─────────────────────────────────────────────────────────────────────────────
// /api/sites — list & create
//
// GET  /api/sites            → 200 ProjectSummary[]   (bare JSON array)
// POST /api/sites            → 201 ProjectWithConfig
//      body: { name: string, config?: unknown, templateId?: string }
//      - config (object) wins; always normalized via normalizeConfig
//      - templateId used only when config absent ("saas" fallback)
// ─────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { TEMPLATES } from "@/lib/landing/defaults"
import { normalizeConfig } from "@/lib/landing/yaml"
import { guard, HttpError, readJsonBody, str, toSummary, toWithConfig, uniqueSlug } from "@/lib/landing/server"
import type { LandingConfig } from "@/lib/landing/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  return guard(async () => {
    const projects = await db.site.findMany({ orderBy: { updatedAt: "desc" } })
    return NextResponse.json(projects.map(toSummary))
  })
}

export async function POST(req: NextRequest) {
  return guard(async () => {
    const body = await readJsonBody(req)
    const name = str(body.name)?.trim().slice(0, 80) ?? ""
    if (!name) throw new HttpError(400, "Field 'name' is required (non-empty string)")

    let config: LandingConfig
    const hasConfig = body.config !== undefined && body.config !== null
    if (hasConfig) {
      // partial / AI JSON / full config — always normalized
      config = normalizeConfig(body.config)
    } else {
      const templateId = str(body.templateId) ?? "saas"
      const template = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0]
      config = normalizeConfig(template.build())
      // template was generic — stamp the user's project name as the brand name
      config.brand.name = name.slice(0, 60)
      config.seo.title = `${name} — Ship faster`
      config.seo.description = config.seo.description.replace(/Vertex/gi, name).slice(0, 300)
      config.seo.description = config.seo.description.replace(/\bMyProduct\b/g, name).slice(0, 300)
      // stamp brand name into navbar/footer overrides too (templates use default brand)
      for (const s of config.sections) {
        if (s.type === "navbar" && s.brandLabel) s.brandLabel = name.slice(0, 60)
      }
    }

    const slug = await uniqueSlug(name)
    const project = await db.site.create({
      data: { name, slug, config: JSON.stringify(config) },
    })
    return NextResponse.json(toWithConfig(project), { status: 201 })
  })
}
