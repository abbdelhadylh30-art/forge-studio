import type { LandingConfig } from "./types"

/**
 * Version snapshots — named save-points on top of undo/redo (the v21 port).
 *
 * Stored in localStorage keyed by project id: snapshots describe *a moment in
 * time* of one project, not the project itself. This matches v21's behavior
 * and — on the current serverless deployment — is actually more durable than
 * the per-instance SQLite the site config lives in. Five slots, newest first,
 * saving with an existing name replaces that slot, a 6th save retires the
 * oldest.
 */

export interface SiteSnapshot {
  id: string
  name: string
  savedAt: number // epoch ms
  config: LandingConfig
}

const PREFIX = "forge-sites:snapshots:"
export const MAX_SNAPSHOT_SLOTS = 5

function storageKey(projectId: string): string {
  return `${PREFIX}${projectId}`
}

function safeParse(raw: string | null): SiteSnapshot[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const out: SiteSnapshot[] = []
    for (const item of parsed) {
      const o = item as Partial<SiteSnapshot>
      // tolerate hand-edited / partially-written entries: skip, never crash the studio
      if (typeof o?.id !== "string" || typeof o?.name !== "string" || typeof o?.savedAt !== "number") continue
      const cfg = o.config as LandingConfig | undefined
      if (!cfg || typeof cfg !== "object" || !Array.isArray(cfg.sections)) continue
      out.push({ id: o.id, name: o.name.slice(0, 60), savedAt: o.savedAt, config: cfg })
    }
    // newest first
    return out.sort((a, b) => b.savedAt - a.savedAt).slice(0, MAX_SNAPSHOT_SLOTS)
  } catch {
    return []
  }
}

function persist(projectId: string, snaps: SiteSnapshot[]): void {
  try {
    window.localStorage.setItem(storageKey(projectId), JSON.stringify(snaps))
  } catch {
    // quota / private mode — the studio keeps working, snapshots just don't stick
  }
}

export function listSnapshots(projectId: string): SiteSnapshot[] {
  if (!projectId || typeof window === "undefined") return []
  return safeParse(window.localStorage.getItem(storageKey(projectId)))
}

/** Capture the current config under a name. Re-saving an existing name
 *  overwrites that slot; a full roster retires the oldest slot. Returns the
 *  stored snapshot (id + timestamp assigned here). */
export function saveSnapshot(projectId: string, name: string, config: LandingConfig): SiteSnapshot | null {
  if (!projectId || typeof window === "undefined") return null
  const trimmed = name.trim().slice(0, 60)
  if (!trimmed) return null
  const snap: SiteSnapshot = {
    id: `snap-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: trimmed,
    savedAt: Date.now(),
    config: JSON.parse(JSON.stringify(config)) as LandingConfig,
  }
  const snaps = listSnapshots(projectId)
  const deduped = snaps.filter((s) => s.name.toLowerCase() !== trimmed.toLowerCase())
  persist(projectId, [snap, ...deduped].slice(0, MAX_SNAPSHOT_SLOTS))
  return snap
}

export function deleteSnapshot(projectId: string, id: string): void {
  if (!projectId || typeof window === "undefined") return
  persist(projectId, listSnapshots(projectId).filter((s) => s.id !== id))
}

/** Relative age for the slot list — "just now" / "4m ago" / "Sep 5, 14:02". */
export function describeAge(savedAt: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - savedAt)
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(savedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}
