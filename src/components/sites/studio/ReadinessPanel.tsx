"use client"

import * as React from "react"
import { AlertTriangle, Check, CircleAlert, Gauge, Sparkles, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useForge } from "@/lib/landing/store"
import { useUi } from "@/lib/landing/uiStore"
import { auditConfig } from "@/lib/landing/readiness"
import type { ReadinessCheck, ReadinessLevel, ReadinessSuggestion } from "@/lib/landing/readiness"
import type { LandingConfig } from "@/lib/landing/types"
import { SECTION_META } from "@/lib/landing/types"

const GRADE_STYLES: Record<"A" | "B" | "C" | "D", { chip: string; ring: string; label: string }> = {
  A: { chip: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300", ring: "text-emerald-400", label: "Launch-ready" },
  B: { chip: "border-lime-500/40 bg-lime-500/10 text-lime-300", ring: "text-lime-400", label: "Almost there" },
  C: { chip: "border-amber-500/40 bg-amber-500/10 text-amber-300", ring: "text-amber-400", label: "Needs work" },
  D: { chip: "border-rose-500/40 bg-rose-500/10 text-rose-300", ring: "text-rose-400", label: "Early draft" },
}

function scoreColor(score: number) {
  if (score >= 90) return "#34d399"
  if (score >= 75) return "#a3e635"
  if (score >= 60) return "#fbbf24"
  return "#fb7185"
}

const LEVEL_ICON: Record<ReadinessLevel, typeof Check> = {
  pass: Check,
  warn: CircleAlert,
  fail: AlertTriangle,
}
const LEVEL_STYLE: Record<ReadinessLevel, string> = {
  pass: "border-emerald-500/20 bg-emerald-500/[0.06]",
  warn: "border-amber-500/20 bg-amber-500/[0.06]",
  fail: "border-rose-500/25 bg-rose-500/[0.07]",
}
const LEVEL_ICON_STYLE: Record<ReadinessLevel, string> = {
  pass: "text-emerald-400",
  warn: "text-amber-400",
  fail: "text-rose-400",
}

const CATEGORY_LABEL: Record<ReadinessCheck["category"], string> = {
  structure: "Page structure",
  seo: "SEO",
  conversion: "Conversion",
}

/** Score ring (SVG) — animated stroke + centered number/grade. */
function ScoreRing({ score, grade, size = 132 }: { score: number; grade: "A" | "B" | "C" | "D"; size?: number }) {
  const stroke = 9
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const [animated, setAnimated] = React.useState(0)

  React.useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 120)
    return () => clearTimeout(t)
  }, [score])

  return (
    <div className="relative" style={{ width: size, height: size }} role="img" aria-label={`Readiness score ${score} of 100, grade ${grade}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={scoreColor(score)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * animated) / 100}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)", filter: `drop-shadow(0 0 6px ${scoreColor(score)}55)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[26px] font-extrabold tabular-nums leading-none text-zinc-100">{animated}</span>
        <span className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-zinc-500">/ 100</span>
        <span className={cn("mt-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold", GRADE_STYLES[grade].chip)}>Grade {grade}</span>
      </div>
    </div>
  )
}

/** Toolbar chip — live score that opens the audit. */
export function ReadinessChip() {
  const config = useForge((s) => s.config)
  const openDialog = useUi((s) => s.openDialog)
  const report = React.useMemo(() => auditConfig(config), [config])

  return (
    <button
      type="button"
      onClick={() => openDialog("readiness")}
      title="Landing readiness score — click for the full audit"
      aria-label={`Landing readiness score ${report.score} of 100, grade ${report.grade}. Open audit.`}
      className={cn(
        "flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold transition-all hover:scale-[1.03] active:scale-95",
        GRADE_STYLES[report.grade].chip
      )}
    >
      <Gauge className="h-3.5 w-3.5" />
      <span className="tabular-nums">{report.score}</span>
      <span className="hidden sm:inline">{GRADE_STYLES[report.grade].label}</span>
    </button>
  )
}

/** Full audit dialog — checklist grouped by category, items link to sections. */
export function ReadinessDialog() {
  const dialog = useUi((s) => s.dialog)
  const closeDialog = useUi((s) => s.closeDialog)
  const open = dialog === "readiness"

  const config = useForge((s) => s.config)
  const selectSection = useForge((s) => s.selectSection)
  const report = React.useMemo(() => auditConfig(config), [config])

  const grouped = React.useMemo(() => {
    const order: ReadinessCheck["category"][] = ["structure", "seo", "conversion"]
    return order.map((cat) => ({ cat, items: report.checks.filter((c) => c.category === cat) }))
  }, [report])

  const onFix = (check: ReadinessCheck) => {
    if (!check.selectSectionId) return
    useUi.getState().setView("studio")
    useForge.getState().setPreviewMode(false)
    selectSection(check.selectSectionId)
    closeDialog()
    const sec = config.sections.find((s) => s.id === check.selectSectionId)
    if (sec) toast.info(`Editing ${SECTION_META[sec.type].label}`, { description: check.label })
  }

  const onSuggestion = (s: ReadinessSuggestion) => {
    if (!s.selectSectionId) return
    useUi.getState().setView("studio")
    useForge.getState().setPreviewMode(false)
    selectSection(s.selectSectionId)
    closeDialog()
    const sec = config.sections.find((x) => x.id === s.selectSectionId)
    if (sec) toast.info(`Editing ${SECTION_META[sec.type].label}`, { description: `${s.label} — enable “A/B test this section” in the properties panel.` })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeDialog()}>
      <DialogContent className="max-w-lg border-zinc-800 bg-zinc-900/95 p-0 backdrop-blur-xl sm:max-w-lg">
        <DialogHeader className="border-b border-zinc-800/60 p-5 pb-4 text-left">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="flex items-center gap-2 text-[15px] font-bold text-zinc-100">
                <Gauge className="h-4 w-4 text-violet-300" /> Landing readiness
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-[12px] text-zinc-500">
                Launch audit — structure, SEO and conversion essentials. Click a check to jump to the fix.
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={closeDialog}
              aria-label="Close audit"
              className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Score summary */}
          <div className="mt-4 flex items-center gap-5">
            <ScoreRing score={report.score} grade={report.grade} size={112} />
            <div className="flex-1 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-bold", GRADE_STYLES[report.grade].chip)}>
                  {GRADE_STYLES[report.grade].label}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { k: "pass", n: report.counts.pass, cls: "text-emerald-300", dot: "bg-emerald-400" },
                    { k: "warn", n: report.counts.warn, cls: "text-amber-300", dot: "bg-amber-400" },
                    { k: "fail", n: report.counts.fail, cls: "text-rose-300", dot: "bg-rose-400" },
                  ] as const
                ).map((x) => (
                  <div key={x.k} className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950/60 px-2 py-1.5">
                    <span className={cn("h-1.5 w-1.5 rounded-full", x.dot)} />
                    <span className="text-[11px] font-bold tabular-nums text-zinc-200">{x.n}</span>
                    <span className="text-[10px] text-zinc-500">{x.k === "pass" ? "ok" : x.k === "warn" ? "warn" : "fix"}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] leading-snug text-zinc-500">
                Weighted across {report.checks.length} checks. Warnings don&apos;t block launch — failures do.
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Checklist */}
        <div className="max-h-[46vh] space-y-5 overflow-y-auto p-5 lf-scroll">
          {grouped.map(({ cat, items }) => (
            <section key={cat} aria-label={CATEGORY_LABEL[cat]}>
              <div className="mb-2 flex items-center gap-2">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{CATEGORY_LABEL[cat]}</h4>
                <span className="h-px flex-1 bg-zinc-800/60" />
                <span className="text-[10px] text-zinc-600">
                  {items.filter((i) => i.level === "pass").length}/{items.length} ok
                </span>
              </div>
              <ul className="space-y-1.5">
                {items.map((check) => {
                  const Icon = LEVEL_ICON[check.level]
                  const fixable = Boolean(check.selectSectionId) && check.level !== "pass"
                  return (
                    <li key={check.id}>
                      <button
                        type="button"
                        onClick={() => onFix(check)}
                        disabled={!fixable}
                        className={cn(
                          "flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors",
                          LEVEL_STYLE[check.level],
                          fixable ? "cursor-pointer hover:border-violet-500/40 hover:bg-violet-500/[0.06]" : "cursor-default"
                        )}
                      >
                        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", LEVEL_ICON_STYLE[check.level])} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-zinc-200">
                            {check.label}
                            <span className="rounded bg-zinc-800/80 px-1 py-px text-[9px] font-medium text-zinc-500">{check.weight}pts</span>
                          </span>
                          <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">{check.detail}</span>
                        </span>
                        {fixable && <span className="mt-0.5 shrink-0 rounded bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-violet-300">Fix</span>}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}

          {/* Growth ideas — non-scoring experiment suggestions */}
          {report.suggestions.length > 0 && (
            <section aria-label="Growth ideas">
              <div className="mb-2 flex items-center gap-2">
                <h4 className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-violet-400">
                  <Sparkles className="h-3 w-3" /> Growth ideas
                </h4>
                <span className="h-px flex-1 bg-violet-500/20" />
                <span className="text-[10px] text-zinc-600">not scored</span>
              </div>
              <ul className="space-y-1.5">
                {report.suggestions.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => onSuggestion(s)}
                      className="group flex w-full items-start gap-2.5 rounded-lg border border-violet-500/20 bg-violet-500/[0.05] p-2.5 text-left transition-all hover:border-violet-500/45 hover:bg-violet-500/[0.09]"
                    >
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12px] font-semibold text-zinc-200">{s.label}</span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">{s.detail}</span>
                      </span>
                      <span className="mt-0.5 shrink-0 rounded bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-violet-300 opacity-0 transition-opacity group-hover:opacity-100">Try it</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
