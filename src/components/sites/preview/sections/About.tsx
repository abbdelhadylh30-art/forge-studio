"use client"

import type { AboutSection } from "@/lib/landing/types"

import { CONTAINER, SECTION_PAD, SectionHeader, gradientText } from "../shared"

export interface AboutProps {
  section: AboutSection
}

/**
 * About section — three styles:
 *  • founder  — a letter from the founder (avatar, name, role, signature paragraphs)
 *  • timeline — milestones with year markers on a vertical rail
 *  • mission  — a mission statement + value cards
 */
export function About({ section }: AboutProps) {
  const items = section.items ?? []

  if (section.style === "founder") {
    const paragraphs = (section.body ?? "").split(/\n{2,}/).filter(Boolean)
    if (paragraphs.length === 0 && !section.title) return null
    const initials = (section.founder?.name ?? "F")
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
    return (
      <section className={SECTION_PAD}>
        <div className={CONTAINER}>
          <div className="grid items-start gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:gap-14">
            {/* Founder card */}
            <div
              className="rounded-2xl border p-6 md:sticky md:top-24"
              style={{ background: "var(--lf-surface)", borderColor: "var(--lf-border)" }}
            >
              <div
                className="grid h-16 w-16 place-items-center rounded-full text-xl font-extrabold"
                style={{ background: "var(--lf-accent-soft)", color: "var(--lf-accent)" }}
                aria-hidden
              >
                {initials}
              </div>
              <p className="mt-4 text-lg font-bold" style={{ color: "var(--lf-text)" }}>
                {section.founder?.name ?? "The founder"}
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--lf-muted)" }}>
                {section.founder?.role ?? "Founder"}
              </p>
              {section.founder?.name ? (
                <p className="mt-5 text-2xl italic" style={{ ...gradientText, fontFamily: "var(--lf-font-display, inherit)" }}>
                  — {section.founder.name.split(" ")[0]}
                </p>
              ) : null}
            </div>

            {/* The letter */}
            <div>
              <SectionHeader title={section.title} subtitle={section.subtitle} />
              <div className="space-y-4">
                {paragraphs.map((p, i) => (
                  <p key={i} className="text-sm leading-7 md:text-base" style={{ color: "var(--lf-muted)" }}>
                    {p}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (section.style === "timeline") {
    if (items.length === 0 && !section.title) return null
    return (
      <section className={SECTION_PAD}>
        <div className={CONTAINER}>
          <SectionHeader title={section.title} subtitle={section.subtitle} center />
          <ol className="relative mx-auto max-w-2xl space-y-8 border-l-2 pl-8" style={{ borderColor: "var(--lf-border)" }}>
            {items.map((it, i) => (
              <li key={`${it.title}-${i}`} className="relative">
                <span
                  className="absolute -left-[41px] grid h-5 w-5 place-items-center rounded-full border-2"
                  style={{ borderColor: "var(--lf-accent)", background: "var(--lf-bg)" }}
                  aria-hidden
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--lf-accent)" }} />
                </span>
                {it.year ? (
                  <span
                    className="mb-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums"
                    style={{ background: "var(--lf-accent-soft)", color: "var(--lf-accent)" }}
                  >
                    {it.year}
                  </span>
                ) : null}
                <h3 className="text-base font-bold md:text-lg" style={{ color: "var(--lf-text)" }}>
                  {it.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--lf-muted)" }}>
                  {it.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    )
  }

  // mission — statement + value cards
  if (!section.body && items.length === 0 && !section.title) return null
  return (
    <section className={SECTION_PAD}>
      <div className={CONTAINER}>
        <SectionHeader title={section.title} subtitle={section.subtitle} center />
        {section.body ? (
          <p
            className="mx-auto mb-10 max-w-2xl text-center text-lg font-medium leading-relaxed md:text-xl"
            style={{ color: "var(--lf-text)", fontFamily: "var(--lf-font-display, inherit)" }}
          >
            “{section.body}”
          </p>
        ) : null}
        {items.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it, i) => (
              <div
                key={`${it.title}-${i}`}
                className="rounded-2xl border p-5 transition-transform duration-150 hover:-translate-y-0.5 md:p-6"
                style={{ background: "var(--lf-surface)", borderColor: "var(--lf-border)" }}
              >
                {it.year ? (
                  <span className="text-xs font-bold tabular-nums" style={{ color: "var(--lf-accent)" }}>
                    {it.year}
                  </span>
                ) : null}
                <h3 className="mt-1 text-base font-bold md:text-lg" style={{ color: "var(--lf-text)" }}>
                  {it.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--lf-muted)" }}>
                  {it.body}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
