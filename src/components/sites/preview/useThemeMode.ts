"use client"

import * as React from "react"

import { getTheme, resolveMode } from "@/lib/landing/themes"
import type { ThemeId, ThemeMode } from "@/lib/landing/types"

/** Live `prefers-color-scheme: dark` state — reacts while the page is open. */
export function usePrefersDark(): boolean {
  const [dark, setDark] = React.useState(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : true,
  )

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = (e: MediaQueryListEvent) => setDark(e.matches)
    mq.addEventListener("change", onChange)
    // re-sync in case the first render ran before hydration completed
    setDark(mq.matches)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  return dark
}

export interface ResolvedThemeMode {
  mode: "dark" | "light"
  /** true when the value comes from brand.mode/theme defaults, not a visitor override */
  fromSite: boolean
}

/**
 * Effective color scheme for a site inside the app (studio preview, published
 * page). Resolution order:
 *   1. `override` — a visitor's manual toggle on the published page
 *   2. brand.mode — "auto" | "dark" | "light"
 *   3. unset → the theme's built-in preference (legacy sites stay identical)
 */
export function useResolvedMode(
  themeId: ThemeId,
  mode: ThemeMode | undefined,
  override?: "dark" | "light" | null,
): ResolvedThemeMode {
  const prefersDark = usePrefersDark()
  return React.useMemo(() => {
    if (override) return { mode: override, fromSite: false }
    return { mode: resolveMode(themeId, mode, prefersDark), fromSite: true }
  }, [override, themeId, mode, prefersDark])
}

/** Theme preference label for tooltips / hints. */
export function modeHint(themeId: ThemeId, mode: ThemeMode | undefined): string {
  if (mode === "auto") return "Auto — follows each visitor's system preference"
  if (mode === "dark") return "Dark — always the dark palette"
  if (mode === "light") return "Light — always the light palette"
  const th = getTheme(themeId)
  return `Theme default — ${th.name} ships ${th.mode}`
}
