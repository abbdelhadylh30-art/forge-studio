"use client"

import type { PainItem, ProblemSection } from "@/lib/landing/types"

import { IconGlyph } from "../iconBank"
import { CONTAINER, SECTION_PAD, SectionHeader } from "../shared"
import { cn } from "@/lib/utils"

export interface ProblemProps {
  section: ProblemSection
}

/** Pain card — rose-tinted icon chip marks it visually as a "cost" tile. */
function PainCard({ item }: { item: PainItem }) {
  return (
    <article
      className="rounded-xl border p-5 md:p-6"
      style={{ borderColor: "var(--lf-border)", background: "var(--lf-surface)" }}
    >
      <div className="flex items-start gap-4">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "color-mix(in srgb, #fb7185 14%, transparent)", color: "#fb7185" }}
        >
          <IconGlyph name={item.icon} className="size-5" />
        </span>
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
      <span
        className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg"
        style={{ background: "color-mix(in srgb, #fb7185 14%, transparent)", color: "#fb7185" }}
      >
        <IconGlyph name={item.icon} className="size-4.5" />
      </span>
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

export function Problem({ section }: ProblemProps) {
  const items = section.items ?? []

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
