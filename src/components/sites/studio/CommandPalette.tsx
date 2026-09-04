"use client"

import * as React from "react"
import {
  BarChart3,
  Check,
  Code2,
  Command as CommandIcon,
  Download,
  Eye,
  FolderOpen,
  Globe,
  Link2,
  Hammer,
  Keyboard,
  Layers,
  Monitor,
  Images,
  Palette,
  Plus,
  Redo2,
  Rocket,
  Save,
  Search,
  Smartphone,
  Sparkles,
  Tablet,
  Undo2,
  Upload,
  Wand2,
} from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useForge } from "@/lib/landing/store"
import { useUi } from "@/lib/landing/uiStore"
import { THEMES } from "@/lib/landing/themes"
import { SECTION_META, SECTION_TYPES } from "@/lib/landing/types"
import type { DeviceType } from "@/lib/landing/types"
import { sectionAnchors, publishedAnchorUrl } from "@/lib/landing/anchors"
import { getAbTests, abTestLabel } from "@/lib/landing/ab"
import { useSaveProject } from "./useSaveProject"

const DEVICE_META: Record<DeviceType, { label: string; icon: typeof Monitor }> = {
  desktop: { label: "Desktop", icon: Monitor },
  tablet: { label: "Tablet · 834px", icon: Tablet },
  mobile: { label: "Mobile · 390px", icon: Smartphone },
}

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform ?? navigator.userAgent)
const MOD = isMac ? "⌘" : "Ctrl"

export const SHORTCUTS: { keys: string; label: string; group: string }[] = [
  { keys: `${MOD} K`, label: "Open command palette", group: "Global" },
  { keys: `${MOD} S`, label: "Save project", group: "Global" },
  { keys: `${MOD} Z`, label: "Undo", group: "Global" },
  { keys: `⇧ ${MOD} Z`, label: "Redo", group: "Global" },
  { keys: "?", label: "Show keyboard shortcuts", group: "Global" },
  { keys: `${MOD} P`, label: "Toggle full-screen preview", group: "Studio" },
  { keys: `${MOD} E`, label: "Export YAML", group: "Studio" },
  { keys: `${MOD} I`, label: "Import YAML", group: "Studio" },
  { keys: `${MOD} D`, label: "Deploy", group: "Studio" },
  { keys: "Esc", label: "Close dialogs / exit preview", group: "Studio" },
]

/** Global ⌘K command palette — every studio action one keystroke away. */
export function CommandPalette() {
  const commandOpen = useUi((s) => s.commandOpen)
  const setCommandOpen = useUi((s) => s.setCommandOpen)
  const openDialog = useUi((s) => s.openDialog)
  const setView = useUi((s) => s.setView)

  const config = useForge((s) => s.config)
  const selectedSectionId = useForge((s) => s.selectedSectionId)
  const selectSection = useForge((s) => s.selectSection)
  const addSection = useForge((s) => s.addSection)
  const setTheme = useForge((s) => s.setTheme)
  const device = useForge((s) => s.device)
  const setDevice = useForge((s) => s.setDevice)
  const previewMode = useForge((s) => s.previewMode)
  const setPreviewMode = useForge((s) => s.setPreviewMode)
  const abPreviewVariant = useForge((s) => s.abPreviewVariant)
  const setAbPreviewVariant = useForge((s) => s.setAbPreviewVariant)
  const abPreviewVariants = useForge((s) => s.abPreviewVariants)
  const setAbPreviewVariantFor = useForge((s) => s.setAbPreviewVariantFor)
  const canUndo = useForge((s) => s.past.length > 0)
  const canRedo = useForge((s) => s.future.length > 0)
  const undo = useForge((s) => s.undo)
  const redo = useForge((s) => s.redo)
  const { save } = useSaveProject()

  const hero = config.sections.find((s) => s.type === "hero")
  // all enabled section-level tests (hero first)
  const abTests = React.useMemo(() => getAbTests(config), [config])

  // sections that render an anchor → "Copy anchor link" deep-link commands
  const anchorEntries = React.useMemo(() => {
    const anchors = sectionAnchors(config)
    return config.sections
      .map((section) => ({ section, anchor: anchors.get(section.id) }))
      .filter((e): e is { section: typeof e.section; anchor: string } => Boolean(e.anchor))
  }, [config])

  // ── Global hotkeys ────────────────────────────────────────────────────────
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      const key = e.key.toLowerCase()

      if (mod && key === "k") {
        e.preventDefault()
        useUi.getState().setCommandOpen(!useUi.getState().commandOpen)
        return
      }
      if (mod && key === "p") {
        e.preventDefault()
        useUi.getState().setView("studio")
        useForge.getState().setPreviewMode(!useForge.getState().previewMode)
        return
      }
      if (mod && key === "e") {
        e.preventDefault()
        useUi.getState().openDialog("export-yaml")
        return
      }
      if (mod && key === "i") {
        e.preventDefault()
        useUi.getState().openDialog("import-yaml")
        return
      }
      if (mod && key === "d") {
        e.preventDefault()
        useUi.getState().openDialog("deploy")
        return
      }
      // ⌘Z / ⇧⌘Z undo-redo (the toolbar tooltips promise it)
      if (mod && key === "z" && !e.shiftKey) {
        const target = e.target as HTMLElement | null
        const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable
        if (!typing) {
          e.preventDefault()
          useForge.getState().undo()
        }
        return
      }
      if (mod && (key === "z" || key === "y") && e.shiftKey) {
        const target = e.target as HTMLElement | null
        const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable
        if (!typing) {
          e.preventDefault()
          useForge.getState().redo()
        }
        return
      }
      // "?" opens shortcuts — only when not typing
      const target = e.target as HTMLElement | null
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable
      if (e.key === "?" && !typing) {
        e.preventDefault()
        useUi.getState().openDialog("shortcuts")
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const run = (fn: () => void) => {
    setCommandOpen(false)
    fn()
  }

  return (
    <CommandDialog
      open={commandOpen}
      onOpenChange={setCommandOpen}
      title="Command palette"
      description="Search every studio action"
      className="top-[20%] translate-y-0 border-zinc-800 bg-zinc-900/95 shadow-2xl shadow-violet-950/40 backdrop-blur-xl sm:max-w-lg [&_[cmdk-group-heading]]:text-zinc-500"
    >
      <CommandInput placeholder="Type a command or search…" className="text-[13px] text-zinc-100 placeholder:text-zinc-500" />
      <CommandList className="max-h-[420px] py-1">
        <CommandEmpty className="py-8 text-center text-[12px] text-zinc-500">
          No commands match — try “deploy”, “theme” or “add”.
        </CommandEmpty>

        {/* Actions */}
        <CommandGroup heading="Actions">
          <CommandItem className="text-[13px] text-zinc-200 data-[selected=true]:bg-violet-500/20 data-[selected=true]:text-violet-100" onSelect={() => run(() => void save())}>
            <Save className="h-4 w-4 text-violet-300" /> Save project
            <CommandShortcut>{MOD}S</CommandShortcut>
          </CommandItem>
          <CommandItem className="text-[13px] text-zinc-200 data-[selected=true]:bg-violet-500/20 data-[selected=true]:text-violet-100" onSelect={() => run(() => openDialog("deploy"))}>
            <Rocket className="h-4 w-4 text-fuchsia-300" /> Deploy site
            <CommandShortcut>{MOD}D</CommandShortcut>
          </CommandItem>
          <CommandItem
            className="text-[13px] text-zinc-200 data-[selected=true]:bg-emerald-500/15 data-[selected=true]:text-emerald-100"
            onSelect={() =>
              run(() => {
                const slug = useForge.getState().project.slug
                if (!useForge.getState().project.id) return
                window.open(`/p/${encodeURIComponent(slug)}`, "_blank", "noopener")
                toast.info("Published page opened 🔗", { description: "Real visits there are tracked — refresh Analytics to see them." })
              })
            }
          >
            <Globe className="h-4 w-4 text-emerald-300" /> Open published page (live tracking)
          </CommandItem>
          <CommandItem className="text-[13px] text-zinc-200 data-[selected=true]:bg-violet-500/20 data-[selected=true]:text-violet-100" onSelect={() => run(undo)} disabled={!canUndo}>
            <Undo2 className="h-4 w-4 text-zinc-400" /> Undo
            <CommandShortcut>{MOD}Z</CommandShortcut>
          </CommandItem>
          <CommandItem className="text-[13px] text-zinc-200 data-[selected=true]:bg-violet-500/20 data-[selected=true]:text-violet-100" onSelect={() => run(redo)} disabled={!canRedo}>
            <Redo2 className="h-4 w-4 text-zinc-400" /> Redo
            <CommandShortcut>⇧{MOD}Z</CommandShortcut>
          </CommandItem>
          <CommandItem className="text-[13px] text-zinc-200 data-[selected=true]:bg-violet-500/20 data-[selected=true]:text-violet-100" onSelect={() => run(() => setPreviewMode(!previewMode))}>
            <Eye className="h-4 w-4 text-zinc-400" /> {previewMode ? "Exit full-screen preview" : "Full-screen preview"}
            <CommandShortcut>{MOD}P</CommandShortcut>
          </CommandItem>
          <CommandItem className="text-[13px] text-zinc-200 data-[selected=true]:bg-violet-500/20 data-[selected=true]:text-violet-100" onSelect={() => run(() => openDialog("ai-generate"))}>
            <Sparkles className="h-4 w-4 text-violet-300" /> Generate page with AI…
          </CommandItem>
          <CommandItem className="text-[13px] text-zinc-200 data-[selected=true]:bg-violet-500/20 data-[selected=true]:text-violet-100" onSelect={() => run(() => openDialog("ai-improve"))}>
            <Wand2 className="h-4 w-4 text-violet-300" /> Improve copy with AI…
          </CommandItem>
          <CommandItem className="text-[13px] text-zinc-200 data-[selected=true]:bg-violet-500/20 data-[selected=true]:text-violet-100" onSelect={() => run(() => openDialog("export-yaml"))}>
            <Download className="h-4 w-4 text-zinc-400" /> Export YAML…
            <CommandShortcut>{MOD}E</CommandShortcut>
          </CommandItem>
          <CommandItem className="text-[13px] text-zinc-200 data-[selected=true]:bg-violet-500/20 data-[selected=true]:text-violet-100" onSelect={() => run(() => openDialog("export-html"))}>
            <Code2 className="h-4 w-4 text-zinc-400" /> Export standalone HTML…
          </CommandItem>
          <CommandItem className="text-[13px] text-zinc-200 data-[selected=true]:bg-violet-500/20 data-[selected=true]:text-violet-100" onSelect={() => run(() => openDialog("import-yaml"))}>
            <Upload className="h-4 w-4 text-zinc-400" /> Import YAML…
            <CommandShortcut>{MOD}I</CommandShortcut>
          </CommandItem>
          <CommandItem className="text-[13px] text-zinc-200 data-[selected=true]:bg-violet-500/20 data-[selected=true]:text-violet-100" onSelect={() => run(() => openDialog("readiness"))}>
            <Check className="h-4 w-4 text-emerald-300" /> Landing readiness score…
          </CommandItem>
          <CommandItem className="text-[13px] text-zinc-200 data-[selected=true]:bg-violet-500/20 data-[selected=true]:text-violet-100" onSelect={() => run(() => openDialog("image-library"))}>
            <Images className="h-4 w-4 text-violet-300" /> Image library — reuse / delete generated images
          </CommandItem>
          <CommandItem className="text-[13px] text-zinc-200 data-[selected=true]:bg-violet-500/20 data-[selected=true]:text-violet-100" onSelect={() => run(() => openDialog("shortcuts"))}>
            <Keyboard className="h-4 w-4 text-zinc-400" /> Keyboard shortcuts
            <CommandShortcut>?</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator className="bg-zinc-800/60" />

        {/* Jump to section */}
        {config.sections.length > 0 && (
          <CommandGroup heading="Jump to section">
            {config.sections.map((section, i) => (
              <CommandItem
                key={section.id}
                value={`section ${i + 1} ${SECTION_META[section.type].label} ${section.type}`}
                className="text-[13px] text-zinc-200 data-[selected=true]:bg-violet-500/20 data-[selected=true]:text-violet-100"
                onSelect={() =>
                  run(() => {
                    setView("studio")
                    setPreviewMode(false)
                    selectSection(section.id)
                  })
                }
              >
                <span className="w-5 text-center text-[13px] leading-none">{SECTION_META[section.type].icon}</span>
                <span className="truncate">
                  {SECTION_META[section.type].label}
                  {section.type !== "hero" && section.type !== "navbar" && "title" in section && typeof section.title === "string" && section.title ? ` — ${section.title.slice(0, 32)}` : ""}
                </span>
                <span className="ml-auto flex items-center gap-2">
                  {section.hidden && <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-zinc-500">hidden</span>}
                  <span className="text-[10px] tabular-nums text-zinc-600">#{i + 1}</span>
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator className="bg-zinc-800/60" />

        {/* Copy anchor deep-links */}
        {anchorEntries.length > 0 && (
          <CommandGroup heading="Copy anchor link">
            {anchorEntries.map(({ section, anchor }, i) => (
              <CommandItem
                key={section.id}
                value={`copy anchor link ${SECTION_META[section.type].label} ${anchor} section ${i + 1}`}
                className="text-[13px] text-zinc-200 data-[selected=true]:bg-emerald-500/15 data-[selected=true]:text-emerald-100"
                onSelect={() =>
                  run(() => {
                    const slug = useForge.getState().project.slug
                    const url = publishedAnchorUrl(slug, anchor)
                    void navigator.clipboard
                      .writeText(url)
                      .then(() => toast.success(`Deep link copied 🔗 #${anchor}`, { description: "Opens the published page scrolled straight to this section." }))
                      .catch(() => toast.error("Copy failed", { description: url }))
                  })
                }
              >
                <span className="w-5 text-center text-[13px] leading-none">{SECTION_META[section.type].icon}</span>
                <span className="truncate">{SECTION_META[section.type].label}</span>
                <span className="font-mono text-[11px] text-emerald-300">#{anchor}</span>
                <span className="ml-auto hidden items-center gap-1 text-[10px] text-zinc-600 sm:flex">
                  <Link2 className="h-3 w-3" /> deep link
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator className="bg-zinc-800/60" />

        {/* Add section */}
        <CommandGroup heading="Add section">
          <CommandItem
            value="add browse packs template chooser"
            className="text-[13px] text-zinc-200 data-[selected=true]:bg-violet-500/20 data-[selected=true]:text-violet-100"
            onSelect={() =>
              run(() => {
                setView("studio")
                setPreviewMode(false)
                openDialog("add-section")
              })
            }
          >
            <Layers className="h-4 w-4 text-violet-300" />
            Browse content packs…
            <span className="ml-auto hidden text-[10px] text-zinc-600 sm:block">35 presets across 12 types</span>
          </CommandItem>
          {SECTION_TYPES.map((type) => (
            <CommandItem
              key={type}
              value={`add ${type} ${SECTION_META[type].label}`}
              className="text-[13px] text-zinc-200 data-[selected=true]:bg-violet-500/20 data-[selected=true]:text-violet-100"
              onSelect={() =>
                run(() => {
                  setView("studio")
                  setPreviewMode(false)
                  addSection(type)
                  toast.success(`${SECTION_META[type].label} section added`, { description: SECTION_META[type].description })
                })
              }
            >
              <Plus className="h-4 w-4 text-zinc-500" />
              <span className="w-5 text-center text-[13px] leading-none">{SECTION_META[type].icon}</span>
              {SECTION_META[type].label}
              <span className="ml-auto hidden text-[10px] text-zinc-600 sm:block">{SECTION_META[type].description}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator className="bg-zinc-800/60" />

        {/* Theme */}
        <CommandGroup heading="Theme">
          {THEMES.map((t) => (
            <CommandItem
              key={t.id}
              value={`theme ${t.id} ${t.name}`}
              className="text-[13px] text-zinc-200 data-[selected=true]:bg-violet-500/20 data-[selected=true]:text-violet-100"
              onSelect={() =>
                run(() => {
                  setView("studio")
                  setTheme(t.id)
                })
              }
            >
              <Palette className="h-4 w-4 text-zinc-500" />
              <span className="flex gap-1">
                {t.swatch.map((c) => (
                  <span key={c} className="h-3 w-3 rounded-[3px] border border-black/40" style={{ background: c }} />
                ))}
              </span>
              {t.name}
              {config.themeId === t.id && <Check className="h-3.5 w-3.5 text-violet-300" />}
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Device */}
        <CommandGroup heading="Preview device">
          {(Object.keys(DEVICE_META) as DeviceType[]).map((d) => {
            const Icon = DEVICE_META[d].icon
            return (
              <CommandItem
                key={d}
                value={`device ${d} ${DEVICE_META[d].label}`}
                className="text-[13px] text-zinc-200 data-[selected=true]:bg-violet-500/20 data-[selected=true]:text-violet-100"
                onSelect={() =>
                  run(() => {
                    setView("studio")
                    setDevice(d)
                  })
                }
              >
                <Icon className="h-4 w-4 text-zinc-400" />
                {DEVICE_META[d].label}
                {device === d && <Check className="h-3.5 w-3.5 text-violet-300" />}
              </CommandItem>
            )
          })}
        </CommandGroup>

        {/* A/B variants — one group per active section-level test */}
        {abTests.length > 0 && (
          <>
            <CommandSeparator className="bg-zinc-800/60" />
            <CommandGroup heading="A/B variant preview">
              {abTests.flatMap(({ section, ab }) => {
                const testLabel = abTestLabel(config, section)
                const active = section.type === "hero" ? abPreviewVariants[section.id] ?? abPreviewVariant : abPreviewVariants[section.id]
                const items = [
                  <CommandItem
                    key={`${section.id}-control`}
                    value={`ab ${testLabel} original control`}
                    className="text-[13px] text-zinc-200 data-[selected=true]:bg-violet-500/20 data-[selected=true]:text-violet-100"
                    onSelect={() =>
                      run(() => {
                        setAbPreviewVariantFor(section.id, null)
                        if (section.type === "hero") setAbPreviewVariant(null)
                      })
                    }
                  >
                    <BarChart3 className="h-4 w-4 text-zinc-400" />
                    <span className="truncate">
                      {abTests.length > 1 ? <span className="text-violet-300">{testLabel} · </span> : null}
                      Original (control)
                    </span>
                    {!active && <Check className="h-3.5 w-3.5 text-violet-300" />}
                  </CommandItem>,
                  ...ab.variants.map((v) => (
                    <CommandItem
                      key={`${section.id}-${v.id}`}
                      value={`ab ${testLabel} variant ${v.name} ${v.headline}`}
                      className="text-[13px] text-zinc-200 data-[selected=true]:bg-violet-500/20 data-[selected=true]:text-violet-100"
                      onSelect={() =>
                        run(() => {
                          setAbPreviewVariantFor(section.id, v.name)
                          if (section.type === "hero") setAbPreviewVariant(v.name)
                        })
                      }
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-zinc-800 text-[10px] font-bold text-zinc-300">{v.name}</span>
                      <span className="truncate">
                        {abTests.length > 1 ? <span className="text-violet-300">{testLabel} · </span> : null}
                        {v.headline.slice(0, 48)}
                      </span>
                      {active === v.name && <Check className="h-3.5 w-3.5 text-violet-300" />}
                    </CommandItem>
                  )),
                ]
                return items
              })}
            </CommandGroup>
          </>
        )}

        <CommandSeparator className="bg-zinc-800/60" />

        {/* Views */}
        <CommandGroup heading="Go to">
          {[
            { id: "studio" as const, label: "Studio", icon: Hammer, hint: "Build & edit" },
            { id: "analytics" as const, label: "Analytics", icon: BarChart3, hint: "Traffic & A/B results" },
            { id: "projects" as const, label: "Projects", icon: FolderOpen, hint: "All landing pages" },
          ].map(({ id, label, icon: Icon, hint }) => (
            <CommandItem
              key={id}
              value={`go ${id} ${label}`}
              className="text-[13px] text-zinc-200 data-[selected=true]:bg-violet-500/20 data-[selected=true]:text-violet-100"
              onSelect={() => run(() => setView(id))}
            >
              <Icon className="h-4 w-4 text-zinc-400" />
              {label}
              <span className="ml-auto hidden text-[10px] text-zinc-600 sm:block">{hint}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>

      {/* Footer hint */}
      <div className="flex items-center gap-3 border-t border-zinc-800/60 px-3 py-2 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1">
          <CommandIcon className="h-3 w-3" /> K to toggle
        </span>
        <span className="flex items-center gap-1">
          <Search className="h-3 w-3" /> fuzzy search
        </span>
        <span className="ml-auto flex items-center gap-1">
          <Keyboard className="h-3 w-3" /> ? all shortcuts
        </span>
      </div>
    </CommandDialog>
  )
}

/** "?" — full keyboard shortcut reference. */
export function ShortcutsDialog() {
  const dialog = useUi((s) => s.dialog)
  const closeDialog = useUi((s) => s.closeDialog)
  const open = dialog === "shortcuts"

  const groups = React.useMemo(() => {
    const map = new Map<string, typeof SHORTCUTS>()
    for (const s of SHORTCUTS) {
      const list = map.get(s.group) ?? []
      list.push(s)
      map.set(s.group, list)
    }
    return [...map.entries()]
  }, [])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeDialog()}>
      <DialogContent className="max-w-md border-zinc-800 bg-zinc-900/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[15px] font-bold text-zinc-100">
            <Keyboard className="h-4 w-4 text-violet-300" /> Keyboard shortcuts
          </DialogTitle>
          <DialogDescription className="text-[12px] text-zinc-500">
            Every studio action one keystroke away. Press <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1 font-mono text-[10px] text-zinc-300">?</kbd> anytime.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-1">
          {groups.map(([group, items]) => (
            <div key={group}>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{group}</p>
              <div className="grid grid-cols-1 gap-1">
                {items.map((s) => (
                  <div key={s.keys + s.label} className="flex items-center justify-between rounded-md px-2 py-1.5 odd:bg-zinc-800/40">
                    <span className="text-[12px] text-zinc-300">{s.label}</span>
                    <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-zinc-200">{s.keys}</kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="border-t border-zinc-800/60 pt-3 text-[10px] text-zinc-600">
          Shortcuts use {MOD === "⌘" ? "Command" : "Ctrl"} on your platform.
        </p>
      </DialogContent>
    </Dialog>
  )
}
