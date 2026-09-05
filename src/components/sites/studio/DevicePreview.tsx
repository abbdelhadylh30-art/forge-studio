"use client"

import * as React from "react"
import { EyeOff, Maximize2, Minimize2, Monitor, Smartphone, Tablet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useForge } from "@/lib/landing/store"
import { useUi } from "@/lib/landing/uiStore"
import { getAbTests, abTestLabel } from "@/lib/landing/ab"
import { ctaHrefFor, runCtaNavigation } from "@/lib/landing/ctaNav"
import { LandingPreview } from "@/components/sites/preview/LandingPreview"
import { applyLocale, localesOf } from "@/lib/landing/i18n"
import { track, detectDevice, detectBrowser } from "@/components/sites/shared/tracking"
import type { Section } from "@/lib/landing/types"

const DEVICE_WIDTHS: Record<string, number | null> = {
  desktop: null,
  tablet: 834,
  mobile: 390,
}

export function DevicePreview({ className }: { className?: string }) {
  const baseConfig = useForge((s) => s.config)
  const previewLocale = useUi((s) => s.previewLocale)
  const config = React.useMemo(
    () => (previewLocale ? applyLocale(baseConfig, previewLocale) : baseConfig),
    [baseConfig, previewLocale]
  )
  const setDevice = useForge((s) => s.setDevice)
  const device = useForge((s) => s.device)
  const previewMode = useForge((s) => s.previewMode)
  const setPreviewMode = useForge((s) => s.setPreviewMode)
  const abVariant = useForge((s) => s.abPreviewVariant)
  const setAbVariant = useForge((s) => s.setAbPreviewVariant)
  const abVariants = useForge((s) => s.abPreviewVariants)
  const setAbVariantFor = useForge((s) => s.setAbPreviewVariantFor)
  const selectedSectionId = useForge((s) => s.selectedSectionId)
  const selectSection = useForge((s) => s.selectSection)
  const projectId = useForge((s) => s.project.id)

  // every enabled section-level test (hero first)
  const abTests = React.useMemo(() => getAbTests(config), [config])

  const trackedViewRef = React.useRef(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Track a pageview once per full-screen preview session
  React.useEffect(() => {
    if (previewMode && projectId && !trackedViewRef.current) {
      trackedViewRef.current = true
      track(projectId, {
        type: "pageview",
        device,
        browser: detectBrowser(),
        duration: 0,
        isBounce: false,
        ...(abTests.length && (abVariants[abTests[0].section.id] ?? abVariant)
          ? { variant: abVariants[abTests[0].section.id] ?? abVariant ?? undefined }
          : {}),
        // record the studio's forced variant selection for every section test
        ...(abTests.length ? { variantMap: Object.fromEntries(abTests.map((t) => [t.section.id, abVariants[t.section.id] ?? (t.section.type === "hero" ? abVariant ?? null : null)]).filter(([, v]) => v != null) as [string, string][]) } : {}),
      })
      // record an exposure for every section-level test being previewed
      for (const t of abTests) {
        const v = abVariants[t.section.id] ?? (t.section.type === "hero" ? abVariant : null)
        if (v) track(projectId, { type: "variant_exposure", variant: v, label: t.section.id })
      }
      toast.info("Pageview tracked", { description: "Privacy-friendly — no cookies, anonymous visitor id." })
    }
    if (!previewMode) trackedViewRef.current = false
  }, [previewMode, projectId, device, abTests, abVariants, abVariant])

  // Reset scroll when switching sections
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [device, previewMode])

  // Esc exits full-screen preview mode
  React.useEffect(() => {
    if (!previewMode) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        useForge.getState().setPreviewMode(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [previewMode])

  const handleCtaClick = (section: Section, label: string) => {
    if (!projectId) return
    // clicks attribute to the section's own test when it has one, else the primary test's variant
    const ownVariant = abVariants[section.id]
    const primaryVariant = abTests.length ? abVariants[abTests[0].section.id] ?? abVariant : null
    track(projectId, {
      type: "cta_click",
      label: `${section.type}: ${label}`,
      variant: ownVariant ?? primaryVariant ?? undefined,
    })
    // act like a real visitor click: scroll the preview to the CTA's target
    // (or open an external link) so the button visibly DOES something
    const nav = runCtaNavigation(section, ctaHrefFor(section, label))
    toast.success("CTA click tracked", { description: nav ? `${label} → ${nav}` : label })
  }

  const handleFormSubmit = (section: Section, data: Record<string, string>) => {
    if (!projectId) return
    track(projectId, { type: "form_submit", label: `${section.type}: ${Object.keys(data).join(", ")}` })
    // Persist the submission as a lead (leads inbox in the analytics view)
    void fetch("/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ projectId, fields: data }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.lead) {
          const lead = j.lead as { name?: string; email?: string }
          toast.success("Lead captured", { description: `${lead.name || lead.email || "New contact"} — see Analytics → Leads inbox` })
        }
      })
      .catch(() => undefined) // lead capture is best-effort; the event above is the source of truth
  }

  const width = DEVICE_WIDTHS[device]
  const visibleCount = config.sections.filter((s) => !s.hidden).length

  return (
    <div className={cn("flex min-h-0 min-w-0 flex-col bg-zinc-900/40", className)}>
      {/* Canvas toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800/80 px-3 py-2">
        <div className="flex items-center gap-0.5 rounded-lg border border-zinc-800 bg-zinc-950 p-0.5">
          {(
            [
              { id: "desktop", icon: Monitor, label: "Desktop" },
              { id: "tablet", icon: Tablet, label: "Tablet" },
              { id: "mobile", icon: Smartphone, label: "Mobile" },
            ] as const
          ).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setDevice(id)}
              aria-label={`${label} preview`}
              aria-pressed={device === id}
              title={label}
              className={cn(
                "flex h-7 w-8 items-center justify-center rounded-md transition-colors",
                device === id ? "bg-violet-500/25 text-violet-200" : "text-zinc-500 hover:text-zinc-200"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        {/* A/B variant switchers — one compact group per active section-level test */}
        {abTests.length > 0 && (
          <div className="flex flex-wrap items-center gap-1" role="group" aria-label="A/B variant preview">
            {abTests.map(({ section, ab }) => {
              const label = abTestLabel(config, section)
              const active = section.type === "hero" ? abVariants[section.id] ?? abVariant : abVariants[section.id]
              const setVariant = (v: string) => {
                setAbVariantFor(section.id, v)
                if (section.type === "hero") setAbVariant(v) // keep the legacy selector in sync
              }
              return (
                <div
                  key={section.id}
                  className={cn(
                    "flex items-center gap-1 rounded-lg border p-0.5",
                    section.type === "hero" ? "border-violet-500/30 bg-violet-500/5" : "border-fuchsia-500/25 bg-fuchsia-500/5"
                  )}
                >
                  <span
                    className={cn("px-1.5 text-[10px] font-bold uppercase tracking-wider", section.type === "hero" ? "text-violet-300" : "text-fuchsia-300")}
                    title={`${label} A/B test — ${ab.variants.length} variants`}
                  >
                    {abTests.length > 1 ? label.slice(0, 10) : "A/B"}
                  </span>
                  {ab.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVariant(v.name)}
                      title={`Variant ${v.name} — ${v.headline}`}
                      className={cn(
                        "h-6 rounded-md px-2 text-[11px] font-semibold transition-colors",
                        active === v.name
                          ? section.type === "hero"
                            ? "bg-violet-500 text-white"
                            : "bg-fuchsia-500 text-white"
                          : section.type === "hero"
                            ? "text-violet-300 hover:bg-violet-500/20"
                            : "text-fuchsia-300 hover:bg-fuchsia-500/20"
                      )}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden font-mono text-[10px] text-zinc-600 sm:inline">
            {width ? `${width}px` : "fluid"} · {previewMode ? "interactive" : "edit"}
          </span>
          <Button
            variant="outline"
            size="sm"
            className={cn("h-7 gap-1.5 border-zinc-700 bg-transparent text-[11px]", previewMode ? "border-violet-500/50 text-violet-200" : "text-zinc-300")}
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            <span className="hidden sm:inline">{previewMode ? "Exit preview" : "Test preview"}</span>
          </Button>
        </div>
      </div>

      {/* Canvas */}
      {previewMode ? (
        <div className="min-h-0 flex-1 overflow-y-auto bg-zinc-950 lf-scroll">
          <div
            className="mx-auto min-h-full transition-all duration-300"
            style={width ? { width, maxWidth: "100%" } : { width: "100%" }}
          >
            <LandingPreview config={config} abVariant={abVariant} abVariants={abVariants} onCtaClick={handleCtaClick} onFormSubmit={handleFormSubmit} className="min-h-full" />
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-stretch justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top,rgba(167,139,250,0.06),transparent_60%)] p-3">
          <div
            ref={scrollRef}
            className="relative min-h-0 w-full overflow-y-auto rounded-xl border border-zinc-800 shadow-2xl shadow-black/40 lf-scroll"
            style={width ? { width, maxWidth: "100%", margin: "0 auto" } : undefined}
          >
            {visibleCount === 0 ? (
              <div className="flex min-h-full flex-col items-center justify-center gap-3 p-10 text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/60">
                  <EyeOff className="h-5 w-5 text-zinc-600" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-zinc-300">Nothing to preview</p>
                  <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-zinc-500">
                    Every section is hidden. Unhide one in the Sections list (eye icon) or add a new section to start
                    building.
                  </p>
                </div>
              </div>
            ) : (
              <LandingPreview
                config={config}
                abVariant={abVariant}
                abVariants={abVariants}
                selectionMode
                selectedSectionId={selectedSectionId}
                onSectionSelect={selectSection}
                className="min-h-full"
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
