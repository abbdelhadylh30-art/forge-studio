"use client";

/**
 * PWA service-worker registration (Tier 4).
 *
 * Registers /sw.js in production only — in `next dev` the SW would fight the
 * dev server's no-cache headers and cause stale-module confusion. Also
 * listens for updated SWs and prompts a refresh instead of serving the old
 * shell forever.
 */

import { useEffect } from "react";

declare global {
  interface Window {
    forgeStudio?: { version: string; desktop: boolean; platform: string };
  }
}

export function PWARegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // Desktop (Electron) app: the Next.js server is embedded in the app
    // binary, so offline caching adds nothing — and a service worker
    // caching through the app:// proxy could serve a stale shell after
    // updates. Skip registration entirely there.
    if (window.forgeStudio?.desktop) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          // Check for updates on focus (standard PWA pattern).
          reg.addEventListener("updatefound", () => {
            const next = reg.installing;
            next?.addEventListener("statechange", () => {
              if (next.state === "installed" && navigator.serviceWorker.controller) {
                console.info("[pwa] New version available — refresh to update.");
              }
            });
          });
        })
        .catch((e) => {
          console.warn("[psw] Service worker registration failed:", e);
        });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
