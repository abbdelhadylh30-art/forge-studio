"use client"

import type { LandingConfig, Section } from "./types"
import { localeDir } from "./types"

/**
 * Locale engine — applies stored AI translations to a config.
 *
 * Translation paths are dotted field paths relative to a section object:
 *   "title", "subtitle", "headline", "sub", "badge", "body",
 *   "cta", "ctaSecondary", "submitLabel", "founder.name", "founder.role",
 *   "items.0.title", "items.0.body", "items.0.quote", "links.1.label", …
 *
 * This module is the single source of truth for:
 *   • which fields are translatable per section type (TRANSLATABLE_FIELDS)
 *   • reading current values at those paths (for the AI translate request)
 *   • applying translated values back (applyLocale)
 */

/** Collect the dotted paths of every user-visible text field of a section. */
export function translatablePaths(section: Section): string[] {
  const paths: string[] = []
  const push = (p: string) => paths.push(p)

  if ("title" in section && section.title) push("title")
  if ("subtitle" in section && section.subtitle) push("subtitle")

  // A/B variant copy (per-variant overrides — each translates separately so
  // the experiment stays meaningful in the target locale)
  if ("ab" in section && section.ab?.variants) {
    section.ab.variants.forEach((v, i) => {
      if (v.headline) push(`ab.variants.${i}.headline`)
      if (v.sub) push(`ab.variants.${i}.sub`)
      if (v.ctaLabel) push(`ab.variants.${i}.ctaLabel`)
    })
  }

  switch (section.type) {
    case "navbar":
      section.links?.forEach((l, i) => {
        push(`links.${i}.label`)
      })
      if (section.cta?.label) push("cta.label")
      if (section.brandLabel) push("brandLabel")
      break
    case "hero":
      push("headline")
      push("sub")
      if (section.badge) push("badge")
      if (section.cta?.label) push("cta.label")
      if (section.secondaryCta?.label) push("secondaryCta.label")
      section.stats?.forEach((s, i) => push(`stats.${i}.label`))
      break
    case "logos":
      section.items?.forEach((_, i) => push(`items.${i}`))
      break
    case "features":
      section.items?.forEach((it, i) => {
        push(`items.${i}.title`)
        push(`items.${i}.body`)
      })
      break
    case "stats":
      section.items?.forEach((_, i) => push(`items.${i}.label`))
      break
    case "testimonials":
      section.items?.forEach((it, i) => {
        push(`items.${i}.quote`)
        push(`items.${i}.author`)
        push(`items.${i}.role`)
      })
      break
    case "pricing":
      section.plans?.forEach((p, i) => {
        push(`plans.${i}.name`)
        if (p.period) push(`plans.${i}.period`)
        p.features?.forEach((_, j) => push(`plans.${i}.features.${j}`))
      })
      if (section.annualDiscountLabel) push("annualDiscountLabel")
      break
    case "faq":
      section.items?.forEach((it, i) => {
        push(`items.${i}.q`)
        push(`items.${i}.a`)
      })
      break
    case "gallery":
      section.items?.forEach((it, i) => {
        if (it.caption) push(`items.${i}.caption`)
      })
      break
    case "about":
      if (section.body) push("body")
      if (section.founder?.name) push("founder.name")
      if (section.founder?.role) push("founder.role")
      section.items?.forEach((it, i) => {
        push(`items.${i}.title`)
        push(`items.${i}.body`)
      })
      break
    case "contact":
      push("submitLabel")
      section.fields?.forEach((f, i) => push(`fields.${i}`))
      if (section.email) push("email")
      break
    case "cta-final":
      push("headline")
      if (section.sub) push("sub")
      push("cta.label")
      if (section.note) push("note")
      break
    case "footer":
      if (section.tagline) push("tagline")
      section.linkGroups?.forEach((g, i) => {
        push(`linkGroups.${i}.group`)
        g.items?.forEach((it, j) => push(`linkGroups.${i}.items.${j}.label`))
      })
      section.social?.forEach((_, i) => push(`social.${i}`))
      if (section.copyright) push("copyright")
      break
  }
  return paths
}

/** Read a dotted path from a section (undefined when missing). */
export function readPath(section: unknown, path: string): string | undefined {
  let cur: unknown = section
  for (const key of path.split(".")) {
    if (cur == null || typeof cur !== "object") return undefined
    cur = (cur as Record<string, unknown>)[key]
  }
  return typeof cur === "string" ? cur : undefined
}

/** Write a dotted path into a CLONED section object (mutates the clone). */
function writePath(target: Record<string, unknown>, path: string, value: string) {
  const keys = path.split(".")
  let cur: Record<string, unknown> = target
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i]
    if (cur[k] == null || typeof cur[k] !== "object") return
    cur = cur[k] as Record<string, unknown>
  }
  cur[keys[keys.length - 1]] = value
}

export interface LocaleMeta {
  code: string
  label: string
  dir: "ltr" | "rtl"
}

/** Normalized locale list (defaults to a single en locale). */
export function localesOf(config: LandingConfig): LocaleMeta[] {
  const list = config.i18n?.locales?.length
    ? config.i18n.locales
    : [{ code: "en", label: "English", dir: "ltr" as const }]
  return list.map((l) => ({
    code: l.code,
    label: l.label ?? l.code.toUpperCase(),
    dir: l.dir ?? localeDir(l.code),
  }))
}

/** Sections that have at least one stored translation for the locale. */
export function translatedSectionIds(config: LandingConfig, locale: string): Set<string> {
  const bySection = config.i18n?.translations?.[locale]
  return new Set(bySection ? Object.keys(bySection) : [])
}

/**
 * Apply a locale's translations to a config (pure — returns a new config).
 * Unknown/missing paths are skipped, so partial translations are safe.
 */
export function applyLocale(config: LandingConfig, locale: string): LandingConfig {
  if (!config.i18n) return config
  const bySection = config.i18n.translations?.[locale]
  if (!bySection) return config

  const sections = config.sections.map((section) => {
    const patch = bySection[section.id]
    if (!patch) return section
    const next = JSON.parse(JSON.stringify(section)) as Record<string, unknown>
    for (const [path, value] of Object.entries(patch)) {
      if (typeof value === "string" && value) writePath(next, path, value)
    }
    return next as unknown as Section
  })

  return { ...config, sections }
}

/** dir attribute for a locale in the context of a config. */
export function dirFor(config: LandingConfig, locale: string): "ltr" | "rtl" {
  const explicit = config.i18n?.locales?.find((l) => l.code === locale)?.dir
  return explicit ?? localeDir(locale)
}
