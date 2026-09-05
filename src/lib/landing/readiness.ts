import type { LandingConfig } from "./types"
import { collectAnchorLinks, findBrokenAnchorLinks } from "./anchors"
import { getAbTests, sectionAb } from "./ab"

export type ReadinessLevel = "pass" | "warn" | "fail"

export interface ReadinessCheck {
  id: string
  category: "structure" | "seo" | "conversion" | "export"
  label: string
  detail: string
  level: ReadinessLevel
  weight: number
  /** Select this section in the studio when the item is clicked (fix action). */
  selectSectionId?: string
}

export interface ReadinessReport {
  score: number // 0-100
  grade: "A" | "B" | "C" | "D"
  checks: ReadinessCheck[]
  counts: { pass: number; warn: number; fail: number }
  /** Non-scoring growth ideas (e.g. "test a value-framed pricing title") —
   *  never affect the score; clicking one jumps to the section. */
  suggestions: ReadinessSuggestion[]
}

export interface ReadinessSuggestion {
  id: string
  label: string
  detail: string
  selectSectionId?: string
}

const TITLE_MIN = 30
const TITLE_MAX = 60
const DESC_MIN = 70
const DESC_MAX = 160
const HEADLINE_MIN = 20
const HEADLINE_MAX = 90

/** Share-image presence (mirrors the export's og:image fallback chain —
 *  explicit ogImage → hero image → gallery image; placeholder art excluded). */
function pickShareImageLike(config: LandingConfig): string | null {
  if (config.seo?.ogImage) return config.seo.ogImage
  const hero = config.sections.find((s) => s.type === "hero")
  if (hero && hero.type === "hero" && hero.image && /^https?:/.test(hero.image)) return hero.image
  const gallery = config.sections.find((s) => s.type === "gallery")
  if (gallery && gallery.type === "gallery") {
    const img = gallery.items?.find((i) => i.src && /^https?:/.test(i.src))
    if (img?.src) return img.src
  }
  return null
}

/**
 * Audit a landing config for launch readiness — structure, SEO and conversion
 * essentials. Pure function: no React, no store. Returns weighted score + grade.
 */
export function auditConfig(config: LandingConfig): ReadinessReport {
  const sections = config.sections
  const visible = sections.filter((s) => !s.hidden)
  const find = (type: string) => visible.find((s) => s.type === type)

  const hero = find("hero")
  const navbar = find("navbar")
  const footer = find("footer")
  const social = find("testimonials") ?? find("logos")
  const pricing = find("pricing")
  const faq = find("faq")
  const finalCta = find("cta-final")
  const contact = find("contact")
  const announcement = find("announcement")
  const problem = find("problem")
  const solution = find("solution")
  const video = find("video")
  const comparison = find("comparison")
  const guarantee = find("guarantee")
  const hiddenCount = sections.length - visible.length

  const checks: ReadinessCheck[] = []

  // ── Structure ──────────────────────────────────────────────────────────────
  checks.push(
    hero
      ? {
          id: "hero",
          category: "structure",
          label: "Hero section",
          detail: "Every landing page needs a hero with a clear value proposition.",
          level: "pass",
          weight: 15,
          selectSectionId: hero.id,
        }
      : {
          id: "hero",
          category: "structure",
          label: "Hero section",
          detail: "No hero found — add one so visitors see your pitch instantly.",
          level: "fail",
          weight: 15,
        }
  )

  if (hero && hero.type === "hero") {
    const ctaOk = hero.cta.label.trim().length > 2 && hero.cta.href.trim().length > 0
    checks.push({
      id: "hero-cta",
      category: "structure",
      label: "Primary CTA",
      detail: ctaOk
        ? `“${hero.cta.label}” is wired and ready.`
        : "Hero CTA is missing a label or destination — visitors won't know what to do.",
      level: ctaOk ? "pass" : "fail",
      weight: 10,
      selectSectionId: hero.id,
    })

    const len = hero.headline.length
    checks.push({
      id: "headline-length",
      category: "structure",
      label: "Headline length",
      detail:
        len < HEADLINE_MIN
          ? `Headline is ${len} chars — aim for ${HEADLINE_MIN}–${HEADLINE_MAX} so the value lands.`
          : len > HEADLINE_MAX
            ? `Headline is ${len} chars — trim toward ${HEADLINE_MIN}–${HEADLINE_MAX} for punch.`
            : `${len} chars — right in the sweet spot.`,
      level: len >= HEADLINE_MIN && len <= HEADLINE_MAX ? "pass" : "warn",
      weight: 5,
      selectSectionId: hero.id,
    })

    const heroTests = getAbTests({ sections: [hero] })
    const abOn = heroTests.length > 0
    checks.push({
      id: "ab",
      category: "conversion",
      label: "A/B experiment",
      detail: abOn
        ? `Live with ${heroTests[0].ab.variants.length} variants — winner auto-promotes at ${heroTests[0].ab.sampleSize} exposures.`
        : "No A/B test on the hero. Enable one to let data pick your best headline.",
      level: abOn ? "pass" : "warn",
      weight: 5,
      selectSectionId: hero.id,
    })
  }

  // section-level experiments beyond the hero (pricing, final CTA…)
  {
    const allTests = getAbTests(config)
    const sectionTests = allTests.filter((t) => t.section.type !== "hero")
    if (sectionTests.length > 0) {
      checks.push({
        id: "ab-sections",
        category: "conversion",
        label: "Section experiments",
        detail: `${sectionTests.length} section-level test${sectionTests.length > 1 ? "s" : ""} live — ${sectionTests.map((t) => t.section.type).join(", ")}.`,
        level: "pass",
        weight: 5,
        selectSectionId: sectionTests[0].section.id,
      })
    }
  }

  checks.push(
    navbar
      ? { id: "navbar", category: "structure", label: "Navigation", detail: "Navbar present — brand + links anchor the page.", level: "pass" as ReadinessLevel, weight: 5, selectSectionId: navbar.id }
      : { id: "navbar", category: "structure", label: "Navigation", detail: "No navbar — visitors lose orientation on long pages.", level: "fail" as ReadinessLevel, weight: 5 }
  )

  checks.push(
    footer
      ? { id: "footer", category: "structure", label: "Footer", detail: "Footer present with links and legal line.", level: "pass" as ReadinessLevel, weight: 5, selectSectionId: footer.id }
      : { id: "footer", category: "structure", label: "Footer", detail: "No footer — add one for links, social and trust.", level: "fail" as ReadinessLevel, weight: 5 }
  )

  checks.push(
    social
      ? { id: "social-proof", category: "conversion", label: "Social proof", detail: social.type === "testimonials" ? "Testimonials build trust with real voices." : "A logo wall signals adoption by known companies.", level: "pass" as ReadinessLevel, weight: 10, selectSectionId: social.id }
      : { id: "social-proof", category: "conversion", label: "Social proof", detail: "No testimonials or logo wall — add social proof to de-risk the decision.", level: "warn" as ReadinessLevel, weight: 10 }
  )

  checks.push(
    pricing
      ? { id: "pricing", category: "conversion", label: "Pricing", detail: "Pricing section present — buyers can self-qualify.", level: "pass" as ReadinessLevel, weight: 5, selectSectionId: pricing.id }
      : { id: "pricing", category: "conversion", label: "Pricing", detail: "No pricing — fine for pre-launch, expected once you sell.", level: "warn" as ReadinessLevel, weight: 5 }
  )

  checks.push(
    faq
      ? { id: "faq", category: "conversion", label: "FAQ", detail: "FAQ pre-answers objections before the final CTA.", level: "pass" as ReadinessLevel, weight: 5, selectSectionId: faq.id }
      : { id: "faq", category: "conversion", label: "FAQ", detail: "No FAQ — common objections go unanswered.", level: "warn" as ReadinessLevel, weight: 5 }
  )

  checks.push(
    finalCta
      ? { id: "final-cta", category: "conversion", label: "Final CTA", detail: "Closing CTA converts readers at the bottom of the page.", level: "pass" as ReadinessLevel, weight: 10, selectSectionId: finalCta.id }
      : { id: "final-cta", category: "conversion", label: "Final CTA", detail: "No final CTA — the page ends without a last ask.", level: "fail" as ReadinessLevel, weight: 10 }
  )

  checks.push(
    contact
      ? { id: "contact", category: "conversion", label: "Contact capture", detail: "Contact form gives visitors a low-friction path.", level: "pass" as ReadinessLevel, weight: 5, selectSectionId: contact.id }
      : { id: "contact", category: "conversion", label: "Contact capture", detail: "No contact section or form to capture intent.", level: "warn" as ReadinessLevel, weight: 5 }
  )

  // ── Narrative arc (problem → solution) — only scored when the story starts ──
  if (problem || solution) {
    const both = Boolean(problem && solution)
    checks.push({
      id: "narrative-arc",
      category: "conversion",
      label: "Problem → solution arc",
      detail: both
        ? "The page argues its case: pain first, then the turn. Classic conversion structure."
        : `${problem ? "Problem" : "Solution"} without its counterpart — pair them so the story lands.`,
      level: both ? "pass" : "warn",
      weight: 5,
      selectSectionId: (problem ?? solution)?.id,
    })
  }

  // ── Risk reversal (guarantee) — bonus, present → scored ──────────────────
  if (guarantee) {
    checks.push({
      id: "guarantee",
      category: "conversion",
      label: "Risk reversal",
      detail: "A guarantee de-risks the decision right before the final CTA.",
      level: "pass",
      weight: 5,
      selectSectionId: guarantee.id,
    })
  }

  // ── Media proof (video) ────────────────────────────────────────────────────
  if (video) {
    checks.push({
      id: "video",
      category: "conversion",
      label: "Video proof",
      detail: "A demo video carries visitors who won't read copy.",
      level: "pass",
      weight: 3,
      selectSectionId: video.id,
    })
  }

  // ── Competitive framing (comparison) ───────────────────────────────────────
  if (comparison) {
    checks.push({
      id: "comparison",
      category: "conversion",
      label: "Competitive framing",
      detail: "A you-vs-them table gives evaluators a reason to pick you.",
      level: "pass",
      weight: 3,
      selectSectionId: comparison.id,
    })
  }

  // ── Announcement bar — optional urgency/attention strip ─────────────────────
  if (announcement) {
    checks.push({
      id: "announcement",
      category: "structure",
      label: "Announcement bar",
      detail:
        announcement.type === "announcement" && announcement.style === "countdown"
          ? "Countdown bar live — urgency ticking at the top of every visit."
          : "Announcement bar present — a quiet persistent broadcast above the fold.",
      level: "pass",
      weight: 2,
      selectSectionId: announcement.id,
    })
  }

  checks.push({
    id: "length",
    category: "structure",
    label: "Page depth",
    detail:
      visible.length >= 5
        ? `${visible.length} visible sections — solid narrative arc.`
        : `${visible.length} sections — a fuller story converts better (aim for 5+).`,
    level: visible.length >= 5 ? "pass" : "warn",
    weight: 5,
  })

  checks.push({
    id: "hidden",
    category: "structure",
    label: "Hidden sections",
    detail:
      hiddenCount === 0
        ? "Nothing hidden — your whole draft will ship."
        : `${hiddenCount} section${hiddenCount > 1 ? "s" : ""} hidden and won't deploy. Un-hide or delete to clean up.`,
    level: hiddenCount === 0 ? "pass" : "warn",
    weight: 3,
  })

  // ── In-page navigation: every #anchor link must resolve to a section ──────
  const brokenLinks = findBrokenAnchorLinks(config)
  const anchorLinks = collectAnchorLinks(config)
  checks.push({
    id: "anchor-links",
    category: "structure",
    label: "Anchor links",
    detail:
      anchorLinks.length === 0
        ? "No in-page anchor links — navbar/footer links pointing at sections would aid navigation."
        : brokenLinks.length === 0
          ? `${anchorLinks.length} in-page link${anchorLinks.length > 1 ? "s" : ""} — all resolve to sections. ✓`
          : `${brokenLinks.length} broken: ${brokenLinks
              .slice(0, 3)
              .map((b) => `“${b.label}” → #${b.target}`)
              .join(" · ")}${brokenLinks.length > 3 ? " …" : ""} — nothing on the page has that anchor.`,
    level: anchorLinks.length === 0 ? "warn" : brokenLinks.length === 0 ? "pass" : "fail",
    weight: 5,
    selectSectionId: brokenLinks[0]?.sectionId,
  })

  // ── SEO ────────────────────────────────────────────────────────────────────
  const titleLen = config.seo.title.length
  checks.push({
    id: "seo-title",
    category: "seo",
    label: "SEO title",
    detail:
      titleLen === 0
        ? "Meta title is empty — search engines will invent one."
        : titleLen < TITLE_MIN
          ? `${titleLen} chars — a little short for keyword real estate (${TITLE_MIN}–${TITLE_MAX}).`
          : titleLen > TITLE_MAX
            ? `${titleLen} chars — will be cut off in results (${TITLE_MIN}–${TITLE_MAX}).`
            : `${titleLen} chars — ideal.`,
    level: titleLen >= TITLE_MIN && titleLen <= TITLE_MAX ? "pass" : titleLen === 0 ? "fail" : "warn",
    weight: 10,
  })

  const descLen = config.seo.description.length
  checks.push({
    id: "seo-desc",
    category: "seo",
    label: "Meta description",
    detail:
      descLen === 0
        ? "Meta description is empty — write one to control your search snippet."
        : descLen < DESC_MIN
          ? `${descLen} chars — expand toward ${DESC_MIN}–${DESC_MAX}.`
          : descLen > DESC_MAX
            ? `${descLen} chars — trim toward ${DESC_MIN}–${DESC_MAX}.`
            : `${descLen} chars — ideal.`,
    level: descLen >= DESC_MIN && descLen <= DESC_MAX ? "pass" : descLen === 0 ? "fail" : "warn",
    weight: 10,
  })

  checks.push({
    id: "brand",
    category: "seo",
    label: "Brand name",
    detail: config.brand.name.trim() ? `“${config.brand.name}” is set.` : "Brand name is empty.",
    level: config.brand.name.trim() ? "pass" : "fail",
    weight: 2,
  })

  // ── Standalone export — what the single HTML file will and won't do ────────
  if (contact) {
    const c = contact as { delivery?: string; sheetWebhookUrl?: string; googleFormUrl?: string; email?: string }
    const delivery = c.delivery ?? "inbox"
    if (delivery === "sheets") {
      const hookOk = Boolean(c.sheetWebhookUrl && /^https:\/\//i.test(c.sheetWebhookUrl))
      checks.push({
        id: "export-form",
        category: "export",
        label: "Export form → Google Sheet",
        detail: hookOk
          ? "Submissions POST straight to your Apps Script webhook — works from any host."
          : "Sheets delivery without a webhook URL — the exported form would be dead. Paste the Web App URL.",
        level: hookOk ? "pass" : "fail",
        weight: 4,
        selectSectionId: contact.id,
      })
    } else if (delivery === "embed") {
      const embedOk = Boolean(c.googleFormUrl && /^https:\/\//i.test(c.googleFormUrl))
      checks.push({
        id: "export-form",
        category: "export",
        label: "Export form → embedded Google Form",
        detail: embedOk
          ? "The frame handles its own submissions — fully self-contained in the export."
          : "Embed mode without a form URL — add it or the section ships as a placeholder card.",
        level: embedOk ? "pass" : "fail",
        weight: 4,
        selectSectionId: contact.id,
      })
    } else {
      const mailtoOk = Boolean(c.email)
      checks.push({
        id: "export-form",
        category: "export",
        label: "Export form delivery",
        detail: mailtoOk
          ? `No backend in a standalone file — submissions open the visitor's mail app as a prefilled draft to ${c.email}. Set a Sheet webhook for silent capture.`
          : "Inbox-only delivery with no contact email — the exported form has nowhere to go. Set a webhook, an embedded form, or an email.",
        level: mailtoOk ? "warn" : "fail",
        weight: 4,
        selectSectionId: contact.id,
      })
    }
  }

  if (announcement) {
    const a = announcement as { style?: string; deadline?: string }
    if (a.style === "countdown") {
      const deadlineOk = Boolean(a.deadline && !Number.isNaN(Date.parse(a.deadline)))
      checks.push({
        id: "export-countdown",
        category: "export",
        label: "Countdown in the export",
        detail: deadlineOk
          ? "The timer ticks live in the exported file — same vanilla engine as the app."
          : "Countdown style without a valid deadline — the exported bar renders static.",
        level: deadlineOk ? "pass" : "warn",
        weight: 2,
        selectSectionId: announcement.id,
      })
    }
  }

  const interactiveGallery = visible.find(
    (s) => (s.type === "gallery" && (s.style === "slider" || s.style === "stories")) || s.type === "faq" || s.type === "testimonials",
  )
  if (interactiveGallery) {
    checks.push({
      id: "export-interactive",
      category: "export",
      label: "Interactive blocks stay alive",
      detail:
        interactiveGallery.type === "gallery"
          ? "Gallery slider/stories keep their gestures + progress rail — pure vanilla JS in the file."
          : "FAQ accordion / testimonial interactions run from the inlined script — no framework shipped.",
      level: "pass",
      weight: 2,
      selectSectionId: interactiveGallery.id,
    })
  }

  {
    const locales = config.i18n?.locales?.length ?? 1
    checks.push({
      id: "export-locale",
      category: "export",
      label: "Locale in the export",
      detail:
        locales > 1
          ? `${locales} locales configured — each export ships ONE at a time (pick it in the dialog). The published page keeps the live switcher.`
          : "Single locale — the export matches the published page exactly.",
      level: locales > 1 ? "warn" : "pass",
      weight: 2,
    })
  }

  {
    const hasWebfont = Boolean(config.brand.font?.startsWith("g-"))
    checks.push({
      id: "export-fonts",
      category: "export",
      label: "Fonts in the export",
      detail: hasWebfont
        ? "Webfont pair streams from Google Fonts with preconnects — same face as the studio, system stack as offline fallback."
        : "System font stack — zero network requests, renders identically everywhere.",
      level: "pass",
      weight: 1,
    })
  }

  {
    const scripts = Boolean(config.tracking?.headScripts?.trim() || config.tracking?.bodyScripts?.trim())
    const banner = config.legal?.cookieConsent?.enabled === true
    if (scripts) {
      checks.push({
        id: "export-scripts",
        category: "export",
        label: "Custom scripts in the export",
        detail: banner
          ? "GA4/Pixel/chat tags ship consent-gated — they only run after the visitor accepts."
          : "Custom tags inject immediately on load — no consent banner is enabled (GDPR caution).",
        level: banner ? "pass" : "warn",
        weight: 3,
      })
    } else if (banner) {
      checks.push({
        id: "export-scripts",
        category: "export",
        label: "Consent banner in the export",
        detail: "The banner ships hidden and reveals via script — JS-off visitors see no banner and load no scripts.",
        level: "pass",
        weight: 2,
      })
    }
  }

  checks.push({
    id: "export-og",
    category: "export",
    label: "Social share image",
    detail: pickShareImageLike(config)
      ? "og:image/Twitter card ship — link previews render with artwork."
      : "No social image set — link previews stay text-only. Set one in Page → SEO (hero images work too).",
    level: pickShareImageLike(config) ? "pass" : "warn",
    weight: 2,
  })

  // ── Score ──────────────────────────────────────────────────────────────────
  const totalWeight = checks.reduce((a, c) => a + c.weight, 0)
  const earned = checks.reduce((a, c) => a + (c.level === "pass" ? c.weight : 0), 0)
  const score = Math.round((earned / totalWeight) * 100)
  const grade: ReadinessReport["grade"] = score >= 90 ? "A" : score >= 75 ? "B" : score >= 60 ? "C" : "D"

  // ── Growth ideas (non-scoring) ──────────────────────────────────────────
  // AB-capable sections that could run their own experiment, by leverage.
  const SUGGEST_META: { type: string; label: string; detail: string }[] = [
    { type: "pricing", label: "Test a pricing headline", detail: "Pricing copy is a high-leverage experiment — try a value-framed title (“Simple plans that scale with you”) against the current one." },
    { type: "cta-final", label: "Test the closing CTA", detail: "The final CTA converts readers at the bottom — an urgency or outcome-framed headline often moves it." },
    { type: "contact", label: "Test the contact title", detail: "A warmer contact-form title (“Let's talk about your project”) can lift submit rates." },
    { type: "features", label: "Test the features framing", detail: "Benefit-led vs. capability-led feature titles land differently — worth an experiment." },
    { type: "testimonials", label: "Test the proof heading", detail: "How you frame social proof (“Loved by teams everywhere”) changes how it's read." },
    { type: "faq", label: "Test the FAQ heading", detail: "A question-style FAQ title can outperform a plain label — cheap to try." },
  ]
  const testsByType = new Map<string, number>() // section type → enabled tests
  for (const t of getAbTests(config)) testsByType.set(t.section.type, (testsByType.get(t.section.type) ?? 0) + 1)
  const suggestions: ReadinessSuggestion[] = []
  for (const meta of SUGGEST_META) {
    const tested = (testsByType.get(meta.type) ?? 0) > 0
    const section = visible.find((s) => s.type === meta.type && !sectionAb(s)?.enabled)
    if (section && !tested) {
      suggestions.push({ id: `suggest-${meta.type}`, label: meta.label, detail: meta.detail, selectSectionId: section.id })
    }
    if (suggestions.length >= 3) break
  }

  return {
    score,
    grade,
    checks,
    counts: {
      pass: checks.filter((c) => c.level === "pass").length,
      warn: checks.filter((c) => c.level === "warn").length,
      fail: checks.filter((c) => c.level === "fail").length,
    },
    suggestions,
  }
}
