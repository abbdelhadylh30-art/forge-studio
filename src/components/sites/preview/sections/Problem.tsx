"use client"

import { useState } from "react"

import type { PainItem, ProblemSection } from "@/lib/landing/types"

import { IconGlyph } from "../iconBank"
import { CONTAINER, SECTION_PAD, SectionHeader } from "../shared"
import { cn } from "@/lib/utils"

export interface ProblemProps {
  section: ProblemSection
}

/** Rose-tinted icon chip — marks pain items visually as "cost" tiles. */
function PainIconChip({ icon, size = "size-10", iconSize = "size-5" }: { icon: string; size?: string; iconSize?: string }) {
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center rounded-lg", size)}
      style={{ background: "color-mix(in srgb, #fb7185 14%, transparent)", color: "#fb7185" }}
    >
      <IconGlyph name={icon} className={iconSize} />
    </span>
  )
}

/** Pain card — rose-tinted icon chip marks it visually as a "cost" tile. */
function PainCard({ item }: { item: PainItem }) {
  return (
    <article
      className="rounded-xl border p-5 md:p-6"
      style={{ borderColor: "var(--lf-border)", background: "var(--lf-surface)" }}
    >
      <div className="flex items-start gap-4">
        <PainIconChip icon={item.icon} />
        <div className="min-w-0">
          <h3 className="font-semibold" style={{ color: "var(--lf-text)" }}>
            {item.title}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--lf-muted)" }}>
            {item.body}
          </p>
        </div>
      </div>
    </article>
  )
}

/** Split row — hairline-separated list, tighter than cards. */
function PainRow({ item, last }: { item: PainItem; last: boolean }) {
  return (
    <div className={cn("flex items-start gap-4 py-5", !last && "border-b")} style={{ borderColor: "var(--lf-border)" }}>
      <PainIconChip icon={item.icon} size="size-9" iconSize="size-4.5" />
      <div>
        <h3 className="font-semibold" style={{ color: "var(--lf-text)" }}>
          {item.title}
        </h3>
        <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--lf-muted)" }}>
          {item.body}
        </p>
      </div>
    </div>
  )
}

/** Tabs — one pain point at a time; the shared [data-lf-tabs] markup lets the
 *  vanilla export script drive the same behavior in standalone HTML.
 *  Contract: all buttons carry the `border` class; active/inactive looks come
 *  from inline styles the script can replicate (bg/fg/borderColor). Panels
 *  toggle via inline `display` (the `hidden` attr loses to Tailwind's .flex). */
function PainTabs({ items }: { items: PainItem[] }) {
  const [active, setActive] = useState(0)
  const activeIdx = Math.min(active, Math.max(items.length - 1, 0))
  const ACTIVE_BG = "color-mix(in srgb, #fb7185 88%, transparent)"

  return (
    <div data-lf-tabs data-lf-active-bg={ACTIVE_BG} data-lf-active-fg="#ffffff">
      <div className="flex flex-wrap justify-center gap-2" role="tablist">
        {items.map((item, i) => (
          <button
            key={`${item.title}-tab-${i}`}
            type="button"
            role="tab"
            data-lf-tab
            data-lf-tab-index={i}
            aria-selected={i === activeIdx}
            onClick={() => setActive(i)}
            className="rounded-xl border px-4 py-2 text-sm font-semibold transition-colors"
            style={
              i === activeIdx
                ? { background: ACTIVE_BG, color: "#ffffff", borderColor: "transparent" }
                : { background: "var(--lf-surface)", borderColor: "var(--lf-border)", color: "var(--lf-muted)" }
            }
          >
            {item.title}
          </button>
        ))}
      </div>
      {items.map((item, i) => (
        <div
          key={`${item.title}-panel-${i}`}
          data-lf-tab-panel
          data-lf-tab-index={i}
          role="tabpanel"
          className="mx-auto mt-6 flex max-w-2xl items-start gap-5 rounded-2xl border p-6 md:p-8"
          style={{
            display: i === activeIdx ? undefined : "none",
            borderColor: "color-mix(in srgb, #fb7185 26%, transparent)",
            background: "color-mix(in srgb, #fb7185 7%, var(--lf-surface))",
          }}
        >
          <PainIconChip icon={item.icon} size="size-14 rounded-xl" iconSize="size-7" />
          <div className="min-w-0">
            <h3 className="text-lg font-semibold" style={{ color: "var(--lf-text)" }}>
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed md:text-base" style={{ color: "var(--lf-muted)" }}>
              {item.body}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

/** Timeline — vertical rail with rose markers; reads as a compounding cost. */
function PainTimeline({ items }: { items: PainItem[] }) {
  return (
    <div className="relative mx-auto max-w-3xl">
      <span aria-hidden className="absolute bottom-6 left-[5px] top-2 w-px md:left-[7px]" style={{ background: "var(--lf-border)" }} />
      {items.map((item, i) => (
        <div key={`${item.title}-${i}`} className="relative flex gap-5 pb-8 last:pb-0 md:gap-7">
          <span
            aria-hidden
            className="relative mt-1.5 size-2.5 shrink-0 rounded-full border-2 md:size-3.5"
            style={{ borderColor: "#fb7185", background: "var(--lf-bg)" }}
          />
          <div className="min-w-0 -mt-0.5">
            <div className="flex items-center gap-3">
              <PainIconChip icon={item.icon} size="size-8" iconSize="size-4" />
              <h3 className="font-semibold" style={{ color: "var(--lf-text)" }}>
                {item.title}
              </h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed md:pl-11" style={{ color: "var(--lf-muted)" }}>
              {item.body}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export function Problem({ section }: ProblemProps) {
  const items = section.items ?? []

  if (section.style === "tabs") {
    return (
      <section className={SECTION_PAD}>
        <div className={cn(CONTAINER, "text-center")}>
          <SectionHeader title={section.title} subtitle={section.subtitle} eyebrow="The problem" center className="mb-8 md:mb-10" />
          <PainTabs items={items} />
        </div>
      </section>
    )
  }

  if (section.style === "timeline") {
    return (
      <section className={SECTION_PAD}>
        <div className={CONTAINER}>
          <SectionHeader title={section.title} subtitle={section.subtitle} eyebrow="The problem" center />
          <PainTimeline items={items} />
        </div>
      </section>
    )
  }

  if (section.style === "split") {
    return (
      <section className={SECTION_PAD}>
        <div className={cn(CONTAINER, "grid gap-10 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-16")}>
          <div>
            <SectionHeader title={section.title} subtitle={section.subtitle} eyebrow="The problem" className="mb-0 md:sticky md:top-24" />
          </div>
          <div className="rounded-2xl border p-4 md:p-6" style={{ borderColor: "var(--lf-border)", background: "var(--lf-surface)" }}>
            {items.map((it, i) => (
              <PainRow key={`${it.title}-${i}`} item={it} last={i === items.length - 1} />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={SECTION_PAD}>
      <div className={CONTAINER}>
        <SectionHeader title={section.title} subtitle={section.subtitle} eyebrow="The problem" center />
        <div className="grid gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {items.map((it, i) => (
            <PainCard key={`${it.title}-${i}`} item={it} />
          ))}
        </div>
      </div>
    </section>
  )
}
