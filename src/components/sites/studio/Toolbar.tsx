"use client"

import * as React from "react"
import { Camera, Code2, Command as CommandIcon, Download, FileText, FolderOpen, Globe, Palette, Redo2, Rocket, Save, SlidersHorizontal, Sparkles, Undo2, Upload, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useForge } from "@/lib/landing/store"
import { useUi } from "@/lib/landing/uiStore"
import { THEMES, getTheme } from "@/lib/landing/themes"
import { localesOf } from "@/lib/landing/i18n"
import { Languages } from "lucide-react"
import { ReadinessChip } from "./ReadinessPanel"
import { useSaveProject } from "./useSaveProject"
import { toast } from "sonner"

/** Shared outline style — every neutral toolbar control wears the same skin,
 *  so the row reads as one organized strip instead of mixed button types. */
const TOOL = "lf-focus h-7 gap-1.5 border-zinc-800 bg-zinc-900/40 text-[11px] font-semibold text-zinc-300 hover:border-violet-500/50 hover:text-zinc-100"

/** Relative "saved X ago" label that self-refreshes (used inside the Save button). */
function SavedAgo({ at }: { at: number }) {
  const [, force] = React.useReducer((x: number) => x + 1, 0)
  React.useEffect(() => {
    const t = setInterval(force, 30_000) // refresh at most every 30s
    return () => clearInterval(t)
  }, [])
  const s = Math.max(0, Math.floor((Date.now() - at) / 1000))
  const label = s < 45 ? "just now" : s < 5400 ? `${Math.max(1, Math.round(s / 60))}m ago` : `${Math.round(s / 3600)}h ago`
  return <span className="hidden tabular-nums text-zinc-500 md:inline">· {label}</span>
}

export function Toolbar() {
  const projectName = useForge((s) => s.project.name)
  const setProjectMeta = useForge((s) => s.setProjectMeta)
  const themeId = useForge((s) => s.config.themeId)
  const setTheme = useForge((s) => s.setTheme)
  const canUndo = useForge((s) => s.past.length > 0)
  const canRedo = useForge((s) => s.future.length > 0)
  const undo = useForge((s) => s.undo)
  const redo = useForge((s) => s.redo)
  const dirty = useForge((s) => s.dirty)
  const openDialog = useUi((s) => s.openDialog)
  const setCommandOpen = useUi((s) => s.setCommandOpen)
  const setView = useUi((s) => s.setView)
  const { save, saving, hasProject, lastSavedAt } = useSaveProject()
  const slug = useForge((s) => s.project.slug)
  const config = useForge((s) => s.config)
  const previewLocale = useUi((s) => s.previewLocale)
  const setPreviewLocale = useUi((s) => s.setPreviewLocale)
  const brandMode = useForge((s) => s.config.brand.mode)
  const updateBrand = useForge((s) => s.updateBrand)
  const tweaksActive = !!useForge((s) => s.config.themeTweaks)
  const locales = localesOf(config)
  const activeLocale = previewLocale ?? locales[0]?.code

  const modeValue = brandMode ?? "theme"

  const setMode = (mode: "theme" | "dark" | "light" | "auto") => {
    updateBrand({ mode: mode === "theme" ? undefined : mode })
    toast.info(
      mode === "theme"
        ? `Color scheme: theme default — ${getTheme(themeId).mode}`
        : `Color scheme: ${mode === "auto" ? "auto (follows system)" : `forced ${mode}`}`,
      {
        description:
          mode === "theme"
            ? "Every palette keeps its built-in preference."
            : mode === "auto"
              ? "The preview + published page follow the visitor's system preference."
              : `All ${THEMES.length} themes ship a matching ${mode} palette.`,
      },
    )
  }

  const openPublished = () => {
    window.open(`/p/${encodeURIComponent(slug)}`, "_blank", "noopener")
    toast.info("Published page opened", {
      description: "Visits, CTA clicks and form submits there are recorded live — refresh Analytics to see them.",
    })
  }

  return (
    <div className="lf-scroll flex h-11 shrink-0 items-center gap-2 overflow-x-auto border-b border-zinc-800/80 bg-zinc-950 px-2 sm:px-3">
      {/* ── Zone 1 · History ─────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-zinc-800 bg-zinc-900/40 p-0.5">
        <Button variant="ghost" size="icon" className="lf-focus h-7 w-7 text-zinc-400 hover:text-zinc-100 disabled:opacity-30" onClick={undo} disabled={!canUndo} aria-label="Undo" title="Undo (⌘Z)">
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="lf-focus h-7 w-7 text-zinc-400 hover:text-zinc-100 disabled:opacity-30" onClick={redo} disabled={!canRedo} aria-label="Redo" title="Redo (⇧⌘Z)">
          <Redo2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="lf-focus h-7 w-7 text-zinc-400 hover:text-violet-200"
          onClick={() => openDialog("snapshots")}
          aria-label="Version snapshots"
          title="Version snapshots — 5 named save-points on top of undo/redo"
        >
          <Camera className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* ── Zone 2 · Project name ────────────────────────────────────── */}
      <div className="flex min-w-0 shrink items-center gap-1.5">
        <input
          value={projectName}
          onChange={(e) => setProjectMeta(e.target.value.slice(0, 60), useForge.getState().project.slug)}
          aria-label="Project name"
          className="w-24 min-w-0 truncate rounded-md border border-transparent bg-transparent px-2 py-1 text-[13px] font-semibold text-zinc-100 outline-none transition-colors hover:border-zinc-700 focus:border-violet-500/60 focus:bg-zinc-900/60 sm:w-40"
        />
        {dirty && <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-amber-400" title="Unsaved changes" aria-label="Unsaved changes" />}
      </div>

      {/* ── Zone 3 · Right cluster — score, design, file, AI, save, ship ── */}
      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        {/* Readiness score */}
        <ReadinessChip />

        {/* Design — one dropdown for theme, color scheme and preview language */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className={TOOL} title={`Design — ${THEMES.length} themes, color scheme, preview language`}>
              <Palette className="h-3 w-3 text-violet-300" />
              <span className="hidden sm:inline">{THEMES.find((t) => t.id === themeId)?.name ?? "Theme"}</span>
              <span className="sr-only">Design</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 border-zinc-800 bg-zinc-900">
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-zinc-500">Theme</DropdownMenuLabel>
            {THEMES.map((t) => (
              <DropdownMenuItem key={t.id} className="gap-2 text-[12px] focus:bg-violet-500/20" onClick={() => setTheme(t.id)}>
                <span className="flex gap-0.5">
                  {t.swatch.map((c) => (
                    <span key={c} className="h-3 w-3 rounded-[3px] border border-black/30" style={{ background: c }} />
                  ))}
                </span>
                <span className="flex-1">{t.name}</span>
                {t.id === themeId && <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-zinc-500">Color scheme</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={modeValue} onValueChange={(v) => setMode(v as "theme" | "dark" | "light" | "auto")}>
              <DropdownMenuRadioItem value="theme" className="gap-2 text-[12px] focus:bg-violet-500/20">
                Theme default <span className="ml-auto text-[10px] text-zinc-500">({getTheme(themeId).mode})</span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark" className="gap-2 text-[12px] focus:bg-violet-500/20">
                Forced dark
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="light" className="gap-2 text-[12px] focus:bg-violet-500/20">
                Forced light
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="auto" className="gap-2 text-[12px] focus:bg-violet-500/20">
                Auto · follows visitor
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            {locales.length > 1 && (
              <>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-zinc-500">Preview language</DropdownMenuLabel>
                {locales.map((l) => (
                  <DropdownMenuItem
                    key={l.code}
                    className="gap-2 text-[12px] focus:bg-violet-500/20"
                    onClick={() => setPreviewLocale(l.code === locales[0]?.code ? null : l.code)}
                  >
                    <Languages className="h-3.5 w-3.5 text-zinc-500" />
                    <span className="flex-1">
                      {l.label} {l.dir === "rtl" ? "· RTL" : ""}
                    </span>
                    <span className="font-mono text-[9px] text-zinc-500">{l.code}</span>
                    {activeLocale === l.code && <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem className="gap-2 text-[12px] focus:bg-violet-500/20" onClick={() => openDialog("theme-tweaks")}>
              <SlidersHorizontal className="h-3.5 w-3.5 text-violet-300" />
              <span className="flex-1">Fine-tune colors…</span>
              {tweaksActive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" title="Tweaks active" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* File — import / export / projects / command palette */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className={TOOL} title="File — YAML import / export, standalone HTML, all projects">
              <FileText className="h-3 w-3" />
              <span className="hidden md:inline">File</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-zinc-800 bg-zinc-900">
            <DropdownMenuItem className="gap-2 text-[12px] focus:bg-violet-500/20" onClick={() => openDialog("export-yaml")}>
              <Download className="h-3.5 w-3.5 text-zinc-300" /> Export YAML…
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-[12px] focus:bg-violet-500/20" onClick={() => openDialog("import-yaml")}>
              <Upload className="h-3.5 w-3.5 text-zinc-300" /> Import YAML…
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-[12px] focus:bg-violet-500/20" onClick={() => openDialog("export-html")}>
              <Code2 className="h-3.5 w-3.5 text-zinc-300" /> Export standalone HTML…
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem className="gap-2 text-[12px] focus:bg-violet-500/20" onClick={() => setView("projects")}>
              <FolderOpen className="h-3.5 w-3.5 text-zinc-300" /> All projects…
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-[12px] focus:bg-violet-500/20" onClick={() => setCommandOpen(true)}>
              <CommandIcon className="h-3.5 w-3.5 text-zinc-300" /> Command palette
              <span className="ml-auto font-mono text-[9px] text-zinc-500">⌘K</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* AI */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="lf-focus h-7 gap-1.5 border-violet-500/40 bg-violet-500/10 text-[11px] font-semibold text-violet-200 hover:bg-violet-500/20 hover:text-violet-100">
              <Sparkles className="h-3 w-3" /> <span className="hidden sm:inline">AI</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 border-zinc-800 bg-zinc-900">
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-zinc-500">landing-forge AI</DropdownMenuLabel>
            <DropdownMenuItem className="gap-2 text-[12px] focus:bg-violet-500/20" onClick={() => openDialog("ai-generate")}>
              <Sparkles className="h-3.5 w-3.5 text-violet-300" /> Generate from prompt…
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-[12px] focus:bg-violet-500/20" onClick={() => openDialog("ai-improve")}>
              <Wand2 className="h-3.5 w-3.5 text-violet-300" /> Improve copy…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Save (⌘S) — autosaved 3s after the last edit */}
        <Button
          variant="outline"
          size="sm"
          className={cn(TOOL, dirty ? "border-amber-500/40 text-amber-200" : !dirty && "text-zinc-300")}
          onClick={() => void save()}
          disabled={saving || !hasProject}
          title={dirty ? "Save now (⌘S) — autosave runs 3s after your last edit" : lastSavedAt ? `Saved ${new Date(lastSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — autosave on` : "Save (⌘S)"}
        >
          <Save className={cn("h-3 w-3", dirty && "text-amber-300", !dirty && !saving && "text-emerald-400/80")} />
          <span className="whitespace-nowrap">{saving ? "Saving…" : dirty ? "Save" : "Saved"}</span>
          {!saving && !dirty && lastSavedAt && <SavedAgo at={lastSavedAt} />}
        </Button>

        {/* Published page — real visitor tracking */}
        <Button
          variant="outline"
          size="sm"
          onClick={openPublished}
          disabled={!hasProject}
          title="Open the published page — a shareable URL where real visits are tracked (pageviews, CTA clicks, leads)"
          className={cn(TOOL, "hover:border-emerald-500/50 hover:text-emerald-200")}
        >
          <Globe className="h-3 w-3" />
          <span className="hidden lg:inline">Published</span>
        </Button>

        {/* Deploy — the single primary action in the strip */}
        <Button
          size="sm"
          className="lf-focus lf-glow h-7 gap-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-[11px] font-semibold text-white transition-all hover:from-violet-600 hover:to-fuchsia-600 active:scale-95"
          onClick={() => openDialog("deploy")}
          disabled={!hasProject}
        >
          <Rocket className="h-3 w-3" /> <span className="hidden sm:inline">Deploy</span>
        </Button>
      </div>
    </div>
  )
}
