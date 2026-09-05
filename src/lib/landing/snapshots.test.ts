import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  listSnapshots,
  saveSnapshot,
  deleteSnapshot,
  describeAge,
  MAX_SNAPSHOT_SLOTS,
} from "./snapshots"
import { normalizeConfig } from "./yaml"
import type { LandingConfig } from "./types"

function sampleConfig(name: string): LandingConfig {
  return normalizeConfig({
    brand: { name },
    themeId: "nebula",
    seo: { title: `${name} — landing`, description: "" },
    sections: [
      { type: "hero", headline: `${name} hero` },
      { type: "footer", style: "minimal", linkGroups: [] },
    ],
  })
}

const PID = "proj-test-1"

describe("version snapshots", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("starts empty and saves a named snapshot", () => {
    expect(listSnapshots(PID)).toEqual([])
    const snap = saveSnapshot(PID, "Before hero rework", sampleConfig("Vertex"))
    expect(snap).not.toBeNull()
    expect(snap?.name).toBe("Before hero rework")
    const all = listSnapshots(PID)
    expect(all).toHaveLength(1)
    expect(all[0].config.brand.name).toBe("Vertex")
    expect(all[0].config.sections.map((s) => s.type)).toEqual(["hero", "footer"])
  })

  it("rejects blank names", () => {
    expect(saveSnapshot(PID, "   ", sampleConfig("X"))).toBeNull()
    expect(listSnapshots(PID)).toEqual([])
  })

  it("re-saving an existing name overwrites that slot", () => {
    saveSnapshot(PID, "Checkpoint", sampleConfig("A"))
    saveSnapshot(PID, "Checkpoint", sampleConfig("B"))
    const all = listSnapshots(PID)
    expect(all).toHaveLength(1)
    expect(all[0].config.brand.name).toBe("B")
  })

  it("caps the roster at 5 slots, retiring the oldest", () => {
    vi.useFakeTimers()
    try {
      for (let i = 0; i < 7; i++) {
        vi.setSystemTime(1000 + i * 60_000) // 1-minute steps so ordering is deterministic
        saveSnapshot(PID, `Slot ${i}`, sampleConfig(`V${i}`))
      }
      const all = listSnapshots(PID)
      expect(all).toHaveLength(MAX_SNAPSHOT_SLOTS)
      expect(all[0].name).toBe("Slot 6") // newest first
      expect(all[4].name).toBe("Slot 2") // Slot 0 + 1 retired
    } finally {
      vi.useRealTimers()
    }
  })

  it("deletes a snapshot by id", () => {
    const snap = saveSnapshot(PID, "Kill me", sampleConfig("X"))
    saveSnapshot(PID, "Keep me", sampleConfig("Y"))
    deleteSnapshot(PID, snap!.id)
    const all = listSnapshots(PID)
    expect(all).toHaveLength(1)
    expect(all[0].name).toBe("Keep me")
  })

  it("names are clamped and trimmed (60 chars)", () => {
    const snap = saveSnapshot(PID, "  " + "x".repeat(100) + "  ", sampleConfig("X"))
    expect(snap?.name).toBe("x".repeat(60))
  })

  it("tolerates corrupted localStorage payloads", () => {
    window.localStorage.setItem(`forge-sites:snapshots:${PID}`, "{not json")
    expect(listSnapshots(PID)).toEqual([])
    // and saving still works after corruption
    expect(saveSnapshot(PID, "Fresh", sampleConfig("X"))).not.toBeNull()
    expect(listSnapshots(PID)).toHaveLength(1)
  })

  it("snapshots are isolated per project", () => {
    saveSnapshot(PID, "Mine", sampleConfig("X"))
    expect(listSnapshots("proj-other")).toEqual([])
  })
})

describe("describeAge", () => {
  const now = 1_700_000_000_000
  it("labels recent snapshots", () => {
    expect(describeAge(now, now)).toBe("just now")
    expect(describeAge(now - 4 * 60_000, now)).toBe("4m ago")
    expect(describeAge(now - 3 * 3_600_000, now)).toBe("3h ago")
  })
  it("falls back to a date for older snapshots", () => {
    const label = describeAge(now - 3 * 86_400_000, now)
    expect(label).toMatch(/[A-Z][a-z]{2} \d+/) // e.g. "Mar 14"
  })
})
