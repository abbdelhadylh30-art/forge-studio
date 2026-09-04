// ─────────────────────────────────────────────────────────────────────────────
// /api/analytics — dashboard payload
//
// GET /api/analytics?projectId=xxx&days=30 → 200 AnalyticsPayload | 400 | 404
//   All metrics are windowed to the last `days` days (1–90, default 30,
//   local midnights, today included) — except `live`, which always covers the
//   last 5 minutes. Response = AnalyticsPayload (see types.ts):
//   { stats, timeseries, devices, countries, referrers, topSections, funnel,
//     live, ab, recentEvents }
//   live: active visits ("who's on the page right now") — a visit stays active
//     for 45s after its last engagement signal (pings land every ~15s)
//   ab: per-variant exposures/clicks/CTR plus avgDuration + engagedPct from
//     variant-tagged pageviews
// ─────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { guard, HttpError, parseStoredConfig } from "@/lib/landing/server"
import { getAbTests, exposureLabels, abTestLabel } from "@/lib/landing/ab"
import { SECTION_META } from "@/lib/landing/types"
import type { AbTestResult, AnalyticsPayload, LiveVisit } from "@/lib/landing/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function dayKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** A visit counts as "on the page right now" if its last engagement signal
 *  (ping or arrival) is this fresh — pings land every ~15s while visible. */
const ACTIVE_GRACE_MS = 45_000
const LIVE_WINDOW_MS = 5 * 60_000

export async function GET(req: NextRequest) {
  return guard(async () => {
    const projectId = req.nextUrl.searchParams.get("projectId")
    if (!projectId) throw new HttpError(400, "Missing 'projectId' query parameter")
    const project = await db.site.findUnique({ where: { id: projectId } })
    if (!project) throw new HttpError(404, "Project not found")

    const daysRaw = Number(req.nextUrl.searchParams.get("days") ?? "30")
    const days = Math.max(1, Math.min(90, Math.floor(Number.isFinite(daysRaw) ? daysRaw : 30)))

    // window start = local midnight, N-1 days back (today counts as day N)
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - (days - 1))

    const [views, events, deviceGroups, countryGroups, referrerGroups, sectionGroups, recent, recentVisits] =
      await Promise.all([
        db.siteView.findMany({
          where: { projectId, createdAt: { gte: start } },
          select: { visitorId: true, variant: true, variantMap: true, duration: true, isBounce: true, createdAt: true },
        }),
        db.siteEvent.findMany({
          where: { projectId, createdAt: { gte: start } },
          select: { type: true, label: true, variant: true, createdAt: true },
        }),
        db.siteView.groupBy({ by: ["device"], where: { projectId, createdAt: { gte: start } }, _count: { _all: true } }),
        db.siteView.groupBy({ by: ["country"], where: { projectId, createdAt: { gte: start } }, _count: { _all: true } }),
        db.siteView.groupBy({ by: ["referrer"], where: { projectId, createdAt: { gte: start } }, _count: { _all: true } }),
        db.siteEvent.groupBy({ by: ["label"], where: { projectId, type: "section_view", createdAt: { gte: start } }, _count: { _all: true } }),
        db.siteEvent.findMany({
          where: { projectId, createdAt: { gte: start } },
          orderBy: { createdAt: "desc" },
          take: 12,
          select: { id: true, type: true, label: true, variant: true, createdAt: true },
        }),
        // recent visits for the live "right now" strip (not windowed by `days`)
        db.siteView.findMany({
          where: { projectId, createdAt: { gte: new Date(Date.now() - LIVE_WINDOW_MS) } },
          orderBy: { createdAt: "desc" },
          take: 30,
          select: { id: true, device: true, browser: true, country: true, referrer: true, variant: true, duration: true, createdAt: true },
        }),
      ])

    // ── stats ────────────────────────────────────────────────────────────────
    const pageviews = views.length
    const uniqueVisitors = new Set(views.map((v) => v.visitorId)).size
    const bounceRate = pageviews ? views.filter((v) => v.isBounce).length / pageviews : 0
    const avgDuration = pageviews
      ? Math.round(views.reduce((s, v) => s + v.duration, 0) / pageviews)
      : 0
    const ctaClicks = events.filter((e) => e.type === "cta_click").length
    const conversionRate = pageviews ? ctaClicks / pageviews : 0

    // ── timeseries (fill all days with zeros) ────────────────────────────────
    const dayMap = new Map<string, { views: number; clicks: number }>()
    for (let i = 0; i < days; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      dayMap.set(dayKey(d), { views: 0, clicks: 0 })
    }
    for (const v of views) {
      const entry = dayMap.get(dayKey(v.createdAt))
      if (entry) entry.views++
    }
    for (const e of events) {
      if (e.type !== "cta_click") continue
      const entry = dayMap.get(dayKey(e.createdAt))
      if (entry) entry.clicks++
    }
    const timeseries = Array.from(dayMap.entries()).map(([date, v]) => ({ date, ...v }))

    // ── dimension breakdowns (top 10, desc) ──────────────────────────────────
    const ranked = (rows: { name: string; count: number }[], top: number) =>
      rows.sort((a, b) => b.count - a.count).slice(0, top)
    const devices = ranked(deviceGroups.map((g) => ({ name: g.device, count: g._count._all })), 10)
    const countries = ranked(countryGroups.map((g) => ({ name: g.country, count: g._count._all })), 10)
    const referrers = ranked(referrerGroups.map((g) => ({ name: g.referrer, count: g._count._all })), 10)
    const topSections = ranked(sectionGroups.map((g) => ({ name: g.label, count: g._count._all })), 8)

    // ── funnel ───────────────────────────────────────────────────────────────
    const countType = (t: string) => events.filter((e) => e.type === t).length
    const funnel = [
      { label: "Visited page", count: pageviews },
      { label: "Engaged with sections", count: countType("section_view") },
      { label: "Clicked CTA", count: countType("cta_click") },
      { label: "Submitted form", count: countType("form_submit") },
    ]

    // ── live "right now" strip ───────────────────────────────────────────────
    // lastActive ≈ createdAt + duration (pings grow duration while visible);
    // a visit is active while that signal is within the grace window.
    const now = Date.now()
    const activeVisits: LiveVisit[] = []
    for (const v of recentVisits) {
      const created = v.createdAt.getTime()
      const lastActive = created + v.duration * 1000
      if (now - lastActive > ACTIVE_GRACE_MS) continue
      activeVisits.push({
        id: v.id,
        device: v.device,
        browser: v.browser,
        country: v.country,
        referrer: v.referrer,
        variant: v.variant,
        // while active, wall-clock elapsed is the truth (pings lag up to 15s)
        durationSec: Math.max(v.duration, Math.floor((now - created) / 1000)),
        startedAt: v.createdAt.toISOString(),
        lastActive: new Date(lastActive).toISOString(),
      })
    }
    const live = {
      active: activeVisits.sort((a, b) => b.durationSec - a.durationSec),
      last5m: recentVisits.length,
      activeCount: activeVisits.length,
    }

    // ── A/B block — every enabled section-level test (hero first) ─────────
    // • exposures: variant_exposure events whose label matches the test key
    //   (hero also accepts its legacy "hero" label from older seeds)
    // • clicks: the hero (page-level) test counts ANY variant-tagged CTA click;
    //   section tests only count clicks whose label starts with their section
    //   type ("pricing: …") — section-scoped attribution
    // • per-variant duration/engagement for EVERY test via PageView.variantMap
    //   (sectionId → variant); the primary test additionally falls back to the
    //   single `variant` column so pre-variantMap data keeps working
    const config = parseStoredConfig(project.config)
    const tests = getAbTests(config)
    // per-test per-variant engagement: testKey → variantName → aggregates
    const engagement = new Map<string, Map<string, { total: number; duration: number; engaged: number }>>()
    for (const v of views) {
      let vm: Record<string, string> | null = null
      if (v.variantMap) {
        try {
          vm = JSON.parse(v.variantMap) as Record<string, string>
        } catch {
          vm = null
        }
      }
      for (const test of tests) {
        // assignment for this test: variantMap entry, else (primary only) the
        // legacy single-variant tag on the row
        const name = vm?.[test.section.id] ?? (test === tests[0] ? v.variant : null)
        if (!name) continue
        let byVariant = engagement.get(test.section.id)
        if (!byVariant) {
          byVariant = new Map()
          engagement.set(test.section.id, byVariant)
        }
        const agg = byVariant.get(name) ?? { total: 0, duration: 0, engaged: 0 }
        agg.total++
        agg.duration += v.duration
        if (!v.isBounce) agg.engaged++
        byVariant.set(name, agg)
      }
    }
    const abTests: AbTestResult[] = tests.map(({ section, ab }, testIdx) => {
      const primary = testIdx === 0
      const labels = exposureLabels(section)
      const exposuresBy = new Map<string, number>()
      const clicksBy = new Map<string, number>()
      // variant-tagged section reads: section_view events whose label is this
      // section's display label (the published observer + seeder convention).
      // The hero gets no reads — the pageview itself IS the hero read.
      const sectionLabel = SECTION_META[section.type]?.label
      const readsBy = new Map<string, number>()
      for (const e of events) {
        if (!e.variant) continue
        if (e.type === "variant_exposure") {
          if (labels.includes(e.label)) exposuresBy.set(e.variant, (exposuresBy.get(e.variant) ?? 0) + 1)
        } else if (e.type === "cta_click") {
          const labelMatch = primary || e.label === section.type || e.label.startsWith(`${section.type}:`)
          if (labelMatch) clicksBy.set(e.variant, (clicksBy.get(e.variant) ?? 0) + 1)
        } else if (e.type === "section_view" && sectionLabel && e.label === sectionLabel) {
          readsBy.set(e.variant, (readsBy.get(e.variant) ?? 0) + 1)
        }
      }
      const variants = ab.variants.map((v) => {
        const exposures = exposuresBy.get(v.name) ?? 0
        const clicks = clicksBy.get(v.name) ?? 0
        const pv = engagement.get(section.id)?.get(v.name)
        return {
          name: v.name,
          headline: v.headline,
          weight: v.weight,
          exposures,
          clicks,
          ctr: exposures > 0 ? clicks / exposures : 0,
          avgDuration: pv && pv.total > 0 ? Math.round(pv.duration / pv.total) : 0,
          engagedPct: pv && pv.total > 0 ? pv.engaged / pv.total : 0,
          sectionReads: readsBy.get(v.name) ?? 0,
        }
      })
      const totalExposures = variants.reduce((s, v) => s + v.exposures, 0)
      const someClicks = variants.some((v) => v.clicks > 0)
      let winner: string | null = null
      if (ab.autoWinner && totalExposures >= ab.sampleSize && someClicks) {
        winner = variants.reduce((best, v) => (v.ctr > best.ctr ? v : best)).name
      }
      // does this test have per-variant visit data at all (variantMap)?
      const hasEngagement = (engagement.get(section.id)?.size ?? 0) > 0
      return {
        key: section.id,
        sectionId: section.id,
        sectionType: section.type,
        sectionLabel: abTestLabel(config, section),
        metric: ab.metric,
        autoWinner: ab.autoWinner,
        sampleSize: ab.sampleSize,
        variants,
        winner,
        totalExposures,
        hasData: totalExposures > 0,
        hasEngagement,
        primary,
      }
    })
    // legacy single-test payload: the primary (first) test, when any
    const primaryTest = abTests[0] ?? null
    const ab: AnalyticsPayload["ab"] = primaryTest
      ? {
          enabled: true,
          metric: primaryTest.metric,
          autoWinner: primaryTest.autoWinner,
          sampleSize: primaryTest.sampleSize,
          variants: primaryTest.variants,
          winner: primaryTest.winner,
          totalExposures: primaryTest.totalExposures,
          hasData: primaryTest.hasData,
        }
      : null

    const payload: AnalyticsPayload = {
      stats: { pageviews, uniqueVisitors, bounceRate, avgDuration, ctaClicks, conversionRate },
      timeseries,
      devices,
      countries,
      referrers,
      topSections,
      funnel,
      live,
      ab,
      abTests,
      recentEvents: recent.map((e) => ({
        id: e.id,
        type: e.type,
        label: e.label,
        variant: e.variant,
        createdAt: e.createdAt.toISOString(),
      })),
    }
    return NextResponse.json(payload)
  })
}
