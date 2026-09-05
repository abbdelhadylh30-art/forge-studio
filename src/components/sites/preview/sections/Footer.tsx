"use client"

import { useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"
import { Check, Facebook, Github, Globe, Instagram, Linkedin, MessageCircle, Twitch, Twitter, Youtube } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import type { FooterSection, FooterSocialLink } from "@/lib/landing/types"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

import { CONTAINER } from "../shared"

export interface FooterProps {
  section: FooterSection
  brandName: string
  /** brand logo URL (brand kit) — replaces the gradient mark when present */
  logoUrl?: string
  /** legal page links (docs / privacy / terms) — rendered beside the copyright */
  legal?: { docsUrl?: string; privacyUrl?: string; termsUrl?: string }
  onCtaClick?: (label: string) => void
}

/** Static mapping from social platform names to lucide icons. */
const SOCIAL_ICONS: Record<string, LucideIcon> = {
  x: Twitter,
  twitter: Twitter,
  github: Github,
  discord: MessageCircle,
  linkedin: Linkedin,
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  twitch: Twitch,
}

/** Brand glyphs lucide doesn't carry (TikTok / WhatsApp / Messenger) — drawn
 *  inline, `currentColor`-aware so they follow the theme tokens like the rest. */
const BRAND_PATHS: Record<string, string> = {
  tiktok:
    "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z",
  whatsapp:
    "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z",
  messenger:
    "M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z",
}

function SocialGlyph({ platform, className }: { platform: string; className?: string }) {
  const key = platform.trim().toLowerCase()
  const Icon = SOCIAL_ICONS[key]
  if (Icon) return <Icon className={className} />
  const brand = BRAND_PATHS[key]
  if (brand) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
        <path d={brand} />
      </svg>
    )
  }
  return <Globe className={className} />
}

/** Icon button — a real outbound link when a URL is set, decorative otherwise. */
function SocialButton({ platform, url }: FooterSocialLink) {
  const label = platform.trim() || "Social"
  const className =
    "flex size-9 items-center justify-center rounded-full border transition-colors hover:[border-color:var(--lf-accent)] hover:[color:var(--lf-accent)]"
  const style = { background: "var(--lf-surface)", borderColor: "var(--lf-border)", color: "var(--lf-muted)" } as const
  if (!url) {
    return (
      <button type="button" aria-label={label} title={`${label} — no link set`} className={className} style={style}>
        <SocialGlyph platform={label} className="size-4" />
      </button>
    )
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={`${label} — ${url}`}
      className={className}
      style={style}
    >
      <SocialGlyph platform={label} className="size-4" />
    </a>
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

/** Docs / privacy / terms links — muted middot-separated row under the copyright. */
function LegalLinks({ legal }: { legal?: { docsUrl?: string; privacyUrl?: string; termsUrl?: string } }) {
  const links = [
    legal?.docsUrl ? { label: "Documentation", href: legal.docsUrl } : null,
    legal?.privacyUrl ? { label: "Privacy", href: legal.privacyUrl } : null,
    legal?.termsUrl ? { label: "Terms", href: legal.termsUrl } : null,
  ].filter(Boolean) as { label: string; href: string }[]
  if (!links.length) return null
  return (
    <nav aria-label="Legal" className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs">
      {links.map((l, i) => (
        <span key={l.label} className="inline-flex items-center gap-2">
          {i > 0 ? (
            <span aria-hidden style={{ color: "var(--lf-muted)" }}>
              ·
            </span>
          ) : null}
          <a href={l.href} className="transition-colors [color:var(--lf-muted)] hover:[color:var(--lf-accent)] underline-offset-2 hover:underline">
            {l.label}
          </a>
        </span>
      ))}
    </nav>
  )
}

function MinimalFooter({ section, brand, logoUrl, legal }: { section: FooterSection; brand: string; logoUrl?: string; legal?: { docsUrl?: string; privacyUrl?: string; termsUrl?: string } }) {
  const socials = section.socialLinks ?? []
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
            <SocialButton key={`${s.platform}-${s.url}`} platform={s.platform} url={s.url} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function MegaFooter({ section, brand, logoUrl, legal }: { section: FooterSection; brand: string; logoUrl?: string; legal?: { docsUrl?: string; privacyUrl?: string; termsUrl?: string } }) {
  const socials = section.socialLinks ?? []
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
              <SocialButton key={`${s.platform}-${s.url}`} platform={s.platform} url={s.url} />
            ))}
          </div>
        ) : <span />}
        <div className="flex flex-col items-center gap-2.5 sm:items-end">
          <Copyright section={section} brand={brand} />
          <LegalLinks legal={legal} />
        </div>
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

function NewsletterFooter({ section, brand, logoUrl, legal, onCtaClick }: { section: FooterSection; brand: string; logoUrl?: string; legal?: { docsUrl?: string; privacyUrl?: string; termsUrl?: string }; onCtaClick?: (label: string) => void }) {
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
  const socials = section.socialLinks ?? []

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
            <SocialButton key={`${s.platform}-${s.url}`} platform={s.platform} url={s.url} />
          ))}
        </div>
      ) : null}

      <div className="mt-6 space-y-2.5">
        <Copyright section={section} brand={brand} />
        <LegalLinks legal={legal} />
      </div>
    </div>
  )
}

export function Footer({ section, brandName, logoUrl, legal, onCtaClick }: FooterProps) {
  const brand = brandName || "Brand"

  return (
    <footer className={cn(section.style === "minimal" ? "py-10" : "py-14")}>
      {section.style === "newsletter" ? (
        <NewsletterFooter section={section} brand={brand} logoUrl={logoUrl} legal={legal} onCtaClick={onCtaClick} />
      ) : (
        <div className={CONTAINER}>
          {section.style === "mega" ? (
            <MegaFooter section={section} brand={brand} logoUrl={logoUrl} legal={legal} />
          ) : (
            <>
              <MinimalFooter section={section} brand={brand} logoUrl={logoUrl} />
              <div className="mt-8 space-y-2.5 border-t pt-6 text-center" style={{ borderColor: "var(--lf-border)" }}>
                <Copyright section={section} brand={brand} />
                <LegalLinks legal={legal} />
              </div>
            </>
          )}
        </div>
      )}
    </footer>
  )
}
