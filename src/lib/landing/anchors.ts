import type { LandingConfig, Section } from "./types"

/**
 * Anchor utilities — one source of truth for in-page navigation.
 *
 * `sectionAnchors` replicates the EXACT derivation LandingPreview uses to set
 * section ids (custom slugified override → first-of-type slot → "top" for the
 * hero, "cta" alias for cta-final, no anchor for repeated types / late navbars),
 * so audits and copy-link commands can never disagree with what actually
 * renders on the published page.
 */

function slugAnchor(raw: string | undefined): string {
  return (raw ?? "").trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "")
}

/** sectionId → rendered anchor id (visible sections only, like the preview). */
export function sectionAnchors(config: LandingConfig): Map<string, string> {
  const seen = new Set<string>()
  const map = new Map<string, string>()
  config.sections
    .filter((s) => !s.hidden)
    .forEach((section, index) => {
      const custom = slugAnchor(section.anchor)
      if (custom) {
        seen.add(section.type) // a custom anchor reserves the type slot too
        map.set(section.id, custom)
        return
      }
      if (seen.has(section.type)) return
      seen.add(section.type)
      if (index > 0 && section.type === "navbar") return // navbar targets are pointless
      if (section.type === "hero") {
        map.set(section.id, "top")
        return
      }
      map.set(section.id, section.type === "cta-final" ? "cta" : section.type)
    })
  return map
}

export interface AnchorLinkRef {
  sectionId: string
  sectionType: Section["type"]
  /** human label of the link ("Pricing", "Start free"…). */
  label: string
  href: string
  /** resolved in-page target when href starts with "#" (no leading #). */
  target: string
}

/** Every in-page "#anchor" link in the config (navbar, CTAs, footer groups). */
export function collectAnchorLinks(config: LandingConfig): AnchorLinkRef[] {
  const refs: AnchorLinkRef[] = []
  const push = (section: Section, label: string, href: string) => {
    if (!href.trim().startsWith("#")) return
    const target = href.trim().slice(1).trim()
    if (!target) return // bare "#" scrolls to top — intentional, not a link to check
    refs.push({ sectionId: section.id, sectionType: section.type, label: label.trim() || "link", href: href.trim(), target })
  }

  for (const s of config.sections) {
    if (s.hidden) continue
    if (s.type === "announcement") {
      if (s.link) push(s, s.link.label, s.link.href)
    } else if (s.type === "navbar") {
      s.links.forEach((l) => push(s, l.label, l.href))
      if (s.cta) push(s, s.cta.label, s.cta.href)
    } else if (s.type === "hero") {
      push(s, s.cta.label, s.cta.href)
      if (s.secondaryCta) push(s, s.secondaryCta.label, s.secondaryCta.href)
    } else if (s.type === "cta-final") {
      push(s, s.cta.label, s.cta.href)
    } else if (s.type === "video") {
      if (s.cta) push(s, s.cta.label, s.cta.href)
    } else if (s.type === "footer") {
      s.linkGroups.forEach((g) => g.items.forEach((l) => push(s, l.label, l.href)))
    }
  }
  return refs
}

export interface BrokenAnchorLink {
  sectionId: string
  sectionType: Section["type"]
  label: string
  target: string
}

/** In-page links whose "#target" matches no rendered section anchor. */
export function findBrokenAnchorLinks(config: LandingConfig): BrokenAnchorLink[] {
  const anchors = new Set(sectionAnchors(config).values())
  return collectAnchorLinks(config)
    .filter((l) => !anchors.has(l.target))
    .map((l) => ({ sectionId: l.sectionId, sectionType: l.sectionType, label: l.label, target: l.target }))
}

/** Deep link to a section on the PUBLISHED page (/p/slug#anchor). */
export function publishedAnchorUrl(slug: string, anchor: string): string {
  const base = typeof window === "undefined" ? "" : window.location.origin
  return `${base}/p/${encodeURIComponent(slug)}#${anchor}`
}
