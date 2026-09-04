// ─────────────────────────────────────────────────────────────────────────────
// /api/leads — contact-form submissions (leads inbox)
//
// GET  /api/leads?projectId=xxx&take=50 → 200 { leads: LeadRecord[] }
// POST /api/leads
//   body: { projectId, fields: Record<string,string> (form label → value) }
//   → 200 { ok: true, lead: LeadRecord } | 400 | 404
// The route extracts a best-effort name / email / message from the field map,
// and stores the full map in the `fields` JSON column.
// ─────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { guard, HttpError, readJsonBody, str } from "@/lib/landing/server"
import type { LeadRecord } from "@/lib/landing/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function pickField(fields: Record<string, string>, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    for (const [key, value] of Object.entries(fields)) {
      if (pattern.test(key) && value?.trim()) return value.trim()
    }
  }
  return ""
}

export function toLeadRecord(l: {
  id: string
  name: string
  email: string
  message: string
  fields: string
  createdAt: Date
}): LeadRecord {
  let parsed: Record<string, string> = {}
  try {
    parsed = JSON.parse(l.fields) as Record<string, string>
  } catch {
    parsed = {}
  }
  return { id: l.id, name: l.name, email: l.email, message: l.message, fields: parsed, createdAt: l.createdAt.toISOString() }
}

export async function GET(req: NextRequest) {
  return guard(async () => {
    const projectId = req.nextUrl.searchParams.get("projectId")
    if (!projectId) throw new HttpError(400, "Missing 'projectId' query parameter")
    const project = await db.site.findUnique({ where: { id: projectId }, select: { id: true } })
    if (!project) throw new HttpError(404, "Project not found")
    const takeRaw = Number(req.nextUrl.searchParams.get("take") ?? "50")
    const take = Math.max(1, Math.min(200, Math.floor(Number.isFinite(takeRaw) ? takeRaw : 50)))

    const rows = await db.siteLead.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take,
    })
    return NextResponse.json({ leads: rows.map(toLeadRecord) })
  })
}

export async function POST(req: NextRequest) {
  return guard(async () => {
    const body = await readJsonBody(req)
    const projectId = str(body.projectId)
    if (!projectId) throw new HttpError(400, "Missing 'projectId'")
    const project = await db.site.findUnique({ where: { id: projectId }, select: { id: true } })
    if (!project) throw new HttpError(404, "Project not found")

    const fields = (body.fields ?? {}) as Record<string, unknown>
    const clean: Record<string, string> = {}
    for (const [k, v] of Object.entries(fields)) {
      if (typeof v === "string" && v.trim() && k.trim()) clean[k.trim().slice(0, 60)] = v.trim().slice(0, 2000)
    }
    if (Object.keys(clean).length === 0) throw new HttpError(400, "Field 'fields' must contain at least one non-empty value")

    const row = await db.siteLead.create({
      data: {
        projectId,
        name: pickField(clean, [/\bname\b/i, /full ?name/i]).slice(0, 120),
        email: pickField(clean, [/e-?mail/i, /courriel/i]).slice(0, 200),
        message: pickField(clean, [/\bmessage\b/i, /\bbody\b/i]).slice(0, 2000),
        fields: JSON.stringify(clean),
      },
    })
    return NextResponse.json({ ok: true, lead: toLeadRecord(row) })
  })
}
