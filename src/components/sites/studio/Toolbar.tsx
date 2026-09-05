"use client"

import * as React from "react"
import { Command as CommandIcon, Code2, Download, Globe, Monitor, Moon, Palette, Redo2, Rocket, Save, SlidersHorizontal, Sparkles, Sun, Undo2, Upload, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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

  // color-scheme quick cycle: Theme default → Dark → Light → Auto
  const MODE_CYCLE: ("theme" | "dark" | "light" | "auto")[] = ["theme", "dark", "light", "auto"]
  const modeValue = brandMode ?? "theme"
  const nextMode = MODE_CYCLE[(MODE_CYCLE.indexOf(modeValue as "theme") + 1) % MODE_CYCLE.length]
  const ModeIcon = modeValue === "auto" ? Monitor : modeValue === "dark" ? Moon : modeValue === "light" ? Sun : Palette
  const modeLabel =
    modeValue === "theme" ? `Theme default (${getTheme(themeId).mode})` : modeValue === "auto" ? "Auto — follows system" : modeValue === "dark" ? "Forced dark" : "Forced light"
  const cycleMode = () => {
    updateBrand({ mode: nextMode === "theme" ? undefined : nextMode })
    toast.info(`Color scheme: ${nextMode === "theme" ? `theme default — ${getTheme(themeId).mode}` : nextMode}`, {
      description:
        nextMode === "theme"
          ? "Every palette keeps its built-in preference."
          : nextMode === "auto"
            ? "The preview + published page follow the visitor's system preference."
            : `All ${THEMES.length} themes ship a matching ${nextMode} palette.`,
    })
  }

  const openPublished = () => {
    window.open(`/p/${encodeURIComponent(slug)}`, "_blank", "noopener")
    toast.info("Published page opened", {
      description: "Visits, CTA clicks and form submits there are recorded live — refresh Analytics to see them.",
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800/80 bg-zinc-950 px-3 py-2">
      {/* Undo / redo */}
      <div className="flex items-center gap-0.5 rounded-lg border border-zinc-800 bg-zinc-950 p-0.5">
        <Button variant="ghost" size="icon" className="lf-focus h-7 w-7 text-zinc-400 hover:text-zinc-100 disabled:opacity-30" onClick={undo} disabled={!canUndo} aria-label="Undo" title="Undo (⌘Z)">
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="lf-focus h-7 w-7 text-zinc-400 hover:text-zinc-100 disabled:opacity-30" onClick={redo} disabled={!canRedo} aria-label="Redo" title="Redo (⇧⌘Z)">
          <Redo2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Project name */}
      <div className="flex min-w-0 items-center gap-1.5">
        <input
          value={projectName}
          onChange={(e) => setProjectMeta(e.target.value.slice(0, 60), useForge.getState().project.slug)}
          aria-label="Project name"
          className="w-28 min-w-0 truncate rounded-md border border-transparent bg-transparent px-2 py-1 text-[13px] font-semibold text-zinc-100 outline-none transition-colors hover:border-zinc-700 focus:border-violet-500/60 focus:bg-zinc-900/60 sm:w-40"
        />
        {dirty && <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-amber-400" title="Unsaved changes" aria-label="Unsaved changes" />}
      </div>

      {/* Theme quick switcher */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="lf-focus h-7 gap-1.5 border-zinc-800 bg-zinc-950 text-[11px] text-zinc-300 hover:border-violet-500/50" title={`One-click themes — ${THEMES.length} curated palettes, each with dark + light`}>
            <Palette className="h-3 w-3 text-violet-300" />
            <span className="hidden sm:inline">{THEMES.find((t) => t.id === themeId)?.name ?? "Theme"}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44 border-zinc-800 bg-zinc-900">
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-zinc-500">One-click themes</DropdownMenuLabel>
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
          <DropdownMenuItem className="gap-2 text-[12px] focus:bg-violet-500/20" onClick={() => openDialog("theme-tweaks")}>
            <SlidersHorizontal className="h-3.5 w-3.5 text-violet-300" />
            <span className="flex-1">Fine-tune…</span>
            {tweaksActive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" title="Tweaks active" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Color-scheme quick cycle — flips the live preview's dark/light */}
      <Button
        variant="outline"
        size="sm"
        onClick={cycleMode}
        aria-label={`Color scheme: ${modeLabel}. Click to switch.`}
        title={`Color scheme — ${modeLabel}. Click to cycle (Theme / Dark / Light / Auto).`}
        className="lf-focus h-7 gap-1.5 border-zinc-800 bg-zinc-950 text-[11px] text-zinc-300 hover:border-violet-500/50"
      >
        <ModeIcon className="h-3 w-3 text-violet-300" />
        <span className="hidden capitalize lg:inline">{modeValue === "theme" ? "Theme" : modeValue}</span>
      </Button>

      {/* Language preview switcher (visible when the site ships >1 locale) */}
      {locales.length > 1 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="lf-focus h-7 gap-1.5 border-zinc-800 bg-zinc-950 text-[11px] text-zinc-300 hover:border-violet-500/50" title="Preview language — translated sections render per locale">
              <Languages className="h-3 w-3 text-violet-300" />
              <span className="hidden sm:inline">{activeLocale.toUpperCase()}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44 border-zinc-800 bg-zinc-900">
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-zinc-500">Preview language</DropdownMenuLabel>
            {locales.map((l) => (
              <DropdownMenuItem
                key={l.code}
                className="gap-2 text-[12px] focus:bg-violet-500/20"
                onClick={() => setPreviewLocale(l.code === locales[0]?.code ? null : l.code)}
              >
                <span className="flex-1">
                  {l.label} {l.dir === "rtl" ? "· RTL" : ""}
                </span>
                <span className="font-mono text-[9px] text-zinc-500">{l.code}</span>
                {activeLocale === l.code && <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem className="gap-2 text-[11px] text-zinc-500 focus:bg-zinc-900" disabled>
              Translate per-section in Properties
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        {/* Readiness score */}
        <ReadinessChip />

        {/* ⌘K palette trigger */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCommandOpen(true)}
          title="Command palette (⌘K)"
          className="lf-focus h-7 gap-1.5 border-zinc-800 bg-zinc-950 text-[11px] text-zinc-400 hover:border-violet-500/50 hover:text-zinc-200"
        >
          <CommandIcon className="h-3 w-3" />
          <span className="hidden font-mono text-[10px] lg:inline">K</span>
        </Button>

        {/* AI */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="h-7 gap-1.5 bg-violet-500 text-[11px] text-white hover:bg-violet-600">
              <Sparkles className="h-3 w-3" /> AI
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

        {/* Import / export */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 gap-1.5 border-zinc-800 bg-zinc-950 text-[11px] text-zinc-300 hover:border-violet-500/50" title="Import / export — YAML and standalone HTML">
              <Download className="h-3 w-3" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 border-zinc-800 bg-zinc-900">
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
              <Save className="h-3.5 w-3.5 text-zinc-300" /> All projects…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Save (⌘S) — autosaved 3s after the last edit */}
        <Button
          variant="outline"
          size="sm"
          className={cn("h-7 gap-1.5 border-zinc-800 bg-zinc-950 text-[11px] hover:border-violet-500/50", dirty ? "border-amber-500/40 text-amber-200" : "text-zinc-300")}
          onClick={() => void save()}
          disabled={saving || !hasProject}
          title={dirty ? "Save now (⌘S) — autosave runs 3s after your last edit" : lastSavedAt ? `Saved ${new Date(lastSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — autosave on` : "Save (⌘S)"}
        >
          <Save className={cn("h-3 w-3", dirty && "text-amber-300", !dirty && !saving && "text-emerald-400/80")} />
          {saving ? "Saving…" : dirty ? "Save*" : "Saved"}
          {!saving && !dirty && lastSavedAt && <SavedAgo at={lastSavedAt} />}
        </Button>

        {/* Published page — real visitor tracking */}
        <Button
          variant="outline"
          size="sm"
          onClick={openPublished}
          disabled={!hasProject}
          title="Open the published page — a shareable URL where real visits are tracked (pageviews, CTA clicks, leads)"
          className="lf-focus h-7 gap-1.5 border-zinc-800 bg-zinc-950 text-[11px] text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-200"
        >
          <Globe className="h-3 w-3" />
          <span className="hidden lg:inline">Published</span>
        </Button>

        {/* Deploy */}
        <Button size="sm" className="h-7 gap-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-[11px] text-white lf-glow transition-all hover:from-violet-600 hover:to-fuchsia-600 active:scale-95" onClick={() => openDialog("deploy")} disabled={!hasProject}>
          <Rocket className="h-3 w-3" /> <span className="hidden sm:inline">Deploy</span>
        </Button>
      </div>
    </div>
  )
}
