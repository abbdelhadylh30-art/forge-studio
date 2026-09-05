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

/** Friendly wording for icon-style values (checklist style renders text). */
const VALUE_TEXT: Record<string, string> = {
  yes: "Included",
  true: "Included",
  no: "Not included",
  false: "Not included",
  partial: "Partial",
  sometimes: "Partial",
}
function valueText(v: string): string {
  return VALUE_TEXT[(v ?? "").trim().toLowerCase()] ?? (v ?? "")
}

export function Comparison({ section }: ComparisonProps) {
  const rows = section.rows ?? []
  const style = section.style ?? "table"

  // ── checklist — scannable rows with a check chip + inline them/us values ──
  if (style === "checklist") {
    return (
      <section className={SECTION_PAD}>
        <div className={CONTAINER}>
          <SectionHeader title={section.title} subtitle={section.subtitle} center />
          <div className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2">
            {rows.map((r, i) => (
              <div
                key={`${r.feature}-${i}`}
                className="flex items-start gap-3.5 rounded-xl border p-4"
                style={{ borderColor: "var(--lf-border)", background: "var(--lf-surface)" }}
              >
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: "var(--lf-accent-soft)", color: "var(--lf-accent)" }}
                >
                  <Check className="size-4" strokeWidth={2.5} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--lf-text)" }}>
                    {r.feature}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--lf-muted)" }}>
                    <span className="font-medium" style={{ color: "var(--lf-text)" }}>
                      {section.usLabel}:
                    </span>{" "}
                    <span className="font-semibold" style={{ color: "var(--lf-accent)" }}>
                      {valueText(r.us)}
                    </span>
                    <span className="mx-1.5 opacity-50">·</span>
                    <span className="font-medium" style={{ color: "var(--lf-text)" }}>
                      {section.themLabel}:
                    </span>{" "}
                    <span style={{ color: "var(--lf-muted)" }}>
                      {valueText(r.them)}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
          {section.note ? (
            <p className="mt-4 text-center text-xs" style={{ color: "var(--lf-muted)" }}>
              {section.note}
            </p>
          ) : null}
        </div>
      </section>
    )
  }

  // ── matrix — compact icon grid (them ✕ vs us ✓), no card chrome ──
  if (style === "matrix") {
    return (
      <section className={SECTION_PAD}>
        <div className={CONTAINER}>
          <SectionHeader title={section.title} subtitle={section.subtitle} center />
          <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border" style={{ borderColor: "var(--lf-border)" }}>
            {/* header row */}
            <div
              className="grid grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 px-4 py-3.5 md:px-5"
              style={{ background: "var(--lf-surface)", borderBottom: "1px solid var(--lf-border)" }}
            >
              <span className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--lf-muted)" }}>
                Feature
              </span>
              <span className="text-center text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--lf-muted)" }}>
                {section.themLabel}
              </span>
              <span className="text-center text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--lf-accent)" }}>
                {section.usLabel}
              </span>
            </div>
            {rows.map((r, i) => (
              <div
                key={`${r.feature}-${i}`}
                className="grid grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 px-4 py-3.5 md:px-5"
                style={{ borderTop: i > 0 ? "1px solid var(--lf-border)" : undefined, background: i % 2 === 1 ? "var(--lf-surface)" : "var(--lf-bg)" }}
              >
                <p className="text-sm font-medium" style={{ color: "var(--lf-text)" }}>
                  {r.feature}
                </p>
                <div className="flex justify-center">
                  <Cell value={r.them} />
                </div>
                <div className="flex justify-center rounded-lg py-1" style={{ background: "var(--lf-accent-soft)" }}>
                  <Cell value={r.us} strong />
                </div>
              </div>
            ))}
          </div>
          {section.note ? (
            <p className="mt-4 text-center text-xs" style={{ color: "var(--lf-muted)" }}>
              {section.note}
            </p>
          ) : null}
        </div>
      </section>
    )
  }

  // ── table — the classic bordered grid (default / legacy look) ──
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
