import { describe, it, expect } from "vitest"
import { applyLocale, dirFor, localesOf, readPath, translatablePaths, translatedSectionIds } from "./i18n"
import type { LandingConfig, Section } from "./types"
import { createSection } from "./defaults"

function configWith(sections: Section[], i18n?: LandingConfig["i18n"]): LandingConfig {
  return {
    version: 1,
    brand: { name: "X" },
    themeId: "nebula",
    seo: { title: "t", description: "d" },
    sections,
    ...(i18n ? { i18n } : {}),
  }
}

describe("localesOf", () => {
  it("defaults to a single en locale", () => {
    expect(localesOf(configWith([]))).toEqual([{ code: "en", label: "English", dir: "ltr" }])
  })

  it("derives RTL for Arabic and LTR for French", () => {
    const cfg = configWith([], {
      locales: [
        { code: "en" },
        { code: "ar", label: "العربية" },
        { code: "fr", label: "Français" },
      ],
      translations: {},
    })
    expect(localesOf(cfg).map((l) => [l.code, l.dir])).toEqual([
      ["en", "ltr"],
      ["ar", "rtl"],
      ["fr", "ltr"],
    ])
  })
})

describe("dirFor", () => {
  const cfg = configWith([], { locales: [{ code: "en" }, { code: "he" }], translations: {} })
  it("uses well-known RTL codes", () => expect(dirFor(cfg, "he")).toBe("rtl"))
  it("explicit dir config wins", () => {
    const c2 = configWith([], { locales: [{ code: "xx", dir: "rtl" }], translations: {} })
    expect(dirFor(c2, "xx")).toBe("rtl")
  })
})

describe("translatablePaths", () => {
  it("collects hero copy including A/B variant fields", () => {
    const hero = createSection("hero")
    if (hero.type !== "hero") throw new Error("expected hero")
    hero.ab = {
      enabled: true,
      metric: "cta_click",
      autoWinner: true,
      sampleSize: 500,
      variants: [
        { id: "v1", name: "A", headline: "A head", sub: "", ctaLabel: "", weight: 50 },
        { id: "v2", name: "B", headline: "B head", sub: "B sub", ctaLabel: "", weight: 50 },
      ],
    }
    const paths = translatablePaths(hero)
    expect(paths).toContain("headline")
    expect(paths).toContain("sub")
    expect(paths).toContain("badge")
    expect(paths).toContain("cta.label")
    expect(paths).toContain("ab.variants.0.headline")
    expect(paths).toContain("ab.variants.1.headline")
    expect(paths).toContain("ab.variants.1.sub")
  })

  it("covers about section body, founder and items", () => {
    const about = createSection("about")
    if (about.type !== "about") throw new Error("expected about")
    const paths = translatablePaths(about)
    expect(paths).toContain("title")
    expect(paths).toContain("body")
    expect(paths).toContain("founder.name")
    expect(paths.filter((p) => p.startsWith("items.0."))).toContain("items.0.title")
  })
})

describe("readPath", () => {
  it("reads nested dotted paths", () => {
    expect(readPath({ a: { b: [{ c: "deep" }] } }, "a.b.0.c")).toBe("deep")
    expect(readPath({ a: null }, "a.b")).toBeUndefined()
  })
})

describe("applyLocale", () => {
  const hero = createSection("hero")
  if (hero.type !== "hero") throw new Error("expected hero")
  const cfg = configWith([hero], {
    locales: [{ code: "en" }, { code: "ar" }],
    translations: {
      ar: {
        [hero.id]: {
          headline: "عنوان",
          "ab.variants.0.headline": "عنوان أ",
          "stats.0.label": "من الدفع",
        },
      },
    },
  })

  it("replaces translated copy and leaves the original untouched", () => {
    const out = applyLocale(cfg, "ar")
    const outHero = out.sections[0]
    if (outHero.type !== "hero") throw new Error("expected hero")
    expect(outHero.headline).toBe("عنوان")
    expect(outHero.ab?.variants[0].headline).toBe("عنوان أ")
    expect(outHero.stats?.[0].label).toBe("من الدفع")
    // purity — input untouched
    if (hero.type !== "hero") throw new Error("expected hero")
    expect(hero.headline).toBe("Ship faster. Sleep better.")
  })

  it("is a no-op for unknown locales", () => {
    expect(applyLocale(cfg, "zz")).toBe(cfg)
  })
})

describe("translatedSectionIds", () => {
  it("tracks which sections have a stored translation", () => {
    const hero = createSection("hero")
    const cfg = configWith([hero], {
      locales: [{ code: "en" }, { code: "ar" }],
      translations: { ar: { [hero.id]: { headline: "x" } } },
    })
    expect(translatedSectionIds(cfg, "ar").has(hero.id)).toBe(true)
    expect(translatedSectionIds(cfg, "fr").size).toBe(0)
  })
})
