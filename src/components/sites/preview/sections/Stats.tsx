"use client"

import type { StatsSection } from "@/lib/landing/types"

import { CONTAINER, SECTION_PAD, SectionHeader, gradientText } from "../shared"

export interface StatsProps {
  section: StatsSection
}

export function Stats({ section }: StatsProps) {
  const items = section.items ?? []
  if (items.length === 0 && !section.title) return null

  return (
    <section className={SECTION_PAD}>
      <div className={CONTAINER}>
        <SectionHeader title={section.title} center />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
          {items.map((s, i) => (
            <div
              key={`${s.value}-${s.label}-${i}`}
              className="rounded-2xl border p-5 text-center transition-transform duration-150 hover:-translate-y-0.5 md:p-6"
              style={{ background: "var(--lf-surface)", borderColor: "var(--lf-border)" }}
            >
              <div className="text-3xl font-extrabold tracking-tight md:text-4xl" style={gradientText}>
                {s.value}
              </div>
              <div className="mt-1.5 text-sm" style={{ color: "var(--lf-muted)" }}>
                {s.label}
              </div>
              {s.delta ? (
                <span
                  className="mt-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{ background: "var(--lf-accent-soft)", color: "var(--lf-accent)" }}
                >
                  {s.delta}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
