"use client"

import type { HeroSection, LandingConfig, Section } from "@/lib/landing/types"
import { SECTION_META } from "@/lib/landing/types"

import { themeStyle } from "@/lib/landing/themes"
import { useGoogleFonts } from "@/lib/landing/googleFonts"
import { abOverrideFor } from "@/lib/landing/ab"

import { cn } from "@/lib/utils"

import { SectionRenderer } from "./SectionRenderer"

export interface LandingPreviewProps {
  config: LandingConfig
  /** Forced variant name for the hero/primary test (legacy single-test switcher). */
  abVariant?: string | null
  /** Per-section forced variants (sectionId → variant name) — section-level A/B. */
  abVariants?: Record<string, string> | null
  onCtaClick?: (section: Section, label: string) => void
  onFormSubmit?: (section: Section, data: Record<string, string>) => void
  className?: string
  /** Studio edit mode: sections get click-to-select overlays and in-page interactions are disabled. */
  selectionMode?: boolean
  selectedSectionId?: string | null
  onSectionSelect?: (id: string) => void
}

/**
 * Root preview renderer: applies the theme CSS variables to a wrapper
 * and renders every visible section. The navbar is rendered without the
 * alternating band wrapper so its `position: sticky` works against the
 * full page height (a wrapper would clip the sticky range) — except in
 * selection mode, where the wrapper is needed for the select overlay.
 */
export function LandingPreview({
  config,
  abVariant,
  abVariants,
  onCtaClick,
  onFormSubmit,
  className,
  selectionMode = false,
  selectedSectionId = null,
  onSectionSelect,
}: LandingPreviewProps) {
  const hero = config.sections.find((s): s is HeroSection => s.type === "hero" && s.ab?.enabled === true)
  // ✦ webfont pairs: stream the css2 stylesheet (system stacks stay the
  // fallback if the network is unavailable)
  useGoogleFonts(config.brand.font)
  const ab = hero?.ab
  // hero variant: per-section map wins, legacy prop is the fallback
  const heroVariantName = (hero && abVariants?.[hero.id]) || abVariant || null
  const variant = ab && heroVariantName ? ab.variants.find((v) => v.name === heroVariantName) : undefined
  const abOverride =
    hero && variant
      ? {
          headline: variant.headline,
          sub: variant.sub ?? hero.sub,
          ctaLabel: variant.ctaLabel ?? hero.cta.label,
        }
      : null

  /** Per-section A/B override: resolves the forced (or assigned) variant for any section. */
  const overrideFor = (section: Section) =>
    section.type === "hero"
      ? abOverride
      : abOverrideFor(section, abVariants?.[section.id] ?? null)

  const visible = config.sections.filter((s) => !s.hidden)
  // Stable anchor targets: by default the first section of each type gets an id
  // matching its type ("features", "pricing", …) so navbar/CTA links like
  // href="#pricing" scroll to it — in the published page and exported HTML.
  // A per-section `anchor` override wins (slugified), still reserving the type.
  // "cta-final" is additionally aliased to "cta" (the default href target).
  const anchorFor = (() => {
    const seen = new Set<string>()
    return (section: Section, index: number): string | undefined => {
      const custom = section.anchor?.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "")
      if (custom) {
        seen.add(section.type) // a custom anchor reserves the type slot too
        return custom
      }
      if (seen.has(section.type)) return undefined
      seen.add(section.type)
      if (index > 0 && section.type === "navbar") return undefined // navbar targets are pointless
      if (section.type === "hero") return "top"
      return section.type === "cta-final" ? "cta" : section.type
    }
  })()

  const SelectOverlay = ({ section }: { section: Section }) => (
    <button
      type="button"
      aria-label={`Select ${SECTION_META[section.type].label} section`}
      onClick={(e) => {
        e.stopPropagation()
        onSectionSelect?.(section.id)
      }}
      className="absolute inset-0 z-30 block cursor-pointer rounded-[2px]"
      style={{
        outline: selectedSectionId === section.id ? "2px solid var(--lf-accent)" : "1px dashed transparent",
        outlineOffset: "-2px",
        transition: "outline-color 120ms ease",
      }}
      onMouseEnter={(e) => {
        if (selectedSectionId !== section.id) e.currentTarget.style.outlineColor = "var(--lf-accent)"
        ;(e.currentTarget as HTMLElement).style.outlineStyle = "solid"
        if (selectedSectionId !== section.id) e.currentTarget.style.outlineWidth = "1px"
      }}
      onMouseLeave={(e) => {
        if (selectedSectionId !== section.id) {
          e.currentTarget.style.outlineColor = "transparent"
          e.currentTarget.style.outlineStyle = "dashed"
          e.currentTarget.style.outlineWidth = "1px"
        } else {
          e.currentTarget.style.outlineWidth = "2px"
        }
      }}
    >
      {selectedSectionId === section.id && (
        <span
          className={cn(
            "absolute z-40 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-md shadow-black/30",
            // Compact sections (navbar) have no empty corner (brand left, CTA
            // right, links center) — the badge straddles the bottom border,
            // centered, where it only covers the next section's top padding.
            // No pop-in animation here: its keyframe transform would clobber
            // the positioning translates (animation fill-mode wins the cascade).
            section.type === "navbar"
              ? "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2"
              : "lf-label-badge left-3 top-3"
          )}
          style={{ background: "var(--lf-accent)", color: "var(--lf-accent-contrast)" }}
        >
          {SECTION_META[section.type].label}
        </span>
      )}
    </button>
  )

  return (
    <div
      style={themeStyle(config.themeId, config.brand.accent, config.brand.font)}
      className={cn("lf-brand-font w-full min-h-full", selectionMode && "select-none", className)}
    >
      {visible.map((section, i) => {
        const anchor = anchorFor(section, i)
        if (section.type === "navbar") {
          if (selectionMode) {
            return (
              <div key={section.id} className="relative">
                <div className="pointer-events-none">
                  <SectionRenderer
                    section={section}
                    brandName={config.brand.name}
                    brandLogo={config.brand.logoUrl}
                    abOverride={overrideFor(section)}
                    onCtaClick={onCtaClick}
                    onFormSubmit={onFormSubmit}
                  />
                </div>
                <SelectOverlay section={section} />
              </div>
            )
          }
          return (
            <SectionRenderer
              key={section.id}
              section={section}
              brandName={config.brand.name}
              brandLogo={config.brand.logoUrl}
              abOverride={overrideFor(section)}
              onCtaClick={onCtaClick}
              onFormSubmit={onFormSubmit}
            />
          )
        }
        // band index = number of content (non-navbar) sections before this one
        const band = visible.slice(0, i).filter((s) => s.type !== "navbar").length % 2
        const bg = band === 0 ? "var(--lf-bg)" : "var(--lf-bg-alt)"
        return (
          <div key={section.id} id={anchor} style={{ background: bg }} className={cn(selectionMode ? "relative" : "scroll-mt-16")}>
            <div className={selectionMode ? "pointer-events-none" : undefined}>
              <SectionRenderer
                section={section}
                brandName={config.brand.name}
                brandLogo={config.brand.logoUrl}
                abOverride={overrideFor(section)}
                onCtaClick={onCtaClick}
                onFormSubmit={onFormSubmit}
              />
            </div>
            {selectionMode && <SelectOverlay section={section} />}
          </div>
        )
      })}
    </div>
  )
}

export default LandingPreview
