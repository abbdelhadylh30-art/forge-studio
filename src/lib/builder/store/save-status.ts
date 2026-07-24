import { create } from "zustand";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface SaveStatusState {
  status: SaveStatus;
  lastSavedAt: number | null;
  _clearTimer: ReturnType<typeof setTimeout> | null;
  setSaving: () => void;
  setSaved: () => void;
  setError: () => void;
  _clearStatus: () => void;
}

export const useSaveStatus = create<SaveStatusState>((set, get) => ({
  status: "idle",
  lastSavedAt: null,
  _clearTimer: null,

  setSaving: () => {
    const t = get()._clearTimer;
    if (t) clearTimeout(t);
    set({ status: "saving", _clearTimer: null });
  },

  setSaved: () => {
    const t = get()._clearTimer;
    if (t) clearTimeout(t);
    const timer = setTimeout(() => {
      set({ status: "idle", _clearTimer: null });
    }, 3000);
    set({ status: "saved", lastSavedAt: Date.now(), _clearTimer: timer });
  },

  setError: () => {
    const t = get()._clearTimer;
    if (t) clearTimeout(t);
    const timer = setTimeout(() => {
      set({ status: "idle", _clearTimer: null });
    }, 5000);
    set({ status: "error", _clearTimer: timer });
  },

  _clearStatus: () => {
    set({ status: "idle", _clearTimer: null });
  },
}));
