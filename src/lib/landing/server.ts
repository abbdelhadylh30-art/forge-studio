// ─────────────────────────────────────────────────────────────────────────────
// Landing Forge — shared SERVER helpers for API route handlers.
// ⚠ SERVER ONLY: imports Prisma. Never import this file from client components.
// ─────────────────────────────────────────────────────────────────────────────
import { NextResponse } from "next/server"
import type { Site } from "@prisma/client"
import { db, ensureSchema } from "@/lib/db"
import { slugify } from "./defaults"
import { normalizeConfig } from "./yaml"
import type { LandingConfig, ProjectSummary, ProjectWithConfig } from "./types"

/** Thrown by handlers to produce a JSON error response with a specific status. */
export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/** Central try/catch wrapper for every route handler. */
export async function guard(fn: () => Promise<Response>): Promise<Response> {
  try {
    // Best-effort runtime schema provisioning (serverless / fresh SQLite).
    // Non-fatal on purpose: routes that don't touch the DB keep working.
    await ensureSchema().catch((e) =>
      console.warn("[db] ensureSchema skipped:", e instanceof Error ? e.message : e)
    )
    return await fn()
  } catch (e) {
    if (e instanceof HttpError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    console.error("[api-error]", e)
    const message = e instanceof Error ? e.message : "Internal server error"
    // Missing tables (schema provisioning failed) → honest 503, no Prisma internals
    const dbDown = /does not exist in the current database|P2021|P2022/.test(message)
    return NextResponse.json(
      { error: dbDown ? "Database unavailable — schema could not be provisioned" : message },
      { status: dbDown ? 503 : 500 }
    )
  }
}

/** Safely read + parse a JSON object body. 400 on invalid JSON. */
export async function readJsonBody(req: Request): Promise<Record<string, unknown>> {
  let text = ""
  try {
    text = await req.text()
  } catch {
    throw new HttpError(400, "Could not read request body")
  }
  if (!text.trim()) return {}
  if (text.length > 2_000_000) throw new HttpError(413, "Request body too large")
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new HttpError(400, "Invalid JSON body")
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new HttpError(400, "Request body must be a JSON object")
  }
  return parsed as Record<string, unknown>
}

// ── unknown → primitive narrowing helpers ────────────────────────────────────
export function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined
}
export function optStr(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null
}
export function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined
}

// ── project mapping ──────────────────────────────────────────────────────────

/** Parse a stored config JSON string → LandingConfig. Resilient — never throws. */
export function parseStoredConfig(raw: string): LandingConfig {
  try {
    return normalizeConfig(JSON.parse(raw) as unknown)
  } catch {
    return normalizeConfig({})
  }
}

/** Prisma Site row → ProjectSummary (config parsed for sectionCount/themeId). */
export function toSummary(p: Site): ProjectSummary {
  const config = parseStoredConfig(p.config)
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    sectionCount: config.sections.length,
    themeId: config.themeId,
  }
}

/** Prisma Site row → ProjectWithConfig. */
export function toWithConfig(p: Site): ProjectWithConfig {
  return { ...toSummary(p), config: parseStoredConfig(p.config) }
}

/** Generate a slug from a name, appending -2, -3… when taken. */
export async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name)
  let candidate = base
  for (let i = 2; i <= 200; i++) {
    const existing = await db.site.findUnique({ where: { slug: candidate }, select: { id: true } })
    if (!existing) return candidate
    candidate = `${base}-${i}`
  }
  return `${base}-${Date.now().toString(36)}`
}

// ── live relay ingest (mini-services/analytics-live) ─────────────────────────
// Fire-and-forget forward of durable tracking records to the socket relay so
// connected dashboards update instantly. NEVER blocks or breaks the response —
// the relay is an optional accelerator, REST polling remains the backstop.

const RELAY_INGEST_URL = "http://127.0.0.1:3004/ingest"

export type RelayIngest =
  | ({ kind: "pageview"; projectId: string; id: string; device?: string; browser?: string; country?: string; referrer?: string; variant?: string })
  | ({ kind: "engagement"; projectId: string; id: string; duration?: number; engaged?: boolean })
  | ({ kind: "event"; projectId: string; type: string; label?: string; variant?: string })

/** Notify the live relay of a durable record. Silent on every failure path. */
export function notifyLive(payload: RelayIngest): void {
  if (!payload.projectId) return
  void fetch(RELAY_INGEST_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(1500),
  }).catch(() => undefined)
}
