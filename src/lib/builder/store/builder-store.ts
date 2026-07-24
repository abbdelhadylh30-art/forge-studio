/**
 * Forge Studio — Builder: Editor Store
 * Zustand store with 50-step undo/redo, multi-page, device preview, theme tokens.
 * Also exposes the rendered HTML so it can be sent to the auditor.
 */

import { create } from "zustand";
import { v4 as uuid } from "uuid";
import type { PageData, SectionInstance, SectionKind, SiteData, ThemeTokens } from "../sections/types";
import { createSection, getSectionType } from "../sections/registry";
import { DEFAULT_THEME } from "../sections/types";
import { renderSiteHTML } from "../sections/renderer";
import { useSaveStatus } from "./save-status";

const MAX_HISTORY = 50;

function clone<T>(v: T): T {
  return typeof structuredClone === "function" ? structuredClone(v) : JSON.parse(JSON.stringify(v));
}

/* ───────────────────────────────────────────────────────────────────────────
 * Autosave + recovery (localStorage)
 *
 * The builder is a single-user, client-side tool. Without autosave, a single
 * browser refresh wipes minutes of work. We persist the site to localStorage
 * on every commit (debounced 500ms) and restore it on the next load.
 *
 * We deliberately DON'T persist undoStack/redoStack — that would balloon
 * localStorage usage for little value. Only the current site state survives.
 * ─────────────────────────────────────────────────────────────────────────── */

const BUILDER_STORAGE_KEY = "forge-studio:builder-site:v1";
const BUILDER_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

interface SavedBuilderState {
  site: SiteData;
  currentPageId: string;
  timestamp: number;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function autosave(site: SiteData, currentPageId: string) {
  if (typeof window === "undefined") return;
  useSaveStatus.getState().setSaving();
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const payload: SavedBuilderState = {
        site: clone(site),
        currentPageId,
        timestamp: Date.now(),
      };
      localStorage.setItem(BUILDER_STORAGE_KEY, JSON.stringify(payload));
      useSaveStatus.getState().setSaved();
    } catch (e) {
      // localStorage might be full or disabled (private mode). Fail silently —
      // the app still works, just without persistence.
      console.warn("Autosave failed:", e);
      useSaveStatus.getState().setError();
    }
  }, 500);
}

function loadSavedState(): SavedBuilderState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(BUILDER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedBuilderState;
    // Discard if older than 30 days
    if (Date.now() - parsed.timestamp > BUILDER_MAX_AGE_MS) {
      localStorage.removeItem(BUILDER_STORAGE_KEY);
      return null;
    }
    // Sanity-check the shape
    if (!parsed.site || !Array.isArray(parsed.site.pages)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Wipe the autosaved state (used by "Reset project" action). */
export function clearBuilderAutosave() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(BUILDER_STORAGE_KEY);
  } catch {
    /* noop */
  }
}

/** Read (but don't consume) the autosaved state — used to show a recovery
 *  hint on the dashboard without auto-loading. */
export function peekBuilderAutosave(): { timestamp: number; siteName: string; pageCount: number } | null {
  const s = loadSavedState();
  if (!s) return null;
  return {
    timestamp: s.timestamp,
    siteName: s.site.name,
    pageCount: s.site.pages.length,
  };
}

/** Load and consume the autosaved state. Returns null if none/expired/invalid. */
export function consumeBuilderAutosave(): SavedBuilderState | null {
  const s = loadSavedState();
  return s;
}

export function blankSite(name: string): SiteData {
  const homePage: PageData = {
    id: uuid(), name: "Home", slug: "home", path: "/", isHome: true, sections: [],
  };
  return {
    id: uuid(), name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    description: "",
    themeTokens: clone(DEFAULT_THEME),
    pages: [homePage],
  };
}

export type DeviceMode = "desktop" | "tablet" | "mobile";

interface BuilderState {
  site: SiteData;
  currentPageId: string;
  selectedSectionId: string | null;
  selectSection: (id: string | null) => void;
  setCurrentPageId: (id: string) => void;

  device: DeviceMode;
  setDevice: (d: DeviceMode) => void;

  /** Preview mode hides all editor chrome — shows the page as it'll look when published. */
  previewMode: boolean;
  setPreviewMode: (b: boolean) => void;

  /** Named version snapshots (Phase 4). */
  versions: { id: string; name: string; timestamp: number; site: SiteData }[];
  saveVersion: (name: string) => void;
  restoreVersion: (id: string) => void;
  deleteVersion: (id: string) => void;

  inspectorOpen: boolean;
  libraryOpen: boolean;
  setInspectorOpen: (b: boolean) => void;
  setLibraryOpen: (b: boolean) => void;

  setThemeTokens: (t: Partial<ThemeTokens>) => void;
  applyThemePreset: (tokens: ThemeTokens) => void;

  addSection: (kind: SectionKind, index?: number) => void;
  removeSection: (id: string) => void;
  duplicateSection: (id: string) => void;
  moveSection: (fromIndex: number, toIndex: number) => void;
  reorderSections: (newOrder: SectionInstance[]) => void;
  updateSectionConfig: (id: string, patch: Record<string, unknown>) => void;

  addPage: (name: string) => void;
  removePage: (id: string) => void;
  updatePageMeta: (id: string, patch: Partial<Pick<PageData, "name" | "slug" | "path" | "isHome" | "seo">>) => void;

  setSiteName: (name: string) => void;
  setSiteDescription: (desc: string) => void;
  loadSite: (site: SiteData) => void;
  newBlankSite: (name: string) => void;

  /** Load an arbitrary HTML document as the starting point for editing
   *  (used when transferring from the auditor). */
  loadFromHTML: (html: string, name: string) => void;

  /** Produce a standalone HTML string for the current site (used for export + auditor transfer). */
  exportHTML: () => string;

  undoStack: SiteData[];
  redoStack: SiteData[];
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  /** Clipboard for copy/paste of sections (cross-page). */
  clipboard: SectionInstance | null;
  copySection: (id: string) => void;
  pasteSection: (afterId?: string) => void;

  /** Toggle section visibility (hidden sections are omitted from export). */
  toggleSectionVisibility: (id: string) => void;

  _commit: (next: SiteData) => void;
}

export const useBuilder = create<BuilderState>((set, get) => ({
  site: blankSite("Untitled site"),
  currentPageId: "",
  selectedSectionId: null,
  selectSection: (id) => set({ selectedSectionId: id }),
  setCurrentPageId: (id) => set({ currentPageId: id, selectedSectionId: null }),

  device: "desktop",
  setDevice: (d) => set({ device: d }),

  previewMode: false,
  setPreviewMode: (b) => set({ previewMode: b, selectedSectionId: null }),

  versions: [],
  saveVersion: (name) => {
    const { site, versions } = get();
    const v = { id: uuid(), name: name || `Version ${versions.length + 1}`, timestamp: Date.now(), site: clone(site) };
    set({ versions: [...versions, v].slice(-20) }); // keep last 20
  },
  restoreVersion: (id) => {
    const { versions } = get();
    const v = versions.find((x) => x.id === id);
    if (!v) return;
    get()._commit(clone(v.site));
  },
  deleteVersion: (id) => {
    set((s) => ({ versions: s.versions.filter((v) => v.id !== id) }));
  },

  inspectorOpen: true,
  libraryOpen: true,
  setInspectorOpen: (b) => set({ inspectorOpen: b }),
  setLibraryOpen: (b) => set({ libraryOpen: b }),

  setThemeTokens: (t) => {
    const s = get().site;
    get()._commit({ ...s, themeTokens: { ...s.themeTokens, ...t } });
  },
  applyThemePreset: (tokens) => {
    const s = get().site;
    get()._commit({ ...s, themeTokens: clone(tokens) });
  },

  addSection: (kind, index) => {
    const s = get().site;
    const pageId = get().currentPageId || s.pages[0]?.id;
    const page = s.pages.find((p) => p.id === pageId);
    if (!page) return;
    const sec = createSection(kind);
    const newSections = [...page.sections];
    if (typeof index === "number") newSections.splice(index, 0, sec);
    else newSections.push(sec);
    const newSite: SiteData = { ...s, pages: s.pages.map((p) => (p.id === page.id ? { ...p, sections: newSections } : p)) };
    get()._commit(newSite);
    set({ selectedSectionId: sec.id });
  },

  removeSection: (id) => {
    const s = get().site;
    const pageId = get().currentPageId || s.pages[0]?.id;
    const page = s.pages.find((p) => p.id === pageId);
    if (!page) return;
    const newSite: SiteData = {
      ...s,
      pages: s.pages.map((p) => (p.id === page.id ? { ...p, sections: page.sections.filter((sec) => sec.id !== id) } : p)),
    };
    get()._commit(newSite);
    if (get().selectedSectionId === id) set({ selectedSectionId: null });
  },

  duplicateSection: (id) => {
    const s = get().site;
    const pageId = get().currentPageId || s.pages[0]?.id;
    const page = s.pages.find((p) => p.id === pageId);
    if (!page) return;
    const idx = page.sections.findIndex((sec) => sec.id === id);
    if (idx === -1) return;
    const copy: SectionInstance = { ...clone(page.sections[idx]), id: uuid() };
    const newSections = [...page.sections];
    newSections.splice(idx + 1, 0, copy);
    const newSite: SiteData = { ...s, pages: s.pages.map((p) => (p.id === page.id ? { ...p, sections: newSections } : p)) };
    get()._commit(newSite);
    set({ selectedSectionId: copy.id });
  },

  moveSection: (fromIndex, toIndex) => {
    const s = get().site;
    const pageId = get().currentPageId || s.pages[0]?.id;
    const page = s.pages.find((p) => p.id === pageId);
    if (!page || fromIndex === toIndex) return;
    const arr = [...page.sections];
    const [moved] = arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, moved);
    const newSite: SiteData = { ...s, pages: s.pages.map((p) => (p.id === page.id ? { ...p, sections: arr } : p)) };
    get()._commit(newSite);
  },

  reorderSections: (newOrder) => {
    const s = get().site;
    const pageId = get().currentPageId || s.pages[0]?.id;
    const page = s.pages.find((p) => p.id === pageId);
    if (!page) return;
    const newSite: SiteData = { ...s, pages: s.pages.map((p) => (p.id === page.id ? { ...p, sections: newOrder } : p)) };
    get()._commit(newSite);
  },

  updateSectionConfig: (id, patch) => {
    const s = get().site;
    const pageId = get().currentPageId || s.pages[0]?.id;
    const page = s.pages.find((p) => p.id === pageId);
    if (!page) return;
    const newSite: SiteData = {
      ...s,
      pages: s.pages.map((p) => (p.id === page.id ? { ...p, sections: page.sections.map((sec) => (sec.id === id ? { ...sec, config: { ...sec.config, ...patch } } : sec)) } : p)),
    };
    get()._commit(newSite);
  },

  addPage: (name) => {
    const s = get().site;
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    const newPage: PageData = { id: uuid(), name, slug, path: `/${slug}`, isHome: false, sections: [] };
    get()._commit({ ...s, pages: [...s.pages, newPage] });
    set({ currentPageId: newPage.id, selectedSectionId: null });
  },

  removePage: (id) => {
    const s = get().site;
    if (s.pages.length <= 1) return;
    // Build a NEW pages array (don't mutate the original PageData objects —
    // Zustand anti-pattern: other subscribers may hold the old reference).
    let filtered = s.pages.filter((p) => p.id !== id);
    const needsHome = filtered.every((p) => !p.isHome);
    if (needsHome && filtered[0]) {
      filtered = filtered.map((p, i) => (i === 0 ? { ...p, isHome: true } : p));
    }
    get()._commit({ ...s, pages: filtered });
    if (get().currentPageId === id) set({ currentPageId: filtered[0]?.id ?? "", selectedSectionId: null });
  },

  updatePageMeta: (id, patch) => {
    const s = get().site;
    get()._commit({ ...s, pages: s.pages.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  },

  setSiteName: (name) => { const s = get().site; get()._commit({ ...s, name }); },
  setSiteDescription: (description) => { const s = get().site; get()._commit({ ...s, description }); },

  loadSite: (site) => {
    set({
      site, currentPageId: site.pages[0]?.id ?? "",
      selectedSectionId: null, undoStack: [], redoStack: [],
    });
  },

  newBlankSite: (name) => {
    const s = blankSite(name);
    set({
      site: s, currentPageId: s.pages[0].id,
      selectedSectionId: null, undoStack: [], redoStack: [],
    });
  },

  loadFromHTML: (html, name) => {
    // Create a new site with a single "Imported" page containing one HTML section.
    // We don't parse the HTML into Forge Studio sections (that would be lossy);
    // instead we treat it as a single raw-HTML section that renders as-is.
    const page: PageData = {
      id: uuid(), name: "Imported", slug: "imported", path: "/", isHome: true,
      sections: [{
        id: uuid(),
        kind: "hero", // placeholder — actual HTML is stored in site.description for the iframe
        config: { __rawHTML: html },
      }],
    };
    const site: SiteData = {
      id: uuid(), name, slug: name.toLowerCase().replace(/\s+/g, "-"),
      description: html, // raw HTML stored here for the auditor to consume
      themeTokens: clone(DEFAULT_THEME),
      pages: [page],
    };
    set({ site, currentPageId: page.id, selectedSectionId: null, undoStack: [], redoStack: [] });
  },

  exportHTML: () => {
    const { site, currentPageId } = get();
    const page = site.pages.find((p) => p.id === (currentPageId || site.pages[0]?.id)) ?? site.pages[0];
    if (!page) return "";
    // If the page has a raw HTML payload (transferred from auditor), return it as-is.
    const rawSection = page.sections.find((s) => (s.config as any)?.__rawHTML);
    if (rawSection) return (rawSection.config as any).__rawHTML as string;
    return renderSiteHTML(site, page);
  },

  undoStack: [],
  redoStack: [],

  undo: () => {
    const { undoStack, redoStack, site } = get();
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    set({ site: prev, undoStack: undoStack.slice(0, -1), redoStack: [...redoStack, site].slice(-MAX_HISTORY), selectedSectionId: null });
  },

  redo: () => {
    const { undoStack, redoStack, site } = get();
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    set({ site: next, redoStack: redoStack.slice(0, -1), undoStack: [...undoStack, site].slice(-MAX_HISTORY), selectedSectionId: null });
  },

  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,

  _commit: (next) => {
    const { site, undoStack } = get();
    set({ site: next, undoStack: [...undoStack, clone(site)].slice(-MAX_HISTORY), redoStack: [] });
    autosave(next, get().currentPageId);
  },

  clipboard: null,

  copySection: (id) => {
    const s = get().site;
    const pageId = get().currentPageId || s.pages[0]?.id;
    const page = s.pages.find((p) => p.id === pageId);
    const sec = page?.sections.find((x) => x.id === id);
    if (!sec) return;
    set({ clipboard: clone(sec) });
  },

  pasteSection: (afterId) => {
    const { clipboard, site, currentPageId } = get();
    if (!clipboard) return;
    const pageId = currentPageId || site.pages[0]?.id;
    const page = site.pages.find((p) => p.id === pageId);
    if (!page) return;
    const copy: SectionInstance = { ...clone(clipboard), id: uuid() };
    const newSections = [...page.sections];
    if (afterId) {
      const idx = newSections.findIndex((s) => s.id === afterId);
      if (idx === -1) newSections.push(copy);
      else newSections.splice(idx + 1, 0, copy);
    } else {
      newSections.push(copy);
    }
    const newSite: SiteData = { ...site, pages: site.pages.map((p) => (p.id === page.id ? { ...p, sections: newSections } : p)) };
    get()._commit(newSite);
    set({ selectedSectionId: copy.id });
  },

  toggleSectionVisibility: (id) => {
    const s = get().site;
    const pageId = get().currentPageId || s.pages[0]?.id;
    const page = s.pages.find((p) => p.id === pageId);
    if (!page) return;
    const newSite: SiteData = {
      ...s,
      pages: s.pages.map((p) => p.id === page.id ? {
        ...p,
        sections: p.sections.map((sec) => sec.id === id ? { ...sec, config: { ...sec.config, __hidden: !sec.config.__hidden } } : sec),
      } : p),
    };
    get()._commit(newSite);
  },
}));

/* ───────────────────────────────────────────────────────────────────────────
 * Autosave subscription — fires whenever site or currentPageId changes.
 * We don't subscribe to selectedSectionId/device/panel toggles (those are
 * UI state, not project state, and don't warrant a save).
 * ─────────────────────────────────────────────────────────────────────────── */
useBuilder.subscribe((state, prev) => {
  if (state.site !== prev.site || state.currentPageId !== prev.currentPageId) {
    autosave(state.site, state.currentPageId);
  }
});

export function useCurrentPage(): PageData | null {
  return useBuilder((s) => {
    const id = s.currentPageId || s.site.pages[0]?.id;
    return s.site.pages.find((p) => p.id === id) ?? null;
  });
}

export function useSelectedSection(): SectionInstance | null {
  return useBuilder((s) => {
    if (!s.selectedSectionId) return null;
    const pageId = s.currentPageId || s.site.pages[0]?.id;
    const page = s.site.pages.find((p) => p.id === pageId);
    return page?.sections.find((sec) => sec.id === s.selectedSectionId) ?? null;
  });
}

export { getSectionType };
