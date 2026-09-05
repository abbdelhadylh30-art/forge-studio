import { describe, it, expect } from "vitest"
import {
  THEMES,
  getTheme,
  themeVars,
  resolveMode,
  themeStyle,
  themeVarsCss,
  accentVars,
  FONT_PAIRS,
  googleFontHref,
  isValidAccent,
  tweaksCss,
} from "./themes"

const VAR_KEYS = [
  "bg",
  "bgAlt",
  "surface",
  "text",
  "textMuted",
  "accent",
  "accentText",
  "accentSoft",
  "border",
  "gradient",
] as const

describe("dual-mode themes", () => {
  it("ships 10 themes, unique ids, each with a full dark AND light variable set", () => {
    expect(THEMES).toHaveLength(10)
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(10)
    const modes = new Set(["dark", "light"])
    for (const th of THEMES) {
      expect(modes).toContain(th.mode)
      for (const key of VAR_KEYS) {
        expect(th.dark[key], `${th.id}.dark.${key}`).toBeTruthy()
        expect(th.light[key], `${th.id}.light.${key}`).toBeTruthy()
      }
      expect(th.swatch).toHaveLength(3)
      expect(th.swatchAlt).toHaveLength(3)
    }
  })

  it("splits evenly: dark-first and light-first palettes both exist", () => {
    const dark = THEMES.filter((t) => t.mode === "dark")
    const light = THEMES.filter((t) => t.mode === "light")
    expect(dark.length).toBeGreaterThanOrEqual(5)
    expect(light.length).toBeGreaterThanOrEqual(4)
  })

  it("themeVars picks the right set; getTheme falls back to the first theme", () => {
    expect(themeVars("paper", "light").bg).toBe(getTheme("paper").light.bg)
    expect(themeVars("paper", "dark").bg).toBe(getTheme("paper").dark.bg)
    expect(getTheme("volcano" as never).id).toBe("nebula")
  })

  it("resolveMode: unset → theme preference, auto → system, forced → itself", () => {
    expect(resolveMode("nebula", undefined, false)).toBe("dark") // unset stays legacy-safe
    expect(resolveMode("paper", undefined, true)).toBe("light")
    expect(resolveMode("nebula", "auto", true)).toBe("dark")
    expect(resolveMode("paper", "auto", false)).toBe("light")
    expect(resolveMode("nebula", "light", true)).toBe("light")
    expect(resolveMode("paper", "dark", false)).toBe("dark")
  })

  it("themeStyle defaults to the theme's preferred mode and honors the override", () => {
    const dark = themeStyle("nebula") as Record<string, string>
    expect(dark["--lf-bg"]).toBe(getTheme("nebula").dark.bg)
    const light = themeStyle("nebula", undefined, undefined, "light") as Record<string, string>
    expect(light["--lf-bg"]).toBe(getTheme("nebula").light.bg)
    expect(light.background).toBe(getTheme("nebula").light.bg)
  })

  it("themeStyle applies a valid brand accent over both modes", () => {
    const style = themeStyle("nebula", "#ff0000", undefined, "light") as Record<string, string>
    expect(style["--lf-accent"]).toBe("#ff0000")
    expect(style["--lf-gradient"]).toContain("#ff0000")
  })

  it("themeVarsCss emits base dark vars, a light override rule and an auto media query", () => {
    const css = themeVarsCss("slate")
    expect(css).toContain(".lf-root{--lf-bg:")
    expect(css).toContain('.lf-root[data-lf-mode="light"]{--lf-bg:')
    expect(css).toContain("@media (prefers-color-scheme: light)")
    expect(css).toContain('.lf-root[data-lf-mode="auto"]{--lf-bg:')
    // accent override applies to both palettes
    const withAccent = themeVarsCss("slate", "#ff0000")
    expect(withAccent).toContain("--lf-accent:#ff0000")
    expect((withAccent.match(/--lf-accent:#ff0000/g) ?? []).length).toBeGreaterThanOrEqual(2)
  })

  it("accentVars derives a full tint set and rejects invalid hex", () => {
    const vars = accentVars("#22d3ee")
    expect(vars).not.toBeNull()
    expect(vars?.accent).toBe("#22d3ee")
    expect(vars?.accentSoft).toContain("rgba(34,211,238,0.14)")
    expect(accentVars("nope")).toBeNull()
    expect(isValidAccent("a78bfa")).toBe(true)
    expect(isValidAccent("#12")).toBe(false)
  })
})

describe("font pairs", () => {
  it("ships 11 pairs with unique ids; google URLs only on webfont pairs", () => {
    expect(FONT_PAIRS.length).toBe(11)
    expect(new Set(FONT_PAIRS.map((f) => f.id)).size).toBe(11)
    for (const pair of FONT_PAIRS) {
      if (pair.google) {
        expect(pair.google.startsWith("https://fonts.googleapis.com/css2?")).toBe(true)
      } else {
        expect(googleFontHref(pair.id)).toBeNull()
      }
    }
  })

  it("includes the Jakarta, Poppins and Arabic webfont pairs", () => {
    expect(googleFontHref("g-jakarta")).toContain("Plus+Jakarta+Sans")
    expect(googleFontHref("g-poppins")).toContain("Poppins")
    expect(googleFontHref("g-arabic")).toContain("Noto+Sans+Arabic")
  })
})

describe("theme fine-tuning CSS (tweaksCss)", () => {
  it("emits scoped rules for set knobs and escapes responsive classes", () => {
    const css = tweaksCss({ headingScale: 1.1, cardRadius: 0, buttonRadius: "pill" })
    expect(css).toContain(".lf-tweaks .text-2xl{font-size:calc(1.5rem*1.1)}")
    expect(css).toContain('@media (min-width:48rem){.lf-tweaks .md\\:text-4xl{font-size:calc(2.25rem*1.1)}}')
    expect(css).toContain(".lf-tweaks .rounded-xl{border-radius:0rem}")
    expect(css).toContain("border-radius:9999px")
    expect(css).not.toContain("shadow")
  })

  it("emits section-scoped padding overrides and body-scale rules", () => {
    const css = tweaksCss({ sectionPadding: 1.25, bodyScale: 1.05, lineHeight: 1.7, shadowIntensity: 0 })
    expect(css).toContain(".lf-tweaks section.py-16{padding-block:calc(4rem*1.25)}")
    expect(css).toContain(".lf-tweaks .text-sm{font-size:calc(0.875rem*1.05)}")
    expect(css).toContain(".lf-tweaks .text-\\[13px\\]{font-size:calc(13px*1.05)}")
    expect(css).toContain(".lf-tweaks .leading-relaxed{line-height:1.7}")
    expect(css).toContain(".lf-tweaks .shadow-lg{box-shadow:")
    expect(css).not.toContain("border-radius")
  })

  it("returns empty CSS for identity / empty tweaks", () => {
    expect(tweaksCss(undefined)).toBe("")
    expect(tweaksCss({})).toBe("")
    expect(tweaksCss({ headingScale: 1, cardRadius: 0.75, shadowIntensity: 1 })).toBe("")
  })

  it("replaces the gradient end with the secondary color (duotone)", () => {
    const css = themeVarsCss("nebula", undefined, "#22d3ee")
    expect(css).toContain("linear-gradient(135deg, #A78BFA 0%, #22d3ee 100%)")
    const style = themeStyle("nebula", undefined, undefined, "dark", "#22d3ee") as Record<string, string>
    expect(style["--lf-gradient"]).toBe("linear-gradient(135deg, #A78BFA 0%, #22d3ee 100%)")
  })
})
