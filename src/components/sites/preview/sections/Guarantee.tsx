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

  // ── badge — big gradient medallion + promise copy side-by-side ──
  if (section.style === "badge") {
    return (
      <section className={SECTION_PAD}>
        <div className={CONTAINER}>
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 md:flex-row md:gap-12">
            <span
              className="flex size-32 shrink-0 flex-col items-center justify-center rounded-full shadow-lg md:size-40"
              style={{ background: "var(--lf-gradient)" }}
            >
              <IconGlyph name="shield-check" className="size-11 md:size-14" style={{ color: "var(--lf-accent-contrast)" }} />
              <span className="mt-1 text-base font-bold md:text-lg" style={{ color: "var(--lf-accent-contrast)" }}>
                {section.subtitle || "30 days"}
              </span>
            </span>
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl" style={{ color: "var(--lf-text)" }}>
                {section.title}
              </h2>
              <div className="mt-4">
                <Body body={section.body} />
              </div>
              {items.length > 0 ? (
                <div className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">
                  {items.map((it, i) => (
                    <span
                      key={`${it.title}-${i}`}
                      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium"
                      style={{ borderColor: "var(--lf-border)", background: "var(--lf-surface)", color: "var(--lf-muted)" }}
                    >
                      <IconGlyph name={it.icon} className="size-3.5" style={{ color: "var(--lf-accent)" }} />
                      {it.title}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    )
  }

  // ── certificate — formal framed document with a seal ──
  if (section.style === "certificate") {
    return (
      <section className={SECTION_PAD}>
        <div className={CONTAINER}>
          <div
            className="relative mx-auto max-w-2xl rounded-2xl border p-2 md:p-2.5"
            style={{ borderColor: "color-mix(in srgb, var(--lf-accent) 45%, transparent)" }}
          >
            <div
              className="rounded-[inherit] border px-6 py-10 text-center md:px-12 md:py-12"
              style={{ borderColor: "color-mix(in srgb, var(--lf-accent) 22%, transparent)", background: "var(--lf-surface)" }}
            >
              <span
                className="mx-auto flex size-16 items-center justify-center rounded-full shadow-md"
                style={{ background: "var(--lf-gradient)" }}
              >
                <IconGlyph name="shield-check" className="size-8" style={{ color: "var(--lf-accent-contrast)" }} />
              </span>
              <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: "var(--lf-accent)" }}>
                Certificate of guarantee
              </p>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight md:text-3xl" style={{ color: "var(--lf-text)" }}>
                {section.title}
              </h2>
              <div className="mx-auto mt-4 max-w-lg">
                <Body body={section.body} />
              </div>
              {items.length > 0 ? (
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {items.map((it, i) => (
                    <span
                      key={`${it.title}-${i}`}
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                      style={{ background: "var(--lf-accent-soft)", color: "var(--lf-accent)" }}
                    >
                      <IconGlyph name={it.icon} className="size-3.5" />
                      {it.title}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    )
  }

  // ── seals — a row of trust medallions ──
  if (section.style === "seals") {
    return (
      <section className={SECTION_PAD}>
        <div className={CONTAINER}>
          <SectionHeader title={section.title} subtitle={section.subtitle} center />
          {section.body ? (
            <div className="mx-auto mb-10 max-w-2xl text-center md:mb-12">
              <Body body={section.body} />
            </div>
          ) : null}
          <div className="mx-auto grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
            {(items.length ? items : [{ icon: "shield-check", title: "Secure", body: "" }]).slice(0, 8).map((it, i) => (
              <div key={`${it.title}-${i}`} className="flex flex-col items-center text-center">
                <span
                  className="flex size-14 items-center justify-center rounded-full border shadow-sm"
                  style={{ background: "var(--lf-accent-soft)", borderColor: "var(--lf-border)", color: "var(--lf-accent)" }}
                >
                  <IconGlyph name={it.icon} className="size-6" />
                </span>
                <p className="mt-3 text-sm font-semibold" style={{ color: "var(--lf-text)" }}>
                  {it.title}
                </p>
                {it.body ? (
                  <p className="mt-1 text-xs" style={{ color: "var(--lf-muted)" }}>
                    {it.body}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

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
