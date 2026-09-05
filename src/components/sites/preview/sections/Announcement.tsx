"use client"

import * as React from "react"

import type { AnnouncementSection } from "@/lib/landing/types"

import { cn } from "@/lib/utils"

import { CONTAINER, SECTION_PAD_BAR } from "../shared"

export interface AnnouncementProps {
  section: AnnouncementSection
  onCtaClick?: (label: string) => void
}

/** Parts of a countdown, in display order. */
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

function LinkChip({ label, href, onCtaClick }: { label: string; href: string; onCtaClick?: (label: string) => void }) {
  return (
    <a
      href={href || "#cta"}
      onClick={(e) => {
        if (onCtaClick) e.preventDefault()
        onCtaClick?.(label)
      }}
      className="ml-3 inline-flex shrink-0 items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold transition-colors hover:bg-white/30 md:ml-4"
    >
      {label}
      <span aria-hidden>→</span>
    </a>
  )
}

/** Live countdown — a React timer in the app, the vanilla [data-lf-countdown]
 *  script in the standalone export (same markup). */
function Countdown({ deadline, prefixLabel }: { deadline?: string; prefixLabel?: string }) {
  const target = React.useMemo(() => {
    const t = Date.parse(deadline ?? "")
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
    <span className="inline-flex items-baseline gap-1 md:gap-1.5" data-lf-countdown={deadline} data-deadline={deadline} data-expired={expired ? "true" : "false"}>
      {prefixLabel ? <span className="mr-1.5 text-[11px] font-semibold opacity-80 md:mr-2 md:text-xs">{prefixLabel}</span> : null}
      {UNITS.map((u) => (
        <span key={u.id} className="inline-flex items-baseline gap-0.5">
          <span data-lf-cd={u.id} className="min-w-[2ch] text-center text-sm font-bold tabular-nums md:text-base">
            {String(parts[u.id]).padStart(2, "0")}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{u.label}</span>
        </span>
      ))}
    </span>
  )
}

export function Announcement({ section, onCtaClick }: AnnouncementProps) {
  const message = section.message?.trim() || "Welcome"
  const link = section.link

  if (section.style === "ticker") {
    // duplicated track → seamless infinite scroll (paused on hover / reduced motion)
    const strip = (
      <span className="lf-ticker-track" aria-hidden>
        {[0, 1].map((copy) => (
          <span key={copy} className="lf-ticker-copy flex shrink-0 items-center">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className="mx-6 inline-flex items-center gap-2 whitespace-nowrap text-xs font-semibold md:mx-8 md:text-[13px]">
                {message}
                <span className="opacity-50" aria-hidden>
                  ·
                </span>
              </span>
            ))}
          </span>
        ))}
      </span>
    )
    return (
      <section className={cn(SECTION_PAD_BAR, "w-full overflow-hidden")} style={{ background: "var(--lf-gradient)", color: "var(--lf-accent-contrast)" }}>
        <span className="sr-only">{message}</span>
        {link ? (
          <div className="flex items-center">
            <div className="min-w-0 flex-1 overflow-hidden">{strip}</div>
            <div className="shrink-0 pr-4 md:pr-6">
              <LinkChip label={link.label} href={link.href} onCtaClick={onCtaClick} />
            </div>
          </div>
        ) : (
          strip
        )}
      </section>
    )
  }

  if (section.style === "countdown") {
    return (
      <section className={cn(SECTION_PAD_BAR, "w-full")} style={{ background: "var(--lf-gradient)", color: "var(--lf-accent-contrast)" }}>
        <div className={cn(CONTAINER, "flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center")}>
          {message ? <span className="text-xs font-semibold md:text-[13px]">{message}</span> : null}
          <Countdown deadline={section.deadline} prefixLabel={section.prefixLabel} />
          {link ? <LinkChip label={link.label} href={link.href} onCtaClick={onCtaClick} /> : null}
        </div>
      </section>
    )
  }

  // static
  return (
    <section className={cn(SECTION_PAD_BAR, "w-full")} style={{ background: "var(--lf-gradient)", color: "var(--lf-accent-contrast)" }}>
      <div className={cn(CONTAINER, "flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center")}>
        <span className="text-xs font-semibold md:text-[13px]">{message}</span>
        {link ? <LinkChip label={link.label} href={link.href} onCtaClick={onCtaClick} /> : null}
      </div>
    </section>
  )
}
