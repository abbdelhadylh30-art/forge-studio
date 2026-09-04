// ─────────────────────────────────────────────────────────────────────────────
// Section-level A/B helpers — shared by the studio, the published page and the
// analytics backend. Single source of truth for:
//   • which sections carry an enabled test
//   • how variant fields (headline / sub / ctaLabel) map onto each section type
//   • stable per-visitor variant assignment (localStorage, weighted)
//   • exposure event keys (hero keeps its legacy "hero" label for old data)
// ─────────────────────────────────────────────────────────────────────────────

import { AB_SECTION_TYPES, SECTION_META } from "./types"
import type { AbConfig, Section } from "./types"

const AB_TYPES: ReadonlySet<string> = new Set(AB_SECTION_TYPES)

/** Read a section's A/B config regardless of its concrete interface. */
export function sectionAb(section: Section): AbConfig | undefined {
  if (!AB_TYPES.has(section.type)) return undefined
  return (section as unknown as { ab?: AbConfig }).ab
}

export interface AbTestRef {
  section: Section
  ab: AbConfig
}

/** All enabled section-level tests (hero first, then section order). */
export function getAbTests(config: { sections: Section[] }): AbTestRef[] {
  const tests: AbTestRef[] = []
  for (const section of config.sections) {
    const ab = sectionAb(section)
    if (ab?.enabled && ab.variants.length >= 2) tests.push({ section, ab })
  }
  // hero is the page-level (primary) test — keep it first
  return tests.sort((a, b) => (a.section.type === "hero" ? -1 : 0) - (b.section.type === "hero" ? -1 : 0))
}

/** The primary test — its variant tags the pageview (per-variant duration/engagement). */
export function primaryAbTest(config: { sections: Section[] }): AbTestRef | null {
  return getAbTests(config)[0] ?? null
}

/** Event labels a `variant_exposure` event may carry for this test (hero also matches its legacy "hero" label). */
export function exposureLabels(section: Section): string[] {
  return section.type === "hero" ? ["hero", section.id] : [section.id]
}

// ── variant assignment (client-side, stable per visitor + test) ──────────────

function pickWeighted(variants: AbConfig["variants"]): string {
  const total = variants.reduce((sum, v) => sum + Math.max(1, v.weight), 0)
  let roll = Math.random() * total
  let picked = variants[0]?.name ?? "A"
  for (const v of variants) {
    roll -= Math.max(1, v.weight)
    if (roll <= 0) {
      picked = v.name
      break
    }
  }
  return picked
}

/** localStorage-cached weighted assignment, stable per visitor + section test. */
export function assignVariantFor(projectId: string, sectionId: string, ab: AbConfig): string {
  const key = `lf-ab-assign-${projectId}-${sectionId}`
  try {
    const stored = window.localStorage.getItem(key)
    if (stored && ab.variants.some((v) => v.name === stored)) return stored
  } catch {
    /* storage unavailable — just pick */
  }
  const picked = pickWeighted(ab.variants)
  try {
    window.localStorage.setItem(key, picked)
  } catch {
    /* ignore */
  }
  return picked
}

/** Assign every enabled test (returns sectionId → variant name). */
export function assignAbVariants(projectId: string, tests: AbTestRef[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const t of tests) out[t.section.id] = assignVariantFor(projectId, t.section.id, t.ab)
  return out
}

// ── rendering overrides ──────────────────────────────────────────────────────

export interface AbOverride {
  headline: string
  sub: string
  ctaLabel: string
}

/** Resolve the effective copy for `variantName` on this section (empty variant fields fall back to the base copy). */
export function abOverrideFor(section: Section, variantName: string | null | undefined): AbOverride | null {
  if (!variantName) return null
  const ab = sectionAb(section)
  if (!ab?.enabled) return null
  const v = ab.variants.find((x) => x.name === variantName)
  if (!v) return null
  switch (section.type) {
    case "hero":
      return { headline: v.headline || section.headline, sub: v.sub || section.sub, ctaLabel: v.ctaLabel || section.cta.label }
    case "cta-final":
      return { headline: v.headline || section.headline, sub: v.sub || section.sub || "", ctaLabel: v.ctaLabel || section.cta.label }
    case "contact":
      return { headline: v.headline || section.title || "", sub: v.sub || section.subtitle || "", ctaLabel: v.ctaLabel || section.submitLabel }
    case "pricing":
    case "features":
    case "testimonials":
    case "faq":
      return { headline: v.headline || section.title || "", sub: v.sub || section.subtitle || "", ctaLabel: "" }
    default:
      return null
  }
}

/** Patch that applies a winning variant's copy to its section (and disables the test). Used by "Promote". */
export function applyVariantPatch(section: Section, variantName: string): Partial<Section> | null {
  const ab = sectionAb(section)
  const v = ab?.variants.find((x) => x.name === variantName)
  if (!ab || !v) return null
  const disabled: AbConfig = { ...ab, enabled: false }
  switch (section.type) {
    case "hero":
      return {
        headline: v.headline || section.headline,
        ...(v.sub ? { sub: v.sub } : {}),
        ...(v.ctaLabel ? { cta: { ...section.cta, label: v.ctaLabel } } : {}),
        ab: disabled,
      } as Partial<Section>
    case "cta-final":
      return {
        headline: v.headline || section.headline,
        ...(v.sub ? { sub: v.sub } : {}),
        ...(v.ctaLabel ? { cta: { ...section.cta, label: v.ctaLabel } } : {}),
        ab: disabled,
      } as Partial<Section>
    case "contact":
      return {
        ...(v.headline ? { title: v.headline } : {}),
        ...(v.sub ? { subtitle: v.sub } : {}),
        ...(v.ctaLabel ? { submitLabel: v.ctaLabel } : {}),
        ab: disabled,
      } as Partial<Section>
    case "pricing":
    case "features":
    case "testimonials":
    case "faq":
      return {
        ...(v.headline ? { title: v.headline } : {}),
        ...(v.sub ? { subtitle: v.sub } : {}),
        ab: disabled,
      } as Partial<Section>
    default:
      return null
  }
}

/** Human label for a test ("Hero" / "Pricing" / "Final CTA") with a position suffix when the type repeats. */
export function abTestLabel(config: { sections: Section[] }, section: Section): string {
  const base = SECTION_META[section.type].label
  const sameType = config.sections.filter((s) => s.type === section.type)
  if (sameType.length > 1) {
    const idx = sameType.indexOf(section)
    return `${base} ${String.fromCharCode(65 + idx)}`
  }
  return base
}

/** Default B-variant headline suggestions per section type (quality starter copy when a test is enabled). */
export const AB_VARIANT_B_SUGGESTIONS: Record<string, string> = {
  hero: "Deploy your product in 30 seconds",
  "cta-final": "Start shipping today",
  pricing: "Simple plans that scale with you",
  features: "Everything you need, nothing you don't",
  testimonials: "Loved by teams everywhere",
  faq: "Questions, answered",
  contact: "Let's talk about your project",
}
