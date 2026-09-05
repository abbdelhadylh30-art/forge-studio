"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, BarChart3, ExternalLink, FolderOpen, Gauge, Hammer, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useForge } from "@/lib/landing/store"
import { useUi } from "@/lib/landing/uiStore"
import { auditConfig } from "@/lib/landing/readiness"
import { TEMPLATES } from "@/lib/landing/defaults"
import { useForge as useForgeStudio } from "@/lib/forge/store"
import { StudioShell } from "@/components/sites/studio/StudioShell"
import { DashboardView } from "@/components/sites/dashboard/DashboardView"
import { ProjectsView } from "@/components/sites/projects/ProjectsView"
import { AddSectionDialog } from "@/components/sites/studio/AddSectionDialog"
import { useSaveProject } from "@/components/sites/studio/useSaveProject"
import { CommandPalette, ShortcutsDialog } from "@/components/sites/studio/CommandPalette"
import { ReadinessDialog } from "@/components/sites/studio/ReadinessPanel"
import { AiGenerateDialog, AiImproveDialog, ExportYamlDialog, ImportYamlDialog, ExportHtmlDialog, ThemeTweaksDialog } from "@/components/sites/studio/Dialogs"
import { DeployDialog } from "@/components/sites/studio/DeployDialog"
import { ImageLibraryDialog } from "@/components/sites/studio/ImageLibraryDialog"
import { ConnectionGuard } from "@/components/sites/shared/ConnectionGuard"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import type { LandingConfig, ProjectSummary, ProjectWithConfig } from "@/lib/landing/types"

type View = "studio" | "analytics" | "projects"

const VIEWS: { id: View; label: string; icon: typeof Hammer }[] = [
  { id: "studio", label: "Studio", icon: Hammer },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "projects", label: "Projects", icon: FolderOpen },
]

/** Strict-mode / double-mount guard: the first-run demo-site bootstrap runs
 *  exactly once per page load even if React re-invokes the effect. */
let bootstrapInFlight: Promise<void> | null = null

async function runBootstrap(
  loadProject: (id: string, name: string, slug: string, config: LandingConfig) => void,
  setBooting: (v: boolean) => void,
): Promise<void> {
  try {
    const listRes = await fetch("/api/sites")
    const list = (await listRes.json()) as ProjectSummary[]
    let target: ProjectSummary | undefined = Array.isArray(list) ? list[0] : undefined

    if (!target) {
      // First run: create the demo site with A/B testing enabled
      const config = TEMPLATES[0].build()
      const hero = config.sections.find((s) => s.type === "hero")
      if (hero && hero.type === "hero" && hero.ab) hero.ab = { ...hero.ab, enabled: true, sampleSize: 500 }
      const createRes = await fetch("/api/sites", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Vertex", config }),
      })
      const created = (await createRes.json()) as ProjectWithConfig & { error?: string }
      if (!createRes.ok || !created.id) throw new Error(created.error ?? "Could not create demo site")
      target = created
      void fetch("/api/analytics/seed", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId: created.id, days: 30 }),
      })
    }

    const full = await fetch(`/api/sites/${target.id}`)
    const project = (await full.json()) as ProjectWithConfig
    loadProject(project.id, project.name, project.slug, project.config)
    toast.success(`Welcome to Sites`, { description: `Loaded “${project.name}” — drag, edit, deploy.` })
  } catch (e) {
    toast.error("Startup failed", { description: e instanceof Error ? e.message : undefined })
  } finally {
    setBooting(false)
  }
}

/**
 * SitesApp — the landing-forge studio, embedded as a Forge Studio view.
 *
 * Everything is self-contained: its own ⌘K palette, its own sonner toaster,
 * its own view switcher (studio / analytics / projects). The header carries a
 * "Back to Forge Studio" affordance that hands control back to the unified
 * dashboard. Published pages live at /p/<slug>.
 */
export function SitesApp() {
  const view = useUi((s) => s.view)
  const setView = useUi((s) => s.setView)
  const dialog = useUi((s) => s.dialog)
  const closeDialog = useUi((s) => s.closeDialog)
  const [booting, setBooting] = React.useState(true)
  const setStudioView = useForgeStudio((s) => s.setView)
  const loadProject = useForge((s) => s.loadProject)
  const dirty = useForge((s) => s.dirty)
  const config = useForge((s) => s.config)
  const projectId = useForge((s) => s.project.id)
  const { save } = useSaveProject()
  const saving = useForge((s) => s.saving)
  const report = React.useMemo(() => auditConfig(config), [config])

  // ── Bootstrap: load last site or create the demo site ─────────────────────
  React.useEffect(() => {
    if (!bootstrapInFlight) {
      bootstrapInFlight = runBootstrap(loadProject, setBooting)
    }
    return () => {}
  }, [loadProject])

  // ── ⌘S / Ctrl+S saves ─────────────────────────────────────────────────────
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        void save()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [save])

  // ── Autosave: 3s after the last edit (debounced), save silently ──────────
  React.useEffect(() => {
    if (!dirty || !projectId || saving) return
    const timer = setTimeout(() => {
      void save({ silent: true })
    }, 3000)
    return () => clearTimeout(timer)
  }, [dirty, saving, save, projectId])

  // ── Warn on unsaved exit ─────────────────────────────────────────────────
  React.useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault()
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [dirty])

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      {/* App bar */}
      <header className="relative z-40 flex shrink-0 items-center gap-3 border-b border-zinc-800/80 bg-zinc-950 px-3 py-2 sm:px-4">
        <button
          type="button"
          onClick={() => setStudioView("dashboard")}
          className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          aria-label="Back to Forge Studio dashboard"
          title="Back to Forge Studio dashboard"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/25 transition-transform hover:scale-105">
            <Hammer className="h-4 w-4 text-white" />
          </span>
          <span className="hidden text-[13px] font-extrabold tracking-tight sm:inline">
            forge <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">sites</span>
          </span>
        </button>

        <span className="hidden h-4 w-px bg-zinc-800 md:block" aria-hidden />

        <button
          type="button"
          onClick={() => setStudioView("dashboard")}
          className="flex h-7 items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900/60 px-2 text-[10px] font-semibold text-zinc-400 transition-colors hover:border-violet-500/40 hover:text-zinc-200"
          title="All Forge Studio tools — builder, auditor, sites"
        >
          <ArrowLeft className="h-3 w-3" />
          <span className="hidden sm:inline">Forge Studio</span>
        </button>

        {/* View switcher */}
        <nav className="mx-auto flex items-center gap-0.5 rounded-lg border border-zinc-800 bg-zinc-900/60 p-0.5" aria-label="Sites views">
          {VIEWS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              aria-current={view === id ? "page" : undefined}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-semibold transition-all sm:px-3",
                view === id
                  ? "bg-violet-500/25 text-violet-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  : "text-zinc-500 hover:text-zinc-200"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {dirty && <span className="hidden text-[10px] text-amber-300/80 md:inline">unsaved</span>}
          {/* Global readiness hint (non-studio views) */}
          {view !== "studio" && !booting && (
            <button
              type="button"
              onClick={() => setView("studio")}
              title="Open readiness audit in Studio"
              className="hidden items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-[10px] font-semibold text-zinc-400 transition-colors hover:border-violet-500/40 hover:text-zinc-200 md:flex"
            >
              <Gauge className="h-3 w-3" style={{ color: report.score >= 90 ? "#34d399" : report.score >= 75 ? "#a3e635" : report.score >= 60 ? "#fbbf24" : "#fb7185" }} />
              <span className="tabular-nums">{report.score}</span>
              <span className="text-zinc-600">/ 100</span>
            </button>
          )}
          <span className="hidden rounded-md border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-[9px] text-zinc-500 md:inline">v1.5</span>
          <Link
            href="https://github.com/abbdelhadylh30-art/forge-studio"
            target="_blank"
            rel="noreferrer"
            className="flex h-7 items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-2.5 text-[11px] font-semibold text-zinc-300 transition-colors hover:border-violet-500/50 hover:text-violet-200"
          >
            <ExternalLink className="h-3 w-3" /> <span className="hidden sm:inline">GitHub</span>
          </Link>
        </div>
      </header>

      {/* Views */}
      {booting ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-950">
          <div className="relative">
            <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
            <div className="absolute inset-0 animate-ping rounded-full bg-violet-500/20" aria-hidden />
          </div>
          <div className="text-center">
            <p className="text-[13px] font-semibold text-zinc-200">Forging your sites…</p>
            <p className="mt-0.5 text-[11px] text-zinc-500">Creating demo site & analytics</p>
          </div>
        </div>
      ) : (
        <>
          {view === "studio" && <StudioShell />}
          {view === "analytics" && <DashboardView />}
          {view === "projects" && <ProjectsView onOpenProject={() => setView("studio")} />}
        </>
      )}

      {/* Global dialogs (open state shared via uiStore — reachable from toolbar, ⌘K palette, hotkeys) */}
      <AiGenerateDialog />
      <AiImproveDialog />
      <ExportYamlDialog />
      <ImportYamlDialog />
      <ExportHtmlDialog />
      <AddSectionDialog />
      <ImageLibraryDialog open={dialog === "image-library"} onOpenChange={(o) => !o && closeDialog()} />
      <DeployDialog />
      <ReadinessDialog />
      <ThemeTweaksDialog />
      <ShortcutsDialog />
      <CommandPalette />

      {/* self-healing connection banner (dev-server restarts, network blips) */}
      <ConnectionGuard />

      {/* sonner toasts — scoped to the Sites module (the outer app uses shadcn toaster) */}
      <Toaster />

      {/* subtle grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(rgba(167,139,250,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  )
}
