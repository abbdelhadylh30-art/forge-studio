import type { LandingConfig } from "./types"

/**
 * Local crash-recovery mirror (the "Start building" builder always had one of
 * these — now Sites does too).
 *
 * The studio autosaves to the server 3s after the last edit, but on the
 * current serverless deployment the database is per-instance: a request can
 * land on an instance that has never seen the project, the PATCH 404s, and
 * edits made in the last seconds would be lost if the tab crashed. This module
 * keeps the newest config in localStorage (mirrored ~1.5s after edits, well
 * inside the server-autosave window) and the bootstrap falls back to it when
 * the API is unreachable or returns a bad payload.
 *
 * Storage failures (quota, private mode, SSR) are always swallowed — the
 * backup is best-effort, never a crash source.
 */

export interface LocalBackup {
  id: string | null
  name: string
  slug: string
  savedAt: number // epoch ms
  config: LandingConfig
}

const KEY = "forge-sites:backup:latest"

/** Backups older than 30 days are ignored on boot (same TTL as the old builder). */
export const BACKUP_TTL_MS = 30 * 24 * 60 * 60 * 1000

const MAX_SERIALIZED = 2_000_000 // 2 MB — stay far below localStorage quotas

export function writeLocalBackup(backup: Omit<LocalBackup, "savedAt"> & { savedAt?: number }): boolean {
  if (typeof window === "undefined") return false
  try {
    const payload = JSON.stringify({ ...backup, savedAt: backup.savedAt ?? Date.now() })
    if (payload.length > MAX_SERIALIZED) return false
    window.localStorage.setItem(KEY, payload)
    return true
  } catch {
    // quota / private mode — editing continues, the mirror just doesn't stick
    return false
  }
}

export function readLocalBackup(): LocalBackup | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (parsed === null || typeof parsed !== "object") return null
    const o = parsed as Partial<LocalBackup>
    if (typeof o.name !== "string" || !o.name) return null
    const cfg = o.config as LandingConfig | undefined
    if (!cfg || typeof cfg !== "object" || !Array.isArray(cfg.sections) || cfg.sections.length === 0) {
      return null
    }
    if (typeof o.savedAt !== "number" || Date.now() - o.savedAt > BACKUP_TTL_MS) return null
    return {
      id: typeof o.id === "string" && o.id ? o.id : null,
      name: o.name,
      slug: typeof o.slug === "string" && o.slug ? o.slug : "site",
      savedAt: o.savedAt,
      config: cfg,
    }
  } catch {
    // corrupted payload — treat as absent, never crash the studio
    return null
  }
}

export function clearLocalBackup(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
