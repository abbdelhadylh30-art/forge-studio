"use client"

import * as React from "react"
import { FONT_PAIRS, googleFontHref } from "@/lib/landing/themes"

/**
 * Streams a Google webfont pair into the document when the active brand font
 * is one of the ✦ pairs. Singleton by design:
 *
 *  • preconnects (fonts.googleapis.com + fonts.gstatic.com w/ crossorigin)
 *    are injected once and left in the <head> — they cost nothing when idle;
 *  • the css2 stylesheet link is created once and its href is swapped when
 *    the pair changes (browser cache keeps already-fetched families);
 *  • nothing is ever removed on unmount — the studio preview, published page
 *    and re-opened dialogs share one set of tags without refetching.
 *
 * Offline-safe: if the fetch fails the page keeps rendering with the system
 * fallback stacks built into every webfont pair (see themes.ts).
 */
export function useGoogleFonts(font: string | undefined): void {
  const href = googleFontHref(font)

  React.useEffect(() => {
    if (typeof document === "undefined" || !href) return

    // 1. preconnects (once)
    if (!document.head.querySelector("link[data-lf-gf-preconnect='apis']")) {
      const apis = document.createElement("link")
      apis.rel = "preconnect"
      apis.href = "https://fonts.googleapis.com"
      apis.dataset.lfGfPreconnect = "apis"
      const gstatic = document.createElement("link")
      gstatic.rel = "preconnect"
      gstatic.href = "https://fonts.gstatic.com"
      gstatic.crossOrigin = "anonymous"
      gstatic.dataset.lfGfPreconnect = "gstatic"
      document.head.append(apis, gstatic)
    }

    // 2. stylesheet (swap href when the pair changes)
    let link = document.head.querySelector<HTMLLinkElement>("link[data-lf-gf-css]")
    if (!link) {
      link = document.createElement("link")
      link.rel = "stylesheet"
      link.dataset.lfGfCss = "true"
      document.head.append(link)
    }
    if (link.href !== href) link.href = href
  }, [href])
}

/**
 * Loads every ✦ pair's stylesheet (marked data-lf-gf-picker) so the font
 * picker tiles render their true faces before selection. Idempotent; called
 * by the FontPicker when it mounts. Tags persist for the session so re-opening
 * the brand kit never refetches.
 */
export function ensureAllGoogleFonts(): void {
  if (typeof document === "undefined") return
  const seen = new Set(
    Array.from(document.head.querySelectorAll<HTMLLinkElement>("link[data-lf-gf-picker]")).map((l) => l.href),
  )
  for (const pair of FONT_PAIRS) {
    if (!pair.google || seen.has(pair.google)) continue
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = pair.google
    link.dataset.lfGfPicker = "true"
    document.head.append(link)
  }
}
