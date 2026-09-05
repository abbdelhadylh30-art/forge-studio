"use client"

import type { HeroSection } from "@/lib/landing/types"

import { cn } from "@/lib/utils"

import { CONTAINER, SECTION_PAD, SECTION_PAD_HERO, gradientText } from "../shared"

export interface HeroProps {
  section: HeroSection
  brandName: string
  abOverride?: { headline: string; sub: string; ctaLabel: string } | null
  onCtaClick?: (label: string) => void
}

interface StatItem {
  value: string
  label: string
}

/**
 * Split a headline into a plain "head" and a gradient "tail"
 * (the last sentence, or the last line of a multi-line headline).
 * Returns null when the headline cannot be split.
 */
function splitHeadline(text: string): { head: string; tail: string } | null {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length > 1) {
    return { head: `${lines.slice(0, -1).join(" ")} `, tail: lines[lines.length - 1] }
  }
  const single = lines[0] ?? text.trim()
  const boundaries: number[] = []
  for (let i = 0; i < single.length; i += 1) {
    if (".!?".includes(single[i])) boundaries.push(i)
  }
  for (let j = boundaries.length - 1; j >= 0; j -= 1) {
    const tail = single.slice(boundaries[j] + 1).trim()
    if (tail) {
      return { head: `${single.slice(0, boundaries[j] + 1).trim()} `, tail }
    }
  }
  return null
}

function StatsRow({ stats, onPanel = false, center = false }: { stats: StatItem[]; onPanel?: boolean; center?: boolean }) {
  if (stats.length === 0) return null
  return (
    <div className={cn("mt-10 flex flex-wrap items-start gap-x-8 gap-y-5", center && "justify-center")}>
      {stats.map((s, i) => (
        <div
          key={`${s.value}-${s.label}-${i}`}
          className={cn("flex flex-col gap-0.5", i > 0 && "sm:border-l sm:pl-8")}
          style={
            i > 0
              ? {
                  borderColor: onPanel
                    ? "color-mix(in srgb, var(--lf-accent-contrast) 30%, transparent)"
                    : "var(--lf-border)",
                }
              : undefined
          }
        >
          <span
            className="text-xl font-extrabold tracking-tight md:text-2xl"
            style={{ color: onPanel ? "var(--lf-accent-contrast)" : "var(--lf-accent)" }}
          >
            {s.value}
          </span>
          <span
            className="text-xs md:text-sm"
            style={
              onPanel
                ? { color: "var(--lf-accent-contrast)", opacity: 0.75 }
                : { color: "var(--lf-muted)" }
            }
          >
            {s.label}
          </span>
        </div>
      ))}
    </div>
  )
}

/** Generated product mockup used when the hero has no image. */
function HeroMock({ brandName }: { brandName: string }) {
  const bars = [38, 62, 45, 74, 55, 88, 66, 94, 78]
  return (
    <div
      className="relative flex aspect-[4/3] flex-col overflow-hidden rounded-2xl border shadow-2xl md:aspect-video"
      style={{ borderColor: "var(--lf-border)", background: "var(--lf-surface)", boxShadow: "0 36px 70px -36px rgba(0, 0, 0, 0.45)" }}
    >
      {/* gradient wash */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "var(--lf-gradient)", opacity: 0.08 }} />
      {/* grid overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, var(--lf-border) 0px, var(--lf-border) 1px, transparent 1px, transparent 34px), repeating-linear-gradient(90deg, var(--lf-border) 0px, var(--lf-border) 1px, transparent 1px, transparent 34px)",
        }}
      />
      {/* window chrome */}
      <div
        className="relative z-10 flex shrink-0 items-center gap-1.5 border-b px-4 py-2.5"
        style={{ borderColor: "var(--lf-border)", background: "var(--lf-bg)" }}
      >
        <span className="size-2.5 rounded-full" style={{ background: "var(--lf-accent)", opacity: 0.9 }} />
        <span className="size-2.5 rounded-full" style={{ background: "var(--lf-accent)", opacity: 0.45 }} />
        <span className="size-2.5 rounded-full" style={{ background: "var(--lf-accent)", opacity: 0.2 }} />
        <span
          className="ml-2 truncate rounded-md px-2 py-0.5 text-[10px] font-medium"
          style={{ background: "var(--lf-surface)", color: "var(--lf-muted)" }}
        >
          {brandName.toLowerCase().replace(/\s+/g, "")}.app
        </span>
      </div>
      {/* floating mini-cards */}
      <div className="relative z-10 flex-1">
        {/* mini chart card */}
        <div
          className="absolute left-[6%] top-[14%] w-[48%] max-w-[220px] rounded-xl border p-3 shadow-lg"
          style={{ background: "var(--lf-bg)", borderColor: "var(--lf-border)" }}
        >
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full" style={{ background: "var(--lf-accent)" }} />
            <span className="text-[10px] font-medium" style={{ color: "var(--lf-muted)" }}>
              Weekly signups
            </span>
          </div>
          <div className="mt-2 flex h-16 items-end gap-1">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t"
                style={{ height: `${h}%`, background: "var(--lf-accent)", opacity: 0.35 + (i / bars.length) * 0.65 }}
              />
            ))}
          </div>
        </div>
        {/* stat card */}
        <div
          className="absolute right-[6%] top-[12%] rounded-xl border p-3 shadow-lg"
          style={{ background: "var(--lf-bg)", borderColor: "var(--lf-border)" }}
        >
          <div className="text-xl font-extrabold tracking-tight" style={gradientText}>
            +128%
          </div>
          <div className="text-[10px]" style={{ color: "var(--lf-muted)" }}>
            conversion lift
          </div>
        </div>
        {/* deploy card */}
        <div
          className="absolute bottom-[12%] right-[8%] hidden w-[44%] max-w-[200px] rounded-xl border p-3 shadow-lg sm:block"
          style={{ background: "var(--lf-bg)", borderColor: "var(--lf-border)" }}
        >
          <div className="h-1.5 w-3/4 rounded-full" style={{ background: "var(--lf-muted)", opacity: 0.35 }} />
          <div className="mt-1.5 h-1.5 w-1/2 rounded-full" style={{ background: "var(--lf-muted)", opacity: 0.25 }} />
          <span
            className="pointer-events-none mt-2.5 inline-block rounded-md px-2.5 py-1 text-[10px] font-semibold"
            style={{ background: "var(--lf-accent)", color: "var(--lf-accent-contrast)" }}
          >
            Deploy now
          </span>
        </div>
      </div>
    </div>
  )
}

export function Hero({ section, brandName, abOverride, onCtaClick }: HeroProps) {
  const headline = abOverride?.headline || section.headline
  const sub = abOverride?.sub || section.sub
  const ctaLabel = abOverride?.ctaLabel || section.cta.label
  const secondaryCta = section.secondaryCta
  const stats = section.stats ?? []
  const hasImage = typeof section.image === "string" && section.image.trim().length > 0
  const layout = section.layout
  const hasVideo = typeof section.videoUrl === "string" && section.videoUrl.trim().length > 0

  // ── video background — cinematic cover with dark scrim ──────────────────
  if (layout === "video") {
    return (
      <section className="relative isolate flex min-h-[72vh] items-center overflow-hidden md:min-h-[88vh]">
        <div aria-hidden className="absolute inset-0 -z-10">
          {hasVideo ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={hasImage ? section.image : undefined}
              className="size-full object-cover"
              style={{ filter: "saturate(1.05) brightness(0.9)" }}
            >
              <source src={section.videoUrl} />
            </video>
          ) : (
            <div className="size-full" style={{ background: "var(--lf-gradient)" }} />
          )}
          {/* legibility scrim */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.7) 100%)" }}
          />
        </div>
        <div className={CONTAINER}>
          <div className="mx-auto flex max-w-2xl flex-col items-center py-20 text-center md:py-28">
            {section.badge ? (
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">{section.badge}</span>
            ) : null}
            <h1 className="mt-5 text-3xl font-extrabold leading-[1.06] tracking-tight text-white sm:text-4xl md:text-6xl">{headline}</h1>
            {sub ? <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 md:text-lg">{sub}</p> : null}
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <a
                href={section.cta.href || "#cta"}
                onClick={(e) => {
                  if (onCtaClick) e.preventDefault()
                  onCtaClick?.(ctaLabel)
                }}
                className="inline-flex h-11 items-center rounded-xl px-6 text-sm font-semibold text-white transition-transform duration-150 hover:scale-[1.02] active:scale-100 md:text-base"
                style={{ background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.35)", backdropFilter: "blur(8px)" }}
              >
                {ctaLabel}
              </a>
              {secondaryCta?.label ? (
                <a
                  href={secondaryCta.href || "#cta"}
                  onClick={(e) => {
                    if (onCtaClick) e.preventDefault()
                    onCtaClick?.(secondaryCta.label)
                  }}
                  className="inline-flex h-11 items-center rounded-xl px-6 text-sm font-semibold text-white/90 underline decoration-white/40 underline-offset-4 transition-colors hover:text-white md:text-base"
                >
                  {secondaryCta.label}
                </a>
              ) : null}
            </div>
            <StatsRow stats={stats} onPanel center />
          </div>
        </div>
      </section>
    )
  }

  // ── gradient — edge-to-edge brand statement ──────────────────────────
  if (layout === "gradient") {
    return (
      <section className={"relative isolate overflow-hidden py-20 md:py-32"} style={{ background: "var(--lf-gradient)", color: "var(--lf-accent-contrast)" }}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div aria-hidden className="pointer-events-none absolute -left-32 -top-40 size-96 rounded-full blur-3xl" style={{ background: "rgba(255,255,255,0.2)" }} />
        <div aria-hidden className="pointer-events-none absolute -bottom-48 -right-24 size-[28rem] rounded-full blur-3xl" style={{ background: "rgba(0,0,0,0.18)" }} />
        <div className={CONTAINER}>
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            {section.badge ? <span className="rounded-full bg-white/18 px-3 py-1 text-xs font-medium">{section.badge}</span> : null}
            <h1 className="mt-5 text-3xl font-extrabold leading-[1.06] tracking-tight sm:text-4xl md:text-6xl">{headline}</h1>
            {sub ? <p className="mt-5 max-w-xl text-base leading-relaxed opacity-85 md:text-lg">{sub}</p> : null}
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <a
                href={section.cta.href || "#cta"}
                onClick={(e) => {
                  if (onCtaClick) e.preventDefault()
                  onCtaClick?.(ctaLabel)
                }}
                className="inline-flex h-11 items-center rounded-xl px-6 text-sm font-semibold transition-transform duration-150 hover:scale-[1.02] active:scale-100 md:text-base"
                style={{ background: "var(--lf-accent-contrast)", color: "var(--lf-accent)", boxShadow: "0 18px 40px -20px rgba(0,0,0,0.45)" }}
              >
                {ctaLabel}
              </a>
              {secondaryCta?.label ? (
                <a
                  href={secondaryCta.href || "#cta"}
                  onClick={(e) => {
                    if (onCtaClick) e.preventDefault()
                    onCtaClick?.(secondaryCta.label)
                  }}
                  className="inline-flex h-11 items-center rounded-xl bg-white/15 px-6 text-sm font-semibold transition-colors hover:bg-white/25 md:text-base"
                >
                  {secondaryCta.label}
                </a>
              ) : null}
            </div>
            <StatsRow stats={stats} onPanel center />
          </div>
        </div>
      </section>
    )
  }

  // ── minimal — quiet centered type, no visual chrome ───────────────────
  if (layout === "minimal") {
    return (
      <section className={SECTION_PAD_HERO}>
        <div className={CONTAINER}>
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            {section.badge ? (
              <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--lf-accent)" }}>
                {section.badge}
              </p>
            ) : null}
            <h1 className="mt-4 text-3xl font-extrabold leading-[1.12] tracking-tight sm:text-4xl md:text-5xl" style={{ color: "var(--lf-text)" }}>
              <span style={gradientText}>{headline}</span>
            </h1>
            {sub ? (
              <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed md:text-lg" style={{ color: "var(--lf-muted)" }}>
                {sub}
              </p>
            ) : null}
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <a
                href={section.cta.href || "#cta"}
                onClick={(e) => {
                  if (onCtaClick) e.preventDefault()
                  onCtaClick?.(ctaLabel)
                }}
                className="inline-flex h-11 items-center rounded-xl px-6 text-sm font-semibold transition-transform duration-150 hover:scale-[1.02] active:scale-100 md:text-base"
                style={{ background: "var(--lf-accent)", color: "var(--lf-accent-contrast)", boxShadow: "0 18px 40px -22px var(--lf-accent)" }}
              >
                {ctaLabel}
              </a>
              {secondaryCta?.label ? (
                <a
                  href={secondaryCta.href || "#cta"}
                  onClick={(e) => {
                    if (onCtaClick) e.preventDefault()
                    onCtaClick?.(secondaryCta.label)
                  }}
                  className="inline-flex h-11 items-center gap-1.5 text-sm font-semibold underline decoration-1 underline-offset-4 transition-colors md:text-base"
                  style={{ color: "var(--lf-text)", textDecorationColor: "var(--lf-border)" }}
                >
                  {secondaryCta.label}
                </a>
              ) : null}
            </div>
            <StatsRow stats={stats} center />
          </div>
        </div>
      </section>
    )
  }

  // ── card — compact sign-up-style panel ─────────────────────────────────
  if (layout === "card") {
    return (
      <section className={SECTION_PAD_HERO}>
        <div className={CONTAINER}>
          <div
            className="mx-auto max-w-xl rounded-3xl border p-8 text-center shadow-2xl md:p-10"
            style={{ borderColor: "var(--lf-border)", background: "var(--lf-surface)", boxShadow: "0 40px 80px -48px rgba(0,0,0,0.5)" }}
          >
            {section.badge ? (
              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium" style={{ background: "var(--lf-accent-soft)", color: "var(--lf-accent)" }}>
                {section.badge}
              </span>
            ) : null}
            <h1 className="mt-4 text-3xl font-extrabold leading-[1.1] tracking-tight md:text-4xl" style={{ color: "var(--lf-text)" }}>
              {headline}
            </h1>
            {sub ? (
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed md:text-base" style={{ color: "var(--lf-muted)" }}>
                {sub}
              </p>
            ) : null}
            <div className="mt-8 flex flex-col gap-3">
              <a
                href={section.cta.href || "#cta"}
                onClick={(e) => {
                  if (onCtaClick) e.preventDefault()
                  onCtaClick?.(ctaLabel)
                }}
                className="inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold transition-transform duration-150 hover:scale-[1.01] active:scale-100 md:text-base"
                style={{ background: "var(--lf-accent)", color: "var(--lf-accent-contrast)", boxShadow: "0 18px 40px -22px var(--lf-accent)" }}
              >
                {ctaLabel}
              </a>
              {secondaryCta?.label ? (
                <a
                  href={secondaryCta.href || "#cta"}
                  onClick={(e) => {
                    if (onCtaClick) e.preventDefault()
                    onCtaClick?.(secondaryCta.label)
                  }}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl border text-sm font-semibold transition-colors hover:[background:var(--lf-accent-soft)] md:text-base"
                  style={{ borderColor: "var(--lf-border)", color: "var(--lf-text)" }}
                >
                  {secondaryCta.label}
                </a>
              ) : null}
            </div>
            <StatsRow stats={stats} center />
          </div>
        </div>
      </section>
    )
  }

  if (layout === "full-bleed") {
    return (
      <section className={SECTION_PAD}>
        <div className={CONTAINER}>
          <div
            className="relative overflow-hidden rounded-3xl px-6 py-14 text-center md:px-12 md:py-20"
            style={{ background: "var(--lf-gradient)", color: "var(--lf-accent-contrast)" }}
          >
            {/* decorative grid + glows */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
                backgroundSize: "44px 44px",
              }}
            />
            <div aria-hidden className="pointer-events-none absolute -left-24 -top-32 size-80 rounded-full blur-3xl" style={{ background: "rgba(255,255,255,0.18)" }} />
            <div aria-hidden className="pointer-events-none absolute -bottom-36 -right-24 size-96 rounded-full blur-3xl" style={{ background: "rgba(0,0,0,0.16)" }} />

            <div className="relative mx-auto flex max-w-3xl flex-col items-center">
              {section.badge ? (
                <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: "rgba(255,255,255,0.18)" }}>
                  {section.badge}
                </span>
              ) : null}
              <h1 className="mt-4 text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-4xl md:text-5xl">{headline}</h1>
              {sub ? <p className="mt-4 max-w-xl text-base leading-relaxed opacity-85 md:text-lg">{sub}</p> : null}
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <a
                  href={section.cta.href || "#cta"}
                  onClick={(e) => {
                    if (onCtaClick) e.preventDefault()
                    onCtaClick?.(ctaLabel)
                  }}
                  className="rounded-xl px-6 py-3 text-sm font-semibold transition-transform duration-150 hover:scale-[1.02] active:scale-100 md:text-base"
                  style={{ background: "var(--lf-accent-contrast)", color: "var(--lf-accent)", boxShadow: "0 18px 40px -20px rgba(0,0,0,0.45)" }}
                >
                  {ctaLabel}
                </a>
                {secondaryCta?.label ? (
                  <a
                    href={secondaryCta.href || "#cta"}
                    onClick={(e) => {
                      if (onCtaClick) e.preventDefault()
                      onCtaClick?.(secondaryCta.label)
                    }}
                    className="rounded-xl px-6 py-3 text-sm font-semibold transition-transform duration-150 hover:scale-[1.02] active:scale-100 md:text-base"
                    style={{ background: "rgba(255,255,255,0.16)" }}
                  >
                    {secondaryCta.label}
                  </a>
                ) : null}
              </div>
              <StatsRow stats={stats} onPanel center />
            </div>
          </div>
        </div>
      </section>
    )
  }

  const parts = splitHeadline(headline)
  const centered = layout === "center"

  const textBlock = (
    <div className={cn("flex flex-col", centered && "items-center text-center")}>
      {section.badge ? (
        <span
          className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
          style={{ background: "var(--lf-accent-soft)", color: "var(--lf-accent)" }}
        >
          {section.badge}
        </span>
      ) : null}
      <h1
        className="mt-4 text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-4xl md:text-5xl"
        style={{ color: "var(--lf-text)" }}
      >
        {parts ? (
          <>
            <span>{parts.head}</span>
            <span style={gradientText}>{parts.tail}</span>
          </>
        ) : (
          <span style={gradientText}>{headline}</span>
        )}
      </h1>
      {sub ? (
        <p className={cn("mt-4 max-w-xl text-base leading-relaxed md:text-lg", centered && "mx-auto")} style={{ color: "var(--lf-muted)" }}>
          {sub}
        </p>
      ) : null}
      <div className={cn("mt-8 flex flex-wrap gap-3", centered && "justify-center")}>
        <a
          href={section.cta.href || "#cta"}
          onClick={(e) => {
            if (onCtaClick) e.preventDefault()
            onCtaClick?.(ctaLabel)
          }}
          className="rounded-xl px-6 py-3 text-sm font-semibold transition-transform duration-150 hover:scale-[1.02] active:scale-100 md:text-base"
          style={{
            background: "var(--lf-accent)",
            color: "var(--lf-accent-contrast)",
            boxShadow: "0 18px 40px -22px var(--lf-accent)",
          }}
        >
          {ctaLabel}
        </a>
        {secondaryCta?.label ? (
          <a
            href={secondaryCta.href || "#cta"}
            onClick={(e) => {
              if (onCtaClick) e.preventDefault()
              onCtaClick?.(secondaryCta.label)
            }}
            className="rounded-xl border px-6 py-3 text-sm font-semibold transition-colors hover:[background:var(--lf-accent-soft)] md:text-base"
            style={{ borderColor: "var(--lf-border)", color: "var(--lf-text)", background: "transparent" }}
          >
            {secondaryCta.label}
          </a>
        ) : null}
      </div>
      <StatsRow stats={stats} center={centered} />
    </div>
  )

  const visual = hasImage ? (
    <div
      className="overflow-hidden rounded-2xl border"
      style={{ borderColor: "var(--lf-border)", boxShadow: "0 36px 70px -36px rgba(0,0,0,0.35)" }}
    >
      <img src={section.image} alt={headline} className="aspect-video w-full object-cover" />
    </div>
  ) : (
    <HeroMock brandName={brandName} />
  )

  if (layout === "center") {
    return (
      <section className={SECTION_PAD}>
        <div className={cn(CONTAINER, "flex flex-col items-center")}>
          {textBlock}
          <div className="mt-12 w-full max-w-3xl md:mt-16">{visual}</div>
        </div>
      </section>
    )
  }

  return (
    <section className={SECTION_PAD}>
      <div className={CONTAINER}>
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
          <div className={cn(layout === "split-left" && "md:order-2")}>{textBlock}</div>
          <div className={cn(layout === "split-left" && "md:order-1")}>{visual}</div>
        </div>
      </div>
    </section>
  )
}
