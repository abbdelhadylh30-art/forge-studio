// ─────────────────────────────────────────────────────────────────────────────
// /api/analytics/export — CSV download (full history, not windowed)
//
// GET /api/analytics/export?projectId=xxx
// → 200 text/csv  (Content-Disposition: attachment; filename="analytics-{slug}.csv")
//    Section 1: PAGEVIEWS table (id,date,visitorId,referrer,country,device,
//               browser,variant,variantMap,duration,isBounce,engaged)
//    blank line
//    Section 2: EVENTS table (id,date,type,label,variant,path)
// → 400 / 404 as JSON { error }
// ─────────────────────────────────────────────────────────────────────────────
import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { guard, HttpError } from "@/lib/landing/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function csvCell(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export async function GET(req: NextRequest) {
  return guard(async () => {
    const projectId = req.nextUrl.searchParams.get("projectId")
    if (!projectId) throw new HttpError(400, "Missing 'projectId' query parameter")
    const project = await db.site.findUnique({ where: { id: projectId } })
    if (!project) throw new HttpError(404, "Project not found")

    const [views, events] = await Promise.all([
      db.siteView.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } }),
      db.siteEvent.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } }),
    ])

    const lines: string[] = []
    lines.push("PAGEVIEWS")
    lines.push("id,date,visitorId,referrer,country,device,browser,variant,variantMap,duration,isBounce,engaged")
    for (const v of views) {
      // compact the map to "sectionId=variant;sectionId=variant" for spreadsheets
      let mapCell = ""
      if (v.variantMap) {
        try {
          const vm = JSON.parse(v.variantMap) as Record<string, string>
          mapCell = Object.entries(vm).map(([k, val]) => `${k}=${val}`).join(";")
        } catch {
          mapCell = ""
        }
      }
      lines.push(
        [
          v.id,
          v.createdAt.toISOString(),
          v.visitorId,
          v.referrer,
          v.country,
          v.device,
          v.browser,
          v.variant ?? "",
          mapCell,
          String(v.duration),
          v.isBounce ? "true" : "false",
          !v.isBounce ? "true" : "false",
        ]
          .map(csvCell)
          .join(",")
      )
    }
    lines.push("")
    lines.push("EVENTS")
    lines.push("id,date,type,label,variant,path")
    for (const e of events) {
      lines.push(
        [e.id, e.createdAt.toISOString(), e.type, e.label, e.variant ?? "", e.path ?? ""].map(csvCell).join(",")
      )
    }

    const csv = `${lines.join("\n")}\n`
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="analytics-${project.slug}.csv"`,
      },
    })
  })
}
