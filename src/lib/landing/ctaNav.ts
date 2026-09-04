import type { Section } from "./types"

// ─────────────────────────────────────────────────────────────────────────────
// CTA navigation — what a landing-page CTA button DOES when a visitor clicks it
//
// Why this exists: every CTA button used to fire ONLY a tracking event. The
// most prominent, most inviting buttons on the page ("Get started", "Go Pro",
// "Start free trial") had no visible response — clicks felt dead ("no buttons
// working"). Sections configure `cta.href` ("#anchor" or an external URL);
// this module turns that config into actual navigation, with a sensible
// fallback ladder when a section has no href of its own (e.g. pricing plans).
// ─────────────────────────────────────────────────────────────────────────────

/** Resolve the configured href for the CTA that was clicked, if the section has one. */
export function ctaHrefFor(section: Section, label: string): string | undefined {
  if (section.type === "hero") {
    if (section.secondaryCta && label === section.secondaryCta.label) return section.secondaryCta.href
    return section.cta.href
  }
  if (section.type === "navbar") return section.cta?.href
  if (section.type === "cta-final") return section.cta.href
  return undefined // pricing plans & newsletter subscribes use the fallback ladder / no-op
}

function slugify(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "")
}

/** The anchor id this section itself renders under (mirrors LandingPreview.anchorFor). */
function ownAnchor(section: Section): string {
  const custom = section.anchor ? slugify(section.anchor) : ""
  if (custom) return custom
  if (section.type === "hero") return "top"
  if (section.type === "cta-final") return "cta"
  return section.type
}

const EXTERNAL = /^(https?:)?\/\//i

/**
 * Run the CTA's navigation.
 *
 * - external URL → opens in a new tab (keeps the studio/preview context intact)
 * - "#anchor"    → smooth-scrolls to that section (works inside the custom
 *                  scroll roots: published page + studio test preview)
 * - fallbacks    → per-section ladder when no usable href exists, e.g. a
 *                  pricing plan button leads to the final CTA / contact form
 *
 * Returns a short description of what happened (`"#cta"`, `"opened in a new
 * tab"`) for toast feedback, or null when the click had nothing to navigate
 * to (e.g. the footer newsletter — its inline "subscribed" state is the
 * response) so callers can skip the hint.
 */
export function runCtaNavigation(section: Section, href: string | undefined): string | null {
  const raw = (href ?? "").trim()

  if (EXTERNAL.test(raw)) {
    window.open(raw, "_blank", "noopener,noreferrer")
    return "opened in a new tab"
  }

  const own = ownAnchor(section)
  const ids: string[] = []
  if (raw.startsWith("#")) {
    const id = raw.slice(1).trim()
    if (id) ids.push(id)
  } else if (raw) {
    // mailto:, tel: and friends — hand them to the browser
    window.location.href = raw
    return null
  }

  // Fallback ladders (self-targets are no-ops and get skipped below):
  //  - cta-final: its href usually points at itself → loop the reader back to the hero
  //  - pricing:   plan buttons have no per-plan href → final CTA → contact form → hero
  //  - hero/navbar without a usable href: guide the visitor down the funnel
  if (section.type === "cta-final") ids.push("top")
  else if (section.type === "pricing") ids.push("cta", "contact", "top")
  else if (section.type === "hero" || section.type === "navbar") ids.push("cta", "contact", "pricing", "top")

  if (ids.length === 0) return null

  for (const id of ids) {
    if (id === own) continue
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
      return `#${id}`
    }
  }
  return null
}
