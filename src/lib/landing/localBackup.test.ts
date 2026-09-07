import { describe, it, expect, beforeEach } from "vitest"
import { writeLocalBackup, readLocalBackup, clearLocalBackup, BACKUP_TTL_MS } from "./localBackup"
import { TEMPLATES } from "./defaults"

// jsdom provides a real localStorage
beforeEach(() => {
  window.localStorage.clear()
})

const sample = () => ({
  id: "proj-1",
  name: "Vertex",
  slug: "vertex",
  config: TEMPLATES[0].build(),
})

describe("localBackup", () => {
  it("round-trips a project", () => {
    expect(writeLocalBackup(sample())).toBe(true)
    const back = readLocalBackup()
    expect(back).not.toBeNull()
    expect(back?.id).toBe("proj-1")
    expect(back?.name).toBe("Vertex")
    expect(back?.slug).toBe("vertex")
    expect(back?.config.sections.length).toBeGreaterThan(0)
    expect(typeof back?.savedAt).toBe("number")
  })

  it("survives a corrupted payload", () => {
    window.localStorage.setItem("forge-sites:backup:latest", "{not json")
    expect(readLocalBackup()).toBeNull()

    window.localStorage.setItem("forge-sites:backup:latest", JSON.stringify({ name: "x" }))
    expect(readLocalBackup()).toBeNull() // no sections array

    window.localStorage.setItem("forge-sites:backup:latest", JSON.stringify({ name: "x", config: { sections: [] } }))
    expect(readLocalBackup()).toBeNull() // empty sections are useless as a fallback
  })

  it("ignores backups older than the TTL", () => {
    const stale = { ...sample(), savedAt: Date.now() - BACKUP_TTL_MS - 1000 }
    window.localStorage.setItem("forge-sites:backup:latest", JSON.stringify(stale))
    expect(readLocalBackup()).toBeNull()

    // fresh explicit savedAt survives
    expect(writeLocalBackup({ ...sample(), savedAt: Date.now() })).toBe(true)
    expect(readLocalBackup()).not.toBeNull()
  })

  it("refuses oversized payloads instead of tripping quotas", () => {
    const big = sample()
    // a >2MB string field pushes the serialized payload past the safety cap
    big.config = { ...big.config, brand: { ...big.config.brand, name: "x".repeat(2_100_000) } } as typeof big.config
    expect(writeLocalBackup(big)).toBe(false)
    expect(window.localStorage.getItem("forge-sites:backup:latest")).toBeNull()
  })

  it("clears cleanly", () => {
    expect(writeLocalBackup(sample())).toBe(true)
    clearLocalBackup()
    expect(readLocalBackup()).toBeNull()
  })

  it("accepts a null project id (local-only draft)", () => {
    expect(writeLocalBackup({ ...sample(), id: null })).toBe(true)
    const back = readLocalBackup()
    expect(back?.id).toBeNull()
    expect(back?.name).toBe("Vertex")
  })
})

describe("landing store loadProject guard", () => {
  it("never crashes on undefined / malformed configs", async () => {
    const { useForge } = await import("./store")
    // the pre-fix crash: API 404 body → config undefined → TypeError
    expect(() => useForge.getState().loadProject("id", "x", "y", undefined as never)).not.toThrow()
    expect(() => useForge.getState().loadProject("id", "x", "y", { brand: null } as never)).not.toThrow()
    expect(useForge.getState().config.sections.length).toBeGreaterThan(0)

    // id-less local draft is fine too
    expect(() => useForge.getState().loadProject(null as never, "", "", undefined as never)).not.toThrow()
    expect(useForge.getState().project.id).toBeNull()
    expect(useForge.getState().project.name).toBe("Untitled page")
  })
})
