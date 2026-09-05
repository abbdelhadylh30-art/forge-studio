"use client"

import * as React from "react"
import type { Section } from "@/lib/landing/types"

import { About } from "./sections/About"
import { Announcement } from "./sections/Announcement"
import { Comparison } from "./sections/Comparison"
import { Contact } from "./sections/Contact"
import { CtaFinal } from "./sections/CtaFinal"
import { Faq } from "./sections/Faq"
import { Features } from "./sections/Features"
import { Footer } from "./sections/Footer"
import { Gallery } from "./sections/Gallery"
import { Guarantee } from "./sections/Guarantee"
import { Hero } from "./sections/Hero"
import { Logos } from "./sections/Logos"
import { Navbar } from "./sections/Navbar"
import { Offer } from "./sections/Offer"
import { Pricing } from "./sections/Pricing"
import { Problem } from "./sections/Problem"
import { Solution } from "./sections/Solution"
import { Stats } from "./sections/Stats"
import { Testimonials } from "./sections/Testimonials"
import { Video } from "./sections/Video"

export interface SectionRendererProps {
  section: Section
  brandName: string
  /** brand logo URL (brand kit) — rendered by navbar & footer when present */
  brandLogo?: string
  /** legal page links (docs / privacy / terms) — rendered inside the footer */
  legal?: { docsUrl?: string; privacyUrl?: string; termsUrl?: string }
  /** Resolved A/B variant copy for THIS section (empty fields already fell back to base copy). */
  abOverride?: { headline: string; sub: string; ctaLabel: string } | null
  onCtaClick?: (section: Section, label: string) => void
  onFormSubmit?: (section: Section, data: Record<string, string>) => void
}

/**
 * Renders a single landing section by its discriminated `type`.
 * Hidden sections render nothing. When an A/B variant is active for this
 * section, its copy overrides are merged INTO the section object before
 * dispatch — section components stay variant-agnostic.
 */
export function SectionRenderer({ section, brandName, brandLogo, legal, abOverride, onCtaClick, onFormSubmit }: SectionRendererProps) {
  if (section.hidden) return null

  return (
    <AnimWrap animation={section.animation}>
      {renderSection(section)}
    </AnimWrap>
  )

  function renderSection(section: Section) {
  switch (section.type) {
    case "announcement":
      return <Announcement section={section} onCtaClick={(label) => onCtaClick?.(section, label)} />
    case "navbar":
      return <Navbar section={section} brandName={brandName} logoUrl={brandLogo} onCtaClick={(label) => onCtaClick?.(section, label)} />
    case "hero":
      return (
        <Hero
          section={section}
          brandName={brandName}
          abOverride={abOverride}
          onCtaClick={(label) => onCtaClick?.(section, label)}
        />
      )
    case "logos":
      return <Logos section={section} />
    case "features": {
      const s = abOverride
        ? { ...section, ...(abOverride.headline ? { title: abOverride.headline } : {}), ...(abOverride.sub ? { subtitle: abOverride.sub } : {}) }
        : section
      return <Features section={s} />
    }
    case "stats":
      return <Stats section={section} />
    case "testimonials": {
      const s = abOverride
        ? { ...section, ...(abOverride.headline ? { title: abOverride.headline } : {}), ...(abOverride.sub ? { subtitle: abOverride.sub } : {}) }
        : section
      return <Testimonials section={s} />
    }
    case "pricing": {
      const s = abOverride
        ? { ...section, ...(abOverride.headline ? { title: abOverride.headline } : {}), ...(abOverride.sub ? { subtitle: abOverride.sub } : {}) }
        : section
      return (
        <Pricing
          section={s}
          onCtaClick={(label, planName) => onCtaClick?.(section, `${planName}: ${label}`)}
        />
      )
    }
    case "faq": {
      const s = abOverride
        ? { ...section, ...(abOverride.headline ? { title: abOverride.headline } : {}), ...(abOverride.sub ? { subtitle: abOverride.sub } : {}) }
        : section
      return <Faq section={s} />
    }
    case "gallery":
      return <Gallery section={section} />
    case "about": {
      const s = abOverride
        ? { ...section, ...(abOverride.headline ? { title: abOverride.headline } : {}), ...(abOverride.sub ? { subtitle: abOverride.sub } : {}) }
        : section
      return <About section={s} />
    }
    case "problem":
      return <Problem section={section} />
    case "solution":
      return <Solution section={section} />
    case "video":
      return <Video section={section} onCtaClick={(label) => onCtaClick?.(section, label)} />
    case "comparison":
      return <Comparison section={section} />
    case "guarantee":
      return <Guarantee section={section} />
    case "offer":
      return <Offer section={section} onCtaClick={(label) => onCtaClick?.(section, label)} />
    case "contact": {
      const s = abOverride
        ? {
            ...section,
            ...(abOverride.headline ? { title: abOverride.headline } : {}),
            ...(abOverride.sub ? { subtitle: abOverride.sub } : {}),
            ...(abOverride.ctaLabel ? { submitLabel: abOverride.ctaLabel } : {}),
          }
        : section
      return <Contact section={s} onFormSubmit={(data) => onFormSubmit?.(section, data)} />
    }
    case "cta-final": {
      const s = abOverride
        ? {
            ...section,
            headline: abOverride.headline,
            ...(abOverride.sub ? { sub: abOverride.sub } : {}),
            ...(abOverride.ctaLabel ? { cta: { ...section.cta, label: abOverride.ctaLabel } } : {}),
          }
        : section
      return <CtaFinal section={s} onCtaClick={(label) => onCtaClick?.(section, label)} />
    }
    case "footer":
      return <Footer section={section} brandName={brandName} logoUrl={brandLogo} legal={legal} onCtaClick={(label) => onCtaClick?.(section, label)} />
    default:
      return null
  }
  }
}

// ── Entrance animation ─────────────────────────────────────────────────────

/**
 * Animation wrapper — reveals the section once when scrolled into view.
 * Uses the same CSS classes as the static HTML export (`lf-anim` + `lf-in`),
 * so preview and export behave identically. Falls back to immediately
 * visible when IntersectionObserver is unavailable (SSR, old browsers).
 */
function AnimWrap({ animation, children }: { animation?: string; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const [shown, setShown] = React.useState(false)

  React.useEffect(() => {
    const el = ref.current
    if (!el || animation === "none" || !animation) {
      setShown(true)
      return
    }
    if (typeof IntersectionObserver === "undefined") {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true)
            io.disconnect()
          }
        }
      },
      { threshold: 0.15 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [animation])

  if (!animation || animation === "none") return <>{children}</>
  return (
    <div ref={ref} data-lf-anim={animation} className={shown ? "lf-anim lf-in" : "lf-anim"}>
      {children}
    </div>
  )
}
