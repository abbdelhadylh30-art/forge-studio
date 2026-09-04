"use client"

import { useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"
import { Check, Github, Globe, Linkedin, MessageCircle, Twitter } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import type { FooterSection } from "@/lib/landing/types"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

import { CONTAINER } from "../shared"

export interface FooterProps {
  section: FooterSection
  brandName: string
  /** brand logo URL (brand kit) — replaces the gradient mark when present */
  logoUrl?: string
  onCtaClick?: (label: string) => void
}

/** Static mapping from social labels to lucide icons. */
const SOCIAL_ICONS: Record<string, LucideIcon> = {
  x: Twitter,
  twitter: Twitter,
  github: Github,
  discord: MessageCircle,
  linkedin: Linkedin,
}

function SocialButton({ label }: { label: string }) {
  const Icon = SOCIAL_ICONS[label.trim().toLowerCase()] ?? Globe
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="flex size-9 items-center justify-center rounded-full border transition-colors hover:[border-color:var(--lf-accent)]"
      style={{ background: "var(--lf-surface)", borderColor: "var(--lf-border)", color: "var(--lf-muted)" }}
    >
      <Icon className="size-4" />
    </button>
  )
}

function BrandMark({ brand, logoUrl }: { brand: string; logoUrl?: string }) {
  return (
    <span className="flex items-center gap-2.5">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${brand} logo`}
          className="h-7 w-auto max-w-[120px] shrink-0 rounded-md object-contain"
          onError={(e) => {
            e.currentTarget.style.display = "none"
          }}
        />
      ) : (
        <span aria-hidden className="size-7 shrink-0 rounded-lg" style={{ background: "var(--lf-gradient)" }} />
      )}
      <span className="text-[15px] font-bold tracking-tight" style={{ color: "var(--lf-text)" }}>
        {brand}
      </span>
    </span>
  )
}

function MinimalFooter({ section, brand, logoUrl }: { section: FooterSection; brand: string; logoUrl?: string }) {
  const socials = section.social ?? []
  return (
    <div className="flex flex-col items-center justify-between gap-5 sm:flex-row">
      <div className="flex flex-col items-center gap-1.5 sm:items-start">
        <BrandMark brand={brand} logoUrl={logoUrl} />
        {section.tagline ? (
          <p className="text-sm" style={{ color: "var(--lf-muted)" }}>
            {section.tagline}
          </p>
        ) : null}
      </div>
      {socials.length > 0 ? (
        <div className="flex items-center gap-2.5">
          {socials.map((s) => (
            <SocialButton key={s} label={s} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function MegaFooter({ section, brand, logoUrl }: { section: FooterSection; brand: string; logoUrl?: string }) {
  const socials = section.social ?? []
  const groups = section.linkGroups ?? []
  return (
    <div>
      <div className="grid grid-cols-2 gap-8 md:grid-cols-5 md:gap-10">
        <div className="col-span-2 flex flex-col items-start gap-3">
          <BrandMark brand={brand} logoUrl={logoUrl} />
          {section.tagline ? (
            <p className="max-w-xs text-sm leading-relaxed" style={{ color: "var(--lf-muted)" }}>
              {section.tagline}
            </p>
          ) : null}
        </div>
        {groups.map((g) => (
          <div key={g.group} className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold" style={{ color: "var(--lf-text)" }}>
              {g.group}
            </h3>
            <ul className="flex flex-col gap-2">
              {g.items.map((l) => (
                <li key={`${g.group}-${l.label}`}>
                  <a href={l.href} className="text-sm transition-colors [color:var(--lf-muted)] hover:[color:var(--lf-text)]">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row" style={{ borderColor: "var(--lf-border)" }}>
        {socials.length > 0 ? (
          <div className="flex items-center gap-2.5">
            {socials.map((s) => (
              <SocialButton key={s} label={s} />
            ))}
          </div>
        ) : <span />}
        <Copyright section={section} brand={brand} />
      </div>
    </div>
  )
}

function Copyright({ section, brand }: { section: FooterSection; brand: string }) {
  return (
    <p className="text-xs" style={{ color: "var(--lf-muted)" }}>
      {section.copyright || `© ${new Date().getFullYear()} ${brand}. All rights reserved.`}
    </p>
  )
}

function NewsletterFooter({ section, brand, logoUrl, onCtaClick }: { section: FooterSection; brand: string; logoUrl?: string; onCtaClick?: (label: string) => void }) {
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    []
  )

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const value = email.trim()
    if (!value || subscribed) return
    onCtaClick?.(`Newsletter: ${value}`)
    setSubscribed(true)
    timerRef.current = setTimeout(() => {
      setSubscribed(false)
      setEmail("")
    }, 2500)
  }

  const groups = section.linkGroups ?? []
  const socials = section.social ?? []

  return (
    <div className={cn(CONTAINER, "flex flex-col items-center text-center")}>
      <BrandMark brand={brand} logoUrl={logoUrl} />
      {section.tagline ? (
        <h2 className="mt-4 max-w-xl text-2xl font-extrabold tracking-tight" style={{ color: "var(--lf-text)" }}>
          {section.tagline}
        </h2>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="mx-auto mt-6 flex w-full max-w-md items-center gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          aria-label="Email address"
          style={{ background: "var(--lf-surface)", borderColor: "var(--lf-border)", color: "var(--lf-text)" }}
        />
        <button
          type="submit"
          disabled={subscribed}
          className="flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-transform duration-150 hover:scale-[1.01]"
          style={
            subscribed
              ? { background: "var(--lf-accent-soft)", color: "var(--lf-accent)" }
              : { background: "var(--lf-accent)", color: "var(--lf-accent-contrast)" }
          }
        >
          {subscribed ? (
            <>
              <Check className="size-4" />
              Subscribed
            </>
          ) : (
            "Subscribe"
          )}
        </button>
      </form>

      {groups.length > 0 ? (
        <nav className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {groups.flatMap((g, gi) =>
            g.items.map((l, li) => (
              <a
                key={`${gi}-${li}-${l.label}`}
                href={l.href}
                className="text-sm transition-colors [color:var(--lf-muted)] hover:[color:var(--lf-text)]"
              >
                {l.label}
              </a>
            ))
          )}
        </nav>
      ) : null}

      {socials.length > 0 ? (
        <div className="mt-8 flex items-center gap-2.5">
          {socials.map((s) => (
            <SocialButton key={s} label={s} />
          ))}
        </div>
      ) : null}

      <div className="mt-6">
        <Copyright section={section} brand={brand} />
      </div>
    </div>
  )
}

export function Footer({ section, brandName, logoUrl, onCtaClick }: FooterProps) {
  const brand = brandName || "Brand"

  return (
    <footer className={cn(section.style === "minimal" ? "py-10" : "py-14")}>
      {section.style === "newsletter" ? (
        <NewsletterFooter section={section} brand={brand} logoUrl={logoUrl} onCtaClick={onCtaClick} />
      ) : (
        <div className={CONTAINER}>
          {section.style === "mega" ? (
            <MegaFooter section={section} brand={brand} logoUrl={logoUrl} />
          ) : (
            <>
              <MinimalFooter section={section} brand={brand} logoUrl={logoUrl} />
              <div className="mt-8 border-t pt-6 text-center" style={{ borderColor: "var(--lf-border)" }}>
                <Copyright section={section} brand={brand} />
              </div>
            </>
          )}
        </div>
      )}
    </footer>
  )
}
