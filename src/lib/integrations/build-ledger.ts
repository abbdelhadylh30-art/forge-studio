/**
 * Forge Studio → Build Ledger bridge (Tier 3)
 *
 * Exports a project entry as a Build Ledger import payload. Build Ledger
 * (sister app: github.com/abbdelhadylh30-art/build-ledger) tracks client
 * projects, campaigns, and posts — its importer accepts:
 *
 *   { projects: Project[], campaigns: Campaign[], posts: Post[], clients: Client[] }
 *
 * We emit exactly one project (validated by its `isProject` guard: id, name,
 * aiUsed[], storageLocation, clientStatus are required; everything else is
 * optional). The audit summary rides along in `notes` so the ledger entry
 * carries the score context without any schema coupling.
 */

export interface LedgerProjectDraft {
  name: string;
  description?: string;
  clientName?: string | null;
  liveUrl?: string | null;
  repoUrl?: string | null;
  notes?: string;
  tags?: string[];
  /** AI tool to attribute in the ledger's aiUsed[] list. */
  aiTool?: string;
}

interface LedgerProject {
  id: string;
  name: string;
  description: string;
  aiUsed: string[];
  storageLocation: "local" | "sandbox" | "cloud" | "github";
  inPortfolio: boolean;
  clientStatus: "personal" | "client" | "in-progress" | "delivered";
  clientName?: string;
  tags: string[];
  repoUrl?: string;
  liveUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerImportPayload {
  projects: LedgerProject[];
  campaigns: unknown[];
  posts: unknown[];
  clients: unknown[];
}

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `forge-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function buildLedgerImportPayload(draft: LedgerProjectDraft): LedgerImportPayload {
  const now = new Date().toISOString();
  const project: LedgerProject = {
    id: uid(),
    name: draft.name || "Untitled project",
    description: draft.description ?? "",
    aiUsed: [draft.aiTool ?? "Other"],
    storageLocation: "local",
    inPortfolio: false,
    // A client-bound build maps naturally to "For Client"; solo work stays personal.
    clientStatus: draft.clientName ? "client" : "personal",
    ...(draft.clientName ? { clientName: draft.clientName } : {}),
    tags: draft.tags?.length ? draft.tags : ["forge-studio"],
    ...(draft.repoUrl ? { repoUrl: draft.repoUrl } : {}),
    ...(draft.liveUrl ? { liveUrl: draft.liveUrl } : {}),
    ...(draft.notes ? { notes: draft.notes } : {}),
    createdAt: now,
    updatedAt: now,
  };
  return { projects: [project], campaigns: [], posts: [], clients: [] };
}

/** Trigger a browser download of the payload as a Build Ledger-importable JSON file. */
export function downloadLedgerPayload(draft: LedgerProjectDraft, filenameBase: string): string {
  const payload = buildLedgerImportPayload(draft);
  const safe = (filenameBase || "project")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "project";
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safe}-buildledger.json`;
  a.click();
  URL.revokeObjectURL(url);
  return a.download;
}
