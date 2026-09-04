"use client"

/** Client-side analytics tracking helpers (privacy-friendly: anonymous visitor id in localStorage). */

const VISITOR_KEY = "lf-visitor-id"

export function getVisitorId(): string {
  if (typeof window === "undefined") return "server"
  try {
    let v = window.localStorage.getItem(VISITOR_KEY)
    if (!v) {
      v = "v-" + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6)
      window.localStorage.setItem(VISITOR_KEY, v)
    }
    return v
  } catch {
    return "anon"
  }
}

export interface TrackPayload {
  type: "pageview" | "cta_click" | "form_submit" | "section_view" | "variant_exposure" | "promote_winner"
  path?: string
  referrer?: string
  country?: string
  device?: string
  browser?: string
  visitorId?: string
  duration?: number
  isBounce?: boolean
  label?: string
  variant?: string
  /** sectionId → assigned variant for every enabled section-level test (pageview only). */
  variantMap?: Record<string, string>
  value?: number
}

export async function track(projectId: string, payload: TrackPayload): Promise<string | null> {
  if (!projectId) return null
  try {
    const res = await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        projectId,
        visitorId: getVisitorId(),
        referrer: typeof document !== "undefined" ? document.referrer || "direct" : "direct",
        ...payload,
      }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { id?: string }
    return data.id ?? null
  } catch {
    return null
  }
}

/**
 * Engagement ping — updates an existing pageview record with real time-on-page
 * and engagement (used by the published page). `keepalive` lets the final ping
 * survive tab close / navigation.
 */
export async function pingEngagement(
  pageviewId: string,
  opts: { duration?: number; engaged?: boolean } = {}
): Promise<boolean> {
  try {
    const res = await fetch("/api/analytics/track", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: pageviewId, ...opts }),
      keepalive: true,
    })
    return res.ok
  } catch {
    return false
  }
}

export function detectDevice(): "desktop" | "mobile" | "tablet" {
  if (typeof window === "undefined") return "desktop"
  const w = window.innerWidth
  const ua = navigator.userAgent
  if (/tablet|ipad/i.test(ua) || (w >= 640 && w < 1024 && /touch/i.test(ua))) return "tablet"
  if (/mobile|iphone|android/i.test(ua) || w < 640) return "mobile"
  return "desktop"
}

export function detectBrowser(): string {
  if (typeof window === "undefined") return "Chrome"
  const ua = navigator.userAgent
  if (ua.includes("Edg/")) return "Edge"
  if (ua.includes("Firefox/")) return "Firefox"
  if (ua.includes("Chrome/")) return "Chrome"
  if (ua.includes("Safari/") && !ua.includes("Chrome")) return "Safari"
  return "Other"
}
