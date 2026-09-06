import { describe, expect, it } from "vitest"
import { buildClothingLaunch } from "./clothingTemplate"
import { buildPortfolioSite } from "./portfolioTemplate"
import { buildRealEstateLaunch } from "./realestateTemplate"
import { buildCoffeeLaunch } from "./coffeeTemplate"
import { normalizeConfig } from "./yaml"
import { findBrokenAnchorLinks, sectionAnchors } from "./anchors"

const EXPECTED_SECTIONS = {
  clothing: 18,
  portfolio: 14,
  realestate: 15,
  coffee: 18,
} as const

const BUILDERS = {
  clothing: buildClothingLaunch,
  portfolio: buildPortfolioSite,
  realestate: buildRealEstateLaunch,
  coffee: buildCoffeeLaunch,
} as const

const BRANDS = {
  clothing: "NORTHFORM",
  portfolio: "Mara Osei",
  realestate: "The Alder House",
  coffee: "Meridian Roasters",
} as const

const THEMES = {
  clothing: "mono",
  portfolio: "slate",
  realestate: "ocean",
  coffee: "gold",
} as const

const REQUIRED_ANCHORS: Record<string, string[]> = {
  clothing: ["offer", "gallery", "features", "guarantee", "faq", "contact", "story", "comparison"],
  portfolio: ["gallery", "features", "story", "faq", "contact", "pricing"],
  realestate: ["features", "gallery", "story", "offer", "faq", "contact", "comparison"],
  coffee: ["features", "story", "offer", "testimonials", "faq", "contact", "comparison"],
}

describe.each(Object.keys(BUILDERS))("%s template", (key) => {
  const build = BUILDERS[key as keyof typeof BUILDERS]

  it("builds the full section list with unique ids", () => {
    const c = build()
    expect(c.sections).toHaveLength(EXPECTED_SECTIONS[key as keyof typeof EXPECTED_SECTIONS])
    const ids = c.sections.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(c.brand.name).toBe(BRANDS[key as keyof typeof BRANDS])
    expect(c.themeId).toBe(THEMES[key as keyof typeof THEMES])
  })

  it("ships no broken in-page #anchor links", () => {
    const c = build()
    expect(findBrokenAnchorLinks(c)).toEqual([])
    const anchors = new Set(sectionAnchors(c).values())
    for (const wanted of REQUIRED_ANCHORS[key as keyof typeof REQUIRED_ANCHORS]) {
      expect(anchors.has(wanted), `anchor #${wanted} should exist`).toBe(true)
    }
  })

  it("survives a normalizeConfig round-trip with content intact", () => {
    const c = normalizeConfig(build())
    expect(c.sections).toHaveLength(EXPECTED_SECTIONS[key as keyof typeof EXPECTED_SECTIONS])
    expect(c.brand.name).toBe(BRANDS[key as keyof typeof BRANDS])
    const hero = c.sections.find((s) => s.type === "hero")
    expect(hero?.type).toBe("hero")
    if (hero?.type === "hero") {
      expect(hero.headline.length).toBeGreaterThan(5)
      expect(hero.images?.length ?? 0).toBe(2)
    }
    const offer = c.sections.find((s) => s.type === "offer")
    if (offer) {
      expect(offer.type === "offer" && offer.price.length).toBeGreaterThan(0)
      expect(offer.type === "offer" && offer.features.length).toBeGreaterThan(2)
    }
  })

  it("returns a fresh object graph per call (no shared mutation)", () => {
    const a = build()
    a.brand.name = "MUTATED"
    const b = build()
    expect(b.brand.name).toBe(BRANDS[key as keyof typeof BRANDS])
    expect(b.sections.map((s) => s.id)).not.toBe(a.sections.map((s) => s.id))
  })
})

describe("niche-specific content checks", () => {
  it("clothing: drop bundle countdowns share a live future deadline", () => {
    const c = buildClothingLaunch()
    const ann = c.sections.find((s) => s.id === "northform-announcement")
    const offer = c.sections.find((s) => s.id === "northform-offer")
    const annDeadline = ann?.type === "announcement" ? ann.deadline : undefined
    const offerDeadline = offer?.type === "offer" ? offer.deadline : undefined
    expect(annDeadline).toBeTruthy()
    expect(offerDeadline).toBe(annDeadline)
    expect(Date.parse(annDeadline!)).toBeGreaterThan(Date.now() + 3 * 86_400_000)
  })

  it("realestate: review countdown is live and the listing price survives", () => {
    const c = buildRealEstateLaunch()
    const offer = c.sections.find((s) => s.id === "alder-offer")
    expect(offer?.type === "offer" && offer.price).toBe("$1,295,000")
    expect(offer?.type === "offer" && offer.originalPrice).toBe("$1,349,000")
    const deadline = offer?.type === "offer" ? offer.deadline : undefined
    expect(deadline).toBeTruthy()
    expect(Date.parse(deadline!)).toBeGreaterThan(Date.now() + 4 * 86_400_000)
  })

  it("coffee: subscription offer ends in the future", () => {
    const c = buildCoffeeLaunch()
    const offer = c.sections.find((s) => s.id === "meridian-offer")
    const deadline = offer?.type === "offer" ? offer.deadline : undefined
    expect(Date.parse(deadline!)).toBeGreaterThan(Date.now() + 7 * 86_400_000)
    expect(offer?.type === "offer" && offer.price).toBe("$17")
  })

  it("portfolio: no countdowns, services + engagements present", () => {
    const c = buildPortfolioSite()
    const types = c.sections.map((s) => s.type)
    expect(types).toContain("pricing")
    expect(types).toContain("features")
    expect(types).not.toContain("announcement")
    expect(types).not.toContain("offer")
  })

  it("all four declare fonts and seo metadata", () => {
    for (const build of Object.values(BUILDERS)) {
      const c = build()
      expect(c.brand.font).toBeTruthy()
      expect(c.seo.title.length).toBeGreaterThan(10)
      expect(c.seo.description.length).toBeGreaterThan(60)
      expect(c.seo.keywords).toBeTruthy()
      expect(c.seo.ogImage).toMatch(/^https:\/\//)
    }
  })
})
