"use client"

import type { ComparisonRow, ComparisonSection } from "@/lib/landing/types"

import { Check, Minus, X } from "lucide-react"

import { CONTAINER, SECTION_PAD, SectionHeader } from "../shared"
import { cn } from "@/lib/utils"

export interface ComparisonProps {
  section: ComparisonSection
}

/** Cell renderer: yes/no/partial → icon; anything else → text. */
function Cell({ value, strong }: { value: string; strong?: boolean }) {
  const v = (value ?? "").trim().toLowerCase()
  if (v === "yes" || v === "true") {
    return (
      <span className="inline-flex items-center justify-center" style={strong ? { color: "var(--lf-accent)" } : { color: "#4ade80" }}>
        <Check className="size-5" strokeWidth={2.5} aria-label="Included" />
      </span>
    )
  }
  if (v === "no" || v === "false") {
    return (
      <span className="inline-flex items-center justify-center text-zinc-500">
        <X className="size-5" strokeWidth={2} aria-label="Not included" />
      </span>
    )
  }
  if (v === "partial" || v === "sometimes") {
    return (
      <span className="inline-flex items-center justify-center" style={{ color: "var(--lf-muted)" }}>
        <Minus className="size-5" strokeWidth={2} aria-label="Partially included" />
      </span>
    )
  }
  if (!v) return <span className="inline-block size-1.5 rounded-full" style={{ background: "var(--lf-border)" }} aria-hidden />
  return (
    <span className="text-center text-[13px] font-medium" style={{ color: strong ? "var(--lf-text)" : "var(--lf-muted)" }}>
      {value}
    </span>
  )
}

function Row({ row }: { row: ComparisonRow }) {
  return (
    <>
      {/* mobile: stacked card per feature */}
      <div className="grid gap-3 rounded-xl border p-4 md:hidden" style={{ borderColor: "var(--lf-border)", background: "var(--lf-surface)" }}>
        <p className="text-sm font-semibold" style={{ color: "var(--lf-text)" }}>
          {row.feature}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "var(--lf-accent-soft)" }}>
            <span className="w-14 shrink-0 text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--lf-accent)" }}>
              Us
            </span>
            <span className="min-w-0 flex-1">
              <Cell value={row.us} strong />
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "var(--lf-surface)" }}>
            <span className="w-14 shrink-0 text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--lf-muted)" }}>
              Them
            </span>
            <span className="min-w-0 flex-1">
              <Cell value={row.them} />
            </span>
          </div>
        </div>
      </div>

      {/* desktop: grid row */}
      <div
        className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-4 border-t px-5 py-4 md:grid md:px-6"
        style={{ borderColor: "var(--lf-border)" }}
      >
        <p className="text-sm font-medium" style={{ color: "var(--lf-text)" }}>
          {row.feature}
        </p>
        <div className="flex justify-center rounded-lg py-1" style={{ background: "var(--lf-accent-soft)" }}>
          <Cell value={row.us} strong />
        </div>
        <div className="flex justify-center py-1">
          <Cell value={row.them} />
        </div>
      </div>
    </>
  )
}

export function Comparison({ section }: ComparisonProps) {
  const rows = section.rows ?? []
  return (
    <section className={SECTION_PAD}>
      <div className={CONTAINER}>
        <SectionHeader title={section.title} subtitle={section.subtitle} center />
        <div
          className="overflow-hidden rounded-2xl border"
          style={{ borderColor: "var(--lf-border)", background: "var(--lf-surface)" }}
        >
          {/* desktop header row */}
          <div
            className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 px-5 py-4 md:grid md:px-6"
            style={{ background: "var(--lf-bg)", borderBottom: "1px solid var(--lf-border)" }}
          >
            <span className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: "var(--lf-muted)" }}>
              Feature
            </span>
            <span className="text-center text-xs font-bold uppercase tracking-[0.14em]" style={{ color: "var(--lf-accent)" }}>
              {section.usLabel}
            </span>
            <span className="text-center text-xs font-bold uppercase tracking-[0.14em]" style={{ color: "var(--lf-muted)" }}>
              {section.themLabel}
            </span>
          </div>
          {/* mobile header chips */}
          <div className="flex items-center justify-center gap-3 border-b px-4 py-3 md:hidden" style={{ borderColor: "var(--lf-border)" }}>
            <span className="rounded-full px-3 py-1 text-[11px] font-bold" style={{ background: "var(--lf-accent-soft)", color: "var(--lf-accent)" }}>
              {section.usLabel}
            </span>
            <span className="text-[11px]" style={{ color: "var(--lf-muted)" }}>
              vs
            </span>
            <span className="rounded-full px-3 py-1 text-[11px] font-bold" style={{ background: "var(--lf-surface)", color: "var(--lf-muted)" }}>
              {section.themLabel}
            </span>
          </div>

          {rows.map((r, i) => (
            <Row key={`${r.feature}-${i}`} row={r} />
          ))}
        </div>
        {section.note ? (
          <p className={cn("mt-4 text-center text-xs")} style={{ color: "var(--lf-muted)" }}>
            {section.note}
          </p>
        ) : null}
      </div>
    </section>
  )
}
