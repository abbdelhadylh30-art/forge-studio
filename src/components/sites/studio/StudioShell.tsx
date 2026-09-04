"use client"

import * as React from "react"
import { Layers, SlidersHorizontal, SquarePen } from "lucide-react"
import { cn } from "@/lib/utils"
import { Toolbar } from "./Toolbar"
import { SectionsPanel } from "./SectionsPanel"
import { PropertiesPanel } from "./PropertiesPanel"
import { DevicePreview } from "./DevicePreview"
import { useForge } from "@/lib/landing/store"

type MobilePane = "sections" | "preview" | "properties"

export function StudioShell() {
  const [mobilePane, setMobilePane] = React.useState<MobilePane>("preview")
  const selectedSectionId = useForge((s) => s.selectedSectionId)
  const sectionsLength = useForge((s) => s.config.sections.length)
  const previewMode = useForge((s) => s.previewMode)

  const panes: { id: MobilePane; label: string; icon: typeof Layers; count?: number }[] = [
    { id: "sections", label: "Sections", icon: Layers, count: sectionsLength },
    { id: "preview", label: "Preview", icon: SquarePen },
    { id: "properties", label: "Edit", icon: SlidersHorizontal },
  ]

  // UX: picking a section from the Sections list auto-jumps to its properties.
  // Only fires while the "sections" pane is active — clicks in the preview
  // canvas (other panes) keep the current pane.
  React.useEffect(() => {
    if (selectedSectionId && mobilePane === "sections") setMobilePane("properties")
  }, [selectedSectionId, mobilePane])

  // Full-screen interactive preview: no chrome at all except the preview toolbar.
  if (previewMode) {
    return <DevicePreview className="flex min-h-0 flex-1" />
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Toolbar />

      {/* Pane switcher — visible below xl (1280px). Covers BOTH phones and the
          lg–xl range (1024–1280), where the properties panel doesn't fit yet
          and used to be unreachable (switcher hidden at lg, panel gated at xl). */}
      <div className="border-b border-zinc-800/80 bg-zinc-950 px-3 py-1.5 xl:hidden" role="tablist" aria-label="Studio panes">
        <div className="mx-auto flex max-w-md gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 p-0.5">
          {panes.map(({ id, label, icon: Icon, count }) => {
            const active = mobilePane === id
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMobilePane(id)}
                className={cn(
                  "relative flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md text-[11px] font-semibold transition-all duration-200",
                  active
                    ? "bg-violet-500/20 text-violet-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                    : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200"
                )}
              >
                <Icon className={cn("h-3.5 w-3.5 transition-colors", active && "text-violet-300")} />
                {label}
                {typeof count === "number" && (
                  <span
                    className={cn(
                      "ml-0.5 rounded-full px-1.5 py-px text-[9px] font-bold tabular-nums transition-colors",
                      active ? "bg-violet-500/25 text-violet-200" : "bg-zinc-800 text-zinc-500"
                    )}
                    aria-hidden
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <SectionsPanel
          className={cn(
            "w-full shrink-0 border-r border-zinc-800/80 lg:flex lg:w-60 xl:w-64",
            mobilePane === "sections" ? "flex" : "hidden"
          )}
        />
        <DevicePreview className={cn("min-w-0 flex-1", mobilePane === "preview" ? "flex" : "hidden lg:flex")} />
        <PropertiesPanel
          className={cn(
            "w-full shrink-0 border-l border-zinc-800/80 xl:flex xl:w-80",
            mobilePane === "properties" ? "flex" : "hidden xl:flex"
          )}
        />
      </div>
    </div>
  )
}
