"use client"

import type { PainItem, SolutionSection } from "@/lib/landing/types"

import { IconGlyph } from "../iconBank"
import { CONTAINER, SECTION_PAD, SectionHeader } from "../shared"
import { cn } from "@/lib/utils"

export interface SolutionProps {
  section: SolutionSection
}

/** Solution card — gradient cap line over an accent-tinted icon chip. */
function SolutionCard({ item }: { item: PainItem }) {
  return (
    <article
      className="relative overflow-hidden rounded-xl border p-5 pt-6 md:p-6 md:pt-7"
      style={{ borderColor: "var(--lf-border)", background: "var(--lf-surface)" }}
    >
      {/* gradient cap */}
      <span aria-hidden className="absolute inset-x-0 top-0 h-0.5" style={{ background: "var(--lf-gradient)" }} />
      <span
        className="flex size-10 items-center justify-center rounded-lg"
        style={{ background: "var(--lf-accent-soft)", color: "var(--lf-accent)" }}
      >
        <IconGlyph name={item.icon} className="size-5" />
      </span>
      <h3 className="mt-4 font-semibold" style={{ color: "var(--lf-text)" }}>
        {item.title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--lf-muted)" }}>
        {item.body}
      </p>
    </article>
  )
}

/** Numbered step — timeline rail with gradient node. */
function StepRow({ item, index }: { item: PainItem; index: number }) {
  return (
    <div className="relative flex gap-5 pb-8 last:pb-0 md:gap-7">
      {/* rail */}
      <div className="relative flex flex-col items-center">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold tabular-nums"
          style={{ borderColor: "var(--lf-border)", background: "var(--lf-surface)", color: "var(--lf-accent)" }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <div className="min-w-0 pt-1.5">
        <h3 className="font-semibold" style={{ color: "var(--lf-text)" }}>
          {item.title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--lf-muted)" }}>
          {item.body}
        </p>
      </div>
    </div>
  )
}

/** Alternating rows — a big visual medallion on one side, copy on the other,
 *  flipping sides each row (the v21 "alternating" solution layout). */
function AlternatingRow({ item, index }: { item: PainItem; index: number }) {
  const flip = index % 2 === 1
  return (
    <div
      className={cn("flex flex-col items-center gap-8 py-10 md:items-center md:gap-14 md:py-12", index > 0 && "border-t")}
      style={index > 0 ? { borderColor: "var(--lf-border)" } : undefined}
    >
      {/* visual medallion */}
      <div
        className="relative flex aspect-[4/3] w-full max-w-md items-center justify-center overflow-hidden rounded-2xl border md:w-[42%] md:shrink-0"
        style={{ borderColor: "var(--lf-border)", background: "var(--lf-accent-soft)" }}
      >
        <span aria-hidden className="absolute inset-x-0 top-0 h-0.5" style={{ background: "var(--lf-gradient)" }} />
        <IconGlyph name={item.icon} className="size-16 md:size-20" strokeWidth={1.25} style={{ color: "var(--lf-accent)", opacity: 0.8 }} />
      </div>
      {/* copy */}
      <div className={cn("max-w-xl text-center md:w-[54%] md:text-left", flip && "md:order-first")}>
        <span
          className="inline-flex size-11 items-center justify-center rounded-xl"
          style={{ background: "var(--lf-accent-soft)", color: "var(--lf-accent)" }}
        >
          <IconGlyph name={item.icon} className="size-5" />
        </span>
        <h3 className="mt-4 text-xl font-bold tracking-tight md:text-2xl" style={{ color: "var(--lf-text)" }}>
          {item.title}
        </h3>
        <p className="mt-2.5 text-sm leading-relaxed md:text-base" style={{ color: "var(--lf-muted)" }}>
          {item.body}
        </p>
      </div>
    </div>
  )
}

/** Icon column — gradient-filled circle, title, body; airy and centered. */
function IconColumn({ item }: { item: PainItem }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span
        className="flex size-14 items-center justify-center rounded-full border shadow-sm"
        style={{ background: "var(--lf-gradient)", borderColor: "var(--lf-border)" }}
      >
        <IconGlyph name={item.icon} className="size-6" style={{ color: "var(--lf-accent-contrast)" }} />
      </span>
      <h3 className="mt-4 text-lg font-bold" style={{ color: "var(--lf-text)" }}>
        {item.title}
      </h3>
      <p className="mt-1.5 max-w-xs text-sm leading-relaxed" style={{ color: "var(--lf-muted)" }}>
        {item.body}
      </p>
    </div>
  )
}

export function Solution({ section }: SolutionProps) {
  const items = section.items ?? []

  if (section.style === "alternating") {
    return (
      <section className={SECTION_PAD}>
        <div className={CONTAINER}>
          <SectionHeader title={section.title} subtitle={section.subtitle} eyebrow="The solution" center />
          <div className="mx-auto max-w-4xl">
            {items.map((it, i) => (
              <AlternatingRow key={`${it.title}-${i}`} item={it} index={i} />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (section.style === "icons") {
    return (
      <section className={SECTION_PAD}>
        <div className={CONTAINER}>
          <SectionHeader title={section.title} subtitle={section.subtitle} eyebrow="The solution" center />
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it, i) => (
              <IconColumn key={`${it.title}-${i}`} item={it} />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (section.style === "steps") {
    return (
      <section className={SECTION_PAD}>
        <div className={CONTAINER}>
          <SectionHeader title={section.title} subtitle={section.subtitle} eyebrow="The solution" center />
          <div className="relative mx-auto max-w-3xl">
            {/* vertical rail behind the nodes */}
            <span
              aria-hidden
              className="absolute bottom-5 left-5 top-5 w-px md:left-[19px]"
              style={{ background: "var(--lf-border)" }}
            />
            {items.map((it, i) => (
              <StepRow key={`${it.title}-${i}`} item={it} index={i} />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (section.style === "split") {
    return (
      <section className={SECTION_PAD}>
        <div className={cn(CONTAINER, "grid gap-10 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-16")}>
          <div>
            <SectionHeader title={section.title} subtitle={section.subtitle} eyebrow="The solution" className="mb-0 md:sticky md:top-24" />
          </div>
          <div className="grid gap-4 md:gap-5">
            {items.map((it, i) => (
              <SolutionCard key={`${it.title}-${i}`} item={it} />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={SECTION_PAD}>
      <div className={CONTAINER}>
        <SectionHeader title={section.title} subtitle={section.subtitle} eyebrow="The solution" center />
        <div className="grid gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {items.map((it, i) => (
            <SolutionCard key={`${it.title}-${i}`} item={it} />
          ))}
        </div>
      </div>
    </section>
  )
}
