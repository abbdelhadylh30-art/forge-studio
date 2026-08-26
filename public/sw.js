/**
 * Forge Studio service worker (Tier 4 — PWA).
 *
 * Strategy:
 *   - App shell + static assets: stale-while-revalidate (instant loads, fresh
 *     in the background).
 *   - Navigations: network-first with offline shell fallback.
 *   - API calls: never cached (audits, PSI, fetch-url must be live).
 *
 * Deliberately tiny: a full offline builder is out of scope, but installing
 * the app gives fast cold-starts and an offline "shell" instead of a browser
 * dinosaur.
 */

const VERSION = "forge-studio-v1";
const STATIC_CACHE = `${VERSION}-static`;
const SHELL_URL = "/";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll([SHELL_URL, "/icon.svg", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"])).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin GETs.
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  // Never cache API responses — audits/PSI/URL-fetches must be live.
  if (url.pathname.startsWith("/api/")) return;

  // Navigations: network-first, offline shell fallback.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(STATIC_CACHE).then((c) => c.put(SHELL_URL, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(SHELL_URL).then((r) => r || Response.error()))
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  event.respondWith(
    caches.match(req).then((cached) => {
      const refresh = fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || refresh;
    })
  );
});
