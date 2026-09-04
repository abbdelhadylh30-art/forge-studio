// ─────────────────────────────────────────────────────────────────────────────
// /api/analytics/track — privacy-friendly event ingest (single record)
//
// POST /api/analytics/track
// body: { projectId, type, path?, referrer?, country?, device?, browser?,
//         visitorId?, duration?, isBounce?, label?, variant?, value? }
//   type: "pageview" | "cta_click" | "form_submit" | "section_view" |
//         "variant_exposure" | "promote_winner"
//   pageview: `variant` (optional) tags the visit with the A/B variant it was
//   exposed to — powers per-variant duration/engagement reporting.
// → 200 { ok: true, id } | 400 | 404
//
// PATCH /api/analytics/track — engagement update for a pageview record
// body: { id, duration?, engaged? }
//   duration: seconds on page (kept if greater than stored)
//   engaged: true marks the visit non-bounce (CTA click / form submit)
//            duration ≥ 15s also implicitly de-bounces
// → 200 { ok: true, duration } | 400 | 404
// ─────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { guard, HttpError, notifyLive, num, optStr, readJsonBody, str } from "@/lib/landing/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const TRACK_TYPES = ["pageview", "cta_click", "form_submit", "section_view", "variant_exposure", "promote_winner"] as const
type TrackType = (typeof TRACK_TYPES)[number]

/** A visit that stays ≥ 15s counts as engaged (industry-standard bounce window). */
const ENGAGED_AFTER_S = 15

/** Coerce an optional `variantMap` payload (sectionId → variant name) into
 *  a compact JSON string, or null. Caps size, drops junk entries. */
function validVariantMap(input: unknown): string | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null
  const out: Record<string, string> = {}
  let n = 0
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (n >= 8) break
    if (typeof v !== "string" || !v) continue
    if (!/^[a-zA-Z0-9_-]{1,40}$/.test(k)) continue
    out[k] = v.slice(0, 2)
    n++
  }
  return n ? JSON.stringify(out) : null
}

export async function POST(req: NextRequest) {
  return guard(async () => {
    const body = await readJsonBody(req)
    const projectId = str(body.projectId)
    if (!projectId) throw new HttpError(400, "Missing 'projectId'")
    const type = str(body.type) as TrackType
    if (!TRACK_TYPES.includes(type)) {
      throw new HttpError(400, `Invalid 'type' — must be one of: ${TRACK_TYPES.join(", ")}`)
    }
    const project = await db.site.findUnique({ where: { id: projectId }, select: { id: true } })
    if (!project) throw new HttpError(404, "Project not found")

    if (type === "pageview") {
      const row = await db.siteView.create({
        data: {
          projectId,
          path: str(body.path) || "/",
          referrer: str(body.referrer) || "direct",
          country: str(body.country) || "US",
          device: str(body.device) || "desktop",
          browser: str(body.browser) || "Chrome",
          visitorId: str(body.visitorId) || "anon",
          variant: optStr(body.variant),
          variantMap: validVariantMap(body.variantMap),
          duration: Math.max(0, Math.floor(num(body.duration) ?? 0)),
          isBounce: body.isBounce === true,
        },
        select: { id: true },
      })
      // surface the new visit on connected dashboards (soft presence)
      notifyLive({
        kind: "pageview",
        projectId,
        id: row.id,
        device: str(body.device) || "desktop",
        browser: str(body.browser) || "Chrome",
        country: str(body.country) || "US",
        referrer: str(body.referrer) || "direct",
        variant: str(body.variant),
      })
      return NextResponse.json({ ok: true, id: row.id })
    }

    const row = await db.siteEvent.create({
      data: {
        projectId,
        type,
        label: str(body.label) ?? "",
        variant: optStr(body.variant),
        value: num(body.value) ?? 0,
        path: str(body.path) || "/",
      },
      select: { id: true },
    })
    // push CTA clicks / form submits to dashboards instantly
    notifyLive({ kind: "event", projectId, type, label: str(body.label) ?? "", variant: str(body.variant) })
    return NextResponse.json({ ok: true, id: row.id })
  })
}

export async function PATCH(req: NextRequest) {
  return guard(async () => {
    const body = await readJsonBody(req)
    const id = str(body.id)
    if (!id) throw new HttpError(400, "Missing 'id'")
    const row = await db.siteView.findUnique({ where: { id }, select: { id: true, projectId: true, duration: true, isBounce: true } })
    if (!row) throw new HttpError(404, "Pageview not found")

    // duration only ever grows (latest ping wins, but never shrinks)
    const incoming = Math.max(0, Math.floor(num(body.duration) ?? 0))
    const duration = Math.max(row.duration, incoming)
    const engaged = body.engaged === true || duration >= ENGAGED_AFTER_S
    await db.siteView.update({
      where: { id },
      data: { duration, ...(engaged ? { isBounce: false } : {}) },
    })
    // keep soft-presence durations live on dashboards without sockets
    notifyLive({ kind: "engagement", projectId: str(body.projectId) || row.projectId, id, duration, engaged })
    return NextResponse.json({ ok: true, duration, isBounce: engaged ? false : row.isBounce })
  })
}
