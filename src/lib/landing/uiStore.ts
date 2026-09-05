"use client"

import { create } from "zustand"

export type AppView = "studio" | "analytics" | "projects"

export type DialogId =
  | "ai-generate"
  | "ai-improve"
  | "export-yaml"
  | "import-yaml"
  | "export-html"
  | "add-section"
  | "image-library"
  | "deploy"
  | "readiness"
  | "theme-tweaks"
  | "shortcuts"
  | null

interface UiState {
  view: AppView
  dialog: DialogId
  commandOpen: boolean
  /** locale forced in the studio preview (null = default locale) */
  previewLocale: string | null

  setView: (v: AppView) => void
  setPreviewLocale: (l: string | null) => void
  openDialog: (d: Exclude<DialogId, null>) => void
  closeDialog: () => void
  setCommandOpen: (v: boolean) => void
}

/** Cross-component UI state: active view + which global dialog is open + ⌘K palette. */
export const useUi = create<UiState>((set) => ({
  view: "studio",
  dialog: null,
  commandOpen: false,
  previewLocale: null,

  setView: (view) => set({ view, dialog: null }),
  setPreviewLocale: (previewLocale) => set({ previewLocale }),
  openDialog: (dialog) => set({ dialog, commandOpen: false }),
  closeDialog: () => set({ dialog: null }),
  setCommandOpen: (commandOpen) => set({ commandOpen, dialog: null }),
}))
