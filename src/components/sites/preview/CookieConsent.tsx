"use client"

import * as React from "react"
import { Cookie, ExternalLink, ShieldCheck } from "lucide-react"

import type { CookieConsentConfig } from "@/lib/landing/types"
import { cn } from "@/lib/utils"

/** Slot wiring shared by the React app + the standalone export's vanilla script. */
export const CONSENT_ACCEPT_ATTR = "data-lf-consent-accept"
export const CONSENT_DECLINE_ATTR = "data-lf-consent-decline"

/**
 * Cookie-consent banner — shown on the published page (and its standalone
 * export) until the visitor decides. Theme-aware (lf vars) so it matches both
 * dark and light palettes, Lucide iconography, comfortable spacing.
 *
 * Note: the built-in analytics (pageviews, CTA clicks, leads) is cookie-free
 * and always runs — this banner governs the custom third-party scripts
 * (GA4, Meta Pixel, chat widgets) configured in Page → Privacy & tracking.
 */
export function CookieConsentBanner({
  consent,
  onDecide,
  hidden = false,
  className,
}: {
  consent: CookieConsentConfig
  onDecide?: (accepted: boolean) => void
  /** export path ships the banner hidden and lets the vanilla script reveal it
   *  (JS-off → no banner, and no custom scripts either — consistent) */
  hidden?: boolean
  className?: string
}) {
  if (!consent.enabled) return null

  const learnMore =
    consent.learnMoreUrl?.trim() && /^https?:\/\//i.test(consent.learnMoreUrl.trim()) ? (
      <a
        href={consent.learnMoreUrl.trim()}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[12px] font-medium underline underline-offset-4 transition-colors"
        style={{ color: "var(--lf-accent)" }}
      >
        {consent.learnMoreLabel?.trim() || "Learn more"}
        <ExternalLink className="h-3 w-3" aria-hidden />
      </a>
    ) : null

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      data-lf-cookie-banner
      hidden={hidden || undefined}
      className={cn(
        "fixed inset-x-0 z-[9999] flex justify-center px-4",
        consent.position === "top" ? "top-0" : "bottom-0",
        className,
      )}
    >
      <div
        className="lf-fade-up my-3 flex w-full max-w-3xl flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border px-5 py-4 shadow-2xl backdrop-blur-xl"
        style={{
          background: "var(--lf-bg)",
          borderColor: "var(--lf-border)",
          boxShadow: "0 18px 50px -12px rgba(0,0,0,0.45)",
        }}
      >
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "var(--lf-accent-soft)" }}
          aria-hidden
        >
          <Cookie className="h-5 w-5" style={{ color: "var(--lf-accent)" }} />
        </span>
        <p className="min-w-[220px] flex-1 text-[13px] leading-relaxed" style={{ color: "var(--lf-text)" }}>
          {consent.message || "We use cookies to enhance your experience. By continuing you agree to our use of cookies."}
        </p>
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          {learnMore}
          <button
            type="button"
            {...{ [CONSENT_DECLINE_ATTR]: "" }}
            onClick={() => onDecide?.(false)}
            className="h-9 rounded-xl border px-4 text-[12px] font-semibold transition-colors hover:opacity-80"
            style={{ borderColor: "var(--lf-border)", color: "var(--lf-muted)" }}
          >
            {consent.declineLabel || "Decline"}
          </button>
          <button
            type="button"
            {...{ [CONSENT_ACCEPT_ATTR]: "" }}
            onClick={() => onDecide?.(true)}
            className="flex h-9 items-center gap-1.5 rounded-xl px-4 text-[12px] font-bold shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
            style={{ background: "var(--lf-accent)", color: "var(--lf-accent-contrast)" }}
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            {consent.acceptLabel || "Accept"}
          </button>
        </div>
      </div>
    </div>
  )
}
