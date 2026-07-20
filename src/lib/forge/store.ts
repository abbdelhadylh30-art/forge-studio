/**
 * Forge Studio — Unified App Store
 * --------------------------------
 * Top-level navigation: dashboard / builder / auditor
 * Transfer bridge: a slot for HTML that one tool hands off to the other.
 *
 * SWEBOK KA 2 §4.1 (Interaction & Presentation) + KA 3 §4.5 (Fault Tolerance):
 * The transfer bridge has a TTL — if `consumeTransfer()` is never called (user
 * navigates away before the receiving tool mounts), the payload is discarded
 * after `TRANSFER_TTL_MS` so it doesn't sit in memory indefinitely with stale
 * HTML that no longer matches the user's intent.
 */

import { create } from "zustand";

export type ForgeView = "dashboard" | "builder" | "auditor" | "templates";

/** A transfer payload older than this is discarded on the next read. */
export const TRANSFER_TTL_MS = 60_000; // 60 seconds

interface TransferPayload {
  html: string;
  name: string;
  source: "builder" | "auditor";
  timestamp: number;
}

interface ForgeStore {
  view: ForgeView;
  setView: (v: ForgeView) => void;

  pendingTransfer: TransferPayload | null;
  transferToAuditor: (html: string, name: string) => void;
  transferToBuilder: (html: string, name: string) => void;
  /** Returns the pending transfer, or null if none / if it has expired. */
  consumeTransfer: () => TransferPayload | null;
}

export const useForge = create<ForgeStore>((set, get) => ({
  view: "dashboard",
  setView: (v) => set({ view: v }),

  pendingTransfer: null,

  transferToAuditor: (html, name) => {
    set({
      view: "auditor",
      pendingTransfer: { html, name, source: "builder", timestamp: Date.now() },
    });
  },

  transferToBuilder: (html, name) => {
    set({
      view: "builder",
      pendingTransfer: { html, name, source: "auditor", timestamp: Date.now() },
    });
  },

  consumeTransfer: () => {
    const p = get().pendingTransfer;
    if (!p) return null;
    // Stale-guard: discard payloads older than the TTL.
    if (Date.now() - p.timestamp > TRANSFER_TTL_MS) {
      set({ pendingTransfer: null });
      return null;
    }
    set({ pendingTransfer: null });
    return p;
  },
}));
