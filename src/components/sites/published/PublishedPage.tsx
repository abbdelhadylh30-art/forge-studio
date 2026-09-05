"use client"

import * as React from "react"
import { ArrowLeft, Check, ChevronDown, ChevronUp, Copy, ExternalLink, Link2, Loader2, Moon, MousePointerClick, Radio, SearchX, Sun, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { LandingPreview } from "@/components/sites/preview/LandingPreview"
import { injectCustomScripts, readConsent, writeConsent, type ConsentState } from "@/components/sites/shared/scriptInjection"
import { track, pingEngagement, detectDevice, detectBrowser, getVisitorId } from "@/components/sites/shared/tracking"
import { useVisitorRelay } from "@/components/sites/shared/livesocket"
import { getAbTests, assignAbVariants, sectionAb } from "@/lib/landing/ab"
import { sectionAnchors } from "@/lib/landing/anchors"
import { ctaHrefFor, runCtaNavigation } from "@/lib/landing/ctaNav"
import { themeVars } from "@/lib/landing/themes"
import { applyLocale, dirFor, localesOf } from "@/lib/landing/i18n"
import { useResolvedMode } from "@/components/sites/preview/useThemeMode"
import { Languages } from "lucide-react"
import { SECTION_META } from "@/lib/landing/types"
import type { LandingConfig, ProjectSummary, ProjectWithConfig, Section } from "@/lib/landing/types"

type LoadState =
  | { kind: "loading" }
  | { kind: "notfound"; slug: string }
  | { kind: "error"; message: string }
  | { kind: "ready"; project: ProjectWithConfig }

/** Live self-refreshing "time on page" ticker (mm:ss). */
function SessionTimer({ since }: { since: number }) {
  const [, force] = React.useReducer((x: number) => x + 1, 0)
  React.useEffect(() => {
    const t = setInterval(force, 1000)
    return () => clearInterval(t)
  }, [])
  const s = Math.max(0, Math.floor((Date.now() - since) / 1000))
  const label = s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`
  return <span className="tabular-nums">{label}</span>
}

/**
 * Published page — the shareable in-app route `/p/<slug>`.
 * Renders the project's last SAVED config full-screen, as a visitor would see
 * it, and records real analytics: pageview, A/B variant exposure, CTA clicks
 * and form submissions (which also land in the leads inbox).
 */
export function PublishedPage({ slug }: { slug: string }) {
  const [state, setState] = React.useState<LoadState>({ kind: "loading" })
  const [variant, setVariant] = React.useState<string | null>(null)
  /** sectionId → assigned variant (per section-level test) */
  const [variantMap, setVariantMap] = React.useState<Record<string, string>>({})
  /** ref mirror of variantMap — the section-view observer reads it at fire
   *  time so it never re-arms (and never double-counts) when assignments land */
  const variantMapRef = React.useRef<Record<string, string>>({})
  const [chromeOpen, setChromeOpen] = React.useState(true)
  /** active display locale (null = default). Synced to the ?lang= URL param. */
  const [locale, setLocale] = React.useState<string | null>(null)
  /** visitor's dark/light override (persisted per browser, flips the whole page). */
  const [modeOverride, setModeOverride] = React.useState<"dark" | "light" | null>(null)
  /** cookie-consent decision — gates the custom third-party scripts */
  const [consent, setConsent] = React.useState<ConsentState>("unknown")
  const [copied, setCopied] = React.useState(false)

  const sessionStartRef = React.useRef(Date.now())
  const pageviewIdRef = React.useRef<string | null>(null)
  const engagedRef = React.useRef(false)
  const [clicks, setClicks] = React.useState(0)
  const [events, setEvents] = React.useState(0)
  const [leadsSent, setLeadsSent] = React.useState(0)
  const [savedDuration, setSavedDuration] = React.useState(0)
  const trackedOnceRef = React.useRef(false)

  // ── Project identity (used by handlers + the live relay below)
  const projectId = state.kind === "ready" ? state.project.id : null
  const config: LandingConfig | null = state.kind === "ready" ? state.project.config : null
  const locales = config ? localesOf(config) : []
  const multi = locales.length > 1
  /** locale-applied config for RENDERING (tracking + A/B use the original). */
  const displayConfig = React.useMemo(() => (config && locale ? applyLocale(config, locale) : config), [config, locale])

  // ── Visitor color-scheme override (persisted, applied before first render
  // of the page content — reads localStorage once on mount)
  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem("lf-visitor-mode")
      if (saved === "dark" || saved === "light") setModeOverride(saved)
    } catch {
      /* private mode — the toggle just won't persist */
    }
  }, [])

  const flipMode = () => {
    setModeOverride((prev) => {
      const next = prev === "dark" ? "light" : "dark"
      try {
        window.localStorage.setItem("lf-visitor-mode", next)
      } catch {
        /* ignore */
      }
      return next
    })
  }

  // ── Cookie consent + custom third-party scripts (GA4, Meta Pixel, chat…).
  // The banner only shows when the site enables it; built-in analytics is
  // cookie-free and always runs. Custom scripts inject ONLY when the gate is
  // open: banner off → immediate, banner on → after Accept (Decline = never).
  React.useEffect(() => {
    if (state.kind !== "ready") return
    const cfg = state.project.config
    setConsent(readConsent())
    const bannerOn = cfg.legal?.cookieConsent?.enabled === true
    if (!cfg.tracking) return
    if (!bannerOn) {
      // no consent gate — inject immediately (owner's explicit choice)
      injectCustomScripts(cfg.tracking, true)
    }
  }, [state])

  React.useEffect(() => {
    if (state.kind !== "ready" || !config?.tracking) return
    const bannerOn = config.legal?.cookieConsent?.enabled === true
    if (!bannerOn) return // already injected immediately
    if (consent === "accepted") injectCustomScripts(config.tracking, true)
  }, [consent, state, config?.tracking])

  const decideConsent = (accepted: boolean) => {
    writeConsent(accepted ? "accepted" : "declined")
    setConsent(accepted ? "accepted" : "declined")
  }

  // pageview id as STATE (the relay needs it to join) — the ref stays for the
  // synchronous event handlers below
  const [pageviewId, setPageviewId] = React.useState<string | null>(null)

  // live relay (WebSocket presence — so the dashboard's "Right now" strip
  // updates the instant this page opens, without waiting for a poll)
  const relay = useVisitorRelay({
    projectId,
    pageviewId,
    device: detectDevice(),
    browser: detectBrowser(),
    variant,
    path: `/${slug}`,
    referrer: typeof document !== "undefined" ? document.referrer || "direct" : "direct",
  })

  // ── Load project by slug (last SAVED state — this is what "published" means)
  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const listRes = await fetch("/api/sites")
        const list = (await listRes.json()) as ProjectSummary[]
        const match = Array.isArray(list) ? list.find((p) => p.slug === slug) : undefined
        if (!match) {
          if (!cancelled) setState({ kind: "notfound", slug })
          return
        }
        const fullRes = await fetch(`/api/sites/${match.id}`)
        if (!fullRes.ok) throw new Error("Could not load the published config")
        const project = (await fullRes.json()) as ProjectWithConfig
        if (!cancelled) setState({ kind: "ready", project })
      } catch (e) {
        if (!cancelled) setState({ kind: "error", message: e instanceof Error ? e.message : "Unknown error" })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [slug])

  // ── Visitor tracking: pageview + A/B exposures, once per visit ────────────
  // Every enabled section test gets an independent, localStorage-stable
  // assignment. The PRIMARY test's variant (hero first) also tags the pageview
  // record itself — that powers per-variant duration/engagement in analytics.
  React.useEffect(() => {
    if (state.kind !== "ready" || trackedOnceRef.current) return
    trackedOnceRef.current = true
    const { id, config } = state.project

    const tests = getAbTests(config)
    const assigned = tests.length ? assignAbVariants(id, tests) : {}
    const primary = tests[0] ?? null
    const primaryName = primary ? assigned[primary.section.id] : null

    variantMapRef.current = assigned
    setVariantMap(assigned)
    setVariant(primaryName)
    for (const t of tests) {
      void track(id, { type: "variant_exposure", variant: assigned[t.section.id], label: t.section.id, path: `/${slug}` })
      setEvents((n) => n + 1)
    }

    void track(id, {
      type: "pageview",
      path: `/${slug}`,
      device: detectDevice(),
      browser: detectBrowser(),
      visitorId: getVisitorId(),
      variant: primaryName ?? undefined,
      variantMap: tests.length ? assigned : undefined,
      duration: 0,
      isBounce: true, // provisional bounce — engagement pings de-bounce this visit
    }).then((pageviewId) => {
      pageviewIdRef.current = pageviewId
      setPageviewId(pageviewId)
    })
    setEvents((n) => n + 1)
  }, [state, slug])

  // ── Engagement pings: real time-on-page + bounce updates ─────────────────
  // Every 15s while the tab is visible we report elapsed seconds; the final
  // ping rides on pagehide/visibilitychange with keepalive. Duration ≥ 15s or
  // an interaction (CTA click / form submit) marks the visit non-bounce.
  // Each ping also rides the WebSocket relay so dashboards tick in real time.
  const elapsedS = () => Math.floor((Date.now() - sessionStartRef.current) / 1000)
  React.useEffect(() => {
    if (state.kind !== "ready") return
    const ping = () => {
      const id = pageviewIdRef.current
      if (!id) return
      relay.heartbeat(elapsedS(), engagedRef.current)
      void pingEngagement(id, { duration: elapsedS(), ...(engagedRef.current ? { engaged: true } : {}) }).then((ok) => {
        if (ok) setSavedDuration(elapsedS())
      })
    }
    const interval = setInterval(() => {
      if (!document.hidden) ping()
    }, 15_000)
    const onVisibility = () => {
      if (document.visibilityState === "hidden") ping()
    }
    const onPageHide = () => ping()
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("pagehide", onPageHide)
    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("pagehide", onPageHide)
    }
  }, [state.kind, relay.heartbeat])

  // ── Sticky mobile CTA (conversion booster): a slim brand-colored bar on
  // phones, shown once the hero has scrolled away and hidden again when the
  // page's own final CTA is on screen — no nagging where the real ask lives.
  const [stickyCtaEligible, setStickyCtaEligible] = React.useState(false)
  const [finalCtaOnScreen, setFinalCtaOnScreen] = React.useState(false)
  const heroSection = config?.sections.find((s): s is Extract<Section, { type: "hero" }> => s.type === "hero" && !s.hidden)
  const stickyCtaLabel = heroSection?.cta.label?.trim()
  React.useEffect(() => {
    if (state.kind !== "ready") return
    // the published page scrolls inside its own overflow container (h-dvh),
    // so the listener rides that element — window.scrollY stays 0 here
    const scrollRoot = document.querySelector<HTMLElement>("[data-lf-scroll-root]")
    const readScroll = () => (scrollRoot ? scrollRoot.scrollTop : window.scrollY)
    const onScroll = () => setStickyCtaEligible(readScroll() > 600)
    onScroll()
    scrollRoot?.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("scroll", onScroll, { passive: true })
    // watch the final CTA — when it fills half the viewport, the sticky bar yields
    const anchors = sectionAnchors(state.project.config)
    const finalCta = state.project.config.sections.find((s) => s.type === "cta-final" && !s.hidden)
    let io: IntersectionObserver | undefined
    if (finalCta && typeof IntersectionObserver !== "undefined") {
      const el = document.getElementById(anchors.get(finalCta.id) ?? "cta")
      if (el) {
        io = new IntersectionObserver(
          (entries) => {
            for (const en of entries) setFinalCtaOnScreen(en.intersectionRatio >= 0.5)
          },
          { threshold: [0.5] },
        )
        io.observe(el)
      }
    }
    return () => {
      scrollRoot?.removeEventListener("scroll", onScroll)
      window.removeEventListener("scroll", onScroll)
      io?.disconnect()
    }
  }, [state])
  // hero opt-out (stickyCta === false) disables the bar entirely
  const stickyCtaVisible =
    stickyCtaEligible && !finalCtaOnScreen && !!stickyCtaLabel && heroSection?.stickyCta !== false
  // sticky CTA color follows the RESOLVED color scheme (visitor override aware)
  const resolvedMode = useResolvedMode(config?.themeId ?? "nebula", config?.brand.mode, modeOverride)
  const stickyAccent =
    (config?.brand.accent && config.brand.accent) ||
    (config ? themeVars(config.themeId, resolvedMode.mode).accent : "#8b5cf6")

  const onStickyCtaClick = () => {
    if (!heroSection || !stickyCtaLabel) return
    handleCtaClick(heroSection, `${stickyCtaLabel} (sticky)`)
    const href = heroSection.cta.href
    if (href.startsWith("#")) {
      document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" })
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  // ── Real page title from the project's SEO settings
  React.useEffect(() => {
    if (state.kind === "ready") document.title = state.project.config.seo.title || state.project.name
    return () => {
      document.title = "Forge Studio — build landing pages visually"
    }
  }, [state])

  // ── Locale: explicit ?lang= wins; else auto-detect from the browser when
  // the site ships multiple locales. Applies dir (RTL flips the whole page).
  React.useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("lang")?.toLowerCase().slice(0, 8)
    if (param && locales.some((l) => l.code === param)) {
      setLocale(param)
      return
    }
    if (!param && multi && !locale) {
      const nav = navigator.language?.toLowerCase().split("-")[0]
      if (nav && locales.some((l) => l.code === nav)) setLocale(nav)
    }
  }, [multi, locales.length])

  React.useEffect(() => {
    if (!config) return
    const active = locale ?? locales[0]?.code ?? "en"
    document.documentElement.lang = active
    document.documentElement.dir = dirFor(config, active)
  }, [config, locale, locales])

  const switchLocale = (code: string | null) => {
    setLocale(code)
    const url = new URL(window.location.href)
    if (code && code !== locales[0]?.code) url.searchParams.set("lang", code)
    else url.searchParams.delete("lang")
    window.history.replaceState(null, "", url)
    // re-run the deep-link scroll for the new locale's markup
    const hash = window.location.hash.slice(1).trim()
    if (hash) setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" }), 150)
  }

  // ── Deep links (#anchor): the page renders asynchronously, so the browser's
  // native hash-scroll fires before any section exists. Honor it once ready.
  React.useEffect(() => {
    if (state.kind !== "ready") return
    const hash = window.location.hash.slice(1).trim()
    if (!hash) return
    const t = setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 200)
    return () => clearTimeout(t)
  }, [state])

  // ── Section view tracking: each section that scrolls ≥50% into view fires
  // one section_view event (label = the section's meta label, the same
  // convention the traffic seeder uses). Powers the "Section performance"
  // panel on the dashboard: which parts of the page actually get read.
  // Hero is skipped — the pageview itself IS the hero read (funnel row 1);
  // sections under an A/B test get their event tagged with the visitor's
  // variant → per-variant read counts on the A/B card.
  React.useEffect(() => {
    if (state.kind !== "ready") return
    const { id, config } = state.project
    const root = document.querySelector<HTMLElement>(".lf-brand-font")
    if (!root || typeof IntersectionObserver === "undefined") return
    // anchor (DOM id) → section id, then section id → display label
    const secByAnchor = new Map<string, string>()
    for (const [secId, anchor] of sectionAnchors(config)) secByAnchor.set(anchor, secId)
    const labelBySec = new Map(config.sections.map((s) => [s.id, SECTION_META[s.type].label]))
    const typeBySec = new Map(config.sections.map((s) => [s.id, s.type]))
    // dedupe by LABEL per visit (not per section instance) — matches the
    // seeder's "distinct sections read" convention; two Features blocks
    // count as one "Features" read
    const seen = new Set<string>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          // "being read" = at least half of the section is visible, OR the
          // section spans the viewport top (reader scrolled INTO it — tall
          // sections like pricing can be taller than the viewport and would
          // otherwise never reach a 0.5 self-ratio)
          const rect = en.boundingClientRect
          const scrolledInto = rect.top <= 0 && rect.bottom > 0
          if (en.intersectionRatio < 0.5 && !scrolledInto) continue
          const secId = secByAnchor.get((en.target as HTMLElement).id)
          if (!secId) continue
          const label = labelBySec.get(secId) ?? "Section"
          if (seen.has(label)) continue
          seen.add(label)
          io.unobserve(en.target)
          const sec = config.sections.find((s) => s.id === secId)
          const readVariant = sec && sectionAb(sec)?.enabled ? variantMapRef.current[secId] : undefined
          void track(id, { type: "section_view", label, path: `/${slug}`, ...(readVariant ? { variant: readVariant } : {}) })
          setEvents((n) => n + 1)
        }
      },
      { root: null, threshold: [0, 0.5] },
    )
    for (const el of Array.from(root.querySelectorAll<HTMLElement>(":scope > div[id]"))) {
      // skip the hero block — the pageview already counts it
      const secId = secByAnchor.get(el.id)
      if (secId && typeBySec.get(secId) === "hero") continue
      io.observe(el)
    }
    return () => io.disconnect()
  }, [state, slug])

  // ── Handlers wired into the landing preview
  const handleCtaClick = React.useCallback(
    (section: Section, label: string) => {
      if (!projectId) return
      engagedRef.current = true
      relay.heartbeat(Math.floor((Date.now() - sessionStartRef.current) / 1000), true)
      if (pageviewIdRef.current) void pingEngagement(pageviewIdRef.current, { duration: Math.floor((Date.now() - sessionStartRef.current) / 1000), engaged: true })
      setClicks((n) => n + 1)
      setEvents((n) => n + 1)
      // clicks attribute to the section's own test when it has one, else the primary variant
      const tagged = sectionAb(section)?.enabled ? variantMap[section.id] : variant
      void track(projectId, {
        type: "cta_click",
        label: `${section.type}: ${label}`,
        variant: tagged ?? undefined,
        path: `/${slug}`,
      })
      // perform the CTA's action: smooth-scroll to its target (or open an
      // external link) — a click the visitor can SEE, not just a tracked event
      const nav = runCtaNavigation(section, ctaHrefFor(section, label))
      toast.success("CTA click tracked", { description: nav ? `${label} → ${nav}` : label })
    },
    [projectId, variant, variantMap, slug, relay.heartbeat]
  )

  const handleFormSubmit = React.useCallback(
    (section: Section, data: Record<string, string>) => {
      if (!projectId) return
      engagedRef.current = true
      relay.heartbeat(Math.floor((Date.now() - sessionStartRef.current) / 1000), true)
      if (pageviewIdRef.current) void pingEngagement(pageviewIdRef.current, { duration: Math.floor((Date.now() - sessionStartRef.current) / 1000), engaged: true })
      setEvents((n) => n + 1)
      setLeadsSent((n) => n + 1)
      void track(projectId, { type: "form_submit", label: `${section.type}: ${Object.keys(data).join(", ")}`, path: `/${slug}` })

      // sheets delivery: no-cors POST to the Google Apps Script Web App
      // (v21 parity — the browser can't read the response, but the row lands);
      // the lead ALSO mirrors into the inbox below so nothing is lost
      const webhook =
        section.type === "contact" && section.delivery === "sheets" ? section.sheetWebhookUrl : undefined
      if (webhook && /^https:\/\//i.test(webhook)) {
        void fetch(webhook, {
          method: "POST",
          mode: "no-cors",
          headers: { "content-type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ ...data, submittedAt: new Date().toISOString() }),
        }).catch(() => undefined)
      }

      void fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId, fields: data }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          const lead = j?.lead as { name?: string; email?: string } | undefined
          toast.success("Message sent", {
            description: webhook
              ? `Saved to your Google Sheet — and the leads inbox.`
              : lead?.name
                ? `Thanks ${lead.name.split(" ")[0]} — we'll be in touch.`
                : "We'll be in touch.",
          })
        })
        .catch(() => undefined)
    },
    [projectId, slug, relay.heartbeat]
  )

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
      toast.success("Link copied", { description: "Anyone with this URL sees the published page." })
    } catch {
      toast.error("Copy failed", { description: "Select the URL in the address bar instead." })
    }
  }

  // ── Loading / error / 404 states
  if (state.kind === "loading") {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-zinc-950 text-zinc-100">
        <div className="relative">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          <div className="absolute inset-0 animate-ping rounded-full bg-violet-500/20" aria-hidden />
        </div>
        <div className="text-center">
          <p className="text-[13px] font-semibold text-zinc-200">Opening published page…</p>
          <p className="mt-0.5 font-mono text-[11px] text-zinc-500">/p/{slug}</p>
        </div>
      </div>
    )
  }

  if (state.kind === "notfound" || state.kind === "error") {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-5 bg-zinc-950 px-6 text-zinc-100">
        <div className="flex size-14 items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/60">
          {state.kind === "notfound" ? <SearchX className="h-6 w-6 text-zinc-500" /> : <Radio className="h-6 w-6 text-rose-400" />}
        </div>
        <div className="max-w-sm text-center">
          <p className="text-[15px] font-semibold text-zinc-100">
            {state.kind === "notfound" ? "No page published at this address" : "The published page could not load"}
          </p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-500">
            {state.kind === "notfound" ? (
              <>
                Nothing is published for <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-violet-300">/p/{state.slug}</code>. Double-check
                the link, or open the studio to publish a project.
              </>
            ) : (
              state.message
            )}
          </p>
        </div>
        <Button asChild size="sm" className="gap-1.5 bg-violet-500 text-white hover:bg-violet-600">
          <a href="/">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to the studio
          </a>
        </Button>
      </div>
    )
  }

  // ── The published page itself
  const { name } = state.project
  return (
    <div data-lf-scroll-root className="relative h-dvh overflow-y-auto bg-zinc-950 lf-scroll [scroll-behavior:smooth]">
      <LandingPreview
        config={displayConfig!}
        abVariant={variant}
        abVariants={variantMap}
        onCtaClick={handleCtaClick}
        onFormSubmit={handleFormSubmit}
        modeOverride={modeOverride}
        consent={{
          visible: consent === "unknown",
          onDecide: decideConsent,
        }}
        className="min-h-full"
      />

      {/* Sticky mobile CTA — brand-colored quick action on phones. Appears
          once the hero scrolls away; yields when the final CTA is in view. */}
      {stickyCtaVisible && stickyCtaLabel && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 animate-[lf-fade-up_0.3s_ease-out] sm:hidden"
          role="complementary"
          aria-label="Quick action"
        >
          <div className="flex items-center gap-3 border-t border-zinc-700/50 bg-zinc-950/92 px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-[0_-12px_32px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <span className="size-2 shrink-0 rounded-full" style={{ background: stickyAccent }} aria-hidden />
            <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-zinc-200">{name}</span>
            <button
              type="button"
              onClick={onStickyCtaClick}
              className="flex h-9 shrink-0 items-center rounded-lg px-4 text-[12px] font-bold text-white shadow-lg transition-transform active:scale-95"
              style={{ background: stickyAccent, boxShadow: `0 8px 22px -6px ${stickyAccent}66` }}
              title={`Quick action — ${stickyCtaLabel}`}
            >
              {stickyCtaLabel}
            </button>
          </div>
        </div>
      )}

      {/* Floating "published preview" chrome — live session telemetry */}
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 transition-[padding] duration-300",
          stickyCtaVisible ? "pb-16 sm:pb-3" : "pb-3",
        )}
      >
        <div
          className={cn(
            "pointer-events-none flex max-w-full flex-col items-center transition-all duration-300",
            chromeOpen ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          )}
        >
          <div className="pointer-events-auto flex max-w-full items-center gap-2 overflow-hidden rounded-xl border border-zinc-700/60 bg-zinc-950/85 px-2.5 py-2 shadow-2xl shadow-black/50 backdrop-blur-xl">
            {/* live pulse — violet ring when riding the real-time relay */}
            <span className="relative flex size-2 shrink-0" aria-hidden>
              {relay.connected && (
                <span className="absolute -inset-1 rounded-full bg-violet-500/25" title="Streaming live to the analytics dashboard" />
              )}
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            <span className="hidden shrink-0 text-[11px] font-semibold text-emerald-300 sm:inline" title={relay.connected ? "Live — streaming presence to the dashboard in real time" : "Live — analytics sync every 15s"}>
              Live{relay.connected && <span className="text-violet-300">·push</span>}
            </span>

            <span className="hidden h-4 w-px shrink-0 bg-zinc-700/60 sm:block" aria-hidden />

            {/* project identity */}
            <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-zinc-200" title={`Published page — ${name}`}>
              <Link2 className="h-3 w-3 shrink-0 text-violet-300" />
              <span className="max-w-[110px] truncate sm:max-w-[180px]">{name}</span>
            </span>

            {/* session telemetry */}
            <span className="hidden items-center gap-3 font-mono text-[10px] text-zinc-400 md:flex" aria-label="Your visit is being tracked, privacy-friendly">
              {variant && (
                <span
                  className="flex items-center gap-1 rounded bg-violet-500/15 px-1.5 py-0.5 font-bold text-violet-300"
                  title={`You are in A/B group ${variant} — this visit's engagement counts toward that variant`}
                >
                  <span className="text-[9px] uppercase tracking-wider">grp</span> {variant}
                </span>
              )}
              <span className="flex items-center gap-1" title={savedDuration > 0 ? `Time on page — synced to analytics (${savedDuration}s saved)` : "Time on page — synced to analytics every 15s"}>
                <Timer className={cn("h-3 w-3", savedDuration > 0 && "text-emerald-400/80")} />
                <SessionTimer since={sessionStartRef.current} />
                {savedDuration > 0 && <span className="text-emerald-400/80" title="Duration synced to the analytics dashboard">✓</span>}
              </span>
              <span className="flex items-center gap-1" title="CTA clicks this visit">
                <MousePointerClick className="h-3 w-3" />
                {clicks}
              </span>
              <span className="flex items-center gap-1" title="Analytics events sent this visit">
                <Radio className="h-3 w-3" />
                {events}
                {leadsSent > 0 && <span className="text-fuchsia-300"> · {leadsSent} msg</span>}
              </span>
            </span>

            <span className="h-4 w-px shrink-0 bg-zinc-700/60" aria-hidden />

            {/* actions */}
            <div className="flex shrink-0 items-center gap-1">
              {/* color-scheme toggle — visitor-side dark/light flip */}
              <button
                type="button"
                onClick={flipMode}
                aria-label={modeOverride === "dark" ? "Switch page to light mode" : "Switch page to dark mode"}
                title={
                  modeOverride === "dark"
                    ? "Dark override on — click for light"
                    : modeOverride === "light"
                      ? "Light override on — click for dark"
                      : "Follows your system — click to force dark"
                }
                className="flex size-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
              >
                {modeOverride === "light" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </button>
              {multi && (
                <div
                  className="flex h-7 items-center gap-0.5 rounded-lg border border-zinc-700/60 bg-zinc-900/70 p-0.5"
                  role="group"
                  aria-label="Page language"
                  title="Switch language — translations are AI-generated per section"
                >
                  <Languages className="ml-1 h-3 w-3 text-zinc-500" aria-hidden />
                  {locales.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => switchLocale(l.code === locales[0]?.code ? null : l.code)}
                      aria-current={(locale ?? locales[0]?.code) === l.code || undefined}
                      className={cn(
                        "flex h-6 items-center rounded-md px-1.5 text-[10px] font-bold transition-colors",
                        (locale ?? locales[0]?.code) === l.code
                          ? "bg-violet-500/25 text-violet-100"
                          : "text-zinc-500 hover:text-zinc-200"
                      )}
                    >
                      {l.code.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 rounded-lg px-2 text-[11px] text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                onClick={() => void copyLink()}
                title="Copy the published link"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span className="hidden sm:inline">Copy link</span>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 rounded-lg px-2 text-[11px] text-violet-300 hover:bg-violet-500/15 hover:text-violet-200"
                title="Open the studio editor for this workspace"
              >
                <a href="/">
                  <ExternalLink className="h-3 w-3" />
                  <span className="hidden sm:inline">Studio</span>
                </a>
              </Button>
            </div>
          </div>

          {/* privacy footnote + collapse toggle */}
          <div className="pointer-events-auto mt-1.5 flex items-center gap-2">
            <p className="rounded-full bg-zinc-950/70 px-2.5 py-0.5 text-[9px] text-zinc-500 backdrop-blur">
              Privacy-friendly analytics · no cookies · anonymous id
            </p>
            <button
              type="button"
              onClick={() => setChromeOpen(false)}
              aria-label="Hide published preview controls"
              title="Hide controls"
              className="flex size-5 items-center justify-center rounded-full bg-zinc-950/70 text-zinc-500 backdrop-blur transition-colors hover:text-zinc-200"
            >
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* collapsed FAB */}
        {!chromeOpen && (
          <button
            type="button"
            onClick={() => setChromeOpen(true)}
            aria-label="Show published preview controls"
            title="Show controls"
            className="pointer-events-auto absolute bottom-0 flex items-center gap-1.5 rounded-full border border-zinc-700/60 bg-zinc-950/85 py-1.5 pl-2.5 pr-3 text-[10px] font-semibold text-zinc-300 shadow-xl shadow-black/40 backdrop-blur transition-colors hover:border-violet-500/50 hover:text-violet-200"
          >
            <ChevronUp className="h-3 w-3" />
            <span className="flex size-1.5 rounded-full bg-emerald-400" aria-hidden />
            {events} tracked
          </button>
        )}
      </div>
    </div>
  )
}
