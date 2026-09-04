"use client"

import * as React from "react"
import { Copy, ExternalLink, FilePlus2, FolderOpen, Layers, Link2, Loader2, Sparkles, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useForge } from "@/lib/landing/store"
import { TEMPLATES } from "@/lib/landing/defaults"
import { THEMES } from "@/lib/landing/themes"
import { normalizeConfig } from "@/lib/landing/yaml"
import type { ProjectWithConfig, ProjectSummary } from "@/lib/landing/types"

export function ProjectsView({ onOpenProject }: { onOpenProject: (id: string) => void }) {
  const loadProject = useForge((s) => s.loadProject)
  const [projects, setProjects] = React.useState<ProjectSummary[] | null>(null)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<ProjectSummary | null>(null)
  const [busy, setBusy] = React.useState<string | null>(null)

  const refresh = React.useCallback(async () => {
    try {
      const res = await fetch("/api/sites")
      const data = await res.json()
      if (Array.isArray(data)) setProjects(data as ProjectSummary[])
    } catch {
      toast.error("Could not load projects")
    }
  }, [])

  const copyPublishedLink = async (p: ProjectSummary) => {
    const url = `${window.location.origin}/p/${encodeURIComponent(p.slug)}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Published link copied 🔗", { description: `/${p.slug} — visits there are tracked live in Analytics.` })
    } catch {
      toast.error("Copy failed")
    }
  }

  const openPublished = (p: ProjectSummary) => {
    window.open(`/p/${encodeURIComponent(p.slug)}`, "_blank", "noopener")
  }

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  const open = async (p: ProjectSummary) => {
    setBusy(p.id)
    try {
      const res = await fetch(`/api/sites/${p.id}`)
      const data = (await res.json()) as ProjectWithConfig
      loadProject(data.id, data.name, data.slug, data.config)
      onOpenProject(data.id)
      toast.success(`Opened ${data.name}`, { description: `${data.sectionCount} sections · ${data.themeId} theme` })
    } catch {
      toast.error("Could not open project")
    } finally {
      setBusy(null)
    }
  }

  const duplicate = async (p: ProjectSummary) => {
    setBusy(p.id)
    try {
      const res = await fetch(`/api/sites/${p.id}/duplicate`, { method: "POST" })
      if (!res.ok) throw new Error()
      await refresh()
      toast.success("Project duplicated")
    } catch {
      toast.error("Duplicate failed")
    } finally {
      setBusy(null)
    }
  }

  const remove = async (p: ProjectSummary) => {
    setBusy(p.id)
    try {
      await fetch(`/api/sites/${p.id}`, { method: "DELETE" })
      await refresh()
      toast.success(`Deleted ${p.name}`)
    } catch {
      toast.error("Delete failed")
    } finally {
      setBusy(null)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="lf-scroll min-h-0 flex-1 overflow-y-auto bg-zinc-950">
      <div className="mx-auto max-w-6xl space-y-5 p-4 pb-16 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-50">
              <FolderOpen className="h-5 w-5 text-violet-300" /> Projects
            </h2>
            <p className="text-[11px] text-zinc-500">{projects ? `${projects.length} saved locally (SQLite + Prisma)` : "Loading…"}</p>
          </div>
          <Button size="sm" className="ml-auto h-8 gap-1.5 bg-violet-500 text-[12px] text-white hover:bg-violet-600" onClick={() => setCreateOpen(true)}>
            <FilePlus2 className="h-3.5 w-3.5" /> New project
          </Button>
        </div>

        {projects === null ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-800 py-16 text-center">
            <Layers className="h-8 w-8 text-zinc-700" />
            <p className="text-[14px] text-zinc-300">No projects yet</p>
            <Button size="sm" className="gap-1.5 bg-violet-500 text-white hover:bg-violet-600" onClick={() => setCreateOpen(true)}>
              <FilePlus2 className="h-3.5 w-3.5" /> Create your first landing page
            </Button>
          </div>
        ) : (
          <div className="lf-fade-up-stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p, i) => {
              const theme = THEMES.find((t) => t.id === p.themeId) ?? THEMES[0]
              const busyThis = busy === p.id
              return (
                <div key={p.id} style={{ animationDelay: `${Math.min(i * 70, 560)}ms` }}>
                  <div className="group overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/40 transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-500/10">
                    {/* theme preview strip */}
                    <button type="button" className="block w-full text-left" onClick={() => open(p)} aria-label={`Open ${p.name}`}>
                      <div className="relative h-24 p-3" style={{ background: `linear-gradient(135deg, ${theme.swatch[0]}, ${theme.swatch[1]})` }}>
                        <div className="flex gap-1.5">
                          {[70, 40, 55, 30].map((w, i) => (
                            <div key={i} className="h-2 rounded-full" style={{ width: w, background: theme.swatch[2], opacity: 0.25 + i * 0.08 }} />
                          ))}
                        </div>
                        <div className="mt-2 h-3 w-1/2 rounded-full" style={{ background: theme.swatch[2], opacity: 0.85 }} />
                        <div className="mt-1.5 h-2 w-2/3 rounded-full bg-white/20" />
                        <div className="absolute right-3 bottom-3 h-6 w-20 rounded-lg" style={{ background: theme.swatch[2] }} />
                        <span className="absolute left-3 bottom-3 rounded-md bg-black/40 px-1.5 py-0.5 font-mono text-[9px] text-white/70 backdrop-blur">{p.sectionCount} sections</span>
                      </div>
                      <div className="p-3">
                        <p className="truncate text-[14px] font-semibold text-zinc-100">{p.name}</p>
                        <p className="mt-0.5 text-[10px] text-zinc-500">
                          {theme.name} theme · updated {new Date(p.updatedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </button>
                    <div className="flex gap-1 border-t border-zinc-800/80 p-2">
                      <Button variant="outline" size="sm" className="h-7 flex-1 gap-1 border-zinc-800 bg-transparent text-[11px] text-zinc-300 hover:border-violet-500/50 hover:text-violet-200" onClick={() => open(p)} disabled={busyThis}>
                        {busyThis ? <Loader2 className="h-3 w-3 animate-spin" /> : <FolderOpen className="h-3 w-3" />} Open
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 border-zinc-800 bg-transparent text-[11px] text-zinc-400 hover:border-emerald-500/50 hover:text-emerald-200"
                        onClick={() => void copyPublishedLink(p)}
                        disabled={busyThis}
                        aria-label={`Copy published link for ${p.name}`}
                        title={`Copy the published link (/${p.slug}) — real visits are tracked`}
                      >
                        <Link2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 border-zinc-800 bg-transparent text-[11px] text-zinc-400 hover:border-emerald-500/50 hover:text-emerald-200"
                        onClick={() => openPublished(p)}
                        disabled={busyThis}
                        aria-label={`Open published page for ${p.name}`}
                        title={`Open the published page (/${p.slug}) in a new tab`}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 gap-1 border-zinc-800 bg-transparent text-[11px] text-zinc-400 hover:text-zinc-100" onClick={() => duplicate(p)} disabled={busyThis} aria-label={`Duplicate ${p.name}`} title="Duplicate">
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 gap-1 border-zinc-800 bg-transparent text-[11px] text-zinc-400 hover:border-rose-500/50 hover:text-rose-300" onClick={() => setDeleteTarget(p)} disabled={busyThis} aria-label={`Delete ${p.name}`} title="Delete">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={(p) => { void refresh(); open(p) }} />
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent className="border-zinc-800 bg-zinc-950">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">Delete “{deleteTarget?.name}”?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This permanently removes the project, its analytics and deploy history. There is no undo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-800 bg-zinc-900 text-zinc-200">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 text-white hover:bg-rose-700" onClick={() => deleteTarget && remove(deleteTarget)}>
              Delete project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function CreateProjectDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: (p: ProjectSummary) => void }) {
  const [name, setName] = React.useState("")
  const [templateId, setTemplateId] = React.useState("saas")
  const [creating, setCreating] = React.useState(false)
  const [aiMode, setAiMode] = React.useState(false)
  const [prompt, setPrompt] = React.useState("")

  const create = async () => {
    setCreating(true)
    try {
      let body: Record<string, unknown>
      if (aiMode && prompt.trim()) {
        body = { name: name.trim() || "AI Forged Page", config: {} }
        // generate first, then create with AI config
        const genRes = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ prompt }),
        })
        const gen = (await genRes.json()) as { config?: unknown; error?: string }
        if (!genRes.ok || !gen.config) throw new Error(gen.error ?? "AI generation failed")
        body = { name: name.trim() || "AI Forged Page", config: gen.config }
      } else {
        body = { name: name.trim() || "Untitled Project", templateId }
      }
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as ProjectWithConfig & { error?: string }
      if (!res.ok || !data.config) throw new Error(data.error ?? "Create failed")
      const config = normalizeConfig(data.config)
      onCreated({ ...data, sectionCount: config.sections.length, themeId: config.themeId } as ProjectSummary)
      onOpenChange(false)
      setName("")
      setPrompt("")
    } catch (e) {
      toast.error("Create failed", { description: e instanceof Error ? e.message : undefined })
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-zinc-800 bg-zinc-950">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">New landing page</DialogTitle>
          <DialogDescription className="text-zinc-400">Start from a template — or let the AI forge one from a prompt.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="proj-name" className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Project name
            </Label>
            <Input id="proj-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Vertex" className="h-9 border-zinc-700 bg-zinc-900/60 text-[13px] text-zinc-100" />
          </div>

          {/* Mode toggle */}
          <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900/50 p-1" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={!aiMode}
              onClick={() => setAiMode(false)}
              className={cn("h-7 flex-1 rounded-md text-[11px] font-medium transition-colors", !aiMode ? "bg-violet-500/20 text-violet-200" : "text-zinc-500 hover:text-zinc-200")}
            >
              📐 From template
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={aiMode}
              onClick={() => setAiMode(true)}
              className={cn("h-7 flex-1 rounded-md text-[11px] font-medium transition-colors", aiMode ? "bg-violet-500/20 text-violet-200" : "text-zinc-500 hover:text-zinc-200")}
            >
              <Sparkles className="mr-1 inline h-3 w-3" /> From AI prompt
            </button>
          </div>

          {aiMode ? (
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Describe the page</Label>
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Landing page for a coffee subscription, warm ember theme…"
                className="h-16 border-zinc-700 bg-zinc-900/60 text-[13px] text-zinc-100"
              />
              <p className="text-[10px] text-zinc-500">Takes ~30s — the AI writes all copy, picks a theme & layouts.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplateId(t.id)}
                  className={cn(
                    "rounded-lg border p-2.5 text-left transition-all hover:scale-[1.02] hover:border-violet-500/50",
                    templateId === t.id ? "border-violet-500 bg-violet-500/10 ring-1 ring-violet-500/30" : "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60"
                  )}
                  aria-pressed={templateId === t.id}
                >
                  <span className="text-lg">{t.icon}</span>
                  <p className="text-[12px] font-semibold text-zinc-100">{t.name}</p>
                  <p className="mt-0.5 text-[9px] leading-tight text-zinc-500">{t.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button size="sm" className="gap-1.5 bg-violet-500 text-white hover:bg-violet-600" onClick={create} disabled={creating}>
            {creating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> {aiMode ? "Forging…" : "Creating…"}
              </>
            ) : (
              <>
                <FilePlus2 className="h-3.5 w-3.5" /> Create project
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
