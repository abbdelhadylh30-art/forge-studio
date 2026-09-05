"use client"

import type { TrackingConfig } from "@/lib/landing/types"

/**
 * Custom third-party script injection for the published page.
 *
 * Accepts raw markup in either shape:
 *   • full tags — <script src="…"></script>, <script>code</script>, several blocks
 *   • bare JS   — everything else is wrapped in a fresh <script> element
 *
 * <script src> snippets become external loads; inline code is executed via a
 * textContent assignment (never innerHTML — the raw text must not be parsed
 * as markup twice). Injection is idempotent per prefix.
 */

const ATTR = "data-lf-custom"

export type ConsentState = "unknown" | "accepted" | "declined"

/** localStorage key for the visitor's cookie-consent decision. */
export const CONSENT_KEY = "lf-cookie-consent"

export function readConsent(): ConsentState {
  if (typeof window === "undefined") return "unknown"
  try {
    const v = window.localStorage.getItem(CONSENT_KEY)
    if (v === "accepted" || v === "declined") return v
  } catch {
    /* private mode */
  }
  return "unknown"
}

export function writeConsent(state: "accepted" | "declined") {
  try {
    window.localStorage.setItem(CONSENT_KEY, state)
  } catch {
    /* ignore */
  }
}

/** True when custom scripts must wait for (or were unlocked by) consent. */
export function consentGatesScripts(enabled: boolean): boolean {
  return enabled
}

interface ParsedScript {
  src?: string
  code?: string
}

/** Split raw markup into individual script definitions. */
export function parseScripts(raw: string): ParsedScript[] {
  const text = raw.trim()
  if (!text) return []
  const out: ParsedScript[] = []
  const tagRe = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  let matched = false
  while ((m = tagRe.exec(text)) !== null) {
    matched = true
    const attrs = m[1] ?? ""
    const body = (m[2] ?? "").trim()
    const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1]
    if (src) out.push({ src })
    else if (body) out.push({ code: body })
    // empty <script></script> blocks are skipped
  }
  // no <script> tags at all → treat the whole input as one inline JS body
  if (!matched && text) out.push({ code: text })
  return out
}

function injectOne(parsed: ParsedScript, target: "head" | "body", prefix: string) {
  const el = document.createElement("script")
  el.setAttribute(ATTR, prefix)
  if (parsed.src) {
    el.src = parsed.src
    el.async = false
  } else {
    el.textContent = parsed.code ?? ""
  }
  ;(target === "head" ? document.head : document.body).appendChild(el)
}

/**
 * Inject the configured custom scripts once. Returns true when injection ran.
 * `allow` is computed by the caller: consent gate passed OR no banner.
 */
export function injectCustomScripts(tracking: TrackingConfig, allow: boolean, prefix = "custom"): boolean {
  if (typeof document === "undefined" || !allow) return false
  // idempotent — never double-inject for this prefix
  if (document.querySelector(`script[${ATTR}="${prefix}"]`)) return false

  const head = parseScripts(tracking.headScripts)
  const body = parseScripts(tracking.bodyScripts)
  head.forEach((s, i) => injectOne(s, "head", `${prefix}-head-${i}`))
  body.forEach((s, i) => injectOne(s, "body", `${prefix}-body-${i}`))
  return head.length + body.length > 0
}
