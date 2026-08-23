/**
 * Forge Studio — Electron Preload Script
 * Minimal — contextIsolation is on, so this just exposes a safe API
 * to the renderer if needed in the future. Currently no-op.
 */

import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("forgeStudio", {
  version: "1.0.0",
  platform: process.platform,
});
