"use client"

import * as React from "react"
import { Layers, Plus, Search, Sparkles } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useForge } from "@/lib/landing/store"
import { useUi } from "@/lib/landing/uiStore"
import { SECTION_META, SECTION_TYPES } from "@/lib/landing/types"
import type { SectionType } from "@/lib/landing/types"
import { CONTENT_PACKS, CONTENT_PACK_COUNT } from "@/lib/landing/contentPacks"

/**
 * Add-section dialog with content packs: pick a section type on the left,
 * pick a content preset on the right, click to insert. Replaces the old
 * quick-add dropdown with a deeper "30+ templates" chooser.
 */
export function AddSectionDialog() {
  const open = useUi((s) => s.dialog === "add-section")
  const closeDialog = useUi((s) => s.closeDialog)
  const addSection = useForge((s) => s.addSection)
  const setView = useUi((s) => s.setView)

  const [type, setType] = React.useState<SectionType>("hero")
  const [query, setQuery] = React.useState("")
  const [hoverPack, setHoverPack] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      setQuery("")
      setHoverPack(null)
    }
  }, [open])

  const filteredTypes = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return SECTION_TYPES
    return SECTION_TYPES.filter((t) => {
      const meta = SECTION_META[t]
      const packs = CONTENT_PACKS[t]
      return (
        meta.label.toLowerCase().includes(q) ||
        meta.description.toLowerCase().includes(q) ||
        packs.some((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
      )
    })
  }, [query])

  const add = (packId: string) => {
    const pack = CONTENT_PACKS[type].find((p) => p.id === packId)
    const label = SECTION_META[type].label
    // insert before the first footer-ish section when possible
    const sections = useForge.getState().config.sections
    let insertAt = sections.length
    const lastIdx = sections.length - 1
    const footerish = sections.findIndex((s) => s.type === "footer" || s.type === "cta-final")
    if (footerish !== -1) insertAt = footerish
    else if (lastIdx >= 0 && sections[lastIdx].type === "contact") insertAt = lastIdx
    addSection(type, insertAt, pack?.patch)
    closeDialog()
    setView("studio")
    toast.success(`${label} added`, {
      description: pack ? `Content: “${pack.name}” — edit anything in the properties panel.` : undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeDialog()}>
      <DialogContent className="max-h-[85vh] gap-0 overflow-hidden border-zinc-800 bg-zinc-950 p-0 sm:max-w-2xl">
        <DialogHeader className="space-y-1.5 border-b border-zinc-800/80 px-5 pb-3 pt-4">
          <DialogTitle className="flex items-center gap-2 text-[15px] font-bold text-zinc-50">
            <Plus className="h-4 w-4 text-violet-300" /> Add a section
          </DialogTitle>
          <DialogDescription className="text-[11.5px] leading-relaxed text-zinc-500">
            {CONTENT_PACK_COUNT} content packs across {SECTION_TYPES.length} section types — pick a preset, then edit every word in the
            properties panel.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[calc(85vh-8.5rem)] min-h-0 flex-col md:flex-row">
          {/* Left: section types list */}
          <div className="flex min-h-0 flex-col border-zinc-800/80 md:w-52 md:border-r">
            <div className="relative px-3 pb-2 pt-3">
              <Search className="pointer-events-none absolute left-5.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter…"
                aria-label="Filter section types and content packs"
                className="h-8 border-zinc-800 bg-zinc-900/60 pl-8 text-[12px] text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-violet-500/40"
              />
            </div>
            <div className="lf-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-2 md:max-h-none">
              {filteredTypes.length === 0 && (
                <p className="px-2 py-6 text-center text-[11px] text-zinc-600">
                  No match for “{query}”.
                </p>
              )}
              <div className="flex flex-row flex-wrap gap-1.5 md:flex-col md:gap-0.5">
                {filteredTypes.map((t) => {
                  const meta = SECTION_META[t]
                  const selected = t === type
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      aria-pressed={selected}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors md:w-full",
                        "md:flex-none",
                        selected
                          ? "bg-violet-500/15 text-violet-100 ring-1 ring-inset ring-violet-500/40"
                          : "text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200",
                        "min-w-[8.5rem] flex-1 md:min-w-0"
                      )}
                    >
                      <span className="text-base leading-none">{meta.icon}</span>
                      <span className="min-w-0 flex-1 truncate text-[12px] font-medium">{meta.label}</span>
                      <span
                        className={cn(
                          "hidden shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold tabular-nums md:inline",
                          selected ? "bg-violet-500/25 text-violet-200" : "bg-zinc-800/80 text-zinc-500"
                        )}
                        title={`${CONTENT_PACKS[t].length} content pack${CONTENT_PACKS[t].length === 1 ? "" : "s"}`}
                      >
                        {CONTENT_PACKS[t].length}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right: content packs for the selected type */}
          <div className="lf-scroll min-h-0 flex-1 overflow-y-auto p-3">
            <p className="mb-2 flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              <Layers className="h-3 w-3" />
              {SECTION_META[type].label} — {CONTENT_PACKS[type].length} pack{CONTENT_PACKS[type].length === 1 ? "" : "s"}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {CONTENT_PACKS[type].map((pack) => (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => add(pack.id)}
                  onMouseEnter={() => setHoverPack(pack.id)}
                  onMouseLeave={() => setHoverPack(null)}
                  className={cn(
                    "group relative flex flex-col gap-1.5 rounded-xl border p-3 text-left transition-all duration-200",
                    hoverPack === pack.id
                      ? "border-violet-500/50 bg-violet-500/10 shadow-lg shadow-violet-950/30"
                      : "border-zinc-800 bg-zinc-900/50 hover:border-violet-500/30"
                  )}
                  aria-label={`Add ${SECTION_META[type].label} with the ${pack.name} content pack`}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <span className="text-[12.5px] font-semibold text-zinc-100">{pack.name}</span>
                    {pack.id === (CONTENT_PACKS[type][0]?.id) && (
                      <span className="shrink-0 rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-px text-[8.5px] font-bold uppercase tracking-wider text-emerald-300">
                        default
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] leading-relaxed text-zinc-400">{pack.description}</span>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                    <span className="rounded-full bg-zinc-800/70 px-1.5 py-0.5 font-mono text-[9px] text-zinc-400">{pack.meta}</span>
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-md transition-all",
                        hoverPack === pack.id ? "bg-violet-500 text-white" : "bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700 group-hover:text-zinc-300"
                      )}
                      aria-hidden
                    >
                      <Plus className="h-3 w-3" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-1.5 px-1 text-[10px] text-zinc-600">
              <Sparkles className="h-3 w-3 shrink-0 text-violet-400/70" />
              Packs are starting points — every field stays editable after insert.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
