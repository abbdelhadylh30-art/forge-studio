/**
 * Forge Studio — Electron Preload Script
 * Minimal — contextIsolation is on, so this just exposes a safe API
 * to the renderer. `desktop` lets the web app detect the Electron shell
 * (e.g. to skip PWA service-worker registration, which is pointless
 * when the server is embedded and could only cause stale caches).
 */

import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("forgeStudio", {
  version: "1.4.1",
  desktop: true,
  platform: process.platform,
});
