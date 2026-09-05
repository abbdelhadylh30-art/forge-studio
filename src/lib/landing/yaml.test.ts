import { describe, it, expect } from "vitest"
import { configToYaml, yamlToConfig, normalizeConfig } from "./yaml"
import { auditConfig } from "./readiness"
import type { ContactSection, LandingConfig, Section } from "./types"
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

describe("dual-mode themes (dark / light / auto)", () => {
  const hero = createSection("hero")
  const footer = createSection("footer")

  it("round-trips brand.mode through the YAML text", () => {
    const cfg = configWith([hero, footer])
    cfg.brand.mode = "auto"
    const text = configToYaml(cfg)
    expect(text).toContain("mode: auto")
    const back = yamlToConfig(text)
    expect(back.brand.mode).toBe("auto")
  })

  it("accepts the four new theme ids and coerces unknown ones", () => {
    for (const id of ["slate", "ocean", "gold", "midnight"] as const) {
      const cfg = configWith([hero, footer])
      cfg.themeId = id
      const back = yamlToConfig(configToYaml(cfg))
      expect(back.themeId).toBe(id)
    }
    const bad = normalizeConfig({ brand: { name: "X" }, themeId: "volcano", sections: [{ type: "hero" }] })
    expect(bad.themeId).toBe("nebula")
  })

  it("drops invalid brand.mode values and keeps undefined unset", () => {
    const bad = normalizeConfig({ brand: { name: "X", mode: "sepia" }, sections: [{ type: "hero" }] })
    expect(bad.brand.mode).toBeUndefined()
    const fine = normalizeConfig({ brand: { name: "X", mode: "light" }, sections: [{ type: "hero" }] })
    expect(fine.brand.mode).toBe("light")
  })
})

describe("privacy & tracking (cookie consent + custom scripts)", () => {
  const hero = createSection("hero")
  const footer = createSection("footer")

  it("round-trips the legal + tracking blocks", () => {
    const cfg = configWith([hero, footer])
    cfg.legal = {
      cookieConsent: {
        enabled: true,
        message: "We use cookies. By continuing you agree.",
        acceptLabel: "Accept all",
        declineLabel: "Essential only",
        learnMoreUrl: "https://example.com/privacy",
        position: "top",
      },
    }
    cfg.tracking = {
      headScripts: '<script>window.__ga=1</script>',
      bodyScripts: "<!-- chat widget -->",
    }
    const back = yamlToConfig(configToYaml(cfg))
    expect(back.legal?.cookieConsent?.enabled).toBe(true)
    expect(back.legal?.cookieConsent?.acceptLabel).toBe("Accept all")
    expect(back.legal?.cookieConsent?.position).toBe("top")
    expect(back.legal?.cookieConsent?.learnMoreUrl).toBe("https://example.com/privacy")
    expect(back.tracking?.headScripts).toContain("__ga")
    expect(back.tracking?.bodyScripts).toContain("chat widget")
  })

  it("drops malformed legal/tracking and keeps well-formed partials", () => {
    const bad = normalizeConfig({
      brand: { name: "X" },
      legal: { cookieConsent: { enabled: "yes", message: 42 } },
      tracking: { headScripts: 7 },
      sections: [{ type: "hero" }],
    })
    expect(bad.legal).toBeUndefined()
    expect(bad.tracking).toBeUndefined()
    // banner without explicit labels keeps safe defaults
    const minimal = normalizeConfig({
      brand: { name: "X" },
      legal: { cookieConsent: { enabled: true, message: "ok" } },
      sections: [{ type: "hero" }],
    })
    expect(minimal.legal?.cookieConsent?.acceptLabel).toBe("Accept")
    expect(minimal.legal?.cookieConsent?.position).toBe("bottom")
    // empty consent (enabled false + no message) is dropped entirely
    const off = normalizeConfig({
      brand: { name: "X" },
      legal: { cookieConsent: { enabled: false, message: "" } },
      sections: [{ type: "hero" }],
    })
    expect(off.legal).toBeUndefined()
  })
})

describe("contact form delivery (inbox / sheets / embed)", () => {
  const contactSection = (): ContactSection => createSection("contact") as ContactSection

  it("round-trips the sheets webhook delivery", () => {
    const contact = contactSection()
    contact.delivery = "sheets"
    contact.sheetWebhookUrl = "https://script.google.com/macros/s/ABC/exec"
    const back = yamlToConfig(configToYaml(configWith([contact])))
    const c = back.sections[0]
    if (c.type !== "contact") throw new Error("expected contact")
    expect(c.delivery).toBe("sheets")
    expect(c.sheetWebhookUrl).toBe("https://script.google.com/macros/s/ABC/exec")
  })

  it("round-trips the embed delivery and drops URLs from other modes", () => {
    const contact = contactSection()
    contact.delivery = "embed"
    contact.googleFormUrl = "https://docs.google.com/forms/d/e/X/viewform"
    contact.sheetWebhookUrl = "https://script.google.com/macros/s/NOPE/exec" // wrong mode → dropped
    const back = yamlToConfig(configToYaml(configWith([contact])))
    const c = back.sections[0]
    if (c.type !== "contact") throw new Error("expected contact")
    expect(c.delivery).toBe("embed")
    expect(c.googleFormUrl).toBe("https://docs.google.com/forms/d/e/X/viewform")
    expect(c.sheetWebhookUrl).toBeUndefined()
  })

  it("coerces invalid delivery values back to inbox (unset)", () => {
    const bad = normalizeConfig({
      brand: { name: "X" },
      sections: [{ type: "contact", fields: ["Name"], delivery: "carrier-pigeon", sheetWebhookUrl: "ftp://nope" }],
    })
    const c = bad.sections[0]
    if (c.type !== "contact") throw new Error("expected contact")
    expect(c.delivery).toBeUndefined()
    expect(c.sheetWebhookUrl).toBeUndefined()
  })
})

describe("readiness export checks", () => {
  it("audits contact delivery per mode + consent gating + og image", () => {
    const contact = createSection("contact") as ContactSection
    const cfg = configWith([contact, createSection("hero")])
    // inbox + email → warn (mailto fallback works)
    contact.email = "hi@example.com"
    let report = auditConfig(cfg)
    const inboxCheck = report.checks.find((c) => c.id === "export-form")
    expect(inboxCheck?.category).toBe("export")
    expect(inboxCheck?.level).toBe("warn")
    // sheets + valid webhook → pass
    contact.delivery = "sheets"
    contact.sheetWebhookUrl = "https://script.google.com/macros/s/X/exec"
    report = auditConfig(cfg)
    expect(report.checks.find((c) => c.id === "export-form")?.level).toBe("pass")
    // sheets + missing webhook → fail
    contact.sheetWebhookUrl = undefined
    report = auditConfig(cfg)
    expect(report.checks.find((c) => c.id === "export-form")?.level).toBe("fail")
    // consent-gated scripts → pass; ungated → warn
    cfg.tracking = { headScripts: "<script>ga()</script>", bodyScripts: "" }
    report = auditConfig(cfg)
    expect(report.checks.find((c) => c.id === "export-scripts")?.level).toBe("warn")
    cfg.legal = { cookieConsent: { enabled: true, message: "ok", acceptLabel: "Accept", declineLabel: "Decline", position: "bottom" } }
    report = auditConfig(cfg)
    expect(report.checks.find((c) => c.id === "export-scripts")?.level).toBe("pass")
    // no og image + no hero image → warn
    expect(report.checks.find((c) => c.id === "export-og")?.level).toBe("warn")
    // every check still feeds a score in 0-100
    expect(report.score).toBeGreaterThanOrEqual(0)
    expect(report.score).toBeLessThanOrEqual(100)
  })
})

describe("offer section (price / countdown / trust)", () => {
  it("round-trips the full offer block", () => {
    const cfg = configWith([])
    cfg.sections = [
      {
        id: "offer-1",
        type: "offer",
        title: "Flash sale",
        subtitle: "Half price, 48 hours",
        badge: "Ends tonight",
        price: "$49",
        originalPrice: "$99",
        period: "One-time payment",
        savingsLabel: "Save 50%",
        deadline: new Date("2030-01-01T00:00:00Z").toISOString(),
        countdownPrefix: "Price doubles in",
        features: ["All features", "Lifetime updates"],
        cta: { label: "Get it", href: "#cta" },
        trust: [{ icon: "lock", label: "Secure checkout" }],
        style: "split",
      },
    ]
    const back = yamlToConfig(configToYaml(cfg))
    const offer = back.sections[0] as unknown as Record<string, unknown>
    expect(offer.style).toBe("split")
    expect(offer.price).toBe("$49")
    expect(offer.originalPrice).toBe("$99")
    expect(offer.deadline).toBe(new Date("2030-01-01T00:00:00Z").toISOString())
    expect(offer.features).toEqual(["All features", "Lifetime updates"])
    expect(offer.trust).toEqual([{ icon: "lock", label: "Secure checkout" }])
  })

  it("coerces malformed offer fields to safe defaults", () => {
    const out = normalizeConfig({
      brand: { name: "X" },
      sections: [
        {
          type: "offer",
          style: "matrix",
          price: 123,
          deadline: "not a date",
          features: [],
          trust: [{ icon: "lock" }, "junk"],
          cta: { href: "https://x.com" },
        },
      ],
    })
    const offer = out.sections[0] as unknown as Record<string, unknown>
    expect(offer.style).toBe("card")
    expect(offer.price).toBe("123")
    expect(offer.deadline).toBeUndefined()
    expect((offer.features as string[]).length).toBeGreaterThanOrEqual(2) // fallback pair
    expect((offer.trust as unknown[] | undefined)).toBeUndefined() // no valid labels → dropped
    expect(offer.cta).toEqual({ label: "Claim this offer", href: "#cta" }) // fresh default cta
  })
})

describe("footer social links (platform + url)", () => {
  it("round-trips structured socialLinks and activates only http(s) urls", () => {
    const cfg = configWith([])
    cfg.sections = [
      {
        id: "footer-1",
        type: "footer",
        style: "mega",
        linkGroups: [{ group: "Product", items: [] }],
        socialLinks: [
          { platform: "X", url: "https://x.com/forge" },
          { platform: "GitHub", url: "javascript:alert(1)" },
          { platform: "Instagram", url: "" },
        ],
      } as never,
    ]
    const back = yamlToConfig(configToYaml(cfg))
    const footer = back.sections[0] as unknown as { socialLinks?: { platform: string; url: string }[] }
    expect(footer.socialLinks).toEqual([
      { platform: "X", url: "https://x.com/forge" },
      { platform: "GitHub", url: "" }, // non-http scheme falls back to decorative
      { platform: "Instagram", url: "" },
    ])
  })

  it("coerces legacy social: [\"X\", \"GitHub\"] to url-less socialLinks", () => {
    const out = normalizeConfig({
      brand: { name: "X" },
      sections: [{ type: "footer", style: "minimal", social: ["X", "GitHub"], linkGroups: [] }],
    })
    const footer = out.sections[0] as unknown as { social?: unknown; socialLinks?: { platform: string; url: string }[] }
    expect(footer.social).toBeUndefined()
    expect(footer.socialLinks).toEqual([
      { platform: "X", url: "" },
      { platform: "GitHub", url: "" },
    ])
  })
})

describe("legal pages (privacy / terms bodies + footer links)", () => {
  it("round-trips privacy and terms content with the link URLs", () => {
    const cfg = configWith([])
    cfg.legal = {
      privacyPolicy: "## Heading\n\nBody text.\n- bullet",
      termsConditions: "Terms body",
      privacyUrl: "privacy.html",
      termsUrl: "terms.html",
      docsUrl: "https://docs.example.com",
    }
    const back = yamlToConfig(configToYaml(cfg))
    expect(back.legal?.privacyPolicy).toContain("## Heading")
    expect(back.legal?.termsConditions).toBe("Terms body")
    expect(back.legal?.privacyUrl).toBe("privacy.html")
    expect(back.legal?.termsUrl).toBe("terms.html")
    expect(back.legal?.docsUrl).toBe("https://docs.example.com")
  })

  it("keeps legal pages when the consent banner is absent and vice versa", () => {
    const out = normalizeConfig({
      brand: { name: "X" },
      legal: { privacyPolicy: "policy body only" },
      sections: [{ type: "hero" }],
    })
    expect(out.legal?.privacyPolicy).toBe("policy body only")
    expect(out.legal?.cookieConsent).toBeUndefined()
  })

  it("drops malformed legal link urls but keeps valid relative filenames", () => {
    const out = normalizeConfig({
      brand: { name: "X" },
      legal: { privacyUrl: "not a url", termsUrl: "terms.html" },
      sections: [{ type: "hero" }],
    })
    expect(out.legal?.privacyUrl).toBeUndefined()
    expect(out.legal?.termsUrl).toBe("terms.html")
  })
})

describe("P4 style variants (problem / solution / comparison / guarantee / faq / gallery / contact)", () => {
  it("round-trips every new narrative style through the YAML text", () => {
    const problem = createSection("problem")
    if (problem.type !== "problem") throw new Error("expected problem")
    problem.style = "timeline"
    const solution = createSection("solution")
    if (solution.type !== "solution") throw new Error("expected solution")
    solution.style = "alternating"
    const back = yamlToConfig(configToYaml(configWith([problem, solution])))
    const p = back.sections.find((s) => s.type === "problem")
    const sol = back.sections.find((s) => s.type === "solution")
    expect(p && p.type === "problem" && p.style).toBe("timeline")
    expect(sol && sol.type === "solution" && sol.style).toBe("alternating")
  })

  it("coerces unknown narrative styles back to the first safe default", () => {
    const out = normalizeConfig({
      brand: { name: "X" },
      sections: [
        { type: "problem", style: "hologram", items: [] },
        { type: "solution", style: "neon", items: [] },
        { type: "guarantee", style: "forcefield", items: [] },
      ],
    })
    expect(out.sections[0].type === "problem" && out.sections[0].style).toBe("grid")
    expect(out.sections[1].type === "solution" && out.sections[1].style).toBe("grid")
    expect(out.sections[2].type === "guarantee" && out.sections[2].style).toBe("card")
  })

  it("round-trips the comparison style and defaults legacy sections to table", () => {
    const styled = createSection("comparison")
    if (styled.type !== "comparison") throw new Error("expected comparison")
    styled.style = "matrix"
    const back = yamlToConfig(configToYaml(configWith([styled])))
    const c = back.sections.find((s) => s.type === "comparison")
    expect(c && c.type === "comparison" && c.style).toBe("matrix")

    const legacy = normalizeConfig({ brand: { name: "X" }, sections: [{ type: "comparison", rows: [] }] })
    const lc = legacy.sections.find((s) => s.type === "comparison")
    expect(lc && lc.type === "comparison" && lc.style).toBe("table")
  })

  it("round-trips faq cards/categorized styles + per-item categories", () => {
    const faq = createSection("faq")
    if (faq.type !== "faq") throw new Error("expected faq")
    faq.style = "categorized"
    faq.items = [
      { q: "Refunds?", a: "Yes.", category: "Billing" },
      { q: "RTL?", a: "Yes.", category: "Features" },
      { q: "Who?", a: "Us." },
    ]
    const back = yamlToConfig(configToYaml(configWith([faq])))
    const f = back.sections.find((s) => s.type === "faq")
    expect(f && f.type === "faq" && f.style).toBe("categorized")
    if (f && f.type === "faq") {
      expect(f.items[0].category).toBe("Billing")
      expect(f.items[2].category).toBeUndefined()
    }
  })

  it("round-trips the gallery horizontal strip + contact layouts", () => {
    const gallery = createSection("gallery")
    if (gallery.type !== "gallery") throw new Error("expected gallery")
    gallery.style = "horizontal"
    const contact = createSection("contact")
    if (contact.type !== "contact") throw new Error("expected contact")
    contact.style = "sidebar"
    const back = yamlToConfig(configToYaml(configWith([gallery, contact])))
    const g = back.sections.find((s) => s.type === "gallery")
    const c = back.sections.find((s) => s.type === "contact")
    expect(g && g.type === "gallery" && g.style).toBe("horizontal")
    expect(c && c.type === "contact" && c.style).toBe("sidebar")
  })

  it("defaults legacy contact sections to the split layout (pixel-identical)", () => {
    const out = normalizeConfig({ brand: { name: "X" }, sections: [{ type: "contact", fields: ["Name"] }] })
    const c = out.sections.find((s) => s.type === "contact")
    expect(c && c.type === "contact" && c.style).toBe("split")
    expect(c && c.type === "contact" && c.delivery).toBeUndefined()
  })
})

describe("theme fine-tuning (P5 themeTweaks)", () => {
  it("round-trips the full tweaks block through the YAML text", () => {
    const cfg = configWith([createSection("hero")])
    cfg.themeTweaks = {
      secondary: "#22d3ee",
      headingScale: 1.15,
      bodyScale: 1.05,
      lineHeight: 1.7,
      letterSpacing: -0.01,
      paragraphSpacing: 1.5,
      sectionPadding: 1.2,
      contentMaxWidth: 1280,
      cardRadius: 1.25,
      buttonRadius: "pill",
      shadowIntensity: 0.5,
    }
    const back = yamlToConfig(configToYaml(cfg))
    expect(back.themeTweaks).toEqual(cfg.themeTweaks)
  })

  it("clamps out-of-range knobs and drops identity values", () => {
    const out = normalizeConfig({
      brand: { name: "X" },
      themeTweaks: {
        headingScale: 9,
        bodyScale: 0.1,
        lineHeight: 42,
        contentMaxWidth: 9999,
        cardRadius: -5,
        shadowIntensity: 100,
        buttonRadius: "wavy",
        secondary: "nope",
      },
      sections: [{ type: "hero" }],
    })
    expect(out.themeTweaks?.headingScale).toBe(1.3)
    expect(out.themeTweaks?.bodyScale).toBe(0.9)
    expect(out.themeTweaks?.lineHeight).toBe(2)
    expect(out.themeTweaks?.contentMaxWidth).toBe(1600)
    expect(out.themeTweaks?.cardRadius).toBe(0)
    expect(out.themeTweaks?.shadowIntensity).toBe(2)
    expect(out.themeTweaks?.buttonRadius).toBeUndefined()
    expect(out.themeTweaks?.secondary).toBeUndefined()
    // identity knobs vanish entirely
    const identity = normalizeConfig({
      brand: { name: "X" },
      themeTweaks: { headingScale: 1, shadowIntensity: 1, cardRadius: 0.75 },
      sections: [{ type: "hero" }],
    })
    expect(identity.themeTweaks).toBeUndefined()
  })

  it("omits the themeTweaks block when unset (legacy YAML stays clean)", () => {
    expect(configToYaml(configWith([createSection("hero")]))).not.toContain("themeTweaks")
  })
})
