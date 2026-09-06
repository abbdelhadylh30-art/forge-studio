import { describe, expect, it } from "vitest"
import { buildGshockLaunch, launchDeadline } from "./gshockTemplate"
import { TEMPLATES } from "./defaults"
import { normalizeConfig } from "./yaml"
import { findBrokenAnchorLinks, sectionAnchors } from "./anchors"

describe("gshockTemplate", () => {
  it("builds an 18-section config with unique section ids", () => {
    const c = buildGshockLaunch()
    expect(c.sections).toHaveLength(18)
    const ids = c.sections.map((s) => s.id)
    expect(new Set(ids).size).toBe(18)
    expect(c.brand.name).toBe("G-SHOCK")
    expect(c.themeId).toBe("ember")
    expect(c.brand.mode).toBe("dark")
  })

  it("survives a normalizeConfig round-trip with content intact", () => {
    const c = normalizeConfig(buildGshockLaunch())
    expect(c.sections).toHaveLength(18)
    const hero = c.sections.find((s) => s.id === "gshock-hero")
    expect(hero?.type).toBe("hero")
    if (hero?.type !== "hero") return
    expect(hero.headline).toBe("Built to outlast everything.")
    expect(hero.images).toHaveLength(2)
    expect(hero.carousel).toBe("zoom")
    const offer = c.sections.find((s) => s.id === "gshock-offer")
    expect(offer?.type).toBe("offer")
    if (offer?.type !== "offer") return
    expect(offer.price).toBe("$99")
    expect(offer.originalPrice).toBe("$129")
    expect(offer.features).toHaveLength(5)
    expect(offer.deadline).toBeTruthy()
  })

  it("ships no broken in-page #anchor links", () => {
    const c = buildGshockLaunch()
    expect(findBrokenAnchorLinks(c)).toEqual([])
    const anchors = new Set(sectionAnchors(c).values())
    for (const wanted of ["offer", "story", "features", "gallery", "comparison", "faq", "contact"]) {
      expect(anchors.has(wanted), `anchor #${wanted} should exist`).toBe(true)
    }
  })

  it("returns a fresh object graph per call (no shared mutation)", () => {
    const a = buildGshockLaunch()
    a.brand.name = "MUTATED"
    const heroA = a.sections.find((s) => s.type === "hero")
    if (heroA?.type === "hero") heroA.headline = "MUTATED"
    const b = buildGshockLaunch()
    expect(b.brand.name).toBe("G-SHOCK")
    const heroB = b.sections.find((s) => s.type === "hero")
    expect(heroB?.type === "hero")
    if (heroB?.type === "hero") expect(heroB.headline).toBe("Built to outlast everything.")
  })

  it("rolls a live, shared future deadline (announcement + offer)", () => {
    const deadline = launchDeadline()
    expect(Number.isNaN(Date.parse(deadline))).toBe(false)
    expect(Date.parse(deadline)).toBeGreaterThan(Date.now() + 6 * 86_400_000)
    const c = buildGshockLaunch()
    const ann = c.sections.find((s) => s.id === "gshock-announcement")
    const offer = c.sections.find((s) => s.id === "gshock-offer")
    expect(ann?.type === "announcement" && ann.deadline).toBe(deadline)
    expect(offer?.type === "offer" && offer.deadline).toBe(deadline)
  })

  it("registers as a showcase template in TEMPLATES without touching defaults", () => {
    const t = TEMPLATES.find((x) => x.id === "product-launch")
    expect(t).toBeDefined()
    expect(t?.name).toBe("Product Launch")
    expect(t?.icon).toBe("gauge")
    expect(t?.stampName).toBe(false)
    expect(t?.description).toContain("G-SHOCK")
    // registry order / fallbacks unchanged
    expect(TEMPLATES[0]?.id).toBe("saas")
    expect(TEMPLATES.map((x) => x.id)).toContain("minimal")
  })
})
