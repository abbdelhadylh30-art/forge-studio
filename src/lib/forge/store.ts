/**
 * Forge Studio — Unified App Store
 * --------------------------------
 * Top-level navigation between the two tools: Sites (build + publish) and
 * Auditor (audit any page). v2.0.0 retired the legacy Page Builder; its code
 * is preserved at git tag `page-builder-final-v1.9.4`.
 */

import { create } from "zustand";

export type ForgeView = "dashboard" | "auditor" | "sites";

interface ForgeStore {
  view: ForgeView;
  setView: (v: ForgeView) => void;
}

export const useForge = create<ForgeStore>((set) => ({
  view: "dashboard",
  setView: (v) => set({ view: v }),
}));
