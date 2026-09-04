"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"

import type { NavbarSection } from "@/lib/landing/types"

import { cn } from "@/lib/utils"

import { CONTAINER } from "../shared"

export interface NavbarProps {
  section: NavbarSection
  brandName: string
  /** brand logo URL (brand kit) — replaces the gradient mark when present */
  logoUrl?: string
  onCtaClick?: (label: string) => void
}

export function Navbar({ section, brandName, logoUrl, onCtaClick }: NavbarProps) {
  const [open, setOpen] = useState(false)
  const brand = section.brandLabel?.trim() || brandName
  const links = section.links ?? []
  const cta = section.cta

  return (
    <nav
      className="sticky top-0 z-10"
      style={{
        backgroundColor: "color-mix(in srgb, var(--lf-bg) 88%, transparent)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--lf-border)",
      }}
    >
      <div className={cn(CONTAINER, "flex h-14 items-center justify-between gap-4")}>
        {/* brand — logo image (brand kit) or gradient mark fallback */}
        <a href="#" className="flex items-center gap-2.5" style={{ color: "var(--lf-text)" }}>
          {logoUrl ? (
                <img
              src={logoUrl}
              alt={`${brand} logo`}
              className="h-7 w-auto max-w-[120px] rounded-md object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
          ) : (
            <span aria-hidden className="size-7 rounded-lg" style={{ background: "var(--lf-gradient)" }} />
          )}
          <span className="text-[15px] font-bold tracking-tight">{brand}</span>
        </a>

        {/* desktop links */}
        <div className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a
              key={`${l.label}-${l.href}`}
              href={l.href}
              className="text-sm transition-colors [color:var(--lf-muted)] hover:[color:var(--lf-text)]"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {cta?.label ? (
            <a
              href={cta.href || "#cta"}
              onClick={(e) => {
                if (onCtaClick) e.preventDefault()
                onCtaClick?.(cta.label)
              }}
              className="hidden rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-transform duration-150 hover:scale-[1.02] active:scale-100 sm:inline-flex"
              style={{ background: "var(--lf-accent)", color: "var(--lf-accent-contrast)" }}
            >
              {cta.label}
            </a>
          ) : null}
          <button
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="inline-flex size-9 items-center justify-center rounded-lg border transition-colors hover:[border-color:var(--lf-accent)] md:hidden"
            style={{ borderColor: "var(--lf-border)", color: "var(--lf-text)" }}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* mobile dropdown */}
      {open ? (
        <div className="border-t md:hidden" style={{ borderColor: "var(--lf-border)", background: "var(--lf-bg)" }}>
          <div className={cn(CONTAINER, "flex flex-col gap-1 py-3")}>
            {links.map((l) => (
              <a
                key={`m-${l.label}-${l.href}`}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2 text-sm transition-colors [color:var(--lf-muted)] hover:[color:var(--lf-text)]"
              >
                {l.label}
              </a>
            ))}
            {cta?.label ? (
              <a
                href={cta.href || "#cta"}
                onClick={(e) => {
                  setOpen(false)
                  if (onCtaClick) e.preventDefault()
                  onCtaClick?.(cta.label)
                }}
                className="mt-2 rounded-lg px-3.5 py-2 text-sm font-semibold"
                style={{ background: "var(--lf-accent)", color: "var(--lf-accent-contrast)" }}
              >
                {cta.label}
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </nav>
  )
}
