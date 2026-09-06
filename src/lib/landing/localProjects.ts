import type { LandingConfig } from "./types"

/**
 * Local project registry — the durable browser-side copy of every project the
 * user creates or opens in Sites.
 *
 * WHY THIS EXISTS
 * The production deployment runs on serverless instances that each carry their
 * own ephemeral SQLite: a POST lands on one instance, the very next GET can be
 * routed to another that has never seen the project (404 → "my project
 * vanished"). The server-side demo seeding guarantees the 5 showcase projects
 * on every instance, but everything the USER creates lives on whichever
 * instance happened to serve the write — until that instance recycles.
 *
 * This registry inverts the ownership: the browser keeps the full config of
 * every project it has touched, and every "open / save / publish" path uses
 * the server first but falls back to (and quietly re-syncs from) this copy.
 * Combined with the PATCH-upsert on the server (an autosave to a cold instance
 * re-creates the project there), projects stop disappearing:
 *
 *   create  → registered locally at once, opened from the POST response
 *             (no refetch race at all)
 *   open    → server 404? load the local copy, re-sync in the background
 *   autosave→ PATCH upserts the project back onto the serving instance
 *   publish → /p/<slug> falls back to this copy in the creator's browser
 *
 * GUARANTEES
 *  - never throws: quota / private mode / SSR are all swallowed silently
 *  - capped: MAX_PROJECTS entries, MAX_ENTRY_BYTES per serialized config
 *  - TTL: entries older than 30 days are ignored on read (and swept on write)
 */

export interface LocalProject {
  id: string
  name: string
  slug: string
  /** epoch ms of the last local edit / confirmed server save */
  updatedAt: number
  config: LandingConfig
}

const KEY = "forge-sites:projects:registry"

/** Registry entries older than this are ignored (same TTL family as the backup mirror). */
export const REGISTRY_TTL_MS = 30 * 24 * 60 * 60 * 1000

const MAX_PROJECTS = 24
/** Per-entry serialized cap (~500 KB) — stays far under the ~5 MB localStorage budget. */
const MAX_ENTRY_BYTES = 500_000
/** Whole-registry hard cap — if exceeded, the largest/oldest entries are dropped first. */
const MAX_REGISTRY_BYTES = 4_000_000

type StoredRegistry = Record<string, LocalProject>

function readRegistry(): StoredRegistry {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return {}
    return parsed as StoredRegistry
  } catch {
    return {} // corrupted payload — treat as empty, never a crash source
  }
}

function writeRegistry(registry: StoredRegistry): boolean {
  if (typeof window === "undefined") return false
  try {
    const payload = JSON.stringify(registry)
    if (payload.length > MAX_REGISTRY_BYTES) return false
    window.localStorage.setItem(KEY, payload)
    return true
  } catch {
    return false // quota / private mode — registry just doesn't stick this time
  }
}

function isValidEntry(v: unknown): v is LocalProject {
  if (v === null || typeof v !== "object") return false
  const o = v as Partial<LocalProject>
  return (
    typeof o.id === "string" &&
    o.id.length > 0 &&
    typeof o.name === "string" &&
    o.name.length > 0 &&
    typeof o.slug === "string" &&
    o.slug.length > 0 &&
    typeof o.updatedAt === "number" &&
    Number.isFinite(o.updatedAt) &&
    !!o.config &&
    typeof o.config === "object" &&
    Array.isArray(o.config.sections) &&
    o.config.sections.length > 0
  )
}

/** Size guard: a single serialized entry must stay under the per-entry cap. */
function entryFits(project: LocalProject): boolean {
  try {
    return JSON.stringify(project).length <= MAX_ENTRY_BYTES
  } catch {
    return false
  }
}

/** Drop expired entries + enforce the project cap (oldest updatedAt evicted). */
function sweep(registry: StoredRegistry): StoredRegistry {
  const now = Date.now()
  const alive: LocalProject[] = []
  for (const entry of Object.values(registry)) {
    if (isValidEntry(entry) && now - entry.updatedAt <= REGISTRY_TTL_MS) alive.push(entry)
  }
  alive.sort((a, b) => b.updatedAt - a.updatedAt) // newest first
  return Object.fromEntries(alive.slice(0, MAX_PROJECTS).map((p) => [p.id, p]))
}

/**
 * Register / refresh a project in the local registry.
 * Mirrors are best-effort: an oversized config is skipped (summary-only
 * callers can still show the card), failures return false and never throw.
 */
export function upsertLocalProject(project: Omit<LocalProject, "updatedAt"> & { updatedAt?: number }): boolean {
  if (typeof window === "undefined") return false
  const entry: LocalProject = { ...project, updatedAt: project.updatedAt ?? Date.now() }
  if (!entryFits(entry)) return false
  const registry = sweep(readRegistry())
  registry[entry.id] = entry
  return writeRegistry(registry)
}

/** All live local projects, newest first. Expired/corrupt entries are filtered. */
export function listLocalProjects(): LocalProject[] {
  const registry = sweep(readRegistry())
  return Object.values(registry).sort((a, b) => b.updatedAt - a.updatedAt)
}

/** Look up a local copy by project id. */
export function getLocalProject(id: string): LocalProject | null {
  if (typeof window === "undefined" || !id) return null
  const entry = readRegistry()[id]
  if (!entry || !isValidEntry(entry)) return null
  if (Date.now() - entry.updatedAt > REGISTRY_TTL_MS) return null
  return entry
}

/** Look up a local copy by published slug (owner's browser on /p/<slug>). */
export function getLocalProjectBySlug(slug: string): LocalProject | null {
  if (typeof window === "undefined" || !slug) return null
  const match = listLocalProjects().find((p) => p.slug === slug)
  return match ?? null
}

/** Remove a project from the registry (delete flow). Never throws. */
export function removeLocalProject(id: string): void {
  if (typeof window === "undefined" || !id) return
  try {
    const registry = readRegistry()
    if (!(id in registry)) return
    delete registry[id]
    writeRegistry(registry)
  } catch {
    // ignore — mirror removal is best-effort
  }
}

/** Test hook: wipe the registry. */
export function clearLocalProjects(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
