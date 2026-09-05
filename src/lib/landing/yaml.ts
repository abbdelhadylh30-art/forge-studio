import { load as yamlLoad, dump as yamlDump } from "js-yaml"
import { createSection, sid } from "./defaults"
import { isValidAccent, isFontPairId } from "./themes"
import type { CookieConsentConfig, LandingConfig, LegalConfig, Section, SectionType, ThemeId, TrackingConfig } from "./types"
import { SECTION_TYPES } from "./types"

const THEME_IDS: ThemeId[] = [
  "nebula",
  "ember",
  "emerald",
  "rose",
  "mono",
  "paper",
  "slate",
  "ocean",
  "gold",
  "midnight",
]

/**
 * Coerce arbitrary / partial / AI-generated data into a valid LandingConfig.
 * Fixes missing fields, wrong enum values, empty sections etc.
 */
export function normalizeConfig(input: unknown): LandingConfig {
  const raw = (input ?? {}) as Record<string, unknown>
  const brand = (raw.brand ?? {}) as Record<string, unknown>
  const seo = (raw.seo ?? {}) as Record<string, unknown>
  const themeId = THEME_IDS.includes(raw.themeId as ThemeId) ? (raw.themeId as ThemeId) : "nebula"
  const rawSections = Array.isArray(raw.sections) ? raw.sections : []

  const sections: Section[] = []
  for (const s of rawSections) {
    const rs = (s ?? {}) as Record<string, unknown>
    const type = rs.type as SectionType
    if (!SECTION_TYPES.includes(type)) continue
    const fresh = createSection(type)
    // merge AI/partial fields over defaults (shallow — nested arrays replaced if present & valid)
    const merged: Record<string, unknown> = { ...fresh, ...stripUndefined(rs) }
    merged.id = typeof rs.id === "string" && rs.id ? rs.id : sid(type)
    // A/B config survives round-trips but must be well-formed (any AB-capable section)
    const abOk = validAb(rs.ab)
    if (abOk) merged.ab = abOk
    else delete merged.ab
    // per-type guards
    if (type === "announcement") {
      merged.style = ["static", "ticker", "countdown"].includes(rs.style as string) ? rs.style : "static"
      merged.message = String(rs.message ?? "")
      const link = validCta(rs.link)
      if (link) merged.link = link
      else delete merged.link
      const dl = typeof rs.deadline === "string" ? rs.deadline.trim() : ""
      if (dl && !Number.isNaN(Date.parse(dl))) merged.deadline = dl.slice(0, 32)
      else delete merged.deadline
      if (typeof rs.prefixLabel === "string" && rs.prefixLabel.trim()) merged.prefixLabel = rs.prefixLabel.slice(0, 60)
      else delete merged.prefixLabel
    }
    if (type === "hero") {
      const layout = rs.layout
      merged.layout = [
        "split-right",
        "split-left",
        "center",
        "full-bleed",
        "minimal",
        "gradient",
        "video",
        "card",
      ].includes(layout as string)
        ? layout
        : "split-right"
      merged.cta = validCta(rs.cta) ?? (fresh as { cta: { label: string; href: string } }).cta
      // background video URL (video layout) — trim, cap, drop when empty
      const vu = typeof rs.videoUrl === "string" ? rs.videoUrl.trim() : ""
      if (vu) merged.videoUrl = vu.slice(0, 500)
      else delete merged.videoUrl
      // sticky mobile CTA: boolean opt-out (default ON — only `false` sticks)
      if (rs.stickyCta === false) merged.stickyCta = false
      else delete merged.stickyCta
    }
    if (type === "features") {
      merged.style = ["grid", "alternating", "bento", "tabs", "carousel"].includes(rs.style as string) ? rs.style : "grid"
      merged.items = validItems(rs.items, 3, (x) => ({
        icon: String((x as Record<string, unknown>).icon ?? "zap"),
        title: String((x as Record<string, unknown>).title ?? "Feature"),
        body: String((x as Record<string, unknown>).body ?? ""),
      }))
    }
    if (type === "testimonials") {
      merged.style = ["grid", "marquee", "spotlight", "video", "logo-wall"].includes(rs.style as string) ? rs.style : "grid"
      merged.items = validItems(rs.items, 3, (x) => {
        const o = x as Record<string, unknown>
        return {
          quote: String(o.quote ?? ""),
          author: String(o.author ?? "Anonymous"),
          role: String(o.role ?? ""),
          initials: String(o.initials ?? initialsOf(String(o.author ?? "A"))),
          rating: typeof o.rating === "number" ? Math.max(1, Math.min(5, Math.round(o.rating))) : 5,
        }
      })
    }
    if (type === "pricing") {
      merged.plans = validItems(rs.plans, 3, (x) => {
        const o = x as Record<string, unknown>
        return {
          name: String(o.name ?? "Plan"),
          price: String(o.price ?? "$0"),
          period: String(o.period ?? "/mo"),
          description: String(o.description ?? ""),
          features: Array.isArray(o.features) ? o.features.map(String).slice(0, 8) : [],
          highlighted: Boolean(o.highlighted),
          ctaLabel: String(o.ctaLabel ?? "Choose plan"),
        }
      })
    }
    if (type === "faq") {
      merged.style = ["accordion", "twocol"].includes(rs.style as string) ? rs.style : "accordion"
      merged.items = validItems(rs.items, 3, (x) => {
        const o = x as Record<string, unknown>
        return { q: String(o.q ?? o.question ?? "Question"), a: String(o.a ?? o.answer ?? "") }
      })
    }
    if (type === "logos") {
      merged.items = validItems(rs.items, 4, (x) => String(x))
    }
    if (type === "stats") {
      merged.items = validItems(rs.items, 4, (x) => {
        const o = x as Record<string, unknown>
        return { value: String(o.value ?? "0"), label: String(o.label ?? ""), delta: String(o.delta ?? "") }
      })
    }
    if (type === "gallery") {
      merged.style = ["masonry", "carousel", "slider", "stories", "ticker"].includes(rs.style as string) ? rs.style : "masonry"
      merged.items = validItems(rs.items, 4, (x) => {
        const o = x as Record<string, unknown>
        return {
          src: typeof o.src === "string" ? o.src : "",
          alt: String(o.alt ?? "Image"),
          hue: String(o.hue ?? String(Math.floor(Math.random() * 360))),
          caption: String(o.caption ?? ""),
        }
      })
    }
    if (type === "problem" || type === "solution" || type === "guarantee") {
      const styles: Record<string, string[]> = {
        problem: ["grid", "split"],
        solution: ["grid", "split", "steps"],
        guarantee: ["card", "split"],
      }
      merged.style = styles[type].includes(rs.style as string) ? rs.style : styles[type][0]
      merged.items = validItems(rs.items, 3, (x) => {
        const o = x as Record<string, unknown>
        return {
          icon: String(o.icon ?? "sparkles"),
          title: String(o.title ?? "Item"),
          body: String(o.body ?? ""),
        }
      })
      if (type === "guarantee") {
        if (typeof rs.body === "string" && rs.body.trim()) merged.body = rs.body.slice(0, 1200)
        else delete merged.body
      }
    }
    if (type === "video") {
      merged.style = ["cinematic", "split", "minimal"].includes(rs.style as string) ? rs.style : "cinematic"
      merged.videoUrl = typeof rs.videoUrl === "string" ? rs.videoUrl.trim().slice(0, 500) : ""
      if (typeof rs.poster === "string" && rs.poster.trim()) merged.poster = rs.poster.slice(0, 500)
      else delete merged.poster
      if (typeof rs.caption === "string" && rs.caption.trim()) merged.caption = rs.caption.slice(0, 200)
      else delete merged.caption
      const cta = validCta(rs.cta)
      if (cta) merged.cta = cta
      else delete merged.cta
    }
    if (type === "comparison") {
      merged.usLabel = String(rs.usLabel ?? "Us").slice(0, 40) || "Us"
      merged.themLabel = String(rs.themLabel ?? "Them").slice(0, 40) || "Them"
      merged.rows = validItems(rs.rows, 3, (x) => {
        const o = x as Record<string, unknown>
        return {
          feature: String(o.feature ?? o.label ?? "Feature"),
          us: String(o.us ?? "yes"),
          them: String(o.them ?? "no"),
        }
      })
      if (typeof rs.note === "string" && rs.note.trim()) merged.note = rs.note.slice(0, 300)
      else delete merged.note
    }
    if (type === "contact") {
      const c = merged as unknown as {
        fields: string[]
        submitLabel: string
        delivery?: "inbox" | "sheets" | "embed"
        sheetWebhookUrl?: string
        googleFormUrl?: string
      }
      c.fields = validItems(rs.fields, 2, (x) => String(x))
      if (!c.fields.length) c.fields = ["Your name", "Email address", "Message"]
      c.submitLabel = String(c.submitLabel ?? "Send message")
      // delivery mode (unset = inbox, legacy-safe) + validated URLs
      const dv = rs.delivery
      c.delivery = dv === "inbox" || dv === "sheets" || dv === "embed" ? dv : undefined
      if (!c.delivery) delete c.delivery
      const hook = typeof rs.sheetWebhookUrl === "string" ? rs.sheetWebhookUrl.trim() : ""
      if (c.delivery === "sheets" && /^https:\/\//i.test(hook)) c.sheetWebhookUrl = hook.slice(0, 500)
      else delete c.sheetWebhookUrl
      const gf = typeof rs.googleFormUrl === "string" ? rs.googleFormUrl.trim() : ""
      if (c.delivery === "embed" && /^https:\/\//i.test(gf)) c.googleFormUrl = gf.slice(0, 500)
      else delete c.googleFormUrl
    }
    if (type === "navbar") {
      merged.links = validItems(rs.links, 1, (x) => {
        const o = x as Record<string, unknown>
        return { label: String(o.label ?? "Link"), href: String(o.href ?? "#") }
      })
    }
    if (type === "footer") {
      merged.style = ["minimal", "mega", "newsletter"].includes(rs.style as string) ? rs.style : "mega"
      merged.linkGroups = validItems(rs.linkGroups, 1, (x) => {
        const o = x as Record<string, unknown>
        return {
          group: String(o.group ?? "Links"),
          items: Array.isArray(o.items)
            ? o.items.map((i) => ({ label: String((i as Record<string, unknown>).label ?? "Link"), href: String((i as Record<string, unknown>).href ?? "#") }))
            : [],
        }
      })
    }
    if (type === "cta-final") {
      merged.cta = validCta(rs.cta) ?? { label: "Start free trial", href: "#cta" }
    }
    sections.push(merged as unknown as Section)
  }

  // sanitize custom anchors ([a-z0-9-] slugs — empty means "use the type default")
  for (const s of sections) {
    if (s.anchor == null) continue
    const a = String(s.anchor).trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "")
    if (a) s.anchor = a
    else delete s.anchor
  }

  const name = String(brand.name ?? "MyProduct").slice(0, 60) || "MyProduct"
  const brandOut: LandingConfig["brand"] = { name, tagline: String(brand.tagline ?? "") }
  const logoUrl = typeof brand.logoUrl === "string" ? brand.logoUrl.trim() : ""
  if (logoUrl) brandOut.logoUrl = logoUrl
  const accent = typeof brand.accent === "string" ? brand.accent.trim() : ""
  if (isValidAccent(accent)) brandOut.accent = accent.startsWith("#") ? accent : `#${accent}`
  if (typeof brand.font === "string" && isFontPairId(brand.font)) brandOut.font = brand.font
  // color-scheme override — unset = the theme's preferred mode (legacy-safe)
  if (brand.mode === "auto" || brand.mode === "dark" || brand.mode === "light") {
    brandOut.mode = brand.mode
  }

  // i18n (multilingual publishing) — validated locales + translations map
  const i18nOut = validI18n(raw.i18n)

  // privacy: cookie-consent banner (validated; only kept when enabled or shaped)
  const legalOut = validLegal(raw.legal)

  // tracking: custom head/body scripts (raw text, capped)
  const trackingOut = validTracking(raw.tracking)

  const seoOut: LandingConfig["seo"] = {
    title: String(seo.title ?? `${name} — Ship faster`).slice(0, 120),
    description: String(seo.description ?? "").slice(0, 300),
  }
  if (seo.noIndex === true) seoOut.noIndex = true
  const ogImage = typeof seo.ogImage === "string" ? seo.ogImage.trim() : ""
  if (ogImage) seoOut.ogImage = ogImage.slice(0, 400)

  const out: LandingConfig = {
    version: 1,
    brand: brandOut,
    themeId,
    seo: seoOut,
    sections: sections.length ? sections : [createSection("hero"), createSection("footer")],
  }
  if (i18nOut) out.i18n = i18nOut
  if (legalOut) out.legal = legalOut
  if (trackingOut) out.tracking = trackingOut
  return out
}

/** Validate + shape the cookie-consent block (dropped unless well-formed). */
function validLegal(input: unknown): LegalConfig | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) return undefined
  const raw = input as Record<string, unknown>
  const cc = raw.cookieConsent
  if (!cc || typeof cc !== "object" || Array.isArray(cc)) return undefined
  const o = cc as Record<string, unknown>
  const consent: CookieConsentConfig = {
    enabled: o.enabled === true,
    message: typeof o.message === "string" ? o.message.slice(0, 400) : "",
    acceptLabel: String(o.acceptLabel ?? "Accept").slice(0, 40) || "Accept",
    declineLabel: String(o.declineLabel ?? "Decline").slice(0, 40) || "Decline",
    position: o.position === "top" ? "top" : "bottom",
  }
  const learnMoreUrl = typeof o.learnMoreUrl === "string" ? o.learnMoreUrl.trim().slice(0, 300) : ""
  if (learnMoreUrl) consent.learnMoreUrl = learnMoreUrl
  const learnMoreLabel = typeof o.learnMoreLabel === "string" ? o.learnMoreLabel.trim().slice(0, 40) : ""
  if (learnMoreLabel) consent.learnMoreLabel = learnMoreLabel
  // drop entirely when nothing meaningful is configured
  if (!consent.enabled && !consent.message) return undefined
  return { cookieConsent: consent }
}

/** Validate + shape the custom tracking scripts (dropped when both empty). */
function validTracking(input: unknown): TrackingConfig | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) return undefined
  const raw = input as Record<string, unknown>
  const head = typeof raw.headScripts === "string" ? raw.headScripts.trim().slice(0, 8000) : ""
  const body = typeof raw.bodyScripts === "string" ? raw.bodyScripts.trim().slice(0, 8000) : ""
  if (!head && !body) return undefined
  return { headScripts: head, bodyScripts: body }
}

/** Validate + shape the i18n config (locales list + translations map). */
function validI18n(input: unknown): LandingConfig["i18n"] | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) return undefined
  const raw = input as Record<string, unknown>
  const rawLocales = Array.isArray(raw.locales) ? raw.locales : []
  const locales: { code: string; label?: string; dir?: "ltr" | "rtl" }[] = []
  for (const l of rawLocales.slice(0, 12)) {
    if (!l || typeof l !== "object") continue
    const o = l as Record<string, unknown>
    const code = String(o.code ?? "").toLowerCase().replace(/[^a-z-]/g, "").slice(0, 8)
    if (!code) continue
    const entry: { code: string; label?: string; dir?: "ltr" | "rtl" } = { code }
    if (typeof o.label === "string" && o.label.trim()) entry.label = o.label.slice(0, 40)
    if (o.dir === "ltr" || o.dir === "rtl") entry.dir = o.dir
    locales.push(entry)
  }
  if (locales.length === 0) return undefined

  const translations: Record<string, Record<string, Record<string, string>>> = {}
  if (raw.translations && typeof raw.translations === "object" && !Array.isArray(raw.translations)) {
    for (const [loc, bySection] of Object.entries(raw.translations as Record<string, unknown>)) {
      if (!bySection || typeof bySection !== "object" || Array.isArray(bySection)) continue
      const secMap: Record<string, Record<string, string>> = {}
      for (const [sid, fields] of Object.entries(bySection as Record<string, unknown>)) {
        if (!fields || typeof fields !== "object" || Array.isArray(fields)) continue
        const fieldMap: Record<string, string> = {}
        for (const [path, value] of Object.entries(fields as Record<string, unknown>)) {
          if (typeof value === "string" && value && /^[a-zA-Z0-9_.-]{1,40}$/.test(path)) {
            fieldMap[path] = value.slice(0, 600)
          }
        }
        if (Object.keys(fieldMap).length > 0) secMap[sid.slice(0, 60)] = fieldMap
      }
      if (Object.keys(secMap).length > 0) translations[loc.slice(0, 8)] = secMap
    }
  }
  return { locales, translations }
}

function stripUndefined(o: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(o)) {
    if (v !== undefined && v !== null) out[k] = v
  }
  return out
}

function validCta(c: unknown): { label: string; href: string } | null {
  if (!c || typeof c !== "object") return null
  const o = c as Record<string, unknown>
  if (typeof o.label !== "string") return null
  return { label: o.label, href: String(o.href ?? "#") }
}

/** Coerce a partial/AI `ab` block into a well-formed AbConfig (or null to drop it). */
function validAb(ab: unknown): {
  enabled: boolean
  metric: string
  autoWinner: boolean
  sampleSize: number
  variants: { id: string; name: string; headline: string; sub?: string; ctaLabel?: string; weight: number }[]
} | null {
  if (!ab || typeof ab !== "object") return null
  const o = ab as Record<string, unknown>
  const variants = Array.isArray(o.variants)
    ? o.variants
        .map((v) => {
          const w = v as Record<string, unknown>
          if (typeof w.name !== "string" || typeof w.headline !== "string") return null
          return {
            id: typeof w.id === "string" && w.id ? w.id : `v${Math.random().toString(36).slice(2, 6)}`,
            name: w.name.slice(0, 2),
            headline: w.headline,
            ...(typeof w.sub === "string" ? { sub: w.sub } : {}),
            ...(typeof w.ctaLabel === "string" ? { ctaLabel: w.ctaLabel } : {}),
            weight: Math.max(0, Math.min(100, Number(w.weight) || 0)),
          }
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
        .slice(0, 4)
    : []
  if (variants.length < 2) return null
  return {
    enabled: Boolean(o.enabled),
    metric: typeof o.metric === "string" && o.metric ? o.metric : "cta_click",
    autoWinner: o.autoWinner === undefined ? true : Boolean(o.autoWinner),
    sampleSize: Math.max(50, Math.floor(Number(o.sampleSize) || 500)),
    variants,
  }
}

function validItems<T>(arr: unknown, min: number, map: (x: unknown) => T): T[] {
  if (!Array.isArray(arr)) return []
  const items = arr.slice(0, 24).map(map)
  return items.length >= min ? items : items.length ? items : []
}

function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "A"
  )
}

/** config → YAML string (reorders keys for readability) */
export function configToYaml(config: LandingConfig): string {
  const ordered: Record<string, unknown> = {
    brand: {
      name: config.brand.name,
      tagline: config.brand.tagline || undefined,
      logoUrl: config.brand.logoUrl || undefined,
      accent: config.brand.accent || undefined,
      font: config.brand.font || undefined,
      mode: config.brand.mode || undefined,
    },
    theme: config.themeId,
    seo: { ...config.seo },
    sections: config.sections.map((s) => {
      const { hidden, ...rest } = s as unknown as Record<string, unknown>
      return hidden === true ? { ...rest, hidden: true } : rest
    }),
  }
  // i18n (locales + translations) must survive the round-trip — the YAML
  // export is advertised as the complete, version-controllable page config.
  if (config.i18n) ordered.i18n = config.i18n
  if (config.legal) ordered.legal = config.legal
  if (config.tracking) ordered.tracking = config.tracking
  return yamlDump(ordered, { lineWidth: 100, noRefs: true, sortKeys: false })
}

/** YAML string → normalized config. Throws on invalid YAML. */
export function yamlToConfig(yamlText: string): LandingConfig {
  const parsed = yamlLoad(yamlText)
  if (typeof parsed !== "object" || parsed === null) throw new Error("YAML root must be a mapping")
  const raw = parsed as Record<string, unknown>
  // accept `theme:` as alias for themeId
  if (raw.themeId === undefined && typeof raw.theme === "string") raw.themeId = raw.theme
  return normalizeConfig(raw)
}

/** Try to parse AI output that may be wrapped in ```json fences */
export function extractJson(text: string): unknown {
  const cleaned = text
    .replace(/```(?:json|ya?ml)?\s*/gi, "")
    .replace(/```\s*$/g, "")
    .trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    // maybe it's yaml
    try {
      return yamlLoad(cleaned)
    } catch {
      /* fallthrough */
    }
    // last resort: find first { ... last }
    const first = cleaned.indexOf("{")
    const last = cleaned.lastIndexOf("}")
    if (first !== -1 && last > first) {
      try {
        return JSON.parse(cleaned.slice(first, last + 1))
      } catch {
        /* give up */
      }
    }
    throw new Error("Could not parse AI response as JSON/YAML")
  }
}
