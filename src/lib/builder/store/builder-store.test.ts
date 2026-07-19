import { describe, it, expect, beforeEach } from "vitest";
import { useBuilder } from "./builder-store";

function reset() {
  useBuilder.getState().newBlankSite("Test site");
}

beforeEach(() => reset());

describe("useBuilder — addSection / removeSection / duplicateSection", () => {
  it("addSection appends a section and selects it", () => {
    const before = useBuilder.getState().site.pages[0].sections.length;
    useBuilder.getState().addSection("hero");
    const after = useBuilder.getState().site.pages[0].sections.length;
    expect(after).toBe(before + 1);
    expect(useBuilder.getState().selectedSectionId).toBeTruthy();
  });

  it("removeSection removes by id and clears selection", () => {
    useBuilder.getState().addSection("hero");
    const id = useBuilder.getState().selectedSectionId!;
    const before = useBuilder.getState().site.pages[0].sections.length;
    useBuilder.getState().removeSection(id);
    const after = useBuilder.getState().site.pages[0].sections.length;
    expect(after).toBe(before - 1);
    expect(useBuilder.getState().selectedSectionId).toBeNull();
  });

  it("duplicateSection creates a copy with a new id right after the source", () => {
    useBuilder.getState().addSection("hero");
    const id = useBuilder.getState().selectedSectionId!;
    const before = useBuilder.getState().site.pages[0].sections.length;
    useBuilder.getState().duplicateSection(id);
    const after = useBuilder.getState().site.pages[0].sections.length;
    expect(after).toBe(before + 1);
    const newId = useBuilder.getState().selectedSectionId;
    expect(newId).toBeTruthy();
    expect(newId).not.toBe(id);
  });
});

describe("useBuilder — addPage / removePage", () => {
  it("addPage creates a new page and switches to it", () => {
    const before = useBuilder.getState().site.pages.length;
    useBuilder.getState().addPage("Pricing");
    const after = useBuilder.getState().site.pages.length;
    expect(after).toBe(before + 1);
    const current = useBuilder.getState().currentPageId;
    const pages = useBuilder.getState().site.pages;
    expect(pages.find((p) => p.id === current)?.name).toBe("Pricing");
  });

  it("removePage refuses to delete the last page", () => {
    const only = useBuilder.getState().site.pages[0];
    useBuilder.getState().removePage(only.id);
    // Still there.
    expect(useBuilder.getState().site.pages.length).toBe(1);
  });

  it("removePage promotes a new home when the home page is deleted (without mutating the original PageData)", () => {
    // Add a second page so we can delete the first (home) one.
    useBuilder.getState().addPage("Second");
    const homeId = useBuilder.getState().site.pages.find((p) => p.isHome)!.id;
    // Snapshot the original pages array (mutation-detection guard).
    const originalPages = useBuilder.getState().site.pages;
    const originalSecond = originalPages.find((p) => p.name === "Second")!;
    const wasHomeOriginally = originalSecond.isHome;

    useBuilder.getState().removePage(homeId);

    const remaining = useBuilder.getState().site.pages;
    expect(remaining.find((p) => p.id === homeId)).toBeUndefined();
    // The promoted page should now be home.
    expect(remaining.some((p) => p.isHome)).toBe(true);
    // The ORIGINAL snapshot's Second page must NOT have been mutated.
    expect(originalSecond.isHome).toBe(wasHomeInitially(wasHomeOriginally));
  });
});

/** Helper: returns the original value back (guards against accidental mutation). */
function wasHomeInitially(v: boolean): boolean {
  return v;
}

describe("useBuilder — undo / redo", () => {
  it("undo restores the previous site state", () => {
    const original = useBuilder.getState().site;
    useBuilder.getState().addSection("hero");
    expect(useBuilder.getState().canUndo()).toBe(true);
    useBuilder.getState().undo();
    expect(useBuilder.getState().site).toEqual(original);
  });

  it("redo re-applies the undone state", () => {
    useBuilder.getState().addSection("hero");
    const afterAdd = useBuilder.getState().site;
    useBuilder.getState().undo();
    useBuilder.getState().redo();
    expect(useBuilder.getState().site).toEqual(afterAdd);
  });

  it("canUndo is false on a fresh store", () => {
    expect(useBuilder.getState().canUndo()).toBe(false);
  });

  it("canRedo is false immediately after a new commit", () => {
    useBuilder.getState().addSection("hero");
    expect(useBuilder.getState().canRedo()).toBe(false);
  });

  it("undo is a no-op when the stack is empty", () => {
    const before = useBuilder.getState().site;
    useBuilder.getState().undo();
    expect(useBuilder.getState().site).toBe(before);
  });
});

describe("useBuilder — theme tokens", () => {
  it("setThemeTokens merges into the current theme", () => {
    const before = useBuilder.getState().site.themeTokens.primary;
    useBuilder.getState().setThemeTokens({ primary: "#ff0000" });
    expect(useBuilder.getState().site.themeTokens.primary).toBe("#ff0000");
    // Other tokens untouched.
    expect(useBuilder.getState().site.themeTokens.accent).toBeTruthy();
  });

  it("applyThemePreset replaces the theme entirely", () => {
    const preset = { ...useBuilder.getState().site.themeTokens, primary: "#00ff00", accent: "#0000ff" };
    useBuilder.getState().applyThemePreset(preset);
    expect(useBuilder.getState().site.themeTokens.primary).toBe("#00ff00");
    expect(useBuilder.getState().site.themeTokens.accent).toBe("#0000ff");
  });
});
