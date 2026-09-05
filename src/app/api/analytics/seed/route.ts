// ─────────────────────────────────────────────────────────────────────────────
// /api/analytics/seed — realistic DEMO traffic generator ("Simulate traffic")
//
// POST /api/analytics/seed
// body: { projectId, days?: number = 30, mode?: "replace" | "append" = "replace" }
// → 200 { ok: true, pageviews: number, events: number, leads: number, mode } | 400 | 404
//
// mode "replace" (default) wipes existing PageViews + Events + Leads first;
// mode "append" keeps history and adds the new rows on top.
//
// Seeds:
//  - per-day pageviews (40 + rand(0..90), mild upward trend, weekend dip)
//  - visitor pool ≈ views/2.2 (so unique < pageviews), weighted referrers /
//    countries / devices / browsers; bounce visits get short durations (1–14s)
//    and engaged visits 15s+ (consistent with the engagement-ping semantics)
//  - EVERY enabled section-level A/B test gets its own exposure stream
//    (config weights, ~70% of views, label = section id) and biased-last-variant
//    clicks (label = section type, ~1.8x CTR) so auto-winner + per-variant
//    engagement stories work once samples are reached. The PRIMARY test
//    (hero first) also tags the pageview rows themselves.
//  - else cta_clicks at 4–7% of views (variant null)
//  - section_view events (~1.5 per view, labels from config sections)
//  - form_submit ~0.8% of views
//  - a few deep-reader visits (300–900s, non-bounce, last 2 days)
//  - demo leads in the leads inbox (~form_submit count, capped 14, real-sounding)
// ─────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { guard, HttpError, num, parseStoredConfig, readJsonBody, str } from "@/lib/landing/server"
import { getAbTests } from "@/lib/landing/ab"
import { SECTION_META } from "@/lib/landing/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const REFERRERS: [string, number][] = [
  ["direct", 30],
  ["google", 28],
  ["x.com", 10],
  ["news.ycombinator.com", 8],
  ["reddit", 6],
  ["producthunt", 6],
  ["linkedin", 5],
  ["bing", 4],
  ["dev.to", 3],
]
const COUNTRIES: [string, number][] = [
  ["US", 24], ["DE", 10], ["GB", 9], ["IN", 9], ["EG", 7], ["FR", 6], ["BR", 6],
  ["JP", 5], ["CA", 5], ["TR", 4], ["ES", 3], ["AU", 3], ["SA", 2], ["NG", 2], ["XX", 7],
]
const DEVICES: [string, number][] = [["desktop", 58], ["mobile", 35], ["tablet", 7]]
const BROWSERS: [string, number][] = [["Chrome", 62], ["Safari", 18], ["Firefox", 9], ["Edge", 7], ["Other", 4]]
const CONTENT_SECTION_TYPES = new Set([
  "logos", "features", "stats", "testimonials", "pricing", "faq", "gallery", "contact", "cta-final",
  "problem", "solution", "video", "comparison", "guarantee", "about",
])

function pickWeighted<T>(pairs: [T, number][]): T {
  const total = pairs.reduce((s, [, w]) => s + w, 0)
  let r = Math.random() * total
  for (const [value, w] of pairs) {
    r -= w
    if (r <= 0) return value
  }
  return pairs[pairs.length - 1][0]
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

function randHex(len: number): string {
  let s = ""
  while (s.length < len) s += Math.floor(Math.random() * 16).toString(16)
  return s.slice(0, len)
}

interface ViewRow {
  projectId: string
  visitorId: string
  path: string
  referrer: string
  country: string
  device: string
  browser: string
  variant: string | null
  variantMap: string | null
  duration: number
  isBounce: boolean
  createdAt: Date
}
interface EventRow {
  projectId: string
  type: string
  label: string
  variant: string | null
  value: number
  path: string
  createdAt: Date
}
interface LeadRow {
  projectId: string
  name: string
  email: string
  message: string
  fields: string
  createdAt: Date
}

const DEMO_NAMES = [
  "Maya Chen", "Omar Haddad", "Sara Novak", "Liam O\u0027Brien", "Aisha Rahman",
  "Tom\u00e1s Silva", "Nina Petrova", "Jonas Weber", "Priya Nair", "Diego Ram\u00edrez",
  "Elif Y\u00fclmaz", "Marcus Johnson", "Yuki Tanaka", "Clara Fontaine",
]
const DEMO_MESSAGES = [
  "Loved the demo \u2014 can you send enterprise pricing? We\u2019re a team of 40.",
  "Does this integrate with our existing stack? Happy to book a call.",
  "Saw you on Product Hunt \u2014 congrats on the launch! One question about the API\u2026",
  "We\u2019re evaluating 3 tools this quarter. What makes you different?",
  "Need an invoice before we can proceed \u2014 who do I contact for billing?",
  "The free tier is perfect for my side project. Upgrading if it sticks!",
  "Can you support SSO? Our security team requires it.",
  "Just wanted to say the onboarding was the smoothest I\u2019ve seen. Zero friction.",
  "Do you offer discounts for startups or students?",
  "How fast is support response time? We\u2019re moving off a tool with 48h SLAs.",
  "Impressive stats on the homepage \u2014 is that from real usage data?",
  "Looking to migrate ~200 projects over. Any bulk import tooling?",
  "Your pricing page mentions annual billing \u2014 is there a refund window?",
  "Feature request: dark mode for the dashboard. Otherwise, flawless.",
]

function slugifyName(name: string): string {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z ]/g, "").trim().replace(/ /g, ".")
}

const DEMO_FIELD_LABELS = ["Name", "Email", "Message"]

export async function POST(req: NextRequest) {
  return guard(async () => {
    const body = await readJsonBody(req)
    const projectId = str(body.projectId)
    if (!projectId) throw new HttpError(400, "Missing 'projectId'")
    const project = await db.site.findUnique({ where: { id: projectId } })
    if (!project) throw new HttpError(404, "Project not found")
    const days = Math.max(1, Math.min(90, Math.floor(num(body.days) ?? 30)))
    const mode = body.mode === "append" ? "append" : "replace"

    // fresh re-seed (replace mode only — append keeps the history)
    if (mode === "replace") {
      await db.siteView.deleteMany({ where: { projectId } })
      await db.siteEvent.deleteMany({ where: { projectId } })
      await db.siteLead.deleteMany({ where: { projectId } })
    }

    const config = parseStoredConfig(project.config)
    // every enabled section-level test (hero first = primary); each test seeds
    // its own exposure stream + section-scoped clicks, the primary also tags views
    const tests = getAbTests(config)
    const primary = tests[0] ?? null
    const lastVariantNameOf = (t: { variants: { name: string }[] }) =>
      t.variants.length ? t.variants[t.variants.length - 1].name : null

    // readable sections for section_view events — id kept so reads can be
    // tagged with the visit's own test assignment (per-variant read counts)
    const readSections = config.sections
      .filter((s) => !s.hidden && CONTENT_SECTION_TYPES.has(s.type))
      .map((s) => ({ id: s.id, label: SECTION_META[s.type].label }))
    const hasContact = config.sections.some((s) => s.type === "contact")

    const now = new Date()
    const startDay = new Date(now)
    startDay.setHours(0, 0, 0, 0)
    startDay.setDate(startDay.getDate() - (days - 1))

    // plan per-day volumes (mild upward trend toward recent days + weekend dip)
    const perDay: { dayStart: Date; views: number }[] = []
    for (let i = 0; i < days; i++) {
      const dayStart = new Date(startDay)
      dayStart.setDate(startDay.getDate() + i)
      const trend = 0.75 + 0.25 * (days === 1 ? 1 : i / (days - 1))
      const dow = dayStart.getDay()
      const weekend = dow === 0 || dow === 6 ? 0.72 : 1
      const views = Math.max(5, Math.round((40 + Math.random() * 90) * trend * weekend))
      perDay.push({ dayStart, views })
    }
    const totalViews = perDay.reduce((s, d) => s + d.views, 0)

    // visitor pool ≈ totalViews / 2.2 unique ids
    const poolSize = Math.max(1, Math.round(totalViews / 2.2))
    const visitors: string[] = Array.from({ length: poolSize }, () => `v-${randHex(8)}`)

    // click rates fixed per seed-run
    const abClickRate = 0.06 + Math.random() * 0.06 // 6–12% of exposures
    const plainClickRate = 0.04 + Math.random() * 0.03 // 4–7% of views

    const viewRows: ViewRow[] = []
    const eventRows: EventRow[] = []

    for (const { dayStart, views } of perDay) {
      const dayEnd = Math.min(dayStart.getTime() + 24 * 3600 * 1000, now.getTime())
      for (let i = 0; i < views; i++) {
        const t = new Date(dayStart.getTime() + Math.random() * Math.max(1, dayEnd - dayStart.getTime()))

        // A/B: every enabled test draws its own exposure BEFORE the view row;
        // the primary test's pick also tags the visit (per-variant duration /
        // engagement reporting)
        const testPicks = new Map<string, string>() // sectionId → variant
        let variant: string | null = null
        for (const test of tests) {
          if (test.ab.variants.length >= 2 && Math.random() < 0.7) {
            const picked = pickWeighted(
              test.ab.variants.map((v) => [v.name, Math.max(1, v.weight)] as [string, number])
            )
            testPicks.set(test.section.id, picked)
            eventRows.push({ projectId, type: "variant_exposure", label: test.section.id, variant: picked, value: 0, path: "/", createdAt: t })
            if (test === primary) variant = picked
          }
        }

        // engagement story: bounces are short; engaged visits hold 15s+; the
        // biased (last) variant holds attention longer and bounces less
        const isWinner = variant !== null && variant === (primary ? lastVariantNameOf(primary.ab) : null)
        const bounceP = variant ? (isWinner ? 0.3 : 0.45) : 0.42
        const isBounce = Math.random() < bounceP
        const duration = isBounce
          ? randInt(1, 14)
          : 15 + Math.floor((isWinner ? 340 : 235) * Math.pow(Math.random(), 1.8))

        viewRows.push({
          projectId,
          visitorId: visitors[randInt(0, visitors.length - 1)],
          path: "/",
          referrer: pickWeighted(REFERRERS),
          country: pickWeighted(COUNTRIES),
          device: pickWeighted(DEVICES),
          browser: pickWeighted(BROWSERS),
          variant,
          variantMap: testPicks.size ? JSON.stringify(Object.fromEntries(testPicks)) : null,
          duration,
          isBounce,
          createdAt: t,
        })

        const clickTime = () =>
          new Date(Math.min(now.getTime(), t.getTime() + randInt(10, 180) * 1000))

        if (variant !== null) {
          // last variant biased ~1.8x CTR so it wins once sample reached
          const rate = abClickRate * (isWinner ? 1.8 : 1)
          if (Math.random() < rate) {
            eventRows.push({ projectId, type: "cta_click", label: "hero", variant, value: 0, path: "/", createdAt: clickTime() })
          }
        } else if (Math.random() < plainClickRate) {
          eventRows.push({ projectId, type: "cta_click", label: "hero", variant: null, value: 0, path: "/", createdAt: clickTime() })
        }

        // per-section test clicks — attributed to the section's own variant
        for (const test of tests) {
          if (test === primary) continue // primary clicks handled above (page-wide)
          const picked = testPicks.get(test.section.id)
          if (!picked) continue
          const isTestWinner = picked === lastVariantNameOf(test.ab)
          if (Math.random() < abClickRate * (isTestWinner ? 1.8 : 1)) {
            eventRows.push({
              projectId,
              type: "cta_click",
              label: test.section.type,
              variant: picked,
              value: 0,
              path: "/",
              createdAt: clickTime(),
            })
          }
        }

        // section views — ~1.5 per view on random distinct sections; a section
        // under an enabled test gets its read tagged with that test's pick
        if (readSections.length) {
          const n = 1 + (Math.random() < 0.5 ? 1 : 0)
          const remaining = [...readSections]
          for (let s = 0; s < n && remaining.length; s++) {
            const sec = remaining.splice(randInt(0, remaining.length - 1), 1)[0]
            const ct = new Date(Math.min(now.getTime(), t.getTime() + randInt(20, 240) * 1000))
            eventRows.push({ projectId, type: "section_view", label: sec.label, variant: testPicks.get(sec.id) ?? null, value: 0, path: "/", createdAt: ct })
          }
        }

        // form submissions ~0.8% of views
        if (Math.random() < 0.008) {
          const ct = new Date(Math.min(now.getTime(), t.getTime() + randInt(30, 300) * 1000))
          eventRows.push({
            projectId,
            type: "form_submit",
            label: hasContact ? "Contact" : "contact",
            variant: null,
            value: 0,
            path: "/contact",
            createdAt: ct,
          })
        }
      }
    }

    // ── a few deep-reader visits (300–900s, non-bounce, last 2 days) ────────
    const deepReaders = Math.max(2, Math.min(5, Math.round(totalViews / 300)))
    for (let i = 0; i < deepReaders; i++) {
      const t = new Date(now.getTime() - randInt(0, 48) * 3600 * 1000 - randInt(0, 3600) * 1000)
      if (t.getTime() > now.getTime()) t.setTime(now.getTime() - 60_000)
      const deepVariant = primary && Math.random() < 0.7 ? pickWeighted(primary.ab.variants.map((v) => [v.name, Math.max(1, v.weight)] as [string, number])) : null
      // deep readers participate in every test's winning group (richer story)
      const deepPicks = new Map<string, string>()
      for (const test of tests) {
        if (test.ab.variants.length >= 2) {
          deepPicks.set(test.section.id, test.ab.variants[test.ab.variants.length - 1].name)
        }
      }
      viewRows.push({
        projectId,
        visitorId: visitors[randInt(0, visitors.length - 1)],
        path: "/",
        referrer: pickWeighted(REFERRERS),
        country: pickWeighted(COUNTRIES),
        device: pickWeighted(DEVICES),
        browser: pickWeighted(BROWSERS),
        variant: deepVariant,
        variantMap: deepPicks.size ? JSON.stringify(Object.fromEntries(deepPicks)) : null,
        duration: randInt(300, 900),
        isBounce: false,
        createdAt: t,
      })
    }

    // batched inserts (SQLite createMany, chunks keep it fast)
    const CHUNK = 500
    for (let i = 0; i < viewRows.length; i += CHUNK) {
      await db.siteView.createMany({ data: viewRows.slice(i, i + CHUNK) })
    }
    for (let i = 0; i < eventRows.length; i += CHUNK) {
      await db.siteEvent.createMany({ data: eventRows.slice(i, i + CHUNK) })
    }

    // ── demo leads (match the form_submit volume story, capped at 14) ──────
    const formSubmits = eventRows.filter((e) => e.type === "form_submit").length
    const leadCount = Math.min(DEMO_NAMES.length, Math.max(3, Math.round(formSubmits)))
    const leadRows: LeadRow[] = Array.from({ length: leadCount }, (_, i) => {
      const name = DEMO_NAMES[(i * 3 + 1) % DEMO_NAMES.length]
      const message = DEMO_MESSAGES[(i * 5 + 2) % DEMO_MESSAGES.length]
      const daysAgo = randInt(0, Math.min(days - 1, 20))
      const t = new Date(now.getTime() - daysAgo * 24 * 3600 * 1000 - randInt(0, 20) * 3600 * 1000)
      return {
        projectId,
        name,
        email: `${slugifyName(name)}@example.com`,
        message,
        fields: JSON.stringify({
          [DEMO_FIELD_LABELS[0]]: name,
          [DEMO_FIELD_LABELS[1]]: `${slugifyName(name)}@example.com`,
          [DEMO_FIELD_LABELS[2]]: message,
        }),
        createdAt: t,
      }
    })
    if (leadRows.length) {
      await db.siteLead.createMany({ data: leadRows })
    }

    return NextResponse.json({ ok: true, mode, pageviews: viewRows.length, events: eventRows.length, leads: leadRows.length })
  })
}
