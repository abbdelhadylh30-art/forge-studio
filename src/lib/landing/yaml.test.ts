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

describe("narrative sections (announcement / problem / solution / video / comparison / guarantee)", () => {
  it("round-trips all six new section types", () => {
    const sections = [
      createSection("announcement"),
      createSection("problem"),
      createSection("solution"),
      createSection("video"),
      createSection("comparison"),
      createSection("guarantee"),
    ] as Section[]
    const back = yamlToConfig(configToYaml(configWith(sections)))
    expect(back.sections.map((s) => s.type)).toEqual([
      "announcement", "problem", "solution", "video", "comparison", "guarantee",
    ])
  })

  it("preserves the hero layout enum incl. the new variants + videoUrl", () => {
    const hero = createSection("hero")
    if (hero.type !== "hero") throw new Error("expected hero")
    hero.layout = "video"
    hero.videoUrl = "https://example.com/loop.mp4"
    const back = yamlToConfig(configToYaml(configWith([hero])))
    const out = back.sections[0]
    if (out.type !== "hero") throw new Error("expected hero")
    expect(out.layout).toBe("video")
    expect(out.videoUrl).toBe("https://example.com/loop.mp4")
  })

  it("preserves the extended gallery styles", () => {
    const gallery = createSection("gallery")
    if (gallery.type !== "gallery") throw new Error("expected gallery")
    gallery.style = "slider"
    const back = yamlToConfig(configToYaml(configWith([gallery])))
    const out = back.sections[0]
    if (out.type !== "gallery") throw new Error("expected gallery")
    expect(out.style).toBe("slider")
  })

  it("coerces malformed narrative fields back to safe defaults", () => {
    const bad = normalizeConfig({
      brand: { name: "X" },
      sections: [
        { type: "announcement", style: "weird", message: "Hello", deadline: "not-a-date", link: { label: "Go" } },
        { type: "problem", style: "steps", items: [{ icon: "clock", title: "A", body: "B" }] },
        { type: "video", style: "sideways", videoUrl: "  " },
        { type: "comparison", rows: [{ feature: "F", us: "yes", them: "no" }] },
      ],
    })
    expect(bad.sections).toHaveLength(4)
    const announcement = bad.sections[0]
    if (announcement.type !== "announcement") throw new Error("expected announcement")
    expect(announcement.style).toBe("static")
    expect(announcement.deadline).toBeUndefined()
    expect(announcement.link?.label).toBe("Go")
    const problem = bad.sections[1]
    if (problem.type !== "problem") throw new Error("expected problem")
    expect(problem.style).toBe("grid")
    const video = bad.sections[2]
    if (video.type !== "video") throw new Error("expected video")
    expect(video.style).toBe("cinematic")
    expect(video.videoUrl).toBe("")
    const comparison = bad.sections[3]
    if (comparison.type !== "comparison") throw new Error("expected comparison")
    expect(comparison.rows).toEqual([{ feature: "F", us: "yes", them: "no" }])
  })
})
