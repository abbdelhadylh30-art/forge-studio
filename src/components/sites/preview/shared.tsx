"use client"

import type { CSSProperties } from "react"

import { cn } from "@/lib/utils"

/** Standard inner container used by every preview section. */
export const CONTAINER = "mx-auto w-full max-w-6xl px-4 sm:px-6"

/** Vertical rhythm used by preview sections. */
export const SECTION_PAD = "py-16 md:py-24"

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
}

/**
 * Shared section header: extrabold title + muted subtitle.
 * Renders nothing when both title and subtitle are empty.
 */
export function SectionHeader({ title, subtitle, center = false, className }: SectionHeaderProps) {
  if (!title && !subtitle) return null
  return (
    <div className={cn(center ? "mx-auto max-w-2xl text-center" : "max-w-2xl", "mb-10 md:mb-12", className)}>
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
