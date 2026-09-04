"use client"

import type { CtaFinalSection } from "@/lib/landing/types"

import { CONTAINER, SECTION_PAD } from "../shared"

export interface CtaFinalProps {
  section: CtaFinalSection
  onCtaClick?: (label: string) => void
}

export function CtaFinal({ section, onCtaClick }: CtaFinalProps) {
  // the final CTA is the funnel's end — when its href targets itself (the
  // demo default) or is empty, loop the reader back to the hero (#top) so the
  // button visibly DOES something, in the app AND in the static HTML export
  const raw = section.cta.href?.trim() ?? ""
  const selfAnchor = `#${(section.anchor?.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "cta")}`
  const ctaHref = raw && raw !== selfAnchor ? raw : "#top"
  return (
    <section className={SECTION_PAD}>
      <div className={CONTAINER}>
        <div
          className="relative overflow-hidden rounded-3xl px-6 py-16 text-center md:px-12 md:py-20"
          style={{ background: "var(--lf-gradient)", color: "var(--lf-accent-contrast)" }}
        >
          {/* decorative grid pattern */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "42px 42px",
            }}
          />
          {/* soft blurred glows */}
          <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full blur-3xl" style={{ background: "rgba(255,255,255,0.18)" }} />
          <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-20 size-96 rounded-full blur-3xl" style={{ background: "rgba(0,0,0,0.16)" }} />

          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">{section.headline}</h2>
            {section.sub ? (
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed opacity-80 md:text-base">{section.sub}</p>
            ) : null}
            <a
              href={ctaHref}
              onClick={(e) => {
                if (onCtaClick) e.preventDefault()
                onCtaClick?.(section.cta.label)
              }}
              className="mt-8 rounded-xl px-6 py-3 text-sm font-semibold transition-transform duration-150 hover:scale-[1.02] active:scale-100 md:text-base"
              style={{
                background: "var(--lf-accent-contrast)",
                color: "var(--lf-accent)",
                boxShadow: "0 16px 34px -18px rgba(0,0,0,0.5)",
              }}
            >
              {section.cta.label}
            </a>
            {section.note ? <p className="mt-4 text-xs opacity-70 md:text-sm">{section.note}</p> : null}
          </div>
        </div>
      </div>
    </section>
  )
}
