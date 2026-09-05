"use client"

import * as React from "react"

import type { OfferSection, OfferTrustItem } from "@/lib/landing/types"

import { IconGlyph } from "../iconBank"
import { CONTAINER, SECTION_PAD, SectionHeader } from "../shared"

export interface OfferProps {
  section: OfferSection
  onCtaClick?: (label: string) => void
}

/** Countdown units — same ids as the announcement engine + vanilla export. */
const UNITS: { id: string; label: string; per: number }[] = [
  { id: "d", label: "days", per: 86_400_000 },
  { id: "h", label: "hrs", per: 3_600_000 },
  { id: "m", label: "min", per: 60_000 },
  { id: "s", label: "sec", per: 1_000 },
]

function splitRemaining(ms: number): Record<string, number> {
  const out: Record<string, number> = {}
  let left = Math.max(0, ms)
  for (const u of UNITS) {
    out[u.id] = Math.floor(left / u.per)
    left -= out[u.id] * u.per
  }
  return out
}

/** Live countdown in boxed digits — carries the same data-lf-* attributes as
 *  the announcement bar, so the standalone export's vanilla engine drives it. */
function CountdownBoxes({ deadline, prefix }: { deadline: string; prefix?: string }) {
  const target = React.useMemo(() => {
    const t = Date.parse(deadline)
    return Number.isNaN(t) ? null : t
  }, [deadline])

  const [remaining, setRemaining] = React.useState(() => (target === null ? 0 : target - Date.now()))
  React.useEffect(() => {
    if (target === null) return
    const tick = () => setRemaining(Math.max(0, target - Date.now()))
    tick()
    const iv = window.setInterval(tick, 1000)
    return () => window.clearInterval(iv)
  }, [target])

  if (target === null) return null
  const parts = splitRemaining(remaining)
  const expired = remaining <= 0

  return (
    <div className="text-center">
      {prefix ? (
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--lf-muted)" }}>
          {prefix}
        </p>
      ) : null}
      <div
        data-lf-countdown={deadline}
        data-deadline={deadline}
        data-expired={expired ? "true" : "false"}
        className="mx-auto grid max-w-xs grid-cols-4 gap-2 sm:max-w-sm sm:gap-3"
      >
        {UNITS.map((u) => (
          <div
            key={u.id}
            className="rounded-xl border px-1 py-2.5 md:py-3"
            style={{ borderColor: "var(--lf-border)", background: "var(--lf-surface)" }}
          >
            <span data-lf-cd={u.id} className="block text-xl font-extrabold tabular-nums md:text-2xl" style={{ color: "var(--lf-text)" }}>
              {String(parts[u.id]).padStart(2, "0")}
            </span>
            <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--lf-muted)" }}>
              {u.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Derive "Save 50%" from the two prices when no explicit label is set. */
function deriveSavings(price: string, original: string | undefined): string | null {
  const cur = Number(price.replace(/[^0-9.]/g, ""))
  const orig = Number((original ?? "").replace(/[^0-9.]/g, ""))
  if (!Number.isFinite(cur) || !Number.isFinite(orig) || orig <= 0 || cur <= 0 || orig <= cur) return null
  const pct = Math.round((1 - cur / orig) * 100)
  return pct > 0 ? `Save ${pct}%` : null
}

function TrustRow({ items }: { items: OfferTrustItem[] }) {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
      {items.map((t, i) => (
        <li key={`${t.label}-${i}`} className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--lf-muted)" }}>
          <IconGlyph name={t.icon} className="size-3.5" />
          {t.label}
        </li>
      ))}
    </ul>
  )
}

function FeatureList({ features }: { features: string[] }) {
  if (!features.length) return null
  return (
    <ul className="space-y-3">
      {features.map((f, i) => (
        <li key={`${f}-${i}`} className="flex items-start gap-3">
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full" style={{ background: "var(--lf-accent-soft)", color: "var(--lf-accent)" }}>
            <IconGlyph name="check" className="size-3" />
          </span>
          <span className="text-sm leading-relaxed md:text-[15px]" style={{ color: "var(--lf-text)" }}>
            {f}
          </span>
        </li>
      ))}
    </ul>
  )
}

function OfferCta({ section, onCtaClick }: OfferProps) {
  return (
    <a
      href={section.cta.href || "#cta"}
      onClick={(e) => {
        if (onCtaClick) e.preventDefault()
        onCtaClick?.(section.cta.label)
      }}
      className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold transition-transform duration-150 hover:scale-[1.02] active:scale-100 md:py-4 md:text-base"
      style={{
        background: "var(--lf-gradient)",
        color: "var(--lf-accent-contrast)",
        boxShadow: "0 18px 40px -20px var(--lf-accent)",
      }}
    >
      {section.cta.label}
      <IconGlyph name="arrow" className="size-4" />
    </a>
  )
}

/** The offer card — price stack, savings, checklist, CTA. */
function OfferCard({ section, onCtaClick, compact = false }: OfferProps & { compact?: boolean }) {
  const savings = section.savingsLabel?.trim() || deriveSavings(section.price, section.originalPrice) || null
  return (
    <div
      className="relative rounded-3xl border"
      style={{ borderColor: "var(--lf-border)", background: "var(--lf-surface)", boxShadow: "0 24px 60px -32px rgba(0,0,0,0.35)" }}
    >
      {section.badge ? (
        <span
          className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide"
          style={{ background: "var(--lf-gradient)", color: "var(--lf-accent-contrast)", boxShadow: "0 10px 26px -12px var(--lf-accent)" }}
        >
          <IconGlyph name="flame" className="size-3" />
          {section.badge}
        </span>
      ) : null}

      <div className={compact ? "p-6 md:p-8" : "p-6 pt-8 md:p-10 md:pt-12"}>
        {/* price stack */}
        <div className="text-center">
          <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1">
            {section.originalPrice ? (
              <span className="text-lg font-semibold line-through md:text-xl" style={{ color: "var(--lf-muted)" }}>
                {section.originalPrice}
              </span>
            ) : null}
            <span className="text-4xl font-extrabold tracking-tight md:text-5xl" style={{ color: "var(--lf-text)" }}>
              {section.price}
            </span>
          </div>
          {section.period ? (
            <p className="mt-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--lf-muted)" }}>
              {section.period}
            </p>
          ) : null}
          {savings ? (
            <span
              className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold"
              style={{ background: "var(--lf-accent-soft)", color: "var(--lf-accent)" }}
            >
              <IconGlyph name="check" className="size-3.5" />
              {savings}
            </span>
          ) : null}
        </div>

        {/* checklist */}
        {section.features?.length ? (
          <div className={compact ? "mt-6" : "mt-8"}>
            <FeatureList features={section.features} />
          </div>
        ) : null}

        {/* CTA */}
        <div className="mt-7 md:mt-8">
          <OfferCta section={section} onCtaClick={onCtaClick} />
        </div>
      </div>
    </div>
  )
}

export function Offer({ section, onCtaClick }: OfferProps) {
  const trust = section.trust ?? []
  const hasDeadline = Boolean(section.deadline && !Number.isNaN(Date.parse(section.deadline)))

  if (section.style === "split") {
    return (
      <section className={SECTION_PAD}>
        <div className={CONTAINER}>
          <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2 md:gap-14">
            <div>
              <SectionHeader title={section.title} subtitle={section.subtitle} className="mb-8 md:mb-10" />
              {hasDeadline ? (
                <div className="mb-8">
                  <CountdownBoxes deadline={section.deadline as string} prefix={section.countdownPrefix} />
                </div>
              ) : null}
              {trust.length ? (
                <div className="[&>ul]:justify-start">
                  <TrustRow items={trust} />
                </div>
              ) : null}
            </div>
            <div className="pt-3">
              <OfferCard section={section} onCtaClick={onCtaClick} compact />
            </div>
          </div>
        </div>
      </section>
    )
  }

  // card (default) — focused, centered funnel block
  return (
    <section className={SECTION_PAD}>
      <div className={CONTAINER}>
        <div className="mx-auto max-w-3xl">
          <SectionHeader title={section.title} subtitle={section.subtitle} center className="mb-12 md:mb-14" />
          <div className="space-y-10">
            {hasDeadline ? <CountdownBoxes deadline={section.deadline as string} prefix={section.countdownPrefix} /> : null}
            <OfferCard section={section} onCtaClick={onCtaClick} />
            {trust.length ? <TrustRow items={trust} /> : null}
          </div>
        </div>
      </div>
    </section>
  )
}
