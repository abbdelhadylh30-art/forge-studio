"use client"

import type { CSSProperties } from "react"

import { cn } from "@/lib/utils"

/** Standard inner container used by every preview section. */
export const CONTAINER = "mx-auto w-full max-w-6xl px-4 sm:px-6"

// ── Vertical rhythm ──────────────────────────────────────────────────────────
// One scale, used consistently so every section breathes the same:
//   hero / gradient moments → more air (SECTION_PAD_HERO)
//   standard content       → SECTION_PAD
//   quiet supporting       → SECTION_PAD_SNUG
//   bars (announcement)    → SECTION_PAD_BAR
export const SECTION_PAD = "py-16 md:py-24"
export const SECTION_PAD_HERO = "pt-20 pb-16 md:pt-32 md:pb-24"
export const SECTION_PAD_SNUG = "py-10 md:py-14"
export const SECTION_PAD_BAR = "py-2.5"

/** Gradient-clipped text driven by the active theme's `--lf-gradient` var. */
export const gradientText: CSSProperties = {
  backgroundImage: "var(--lf-gradient)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
}

export interface SectionHeaderProps {
  title?: string
  subtitle?: string
  center?: boolean
  className?: string
  /** small uppercase kicker above the title */
  eyebrow?: string
}

/**
 * Shared section header: optional eyebrow, extrabold title, muted subtitle.
 * Renders nothing when title, subtitle and eyebrow are all empty.
 */
export function SectionHeader({ title, subtitle, center = false, className, eyebrow }: SectionHeaderProps) {
  if (!title && !subtitle && !eyebrow) return null
  return (
    <div className={cn(center ? "mx-auto max-w-2xl text-center" : "max-w-2xl", "mb-10 md:mb-14", className)}>
      {eyebrow ? (
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--lf-accent)" }}>
          {eyebrow}
        </p>
      ) : null}
      {title ? (
        <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl" style={{ color: "var(--lf-text)" }}>
          {title}
        </h2>
      ) : null}
      {subtitle ? (
        <p className="mt-3 text-sm leading-relaxed md:text-base" style={{ color: "var(--lf-muted)" }}>
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}
