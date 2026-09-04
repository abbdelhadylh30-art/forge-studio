"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { BarChart3, Crown, Download, Eye, Globe2, Layers, Loader2, Mail, Monitor, MonitorSmartphone, MousePointerClick, Pause, Play, Radio, RefreshCw, Smartphone, Sparkles, Tablet, Timer, TrendingDown, TrendingUp, Users, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useForge } from "@/lib/landing/store"
import { applyVariantPatch } from "@/lib/landing/ab"
import { SECTION_META } from "@/lib/landing/types"
import type { AbTestResult, AbVariantResult, AnalyticsPayload, LeadRecord, LiveVisit } from "@/lib/landing/types"
import { LeadDetailSheet, downloadLeadsCsv } from "./LeadDetailSheet"
import { useDashboardRelay, mergeLiveVisits, type RelayEvent } from "@/components/sites/shared/livesocket"

const ACCENT = "#A78BFA"
const ACCENT2 = "#f0abfc"
const GREEN = "#34d399"

function countryFlag(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return "🌐"
  return String.fromCodePoint(...[...code].map((c) => 127397 + c.charCodeAt(0)))
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k"
  return String(Math.round(n))
}

function fmtDuration(s: number): string {
  if (!s) return "0s"
  const m = Math.floor(s / 60)
  const sec = Math.round(s % 60)
  return m ? `${m}m ${sec}s` : `${sec}s`
}

function deviceIcon(d: string) {
  if (d === "mobile") return Smartphone
  if (d === "tablet") return Tablet
  if (d === "desktop") return Monitor
  return MonitorSmartphone
}

function fmtLiveTimer(s: number): string {
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return `${m}m ${String(s % 60).padStart(2, "0")}s`
}

function StatCard({ icon: Icon, label, value, delta, deltaUp, hint }: { icon: typeof Users; label: string; value: string; delta?: string; deltaUp?: boolean; hint?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 transition-all hover:-translate-y-0.5 hover:border-violet-500/30 hover:bg-zinc-900/70">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
        <Icon className="h-4 w-4 text-violet-300/70" />
      </div>
      <p className="mt-2 text-2xl font-extrabold tracking-tight text-zinc-50">{value}</p>
      {delta && (
        <p className={cn("mt-1 flex items-center gap-1 text-[11px]", deltaUp ? "text-emerald-400" : "text-rose-400")}>
          {deltaUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />} {delta}
        </p>
      )}
      {hint && <p className="mt-1 text-[10px] text-zinc-600">{hint}</p>}
    </div>
  )
}

function PanelCard({ title, icon: Icon, children, actions }: { title: string; icon: typeof Globe2; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-violet-300" />
        <h3 className="text-[13px] font-semibold text-zinc-100">{title}</h3>
        <div className="ml-auto">{actions}</div>
      </div>
      {children}
    </div>
  )
}

/** One active visit card — device, origin, variant, live-ticking timer. */
function ActiveVisitCard({ visit, since }: { visit: LiveVisit; since: number }) {
  const [, force] = React.useReducer((x: number) => x + 1, 0)
  React.useEffect(() => {
    const t = setInterval(force, 1000)
    return () => clearInterval(t)
  }, [])
  const elapsed = Math.floor((Date.now() - since) / 1000) + visit.durationSec
  const fresh = visit.durationSec < 15
  const DeviceIcon = deviceIcon(visit.device)
  return (
    <div
      className="group flex items-center gap-3 rounded-lg border border-emerald-500/15 bg-gradient-to-r from-emerald-500/[0.04] to-zinc-900/40 px-3 py-2.5 transition-colors hover:border-emerald-500/35"
      title={`${visit.device} · ${visit.browser} · ${visit.country} · from ${visit.referrer} — on the page for ${fmtLiveTimer(elapsed)}`}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg border",
          fresh ? "border-violet-500/40 bg-violet-500/10" : "border-zinc-700/80 bg-zinc-800/60"
        )}
        aria-hidden
      >
        <DeviceIcon className={cn("h-4 w-4", fresh ? "text-violet-300" : "text-zinc-300")} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-300">
          <span className="text-sm leading-none" aria-hidden>{countryFlag(visit.country)}</span>
          <span className="font-semibold">{visit.country}</span>
          <span className="text-zinc-600">·</span>
          <span className="truncate">{visit.browser}</span>
          {visit.variant && (
            <span className="rounded bg-violet-500/15 px-1 py-0.5 font-mono text-[9px] font-bold text-violet-300" title={`A/B variant ${visit.variant}`}>v{visit.variant}</span>
          )}
        </div>
        <p className="mt-0.5 truncate font-mono text-[10px] text-zinc-500">from {visit.referrer}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {fresh && (
          <span className="rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-300">new</span>
        )}
        <span className="flex items-center gap-1 font-mono text-[11px] tabular-nums text-emerald-300" aria-label={`On the page for ${fmtLiveTimer(elapsed)}`}>
          <span className="relative flex size-1.5" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
          </span>
          {fmtLiveTimer(elapsed)}
        </span>
      </div>
    </div>
  )
}

/** "Right now" live-visitors strip — active visits on the published page. */
function LiveVisitsPanel({ live, liveEnabled, slug, push }: { live: AnalyticsPayload["live"]; liveEnabled: boolean; slug: string; push: boolean }) {
  // snapshot time when the payload identity changes — timers tick locally from
  // the server-known duration, so they stay smooth between 5s polls
  const [since, setSince] = React.useState(() => Date.now())
  React.useEffect(() => {
    setSince(Date.now())
  }, [live])

  const active = live.active
  return (
    <div className="lf-fade-up rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="relative flex size-2" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
        </span>
        <h3 className="text-[13px] font-semibold text-zinc-100">Right now</h3>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums", active.length ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "bg-zinc-800 text-zinc-500")}>
          {active.length} {active.length === 1 ? "visitor" : "visitors"} on the page
        </span>
        {push ? (
          <span
            className="flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-300"
            title="Real-time push — presence & events stream over WebSocket the instant they happen"
          >
            <Zap className="h-2.5 w-2.5" /> push
          </span>
        ) : (
          <span
            className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500"
            title="Polling fallback — refreshing every few seconds over HTTP"
          >
            polling
          </span>
        )}
        <span className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-500 tabular-nums" title="Total visits in the last 5 minutes">
          {live.last5m} in last 5m
        </span>
        <button
          type="button"
          className="ml-auto flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-[10px] font-semibold text-zinc-400 transition-colors hover:border-emerald-500/40 hover:text-emerald-200"
          onClick={() => slug && window.open(`/p/${encodeURIComponent(slug)}`, "_blank", "noopener")}
          title="Open the published page — your own visit appears here within seconds"
        >
          <Globe2 className="h-3 w-3" /> Join live
        </button>
      </div>
      {!liveEnabled ? (
        <p className="py-3 text-center text-[11px] text-zinc-500">
          Live refresh is paused — resume it to track active visitors in real time.
        </p>
      ) : active.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 py-4 text-center">
          <Radio className="h-5 w-5 text-zinc-700" aria-hidden />
          <p className="text-[11px] text-zinc-500">No one is on the page right now.</p>
          <p className="text-[10px] text-zinc-600">Open “Join live” — your visit shows up here within seconds and its timer runs live.</p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((v) => (
            <ActiveVisitCard key={v.id} visit={v} since={since} />
          ))}
        </div>
      )}
    </div>
  )
}

const CHART_TOOLTIP = {
  contentStyle: {
    background: "#18181b",
    border: "1px solid #3f3f46",
    borderRadius: "8px",
    fontSize: "11px",
    color: "#e4e4e7",
  },
  labelStyle: { color: "#a1a1aa" },
} as const

// ── Live events ticker (fed by the WebSocket relay) ─────────────────────────

export interface TickerItem {
  id: string
  type: string
  label: string
  variant: string | null
  at: number // epoch ms
}

function tickerIcon(type: string) {
  switch (type) {
    case "cta_click":
      return { icon: MousePointerClick, cls: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30" }
    case "form_submit":
      return { icon: Mail, cls: "text-fuchsia-300 bg-fuchsia-500/10 border-fuchsia-500/30" }
    case "variant_exposure":
      return { icon: Sparkles, cls: "text-violet-300 bg-violet-500/10 border-violet-500/30" }
    case "pageview":
      return { icon: Users, cls: "text-sky-300 bg-sky-500/10 border-sky-500/30" }
    default:
      return { icon: Radio, cls: "text-zinc-300 bg-zinc-800/60 border-zinc-700" }
  }
}

function relTime(at: number): string {
  const s = Math.max(0, Math.floor((Date.now() - at) / 1000))
  if (s < 5) return "just now"
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m / 60)}h ago`
}

/** "Latest activity" strip — the last few events, pushed live over the relay.
 *  Rows relating to an A/B test click through to that test's tab.
 *  Pause freezes the strip (new events buffer behind a "+N new" chip);
 *  CSV export snapshots what is on screen. */
function LiveEventsPanel({
  items,
  push,
  onJumpToTest,
  slug,
}: {
  items: TickerItem[]
  push: boolean
  onJumpToTest?: (testKey: string) => void
  slug?: string
}) {
  const [, force] = React.useReducer((x: number) => x + 1, 0)
  React.useEffect(() => {
    const t = setInterval(force, 5000) // relative timestamps drift slowly
    return () => clearInterval(t)
  }, [])

  // ── pause: freeze rows at the pause moment (pure derivation, no refs) ────
  // events with at <= pausedAt are the frozen view; newer ones count behind
  // the "+N new — resume" chip until the stream resumes.
  const [pausedAt, setPausedAt] = React.useState<number | null>(null)
  const paused = pausedAt !== null
  const shown = paused ? items.filter((i) => i.at <= pausedAt!).slice(0, 8) : items.slice(0, 8)
  const newCount = paused ? items.filter((i) => i.at > pausedAt!).length : 0

  const exportCsv = () => {
    const rows = [
      ["time_iso", "time_local", "type", "label", "variant"],
      ...shown.map((ev) => [
        new Date(ev.at).toISOString(),
        new Date(ev.at).toLocaleTimeString(),
        ev.type,
        ev.label,
        ev.variant ?? "",
      ]),
    ]
    const csv = rows.map((r) => r.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `landing-forge-live-events-${slug ?? "project"}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Live activity exported", { description: `${shown.length} events → CSV` })
  }

  return (
    <div className="lf-fade-up rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4">
      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-zinc-100">
          <Radio className={cn("h-4 w-4", push && !paused ? "text-violet-300" : "text-zinc-500")} /> Latest activity
        </h3>
        {push && !paused && (
          <span
            className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-300"
            title="Events stream over WebSocket the instant they happen"
          >
            live
          </span>
        )}
        {paused && newCount > 0 && (
          <button
            type="button"
            onClick={() => setPausedAt(null)}
            className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300 transition-colors hover:bg-amber-500/20"
            title="New events arrived while paused — resume to see them"
          >
            +{newCount} new — resume
          </button>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="hidden text-[10px] text-zinc-600 sm:inline">CTA clicks · form submits · exposures · visits</span>
          <button
            type="button"
            onClick={() => setPausedAt((p) => (p === null ? Date.now() : null))}
            aria-pressed={paused}
            title={paused ? "Resume the live stream" : "Pause the live stream to read without rows jumping"}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900/60 text-zinc-400 transition-colors hover:border-violet-500/50 hover:text-violet-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500/50"
          >
            {paused ? <Play className="h-3 w-3" aria-hidden /> : <Pause className="h-3 w-3" aria-hidden />}
            <span className="sr-only">{paused ? "Resume live activity" : "Pause live activity"}</span>
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={shown.length === 0}
            title="Export the visible activity strip as CSV"
            className="flex h-6 w-6 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900/60 text-zinc-400 transition-colors hover:border-violet-500/50 hover:text-violet-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500/50 disabled:opacity-40 disabled:hover:border-zinc-700 disabled:hover:text-zinc-400"
          >
            <Download className="h-3 w-3" aria-hidden />
            <span className="sr-only">Export live activity as CSV</span>
          </button>
        </div>
      </div>
      {shown.length === 0 ? (
        <p className="py-2.5 text-center text-[11px] text-zinc-500">
          Nothing yet — open the published page (“Join live”) and click around: events appear here the instant they happen.
        </p>
      ) : (
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {shown.map((ev) => {
            const { icon: Icon, cls } = tickerIcon(ev.type)
            const testKey = ev.type === "variant_exposure" ? ev.label : ev.type === "cta_click" ? ev.label.split(":")[0] : null
            const clickable = testKey !== null
            return (
              <li
                key={ev.id}
                role={clickable && onJumpToTest ? "button" : undefined}
                tabIndex={clickable && onJumpToTest ? 0 : undefined}
                aria-label={clickable && onJumpToTest ? `View the ${ev.label.split(":")[0]} A/B test results` : undefined}
                onClick={() => clickable && onJumpToTest?.(testKey!)}
                onKeyDown={(e) => {
                  if (clickable && onJumpToTest && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault()
                    onJumpToTest(testKey!)
                  }
                }}
                className={cn(
                  "lf-ticker-in flex items-center gap-2.5 rounded-lg border border-zinc-800/70 bg-zinc-900/50 px-2.5 py-1.5 transition-all",
                  clickable && onJumpToTest && "cursor-pointer hover:border-violet-500/40 hover:bg-violet-500/[0.06] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500/50"
                )}
                title={`${ev.type}${ev.variant ? ` · variant ${ev.variant}` : ""} · ${new Date(ev.at).toLocaleTimeString()}${clickable && onJumpToTest ? " — click to view its A/B test" : ""}`}
              >
                <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-md border", cls)} aria-hidden>
                  <Icon className="h-3 w-3" />
                </span>
                <span className="min-w-0 flex-1 truncate text-[11px] text-zinc-300">
                  {ev.type === "cta_click" ? "CTA click" : ev.type === "form_submit" ? "Form submit" : ev.type === "variant_exposure" ? "Variant exposure" : ev.type === "pageview" ? "Pageview" : ev.type}
                  <span className="text-zinc-500"> · {ev.label}</span>
                  {ev.variant && <span className="ml-1 rounded bg-violet-500/15 px-1 py-0.5 font-mono text-[9px] font-bold text-violet-300">v{ev.variant}</span>}
                </span>
                {clickable && onJumpToTest && <TrendingUp className="h-3 w-3 shrink-0 text-violet-400/60" aria-hidden />}
                <span className="shrink-0 font-mono text-[10px] tabular-nums text-zinc-500">{relTime(ev.at)}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ── A/B tests card (multi-test: hero + section-level) ───────────────────────

function AbVariantRow({ v, isWinner, showEngagement, isEngLeader }: { v: AbVariantResult; isWinner: boolean; showEngagement: boolean; isEngLeader: boolean }) {
  return (
    <div className={cn("rounded-lg border p-3 transition-colors", isWinner ? "border-amber-500/40 bg-amber-500/[0.04]" : "border-zinc-800 bg-zinc-900/50")}>
      <div className="flex items-center gap-2">
        <span className={cn("flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold", isWinner ? "bg-amber-400 text-black" : "bg-violet-500/20 text-violet-200")}>{v.name}</span>
        <span className="min-w-0 flex-1 truncate text-[12px] text-zinc-300" title={v.headline}>{v.headline}</span>
        <span className="font-mono text-[10px] text-zinc-500" title="Traffic weight">w {v.weight}%</span>
      </div>
      {/* CTR row */}
      <div className="mt-2 flex items-center gap-2" title={`Clicks ${v.clicks} of ${v.exposures} exposures`}>
        <MousePointerClick className="h-3 w-3 shrink-0 text-zinc-500" aria-hidden />
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300" style={{ width: `${Math.round(v.ctr * 100)}%` }} />
        </div>
        <span className="w-24 text-right font-mono text-[10px] text-zinc-400">
          CTR {(v.ctr * 100).toFixed(1)}% · {v.clicks}/{v.exposures}
        </span>
      </div>
      {/* Section reads row — variant-tagged section_view events (per-variant
          read counts + reach); hidden for the hero (the pageview is its read) */}
      {v.sectionReads > 0 && (
        <div
          className="mt-1.5 flex items-center gap-2"
          title={`Variant-tagged reads: ${fmtNum(v.sectionReads)}${v.exposures > 0 ? ` · ${Math.round((v.sectionReads / v.exposures) * 100)}% of exposed visitors actually read this section` : ""}`}
        >
          <Eye className="h-3 w-3 shrink-0 text-zinc-500" aria-hidden />
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-300"
              style={{ width: `${v.exposures > 0 ? Math.round((v.sectionReads / v.exposures) * 100) : 0}%` }}
            />
          </div>
          <span className="w-24 text-right font-mono text-[10px] text-zinc-400">
            Reads {fmtNum(v.sectionReads)}{v.exposures > 0 ? ` · ${Math.round((v.sectionReads / v.exposures) * 100)}%` : ""}
          </span>
        </div>
      )}
      {/* Engagement row — avg duration + engaged share, per-variant (PageView.variantMap) */}
      {showEngagement ? (
        <div className="mt-1.5 flex items-center gap-2" title={`Variant-tagged visits: avg ${fmtDuration(v.avgDuration)} on page · ${Math.round(v.engagedPct * 100)}% engaged`}>
          <Timer className="h-3 w-3 shrink-0 text-zinc-500" aria-hidden />
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400" style={{ width: `${Math.round(v.engagedPct * 100)}%` }} />
          </div>
          <span className="flex w-24 items-center justify-end gap-1 font-mono text-[10px] text-zinc-400">
            {isEngLeader && <Crown className="h-2.5 w-2.5 text-amber-400" aria-label="Holds attention best" />}
            {fmtDuration(v.avgDuration)} · {Math.round(v.engagedPct * 100)}%
          </span>
        </div>
      ) : (
        <p className="mt-1.5 text-right font-mono text-[9px] text-zinc-600" title="Per-variant time-on-page appears once variant-tagged visits exist (new data records every test assignment)">
          awaiting per-variant visits
        </p>
      )}
    </div>
  )
}

function AbTestPanel({ test, onPromote }: { test: AbTestResult; onPromote: (t: AbTestResult) => void }) {
  const withEngagement = test.variants.filter((x) => x.exposures > 0 && (x.avgDuration > 0 || x.engagedPct > 0))
  const engLeader = withEngagement.length >= 2 ? withEngagement.reduce((best, x) => (x.avgDuration > best.avgDuration ? x : best)) : null
  // progress toward the auto-winner decision threshold
  const samplePct = Math.min(100, Math.round((test.totalExposures / Math.max(1, test.sampleSize)) * 100))
  const sampleReached = test.totalExposures >= test.sampleSize
  return (
    <div className="space-y-3">
      {test.winner && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
          <Crown className="h-3.5 w-3.5" />
          Variant <b>{test.winner}</b> is winning (sample {fmtNum(test.totalExposures)} / {fmtNum(test.sampleSize)} reached) — auto-winner {test.autoWinner ? "ON" : "OFF"}
        </div>
      )}
      {/* Sample progress — headroom before the auto-winner decision */}
      {!test.winner && (
        <div
          className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2"
          title={`${fmtNum(test.totalExposures)} of ${fmtNum(test.sampleSize)} exposures — ${test.autoWinner ? "the winner auto-promotes at this threshold" : "auto-winner is off; promote manually anytime"}`}
        >
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-semibold text-zinc-400">
              {sampleReached ? "Sample reached — winner armed" : `Sample progress · ${samplePct}%`}
            </span>
            <span className="font-mono tabular-nums text-zinc-500">
              {fmtNum(test.totalExposures)} / {fmtNum(test.sampleSize)}
            </span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-zinc-800">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                sampleReached ? "bg-gradient-to-r from-amber-400 to-amber-300" : "bg-gradient-to-r from-violet-500 to-fuchsia-500"
              )}
              style={{ width: `${Math.max(2, samplePct)}%` }}
            />
          </div>
        </div>
      )}
      {!test.hasData && (
        <p className="text-[11px] text-zinc-500">
          No exposures recorded yet — use “Test preview” with a variant selected, or simulate traffic.
        </p>
      )}
      {test.variants.map((v) => (
        <AbVariantRow
          key={v.name}
          v={v}
          isWinner={v.name === test.winner}
          showEngagement={test.hasEngagement}
          isEngLeader={engLeader !== null && v.name === engLeader.name && v.avgDuration > 0}
        />
      ))}
      {test.winner && (
        <Button size="sm" className="h-7 w-full gap-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-[11px] text-white hover:from-violet-600 hover:to-fuchsia-600 lf-glow" onClick={() => onPromote(test)}>
          <Crown className="h-3 w-3" /> Promote {test.winner} — apply its copy to this {test.sectionLabel.toLowerCase()}
        </Button>
      )}
    </div>
  )
}

export function DashboardView() {
  const projectId = useForge((s) => s.project.id)
  const projectName = useForge((s) => s.project.name)
  const slug = useForge((s) => s.project.slug)
  const updateSection = useForge((s) => s.updateSection)
  const sections = useForge((s) => s.config.sections)

  const [data, setData] = React.useState<AnalyticsPayload | null>(null)
  const [leads, setLeads] = React.useState<LeadRecord[]>([])
  const [selectedLead, setSelectedLead] = React.useState<LeadRecord | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [seeding, setSeeding] = React.useState(false)
  const [days, setDays] = React.useState("30")
  // live refresh: poll while enabled + tab visible; only re-render on change
  const [live, setLive] = React.useState(true)
  const [lastRefresh, setLastRefresh] = React.useState<number | null>(null)
  const [hasNew, setHasNew] = React.useState(false)

  // ── real-time push relay (WebSocket) — presence + instant event signals.
  // Falls back silently to REST polling whenever the relay is unreachable.
  const relay = useDashboardRelay(projectId, live)
  const pushConnected = live && relay.connected

  // ── Live events ticker: relay pushes land instantly; REST recentEvents
  // backfill the list on load (deduped by type+label+variant within 5s).
  // section_view is excluded from the strip (high volume, low conversion
  // signal — it feeds the Section performance panel instead).
  const [ticker, setTicker] = React.useState<TickerItem[]>([])
  React.useEffect(() => {
    if (!relay.lastEvent || relay.lastEvent.type === "section_view") return
    const ev: TickerItem = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: relay.lastEvent.type,
      label: relay.lastEvent.label,
      variant: relay.lastEvent.variant,
      at: relay.lastEvent.at,
    }
    setTicker((prev) => [ev, ...prev.filter((x) => x.id !== ev.id)].slice(0, 12))
  }, [relay.lastEvent])
  React.useEffect(() => {
    if (!data?.recentEvents?.length) return
    setTicker((prev) => {
      const rest = data.recentEvents.map((e) => ({
        id: `rest-${e.id}`,
        type: e.type,
        label: e.label,
        variant: e.variant,
        at: new Date(e.createdAt).getTime(),
      }))
      // keep relay items that are NOT already covered by a REST row
      const relayOnly = prev.filter(
        (p) => !p.id.startsWith("rest-") && !rest.some((r) => r.type === p.type && r.label === p.label && r.variant === p.variant && Math.abs(r.at - p.at) < 5000)
      )
      return [...relayOnly, ...rest].sort((a, b) => b.at - a.at).slice(0, 12)
    })
  }, [data])

  // active A/B test tab (defaults to the primary test)
  const [abTab, setAbTab] = React.useState<string | null>(null)

  // ticker row → relevant A/B test tab: match by section id, section type,
  // or the legacy "hero" label (primary test)
  const jumpToAbTest = React.useCallback(
    (key: string) => {
      const tests = data?.abTests ?? []
      const hit = tests.find((t) => t.key === key) ?? tests.find((t) => t.sectionType === key) ?? (key === "hero" ? tests[0] : undefined)
      if (hit) {
        setAbTab(hit.key)
        document.getElementById("ab-tests-card")?.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    },
    [data]
  )

  const load = React.useCallback(
    async (opts?: { quiet?: boolean }) => {
      if (!projectId) return
      if (!opts?.quiet) setLoading(true)
      try {
        const res = await fetch(`/api/analytics?projectId=${projectId}&days=${days}`)
        const payload = (await res.json()) as AnalyticsPayload
        setData((prev) => {
          if (prev && JSON.stringify(prev) === JSON.stringify(payload)) return prev
          if (prev && opts?.quiet) setHasNew(true)
          return payload
        })
      } catch {
        if (!opts?.quiet) toast.error("Could not load analytics")
      } finally {
        if (!opts?.quiet) setLoading(false)
        if (opts?.quiet) setLastRefresh(Date.now())
      }
      try {
        const res = await fetch(`/api/leads?projectId=${projectId}&take=50`)
        const out = (await res.json()) as { leads?: LeadRecord[] }
        setLeads((prev) => (prev && JSON.stringify(prev) === JSON.stringify(out.leads ?? []) ? prev : (out.leads ?? [])))
      } catch {
        /* leads inbox is best-effort */
      }
    },
    [projectId, days]
  )

  React.useEffect(() => {
    void load()
  }, [load])

  // ── Live polling: REST backstop while enabled + tab visible.
  // While the push relay is connected we poll slowly (20s consistency check);
  // without it we fall back to the original 5s cadence. Payloads are diffed —
  // unchanged data never re-renders the charts.
  React.useEffect(() => {
    if (!live || !projectId) return
    const t = setInterval(() => {
      if (!document.hidden) void load({ quiet: true })
    }, pushConnected ? 20_000 : 5_000)
    return () => clearInterval(t)
  }, [live, projectId, load, pushConnected])

  // ── Push-driven refresh: relay signals (new visit / CTA click / form submit)
  // trigger a quiet reload within ~1.2s — charts catch up without waiting for
  // the polling backstop. Debounced so bursts collapse into one fetch.
  React.useEffect(() => {
    if (!relay.signals || !live) return
    const t = setTimeout(() => {
      if (!document.hidden) void load({ quiet: true })
    }, 1200)
    return () => clearTimeout(t)
  }, [relay.signals, live, load])

  const seed = async (mode: "replace" | "append" = "replace") => {
    if (!projectId) return
    setSeeding(true)
    try {
      const res = await fetch("/api/analytics/seed", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId, days: Number(days), mode }),
      })
      const out = (await res.json()) as { pageviews?: number; events?: number; leads?: number; mode?: string; error?: string }
      if (!res.ok) throw new Error(out.error)
      toast.success(mode === "append" ? "Demo traffic appended 🌍" : "Demo traffic generated 🌍", {
        description: `+${fmtNum(out.pageviews ?? 0)} pageviews · +${fmtNum(out.events ?? 0)} events${mode === "append" ? " — history kept" : ` · ${out.leads ?? 0} leads`}`,
      })
      await load()
    } catch (e) {
      toast.error("Seeding failed", { description: e instanceof Error ? e.message : undefined })
    } finally {
      setSeeding(false)
    }
  }

  // clear the "new data" hint once the user has seen it (any interaction)
  React.useEffect(() => {
    if (!hasNew) return
    const t = setTimeout(() => setHasNew(false), 6000)
    return () => clearTimeout(t)
  }, [hasNew])

  const promoteWinner = async (test: AbTestResult) => {
    if (!test.winner) return
    const section = sections.find((s) => s.id === test.sectionId)
    if (!section) return
    const patch = applyVariantPatch(section, test.winner)
    if (!patch) return
    updateSection(section.id, patch)
    if (projectId) {
      // persist the promoted config so analytics & reloads agree (await before refetch)
      const updated = useForge.getState().config
      try {
        await fetch(`/api/sites/${projectId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: useForge.getState().project.name, config: updated }),
        })
      } catch {
        /* keep local update even if persist fails */
      }
      void fetch("/api/analytics/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId, type: "promote_winner", label: `Promoted ${test.sectionLabel} variant ${test.winner}`, variant: test.winner }),
      })
    }
    toast.success(`Variant ${test.winner} promoted 👑`, { description: `Winning copy applied to the ${test.sectionLabel.toLowerCase()} section; test paused.` })
    await load()
  }

  const mergedLive = React.useMemo(() => {
    const base = data?.live
    if (!base) return null
    // when the push relay is connected, its presence + leave-decisions are
    // strictly fresher than the REST poll — let them win
    const left = relay.connected ? relay.leftIds : undefined
    return { ...base, active: mergeLiveVisits(base.active, relay.visits, left) }
  }, [data, relay.visits, relay.connected, relay.leftIds])

  if (loading && !data) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-zinc-500">
          <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
          <p className="text-[12px]">Loading analytics…</p>
        </div>
      </div>
    )
  }

  const stats = data?.stats
  const hasData = (stats?.pageviews ?? 0) > 0
  const funnelMax = Math.max(1, ...(data?.funnel.map((f) => f.count) ?? [1]))
  // visible (non-hidden) sections in the current config — context for the
  // Section performance panel's "tracked" badge
  const visibleSectionCount = sections.filter((s) => !s.hidden).length
  // section display label → type: links Section performance rows to the
  // A/B test that runs on that section (if any)
  const typeByLabel = new Map(
    sections.filter((s) => !s.hidden).map((s) => [SECTION_META[s.type].label, s.type] as const),
  )
  const abTests = data?.abTests ?? []

  return (
    <div className="lf-scroll min-h-0 flex-1 overflow-y-auto bg-zinc-950">
      <div className="mx-auto max-w-6xl space-y-4 p-4 pb-16 sm:p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-50">
              <BarChart3 className="h-5 w-5 text-violet-300" /> Analytics — {projectName}
            </h2>
            <p className="text-[11px] text-zinc-500">
              Privacy-friendly · no cookies · GDPR-safe · <span className="font-mono">/{slug}/dashboard</span>
            </p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {/* Live auto-refresh toggle — push relay w/ REST polling backstop */}
            <button
              type="button"
              role="switch"
              aria-checked={live}
              onClick={() => setLive((v) => !v)}
              title={
                live
                  ? pushConnected
                    ? "Live push connected — visits & events stream over WebSocket instantly"
                    : `Live refresh on (polling) — new published-page visits appear automatically${lastRefresh ? ` (last check ${Math.max(0, Math.round((Date.now() - lastRefresh) / 1000))}s ago)` : ""}`
                  : "Live refresh paused — click to resume auto-updating"
              }
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold transition-colors",
                live
                  ? pushConnected
                    ? "border-violet-500/40 bg-violet-500/10 text-violet-200 hover:bg-violet-500/15"
                    : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15"
                  : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-zinc-300"
              )}
            >
              {live ? (
                pushConnected ? (
                  <Zap className="h-3 w-3" />
                ) : (
                  <span className="relative flex size-2" aria-hidden>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                  </span>
                )
              ) : (
                <Pause className="h-3 w-3" />
              )}
              {live ? (pushConnected ? "Live push" : "Live") : "Paused"}
              {live && hasNew && <span className="h-1.5 w-1.5 rounded-full bg-violet-400" title="New data just arrived" aria-label="New data arrived" />}
            </button>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="h-8 w-24 border-zinc-800 bg-zinc-900 text-[12px] text-zinc-200" aria-label="Date range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
                <SelectItem value="7" className="text-[12px] focus:bg-violet-500/20">Last 7 days</SelectItem>
                <SelectItem value="30" className="text-[12px] focus:bg-violet-500/20">Last 30 days</SelectItem>
                <SelectItem value="90" className="text-[12px] focus:bg-violet-500/20">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-zinc-800 bg-zinc-900 text-[11px] text-zinc-200 hover:border-emerald-500/50 hover:text-emerald-200"
              onClick={() => slug && window.open(`/p/${encodeURIComponent(slug)}`, "_blank", "noopener")}
              title="Open the published page — pageviews, CTA clicks and form submits there flow into this dashboard"
            >
              <Globe2 className="h-3 w-3 text-emerald-300" /> View live page
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 border-zinc-800 bg-zinc-900 text-[11px] text-zinc-200 hover:border-violet-500/50" disabled={seeding}>
                  {seeding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3 text-amber-300" />} Simulate traffic
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border-zinc-800 bg-zinc-900 text-zinc-100">
                <DropdownMenuItem className="gap-2 text-[11px] focus:bg-violet-500/20" onClick={() => void seed("replace")} disabled={seeding}>
                  <RefreshCw className="h-3 w-3" /> Fresh dataset <span className="ml-auto text-[9px] text-zinc-500">wipes history</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 text-[11px] focus:bg-violet-500/20" onClick={() => void seed("append")} disabled={seeding}>
                  <Play className="h-3 w-3" /> Append {days}d <span className="ml-auto text-[9px] text-zinc-500">keeps history</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 border-zinc-800 bg-zinc-900 text-[11px] text-zinc-200 hover:border-violet-500/50"
              onClick={() => projectId && window.open(`/api/analytics/export?projectId=${projectId}`, "_blank")}
              disabled={!hasData}
            >
              <Download className="h-3 w-3" /> Export CSV
            </Button>
          </div>
        </div>

        {!hasData ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-zinc-800 py-20 text-center">
            <Globe2 className="h-10 w-10 text-zinc-700" />
            <div>
              <p className="text-[15px] font-semibold text-zinc-200">No traffic yet</p>
              <p className="mt-1 max-w-sm text-[12px] text-zinc-500">
                Use “Test preview” in the Studio to record real pageviews & CTA clicks, or generate a realistic 30-day demo dataset.
              </p>
            </div>
            <Button size="sm" className="gap-1.5 bg-violet-500 text-white hover:bg-violet-600" onClick={() => void seed("replace")} disabled={seeding}>
              {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />} Generate demo traffic
            </Button>
          </div>
        ) : (
          <>
            {/* Live "right now" strip — active visits, ticking timers */}
            <LiveVisitsPanel live={mergedLive ?? data!.live} liveEnabled={live} slug={slug} push={pushConnected} />

            {/* Live events ticker — relay-pushed activity stream; rows jump to their A/B test */}
            <LiveEventsPanel items={ticker} push={pushConnected} onJumpToTest={jumpToAbTest} slug={slug} />

            {/* Stat cards */}
            <div className="lf-fade-up-stagger grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <div style={{ animationDelay: "0ms" }}>
                <StatCard icon={BarChart3} label="Pageviews" value={fmtNum(stats!.pageviews)} />
              </div>
              <div style={{ animationDelay: "60ms" }}>
                <StatCard icon={Users} label="Unique visitors" value={fmtNum(stats!.uniqueVisitors)} />
              </div>
              <div style={{ animationDelay: "120ms" }}>
                <StatCard icon={TrendingDown} label="Bounce rate" value={`${Math.round(stats!.bounceRate * 100)}%`} />
              </div>
              <div style={{ animationDelay: "180ms" }}>
                <StatCard icon={Timer} label="Avg. duration" value={fmtDuration(stats!.avgDuration)} />
              </div>
              <div style={{ animationDelay: "240ms" }}>
                <StatCard icon={MousePointerClick} label="CTA clicks" value={fmtNum(stats!.ctaClicks)} />
              </div>
              <div style={{ animationDelay: "300ms" }}>
                <StatCard icon={Sparkles} label="Conversion" value={`${(stats!.conversionRate * 100).toFixed(1)}%`} hint="clicks / pageviews" />
              </div>
            </div>

            {/* Traffic chart */}
            <div className="lf-fade-up" style={{ animationDelay: "340ms" }}>
              <PanelCard title={`Traffic — last ${days} days`} icon={BarChart3}>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data!.timeseries} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                      <defs>
                        <linearGradient id="lfViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={ACCENT} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={ACCENT} stopOpacity={0.02} />
                        </linearGradient>
                        <linearGradient id="lfClicks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={GREEN} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={GREEN} stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "#71717a", fontSize: 10 }}
                        tickFormatter={(d: string) => d.slice(5)}
                        axisLine={{ stroke: "#3f3f46" }}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip {...CHART_TOOLTIP} />
                      <Area type="monotone" dataKey="views" name="Pageviews" stroke={ACCENT} strokeWidth={2} fill="url(#lfViews)" />
                      <Area type="monotone" dataKey="clicks" name="CTA clicks" stroke={GREEN} strokeWidth={2} fill="url(#lfClicks)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </PanelCard>
            </div>

            <div className="lf-fade-up-stagger grid gap-4 lg:grid-cols-3">
              {/* Devices */}
              <div style={{ animationDelay: "380ms" }}>
                <PanelCard title="Devices" icon={MonitorSmartphone}>
                  <div className="flex h-44 items-center">
                    <div className="h-full w-1/2">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={data!.devices} dataKey="count" nameKey="name" innerRadius={38} outerRadius={58} paddingAngle={3} strokeWidth={0}>
                            {data!.devices.map((_, i) => (
                              <Cell key={i} fill={[ACCENT, ACCENT2, "#86198f"][i % 3]} />
                            ))}
                          </Pie>
                          <Tooltip {...CHART_TOOLTIP} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <ul className="w-1/2 space-y-1.5">
                      {data!.devices.map((d, i) => (
                        <li key={d.name} className="flex items-center gap-2 text-[12px] text-zinc-300">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: [ACCENT, ACCENT2, "#86198f"][i % 3] }} />
                          <span className="flex-1 capitalize">{d.name}</span>
                          <span className="font-mono text-zinc-500">{Math.round((d.count / Math.max(1, stats!.pageviews)) * 100)}%</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </PanelCard>
              </div>

              {/* Visitor countries */}
              <div style={{ animationDelay: "440ms" }}>
                <PanelCard title="Visitor map" icon={Globe2}>
                  <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {data!.countries.slice(0, 8).map((c) => {
                      const pct = (c.count / Math.max(1, stats!.pageviews)) * 100
                      return (
                        <li key={c.name} className="flex items-center gap-2">
                          <span className="w-6 text-center text-base leading-none">{countryFlag(c.name)}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-zinc-300">{c.name}</span>
                              <span className="font-mono text-zinc-500">{fmtNum(c.count)}</span>
                            </div>
                            <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
                              <div className="h-full rounded-full bg-violet-400/70" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </PanelCard>
              </div>

              {/* Referrers */}
              <div style={{ animationDelay: "500ms" }}>
                <PanelCard title="Top referrers" icon={Globe2}>
                  <ul className="space-y-1.5">
                    {data!.referrers.slice(0, 7).map((r) => {
                      const pct = (r.count / Math.max(1, stats!.pageviews)) * 100
                      return (
                        <li key={r.name} className="flex items-center gap-2">
                          <span className="w-28 truncate font-mono text-[11px] text-zinc-400">{r.name}</span>
                          <div className="h-4 flex-1 overflow-hidden rounded bg-zinc-800">
                            <div className="flex h-full items-center justify-end rounded bg-gradient-to-r from-violet-500/40 to-fuchsia-500/60 pr-1.5" style={{ width: `${Math.max(12, pct)}%` }}>
                              <span className="text-[9px] font-semibold text-white/90">{fmtNum(r.count)}</span>
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </PanelCard>
              </div>
            </div>

            <div className="lf-fade-up-stagger grid gap-4 lg:grid-cols-2">
              {/* Funnel */}
              <div style={{ animationDelay: "560ms" }}>
                <PanelCard title="Conversion funnel" icon={MousePointerClick}>
                  <ul className="space-y-3">
                    {data!.funnel.map((f, i) => (
                      <li key={f.label}>
                        <div className="mb-1 flex justify-between text-[11px]">
                          <span className="text-zinc-300" title={i === 1 ? "Counts each section interaction — can exceed pageviews by design" : undefined}>
                            {i + 1}. {f.label}
                            {i === 1 && <span className="ml-1 text-[9px] text-zinc-600">(interactions)</span>}
                          </span>
                          <span className="font-mono text-zinc-400">
                            {fmtNum(f.count)} · {Math.round((f.count / funnelMax) * 100)}%
                          </span>
                        </div>
                        <div className="h-6 overflow-hidden rounded-md bg-zinc-800/60">
                          <div
                            className="flex h-full items-center rounded-md bg-gradient-to-r from-violet-500 to-fuchsia-500/80 px-2 transition-all"
                            style={{ width: `${Math.max(3, (f.count / funnelMax) * 100)}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </PanelCard>
              </div>

              {/* A/B tests — section-level (hero + any section with a test) */}
              <div id="ab-tests-card" style={{ animationDelay: "620ms" }}>
                <PanelCard
                  title={abTests.length > 1 ? `A/B tests — ${abTests.length} live` : abTests.length === 1 ? `A/B test — ${abTests[0].sectionLabel.toLowerCase()}` : "A/B tests"}
                  icon={Sparkles}
                >
                  {abTests.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-center">
                      <Sparkles className="h-6 w-6 text-zinc-700" />
                      <p className="text-[12px] text-zinc-500">No A/B tests running.</p>
                      <p className="max-w-xs text-[10px] leading-relaxed text-zinc-600">
                        Enable “A/B test this section” on the hero, pricing, features, testimonials, FAQ, contact or final CTA (Studio → Section tab) — each section runs its own experiment with per-variant CTR.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {abTests.length > 1 && (
                        <div className="flex flex-wrap gap-1 rounded-lg border border-zinc-800 bg-zinc-950/60 p-1" role="tablist" aria-label="A/B tests">
                          {abTests.map((t) => {
                            const active = (abTab ?? abTests[0].key) === t.key
                            return (
                              <button
                                key={t.key}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => setAbTab(t.key)}
                                className={cn(
                                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors",
                                  active ? "bg-violet-500/25 text-violet-200" : "text-zinc-500 hover:text-zinc-200"
                                )}
                              >
                                {t.sectionLabel}
                                {t.primary && <span className="rounded bg-violet-500/20 px-1 text-[8px] font-bold uppercase tracking-wide text-violet-300" title="Primary test — the page-level experiment (also tags the pageview itself)">page</span>}
                                {t.winner && <Crown className="h-2.5 w-2.5 text-amber-400" aria-label="winner" />}
                              </button>
                            )
                          })}
                        </div>
                      )}
                      {abTests
                        .filter((t) => t.key === (abTab ?? abTests[0].key))
                        .map((t) => (
                          <AbTestPanel key={t.key} test={t} onPromote={(x) => void promoteWinner(x)} />
                        ))}
                    </div>
                  )}
                </PanelCard>
              </div>
            </div>

            {/* Section performance — which parts of the page actually get read */}
            <div className="lf-fade-up" style={{ animationDelay: "600ms" }}>
              <PanelCard
                title="Section performance"
                icon={Layers}
                actions={
                  <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
                    {data!.topSections.length} of {visibleSectionCount} tracked
                  </span>
                }
              >
                {data!.topSections.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <Layers className="h-6 w-6 text-zinc-700" />
                    <p className="text-[12px] text-zinc-500">No section views yet.</p>
                    <p className="max-w-xs text-[10px] leading-relaxed text-zinc-600">
                      Open the published page (“Join live”) and scroll — every section that reaches half the viewport counts a view here.
                    </p>
                  </div>
                ) : (
                  <ul className="grid gap-1.5 sm:grid-cols-2">
                    {data!.topSections.map((s, i) => {
                      const pctViews = (s.count / Math.max(1, stats!.pageviews)) * 100
                      const barPct = (s.count / Math.max(1, data!.topSections[0].count)) * 100
                      const rowTest = abTests.find((t) => t.sectionType === typeByLabel.get(s.name))
                      return (
                        <li key={s.name} className="flex items-center gap-2.5 rounded-lg border border-zinc-800/70 bg-zinc-900/50 px-2.5 py-1.5">
                          <span className="w-5 shrink-0 text-center font-mono text-[10px] tabular-nums text-zinc-600" aria-hidden>
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
                              <span className="flex min-w-0 items-center gap-1.5">
                                <span className="truncate text-zinc-300">{s.name}</span>
                                {rowTest && (
                                  <button
                                    type="button"
                                    onClick={() => jumpToAbTest(rowTest.key)}
                                    className="flex shrink-0 items-center gap-0.5 rounded border border-violet-500/30 bg-violet-500/10 px-1 py-px text-[8px] font-bold uppercase tracking-wider text-violet-300 transition-colors hover:bg-violet-500/20"
                                    title={`${rowTest.sectionLabel} runs an A/B test — view per-variant reads and CTR`}
                                  >
                                    <Sparkles className="h-2 w-2" aria-hidden /> A/B
                                  </button>
                                )}
                              </span>
                              <span className="shrink-0 font-mono tabular-nums text-zinc-500">
                                {fmtNum(s.count)} · {Math.round(pctViews)}%
                              </span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 transition-all"
                                style={{ width: `${Math.max(4, barPct)}%` }}
                              />
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </PanelCard>
            </div>

            {/* Leads inbox — contact form submissions */}
            <div className="lf-fade-up" style={{ animationDelay: "640ms" }}>
              <PanelCard
                title="Leads inbox"
                icon={Mail}
                actions={
                  <div className="flex items-center gap-2">
                    {leads.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          downloadLeadsCsv(leads, projectName || "project")
                          toast.success("Leads CSV exported 📄", { description: `${leads.length} submissions — one row each, all fields included.` })
                        }}
                        className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-[10px] font-semibold text-zinc-400 transition-colors hover:border-violet-500/40 hover:text-zinc-200"
                        title="Export all submissions as CSV (spreadsheet-ready)"
                      >
                        <Download className="h-3 w-3" /> CSV
                      </button>
                    )}
                    <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-violet-300">
                      {leads.length} {leads.length === 1 ? "submission" : "submissions"}
                    </span>
                  </div>
                }
              >
                {leads.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <Mail className="h-6 w-6 text-zinc-700" />
                    <p className="text-[12px] text-zinc-500">No form submissions yet.</p>
                    <p className="max-w-xs text-[10px] text-zinc-600">
                      Open “Test preview” in the Studio and submit the contact form — every submission lands here as a lead.
                    </p>
                  </div>
                ) : (
                  <ul className="grid max-h-96 gap-2 overflow-y-auto lf-scroll pr-1 sm:grid-cols-2">
                    {leads.map((lead) => {
                      const initials = (lead.name || lead.email || "?")
                        .split(/[\s.@]+/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((w) => w[0]?.toUpperCase())
                        .join("")
                      const hue = (lead.id.charCodeAt(0) * 13) % 360
                      return (
                        <li
                          key={lead.id}
                          className="group"
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedLead(lead)}
                            className="flex w-full items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-left transition-all hover:border-violet-500/30 hover:bg-zinc-900/80 hover:shadow-md hover:shadow-violet-950/20"
                            aria-label={`Open lead details for ${lead.name || lead.email || "anonymous submission"}`}
                            title="Open full submission details"
                          >
                          <span
                            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-zinc-700 text-[11px] font-bold text-zinc-100"
                            style={{ background: `hsl(${hue} 45% 22%)` }}
                          >
                            {initials}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2">
                              <p className="truncate text-[12px] font-semibold text-zinc-100">{lead.name || "Anonymous"}</p>
                              <span className="ml-auto shrink-0 font-mono text-[9px] text-zinc-600">
                                {new Date(lead.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                              </span>
                            </div>
                            {lead.email && (
                              <a
                                href={`mailto:${lead.email}`}
                                className="mt-0.5 block truncate text-[11px] text-violet-300/90 underline-offset-2 hover:underline"
                                title={`Email ${lead.email}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {lead.email}
                              </a>
                            )}
                            {lead.message && (
                              <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-zinc-400" title={lead.message}>
                                {lead.message}
                              </p>
                            )}
                            <span className="mt-1.5 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-violet-400/0 transition-colors group-hover:text-violet-400/70">
                              View details →
                            </span>
                          </div>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </PanelCard>
            </div>

            {/* Recent events */}
            <div className="lf-fade-up" style={{ animationDelay: "680ms" }}>
              <PanelCard title="Recent events" icon={Zap}>
                <ul className="divide-y divide-zinc-800/60">
                  {data!.recentEvents.map((e) => (
                    <li key={e.id} className="flex items-center gap-3 py-1.5 text-[11px]">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase",
                          e.type === "cta_click" ? "bg-emerald-500/15 text-emerald-300" : e.type === "form_submit" ? "bg-fuchsia-500/15 text-fuchsia-300" : e.type === "variant_exposure" ? "bg-violet-500/15 text-violet-300" : "bg-zinc-500/15 text-zinc-400"
                        )}
                      >
                        {e.type.replace("_", " ")}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-zinc-300">{e.label}</span>
                      {e.variant && <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[9px] text-violet-300">v{e.variant}</span>}
                      <span className="font-mono text-zinc-600">{new Date(e.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </li>
                  ))}
                </ul>
              </PanelCard>
            </div>
          </>
        )}
      </div>

      {/* Lead detail drawer — full submission + reply actions */}
      <LeadDetailSheet lead={selectedLead} open={selectedLead !== null} onOpenChange={(o) => !o && setSelectedLead(null)} />
    </div>
  )
}
