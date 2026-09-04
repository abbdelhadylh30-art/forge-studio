import { describe, it, expect } from "vitest"
import { configToYaml, yamlToConfig, normalizeConfig } from "./yaml"
import type { LandingConfig, Section } from "./types"
import { createSection } from "./defaults"

function configWith(sections: Section[], i18n?: LandingConfig["i18n"]): LandingConfig {
  return {
    version: 1,
    brand: { name: "X", tagline: "tag" },
    themeId: "nebula",
    seo: { title: "t", description: "d" },
    sections,
    ...(i18n ? { i18n } : {}),
  }
}

describe("yaml round-trip", () => {
  const hero = createSection("hero")
  const footer = createSection("footer")

  it("preserves sections, brand and theme", () => {
    const cfg = configWith([hero, footer])
    const back = yamlToConfig(configToYaml(cfg))
    expect(back.sections.map((s) => s.type)).toEqual(["hero", "footer"])
    expect(back.brand.name).toBe("X")
    expect(back.themeId).toBe("nebula")
  })

  it("preserves the i18n block (locales + translations)", () => {
    const cfg = configWith([hero, footer], {
      locales: [
        { code: "en", label: "English" },
        { code: "ar", label: "العربية" },
      ],
      translations: {
        ar: { [hero.id]: { headline: "مرحبا", "cta.label": "ابدأ" } },
      },
    })
    const back = yamlToConfig(configToYaml(cfg))
    expect(back.i18n).toBeDefined()
    expect(back.i18n?.locales.map((l) => l.code)).toEqual(["en", "ar"])
    expect(back.i18n?.translations.ar?.[hero.id]?.headline).toBe("مرحبا")
    expect(back.i18n?.translations.ar?.[hero.id]?.["cta.label"]).toBe("ابدأ")
  })

  it("emits an i18n block in the YAML text itself", () => {
    const cfg = configWith([hero], {
      locales: [{ code: "en" }, { code: "ar" }],
      translations: { ar: { [hero.id]: { headline: "مرحبا" } } },
    })
    const text = configToYaml(cfg)
    expect(text).toContain("i18n")
    expect(text).toContain("مرحبا")
  })

  it("omits i18n when the config has none", () => {
    expect(configToYaml(configWith([hero]))).not.toContain("i18n")
  })

  it("normalizeConfig still strips malformed i18n", () => {
    const bad = normalizeConfig({ brand: { name: "X" }, sections: [{ type: "hero" }], i18n: { locales: [] } })
    expect(bad.i18n).toBeUndefined()
  })
})
