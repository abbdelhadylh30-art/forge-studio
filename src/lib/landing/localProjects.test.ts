import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  upsertLocalProject,
  listLocalProjects,
  getLocalProject,
  getLocalProjectBySlug,
  removeLocalProject,
  clearLocalProjects,
  REGISTRY_TTL_MS,
} from "./localProjects"
import { TEMPLATES } from "./defaults"
import type { LocalProject } from "./localProjects"

// jsdom provides a real localStorage
beforeEach(() => {
  window.localStorage.clear()
  vi.restoreAllMocks()
})

const sample = (id: string, over: Partial<LocalProject> = {}): Omit<LocalProject, "updatedAt"> & { updatedAt?: number } => ({
  id,
  name: `Project ${id}`,
  slug: `project-${id}`,
  config: TEMPLATES[0].build(),
  ...over,
})

describe("localProjects registry", () => {
  it("round-trips a single project", () => {
    expect(upsertLocalProject(sample("p1"))).toBe(true)
    const got = getLocalProject("p1")
    expect(got).not.toBeNull()
    expect(got?.name).toBe("Project p1")
    expect(got?.slug).toBe("project-p1")
    expect(got?.config.sections.length).toBeGreaterThan(0)
    expect(typeof got?.updatedAt).toBe("number")
  })

  it("lists newest-first and finds by slug", () => {
    upsertLocalProject(sample("p1", { updatedAt: Date.now() - 10_000 }))
    upsertLocalProject(sample("p2"))
    const list = listLocalProjects()
    expect(list.map((p) => p.id)).toEqual(["p2", "p1"])
    expect(getLocalProjectBySlug("project-p2")?.id).toBe("p2")
    expect(getLocalProjectBySlug("missing")).toBeNull()
  })

  it("updates an existing entry in place (upsert, not append)", () => {
    upsertLocalProject(sample("p1"))
    upsertLocalProject(sample("p1", { name: "Renamed" }))
    expect(listLocalProjects()).toHaveLength(1)
    expect(getLocalProject("p1")?.name).toBe("Renamed")
  })

  it("survives a corrupted registry payload", () => {
    window.localStorage.setItem("forge-sites:projects:registry", "{not json")
    expect(listLocalProjects()).toEqual([])
    expect(getLocalProject("p1")).toBeNull()
    // writes still work over the corruption
    expect(upsertLocalProject(sample("p1"))).toBe(true)
    expect(getLocalProject("p1")?.id).toBe("p1")
  })

  it("filters invalid entries instead of crashing on read", () => {
    const registry = {
      bad1: { id: "bad1" }, // no name/slug/config
      bad2: "a string",
      good: { id: "good", name: "G", slug: "g", updatedAt: Date.now(), config: TEMPLATES[0].build() },
    }
    window.localStorage.setItem("forge-sites:projects:registry", JSON.stringify(registry))
    const list = listLocalProjects()
    expect(list.map((p) => p.id)).toEqual(["good"])
  })

  it("ignores entries older than the TTL", () => {
    const stale = sample("stale", { updatedAt: Date.now() - REGISTRY_TTL_MS - 1000 })
    expect(upsertLocalProject(stale)).toBe(true) // written with explicit stale stamp
    expect(getLocalProject("stale")).toBeNull() // read path filters it
    expect(listLocalProjects().find((p) => p.id === "stale")).toBeUndefined()
  })

  it("refuses oversized configs instead of tripping quotas", () => {
    const big = sample("big")
    big.config = {
      ...big.config,
      brand: { ...big.config.brand, name: "x".repeat(600_000) },
    } as typeof big.config
    expect(upsertLocalProject(big)).toBe(false)
    expect(getLocalProject("big")).toBeNull()
  })

  it("caps the number of projects (oldest evicted first)", () => {
    for (let i = 0; i < 30; i++) {
      upsertLocalProject(sample(`p${i}`, { updatedAt: Date.now() + i })) // increasing freshness
    }
    const list = listLocalProjects()
    expect(list.length).toBeLessThanOrEqual(24)
    // the newest survive, the oldest are gone
    expect(list.find((p) => p.id === "p29")).toBeDefined()
    expect(list.find((p) => p.id === "p0")).toBeUndefined()
  })

  it("removes entries cleanly and never throws", () => {
    upsertLocalProject(sample("p1"))
    removeLocalProject("p1")
    expect(getLocalProject("p1")).toBeNull()
    // removing a missing id is a no-op
    expect(() => removeLocalProject("nope")).not.toThrow()
  })

  it("clearLocalProjects wipes the registry", () => {
    upsertLocalProject(sample("p1"))
    clearLocalProjects()
    expect(listLocalProjects()).toEqual([])
  })

  it("degrades gracefully when localStorage throws (quota)", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota exceeded")
    })
    expect(upsertLocalProject(sample("p1"))).toBe(false)
    expect(() => removeLocalProject("p1")).not.toThrow()
    expect(() => clearLocalProjects()).not.toThrow()
    spy.mockRestore()
  })
})
