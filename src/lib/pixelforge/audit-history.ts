/**
 * PixelForge v19 — Audit History (Tier 2)
 *
 * Persists audit snapshots two ways:
 *   1. localStorage (`forge-studio:audit-history:v1`) — always available,
 *      survives refresh, capped at 20 entries, no HTML stored (summaries only).
 *   2. Prisma (Project + Audit models) via POST /api/audits — fire-and-forget;
 *      works on the desktop app (persistent userData SQLite) and anywhere a
 *      DATABASE_URL is configured. Failures are silent by design: localStorage
 *      remains the source of truth for the dashboard list.
 *
 * SWEBOK KA 3 §4.5 (Fault Tolerance): every persistence path degrades
 * independently — quota errors, network errors, and server errors never
 * break the audit flow itself.
 */

import type { Category, CategoryScore } from "@/lib/pixelforge/types";

const HISTORY_KEY = "forge-studio:audit-history:v1";
const MAX_ENTRIES = 20;
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 90; // 90 days

export interface AuditHistoryEntry {
  id: string;
  projectId: string | null;
  name: string;
  url: string | null;
  clientName: string | null;
  score: number;
  desktopScore: number;
  mobileScore: number;
  issueCount: number;
  errorCount: number;
  warningCount: number;
  cats: Partial<Record<Category, CategoryScore>>;
  createdAt: number; // epoch ms
}

export function loadAuditHistory(): AuditHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AuditHistoryEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e) => e && typeof e.id === "string" && typeof e.score === "number")
      .filter((e) => Date.now() - e.createdAt < MAX_AGE_MS)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

function persistLocal(entries: AuditHistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch (e) {
    console.warn("Audit history localStorage write failed:", e);
  }
}

/** UID — crypto.randomUUID when available, fallback for older WebViews. */
function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface SaveSnapshotInput {
  name: string;
  url: string | null;
  clientName: string | null;
  projectId: string | null;
  score: number;
  desktopScore: number;
  mobileScore: number;
  issues: { severity: string; resolved?: boolean }[];
  cats: Partial<Record<Category, CategoryScore>>;
  html?: string;
}

/**
 * Save an audit snapshot. Returns the local entry (always written) — the
 * Prisma POST is best-effort and never blocks.
 */
export function saveAuditSnapshot(input: SaveSnapshotInput): AuditHistoryEntry {
  const entry: AuditHistoryEntry = {
    id: uid(),
    projectId: input.projectId,
    name: input.name || "Untitled audit",
    url: input.url,
    clientName: input.clientName,
    score: input.score,
    desktopScore: input.desktopScore,
    mobileScore: input.mobileScore,
    issueCount: input.issues.length,
    errorCount: input.issues.filter((i) => i.severity === "error").length,
    warningCount: input.issues.filter((i) => i.severity === "warning").length,
    cats: input.cats,
    createdAt: Date.now(),
  };

  // 1. localStorage (synchronous, authoritative for the dashboard list).
  const next = [entry, ...loadAuditHistory()].slice(0, MAX_ENTRIES);
  persistLocal(next);

  // 2. Prisma (async, best-effort). HTML is only sent server-side where the
  //    SQLite file lives; it is never stored in localStorage.
  if (typeof window !== "undefined") {
    void fetch("/api/audits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entry,
        html: input.html && input.html.length < 800 * 1024 ? input.html : undefined,
      }),
    }).catch((e) => {
      // Silent: server persistence is a bonus, not a requirement.
      console.warn("Audit snapshot server sync skipped:", e);
    });
  }

  return entry;
}

export function clearAuditHistory() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    /* ignore */
  }
}

export function deleteAuditHistoryEntry(id: string) {
  persistLocal(loadAuditHistory().filter((e) => e.id !== id));
}
