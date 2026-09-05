"use client"

import type { GuaranteeSection, PainItem } from "@/lib/landing/types"

import { IconGlyph } from "../iconBank"
import { CONTAINER, SECTION_PAD, SectionHeader } from "../shared"

export interface GuaranteeProps {
  section: GuaranteeSection
}

function Body({ body }: { body?: string }) {
  if (!body?.trim()) return null
  const paragraphs = body
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
  return (
    <div className="space-y-4">
      {paragraphs.map((p, i) => (
        <p key={i} className="text-sm leading-relaxed md:text-[15px]" style={{ color: "var(--lf-muted)" }}>
          {p}
        </p>
      ))}
    </div>
  )
}

function TermChip({ item }: { item: PainItem }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border px-4 py-3" style={{ borderColor: "var(--lf-border)", background: "var(--lf-surface)" }}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--lf-accent-soft)", color: "var(--lf-accent)" }}>
        <IconGlyph name={item.icon} className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold" style={{ color: "var(--lf-text)" }}>
          {item.title}
        </p>
        {item.body ? (
          <p className="truncate text-xs" style={{ color: "var(--lf-muted)" }}>
            {item.body}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function Guarantee({ section }: GuaranteeProps) {
  const items = section.items ?? []

  if (section.style === "split") {
    return (
      <section className={SECTION_PAD}>
        <div className={CONTAINER}>
          <div className="grid items-start gap-10 rounded-2xl border p-6 md:grid-cols-2 md:gap-14 md:p-10" style={{ borderColor: "var(--lf-border)", background: "var(--lf-surface)" }}>
            <div>
              <span className="flex size-14 items-center justify-center rounded-2xl" style={{ background: "var(--lf-accent-soft)", color: "var(--lf-accent)" }}>
                <IconGlyph name="shield-check" className="size-7" />
              </span>
              <h2 className="mt-5 text-2xl font-extrabold tracking-tight md:text-3xl" style={{ color: "var(--lf-text)" }}>
                {section.title}
              </h2>
              {section.subtitle ? (
                <p className="mt-2 text-sm md:text-base" style={{ color: "var(--lf-accent)" }}>
                  {section.subtitle}
                </p>
              ) : null}
              <div className="mt-5">
                <Body body={section.body} />
              </div>
            </div>
            <div className="grid gap-3 md:content-center">
              {items.map((it, i) => (
                <TermChip key={`${it.title}-${i}`} item={it} />
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  // card — centered promise panel
  return (
    <section className={SECTION_PAD}>
      <div className={CONTAINER}>
        <SectionHeader title={section.title} subtitle={section.subtitle} center />
        <div
          className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border px-6 py-10 text-center md:px-12 md:py-14"
          style={{ borderColor: "var(--lf-border)", background: "var(--lf-surface)" }}
        >
          {/* gradient cap */}
          <span aria-hidden className="absolute inset-x-0 top-0 h-0.5" style={{ background: "var(--lf-gradient)" }} />
          <span className="mx-auto flex size-16 items-center justify-center rounded-2xl" style={{ background: "var(--lf-accent-soft)", color: "var(--lf-accent)" }}>
            <IconGlyph name="shield-check" className="size-8" />
          </span>
          <div className="mx-auto mt-6 max-w-xl">
            <Body body={section.body} />
          </div>
          {items.length > 0 ? (
            <div className="mx-auto mt-8 grid max-w-xl gap-3 text-left sm:grid-cols-2">
              {items.map((it, i) => (
                <TermChip key={`${it.title}-${i}`} item={it} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
