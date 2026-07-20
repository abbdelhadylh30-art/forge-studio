/**
 * PixelForge v19 — Editor Store (Zustand)
 * -----------------------------------------
 * 1:1 port of the v19 vanilla-JS state model.
 *
 * Holds: current HTML, score data, selected element, mode, device, undo/redo,
 * changelog, team comments, monitor, A/B variants, guide state, and all
 * the right-panel tab state.
 *
 * History: 80-deep stack (matches v19 MAX_HISTORY).
 */

import { create } from "zustand";
import { v4 as uuid } from "uuid";
import type {
  ChangeLogItem,
  DeviceMode,
  EditorMode,
  Issue,
  PanelTab,
  ScoreData,
  TeamComment,
  UrlMode,
} from "../types";

const MAX_HISTORY = 80;

interface EditorState {
  // The current HTML being audited
  currentHTML: string;
  initialHTML: string;
  initialScore: number | null;
  previousScore: number;

  // Live score data
  scoreData: ScoreData | null;

  // UI state
  mode: EditorMode;
  device: DeviceMode;
  urlMode: UrlMode;
  activeTab: PanelTab;
  selectedSelector: string | null;
  layerCollapsed: boolean;
  rightCollapsed: boolean;
  mobileSheetOpen: boolean;
  analyzing: boolean;

  // URL bar
  urlBarInput: string;
  urlBarStatus: { msg: string; type: "info" | "success" | "error" | "warning" } | null;

  // History
  historyStack: string[];
  historyIndex: number;

  // Changelog
  changeLog: ChangeLogItem[];

  // Guide
  guideActive: boolean;
  guideStep: number;
  guideChecklist: Record<string, boolean>;

  // Team comments
  teamComments: TeamComment[];

  // Project
  projectId: string | null;
  projectName: string;
  projectUrl: string | null;
  clientName: string | null;
  setProjectName: (name: string) => void;

  // Whitelabel
  whitelabelActive: boolean;
  whitelabelBrand: string;

  // A/B variants
  abVariants: { id: string; name: string; html: string; score: number | null; isWinner: boolean }[];

  // ─── Actions ───
  setHTML: (html: string, opts?: { resetHistory?: boolean; skipHistory?: boolean }) => void;
  setScoreData: (sd: ScoreData) => void;
  setMode: (m: EditorMode) => void;
  setDevice: (d: DeviceMode) => void;
  setUrlMode: (m: UrlMode) => void;
  setActiveTab: (t: PanelTab) => void;
  setSelectedSelector: (s: string | null) => void;
  toggleLayer: () => void;
  toggleRight: () => void;
  setMobileSheetOpen: (b: boolean) => void;
  setAnalyzing: (b: boolean) => void;
  setUrlBarInput: (s: string) => void;
  setUrlBarStatus: (msg: string, type: "info" | "success" | "error" | "warning") => void;

  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  addChange: (c: Omit<ChangeLogItem, "id" | "timestamp">) => void;
  revertChange: (id: string) => void;
  clearChangelog: () => void;

  startGuide: () => void;
  endGuide: () => void;
  setGuideStep: (i: number) => void;
  markGuideStepDone: (id: string) => void;

  addTeamComment: (author: string, text: string, selector?: string) => void;
  setTeamComments: (cs: TeamComment[]) => void;

  loadProject: (p: {
    id: string;
    name: string;
    url: string | null;
    clientName: string | null;
    html: string;
  }) => void;
  newProject: () => void;

  setWhitelabel: (active: boolean, brand?: string) => void;

  addABVariant: (name: string, html: string) => void;
  setABVariantScore: (id: string, score: number) => void;
  setABWinner: (id: string) => void;
}

export const usePFStore = create<EditorState>((set, get) => ({
  currentHTML: "",
  initialHTML: "",
  initialScore: null,
  previousScore: 0,
  scoreData: null,
  mode: "edit",
  device: "desktop",
  urlMode: "fetch",
  activeTab: "score",
  selectedSelector: null,
  layerCollapsed: false,
  rightCollapsed: false,
  mobileSheetOpen: false,
  analyzing: false,
  urlBarInput: "",
  urlBarStatus: null,
  historyStack: [],
  historyIndex: -1,
  changeLog: [],
  guideActive: false,
  guideStep: 0,
  guideChecklist: {},
  teamComments: [],
  projectId: null,
  projectName: "Untitled audit",
  projectUrl: null,
  clientName: null,
  whitelabelActive: false,
  whitelabelBrand: "PixelForge",
  abVariants: [],

  setHTML: (html, opts) => {
    const prev = get().currentHTML;
    if (prev && prev !== html && !opts?.resetHistory && !opts?.skipHistory) {
      get().pushHistory();
    }
    if (opts?.resetHistory) {
      set({
        currentHTML: html,
        initialHTML: html,
        historyStack: [html],
        historyIndex: 0,
        initialScore: null,
        previousScore: 0,
        changeLog: [],
        selectedSelector: null,
      });
    } else {
      set({ currentHTML: html });
    }
  },

  setScoreData: (sd) => {
    const prev = get().scoreData;
    set({
      scoreData: sd,
      previousScore: prev?.score ?? 0,
      initialScore: get().initialScore ?? sd.score,
    });
  },

  setMode: (m) => set({ mode: m }),
  setDevice: (d) => set({ device: d }),
  setUrlMode: (m) => set({ urlMode: m }),
  setActiveTab: (t) => set({ activeTab: t }),
  setSelectedSelector: (s) => set({ selectedSelector: s }),
  toggleLayer: () => set((s) => ({ layerCollapsed: !s.layerCollapsed })),
  toggleRight: () => set((s) => ({ rightCollapsed: !s.rightCollapsed })),
  setMobileSheetOpen: (b) => set({ mobileSheetOpen: b }),
  setAnalyzing: (b) => set({ analyzing: b }),
  setUrlBarInput: (s) => set({ urlBarInput: s }),
  setUrlBarStatus: (msg, type) => set({ urlBarStatus: { msg, type } }),

  pushHistory: () => {
    const { historyStack, historyIndex, currentHTML } = get();
    const truncated = historyStack.slice(0, historyIndex + 1);
    truncated.push(currentHTML);
    const capped = truncated.slice(-MAX_HISTORY);
    set({
      historyStack: capped,
      historyIndex: capped.length - 1,
    });
  },

  undo: () => {
    const { historyStack, historyIndex } = get();
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    set({
      historyIndex: newIndex,
      currentHTML: historyStack[newIndex],
      selectedSelector: null,
    });
  },

  redo: () => {
    const { historyStack, historyIndex } = get();
    if (historyIndex >= historyStack.length - 1) return;
    const newIndex = historyIndex + 1;
    set({
      historyIndex: newIndex,
      currentHTML: historyStack[newIndex],
      selectedSelector: null,
    });
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().historyStack.length - 1,

  addChange: (c) => {
    const change: ChangeLogItem = {
      ...c,
      id: uuid(),
      timestamp: Date.now(),
    };
    set((s) => ({ changeLog: [change, ...s.changeLog] }));
  },

  revertChange: (id) => {
    set((s) => ({
      changeLog: s.changeLog.map((c) => (c.id === id ? { ...c, reverted: true } : c)),
    }));
  },

  clearChangelog: () => set({ changeLog: [] }),

  startGuide: () => set({ guideActive: true, guideStep: 0, guideChecklist: {} }),
  endGuide: () => set({ guideActive: false }),
  setGuideStep: (i) => set({ guideStep: i }),
  markGuideStepDone: (id) =>
    set((s) => ({ guideChecklist: { ...s.guideChecklist, [id]: true } })),

  addTeamComment: (author, text, selector) => {
    const c: TeamComment = {
      id: uuid(),
      author,
      text,
      selector,
      timestamp: Date.now(),
    };
    set((s) => ({ teamComments: [c, ...s.teamComments] }));
  },
  setTeamComments: (cs) => set({ teamComments: cs }),

  setProjectName: (name) => set({ projectName: name }),

  loadProject: (p) => {
    set({
      projectId: p.id,
      projectName: p.name,
      projectUrl: p.url,
      clientName: p.clientName,
      currentHTML: p.html,
      initialHTML: p.html,
      historyStack: [p.html],
      historyIndex: 0,
      initialScore: null,
      previousScore: 0,
      changeLog: [],
      selectedSelector: null,
      scoreData: null,
    });
  },

  newProject: () => {
    set({
      projectId: null,
      projectName: "Untitled audit",
      projectUrl: null,
      clientName: null,
      currentHTML: "",
      initialHTML: "",
      historyStack: [],
      historyIndex: -1,
      initialScore: null,
      previousScore: 0,
      changeLog: [],
      selectedSelector: null,
      scoreData: null,
      teamComments: [],
    });
  },

  setWhitelabel: (active, brand) => {
    set({
      whitelabelActive: active,
      whitelabelBrand: brand ?? get().whitelabelBrand,
    });
  },

  addABVariant: (name, html) => {
    set((s) => ({
      abVariants: [...s.abVariants, { id: uuid(), name, html, score: null, isWinner: false }],
    }));
  },
  setABVariantScore: (id, score) => {
    set((s) => ({
      abVariants: s.abVariants.map((v) => (v.id === id ? { ...v, score } : v)),
    }));
  },
  setABWinner: (id) => {
    set((s) => ({
      abVariants: s.abVariants.map((v) => ({ ...v, isWinner: v.id === id })),
    }));
  },
}));

/** Stable empty array — avoids creating a new array literal on every render
 *  which would trigger Zustand's getSnapshot-should-be-cached warning. */
const EMPTY_ISSUES: Issue[] = [];

/* ───────────────────────────────────────────────────────────────────────────
 * Autosave + recovery (localStorage) — auditor
 *
 * Persists the current HTML + project name + change log so a refresh doesn't
 * lose the audit. History stack is NOT persisted (would balloon localStorage).
 * ─────────────────────────────────────────────────────────────────────────── */

const AUDITOR_STORAGE_KEY = "forge-studio:auditor-state:v1";
const AUDITOR_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 days (audits are shorter-lived than builder projects)
const AUDITOR_MAX_HTML_BYTES = 800 * 1024; // 800 KB cap — bigger pages risk QuotaExceededError

interface SavedAuditorState {
  currentHTML: string;
  projectName: string;
  changeLog: ChangeLogItem[];
  timestamp: number;
}

let auditorSaveTimer: ReturnType<typeof setTimeout> | null = null;

function auditorAutosave(state: { currentHTML: string; projectName: string; changeLog: ChangeLogItem[] }) {
  if (typeof window === "undefined") return;
  if (!state.currentHTML) return;
  if (state.currentHTML.length > AUDITOR_MAX_HTML_BYTES) return; // skip oversize
  if (auditorSaveTimer) clearTimeout(auditorSaveTimer);
  auditorSaveTimer = setTimeout(() => {
    try {
      const payload: SavedAuditorState = {
        currentHTML: state.currentHTML,
        projectName: state.projectName,
        changeLog: state.changeLog.slice(-50), // cap changelog
        timestamp: Date.now(),
      };
      localStorage.setItem(AUDITOR_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn("Auditor autosave failed:", e);
    }
  }, 800);
}

function loadAuditorSavedState(): SavedAuditorState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUDITOR_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedAuditorState;
    if (Date.now() - parsed.timestamp > AUDITOR_MAX_AGE_MS) {
      localStorage.removeItem(AUDITOR_STORAGE_KEY);
      return null;
    }
    if (!parsed.currentHTML) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearAuditorAutosave() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(AUDITOR_STORAGE_KEY);
  } catch {
    /* noop */
  }
}

export function peekAuditorAutosave(): { timestamp: number; projectName: string; htmlSize: number; changeCount: number } | null {
  const s = loadAuditorSavedState();
  if (!s) return null;
  return {
    timestamp: s.timestamp,
    projectName: s.projectName,
    htmlSize: s.currentHTML.length,
    changeCount: s.changeLog.length,
  };
}

export function consumeAuditorAutosave(): SavedAuditorState | null {
  return loadAuditorSavedState();
}

// Subscribe to auditor state changes for autosave
usePFStore.subscribe((state, prev) => {
  if (
    state.currentHTML !== prev.currentHTML ||
    state.projectName !== prev.projectName ||
    state.changeLog !== prev.changeLog
  ) {
    auditorAutosave({
      currentHTML: state.currentHTML,
      projectName: state.projectName,
      changeLog: state.changeLog,
    });
  }
});

/** Issues filtered by severity */
export function useIssuesBySeverity() {
  const issues = usePFStore((s) => s.scoreData?.issues ?? EMPTY_ISSUES);
  return {
    errors: issues.filter((i) => i.severity === "error"),
    warnings: issues.filter((i) => i.severity === "warning"),
    all: issues,
  };
}

/** Top 3 highest-priority fixes */
export function useTop3Fixes(): Issue[] {
  const issues = usePFStore((s) => s.scoreData?.issues ?? EMPTY_ISSUES);
  return [...issues]
    .filter((i) => i.pts < i.max)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);
}
