/**
 * Forge Studio — Builder: All 12 React section components in one file.
 * Each consumes its config + theme tokens and renders with inline styles.
 */

"use client";

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import type { ThemeTokens } from "@/lib/builder/sections/types";
import { resolveIcon } from "@/lib/builder/sections/theme-utils";

type Theme = ThemeTokens;

export function Navbar({ config, theme }: { config: any; theme: Theme }) {
  const c = config;
  return (
    <header className="w-full border-b backdrop-blur-sm" style={{ background: c.transparent ? "transparent" : theme.background, borderColor: theme.border, position: c.sticky ? "sticky" : "relative", top: 0, zIndex: 30 }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          {c.logoUrl ? <img src={c.logoUrl} alt={c.brand} className="h-7 w-auto" /> : <div className="grid h-7 w-7 place-items-center rounded-md font-bold" style={{ background: theme.primary, color: theme.primaryFg }}>{c.brand?.[0]?.toUpperCase() ?? "A"}</div>}
          <span className="font-semibold" style={{ color: theme.foreground, fontFamily: theme.fontHeading }}>{c.brand}</span>
        </div>
        <nav className="hidden items-center gap-6 md:flex">
          {c.links?.map((l: any, i: number) => <a key={i} href={l.href} className="text-sm font-medium transition-opacity hover:opacity-70" style={{ color: theme.foreground }}>{l.label}</a>)}
        </nav>
        {c.ctaLabel && <a href={c.ctaHref} className="inline-flex items-center gap-1 rounded-md px-4 py-2 text-sm font-semibold transition-transform hover:scale-105" style={{ background: theme.primary, color: theme.primaryFg }}>{c.ctaLabel}</a>}
      </div>
    </header>
  );
}

export function Hero({ config, theme }: { config: any; theme: Theme }) {
  const c = config;
  const isSplit = c.variant !== "centered";
  const align = c.align ?? (isSplit ? "left" : "center");
  const textBlock = (
    <div className={`flex flex-col gap-5 ${align === "center" ? "items-center text-center" : "items-start text-left"}`}>
      {c.eyebrow && <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider" style={{ background: theme.muted, color: theme.mutedFg }}>{c.eyebrow}</span>}
      <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl" style={{ color: theme.foreground, fontFamily: theme.fontHeading }}>{c.headline}</h1>
      {c.subhead && <p className="max-w-2xl text-base sm:text-lg" style={{ color: theme.mutedFg }}>{c.subhead}</p>}
      <div className={`mt-2 flex flex-wrap gap-3 ${align === "center" ? "justify-center" : ""}`}>
        {c.primaryCtaLabel && <a href={c.primaryCtaHref} className="inline-flex items-center gap-1 rounded-md px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-105" style={{ background: theme.primary, color: theme.primaryFg }}>{c.primaryCtaLabel}</a>}
        {c.secondaryCtaLabel && <a href={c.secondaryCtaHref} className="inline-flex items-center gap-1 rounded-md border px-5 py-2.5 text-sm font-semibold" style={{ borderColor: theme.border, color: theme.foreground, background: "transparent" }}>{c.secondaryCtaLabel}</a>}
      </div>
    </div>
  );
  return (
    <section className="px-6 py-16 sm:py-24" style={{ background: theme.background }}>
      <div className="mx-auto max-w-6xl">
        {isSplit ? (
          <div className={`grid items-center gap-12 md:grid-cols-2 ${c.variant === "split-right" ? "md:[&>*:first-child]:order-2" : ""}`}>
            {textBlock}
            {c.imageUrl ? <img src={c.imageUrl} alt="" className="w-full rounded-xl shadow-xl" style={{ borderRadius: theme.radius }} /> : <div className="grid aspect-video w-full place-items-center rounded-xl" style={{ background: theme.muted, borderRadius: theme.radius }}><span className="text-sm" style={{ color: theme.mutedFg }}>Image placeholder</span></div>}
          </div>
        ) : <div className="flex flex-col items-center text-center">{textBlock}</div>}
      </div>
    </section>
  );
}

export function LogoCloud({ config, theme }: { config: any; theme: Theme }) {
  const c = config;
  return (
    <section className="px-6 py-12" style={{ background: theme.background }}>
      <div className="mx-auto max-w-6xl">
        {c.title && <p className="mb-8 text-center text-sm font-medium uppercase tracking-wider" style={{ color: theme.mutedFg }}>{c.title}</p>}
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 opacity-70">
          {c.logos?.map((logo: any, i: number) => (
            <div key={i} className="flex items-center gap-2">
              {logo.url ? <img src={logo.url} alt={logo.name} className="h-7 w-auto" /> : <span className="text-xl font-bold tracking-tight" style={{ color: theme.foreground, fontFamily: theme.fontHeading }}>{logo.name}</span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Features({ config, theme }: { config: any; theme: Theme }) {
  const c = config;
  const cols = Number(c.columns ?? 3);
  return (
    <section id="features" className="px-6 py-16 sm:py-24" style={{ background: theme.background }}>
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          {c.eyebrow && <p className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: theme.accent }}>{c.eyebrow}</p>}
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: theme.foreground, fontFamily: theme.fontHeading }}>{c.title}</h2>
          {c.subtitle && <p className="mt-4 text-lg" style={{ color: theme.mutedFg }}>{c.subtitle}</p>}
        </div>
        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${cols === 4 ? "240" : "280"}px, 1fr))` }}>
          {c.items?.map((item: any, i: number) => {
            const Icon = resolveIcon(item.icon);
            return (
              <div key={i} className="group rounded-xl border p-6 transition-all hover:shadow-lg" style={{ borderColor: theme.border, background: theme.background, borderRadius: theme.radius }}>
                <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg" style={{ background: theme.muted, color: theme.accent }}><Icon className="h-5 w-5" /></div>
                <h3 className="mb-2 text-lg font-semibold" style={{ color: theme.foreground, fontFamily: theme.fontHeading }}>{item.title}</h3>
                {item.description && <p className="text-sm" style={{ color: theme.mutedFg }}>{item.description}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Stats({ config, theme }: { config: any; theme: Theme }) {
  const c = config;
  return (
    <section className="px-6 py-12" style={{ background: theme.muted }}>
      <div className="mx-auto max-w-6xl">
        {c.title && <h2 className="mb-10 text-center text-2xl font-bold tracking-tight" style={{ color: theme.foreground }}>{c.title}</h2>}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {c.stats?.map((s: any, i: number) => (
            <div key={i} className="text-center">
              <div className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl" style={{ color: theme.foreground, fontFamily: theme.fontHeading }}>{s.value}</div>
              <div className="mt-2 text-sm font-medium" style={{ color: theme.mutedFg }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Gallery({ config, theme }: { config: any; theme: Theme }) {
  const c = config;
  const cols = Number(c.columns ?? 3);
  return (
    <section id="work" className="px-6 py-16 sm:py-24" style={{ background: theme.background }}>
      <div className="mx-auto max-w-6xl">
        {c.title && <h2 className="mb-10 text-center text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: theme.foreground, fontFamily: theme.fontHeading }}>{c.title}</h2>}
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(260px, 1fr))` }}>
          {c.images?.map((img: any, i: number) => (
            <figure key={i} className="group overflow-hidden rounded-xl" style={{ borderRadius: theme.radius }}>
              <div className="relative aspect-[4/3] overflow-hidden" style={{ background: theme.muted }}>
                <img src={img.url} alt={img.caption ?? ""} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              </div>
              {img.caption && <figcaption className="mt-2 text-sm" style={{ color: theme.mutedFg }}>{img.caption}</figcaption>}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Testimonials({ config, theme }: { config: any; theme: Theme }) {
  const c = config;
  return (
    <section id="testimonials" className="px-6 py-16 sm:py-24" style={{ background: theme.muted }}>
      <div className="mx-auto max-w-6xl">
        {c.title && <h2 className="mb-12 text-center text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: theme.foreground, fontFamily: theme.fontHeading }}>{c.title}</h2>}
        <div className="grid gap-6 md:grid-cols-3">
          {c.items?.map((t: any, i: number) => (
            <figure key={i} className="flex flex-col gap-4 rounded-xl border p-6" style={{ borderColor: theme.border, background: theme.background, borderRadius: theme.radius }}>
              <blockquote className="text-base leading-relaxed" style={{ color: theme.foreground }}>&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption className="mt-auto flex items-center gap-3">
                {t.avatar ? <img src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full object-cover" /> : <div className="grid h-10 w-10 place-items-center rounded-full text-sm font-bold" style={{ background: theme.primary, color: theme.primaryFg }}>{t.name?.[0]?.toUpperCase()}</div>}
                <div>
                  <div className="text-sm font-semibold" style={{ color: theme.foreground }}>{t.name}</div>
                  {t.role && <div className="text-xs" style={{ color: theme.mutedFg }}>{t.role}</div>}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Pricing({ config, theme }: { config: any; theme: Theme }) {
  const c = config;
  return (
    <section id="pricing" className="px-6 py-16 sm:py-24" style={{ background: theme.background }}>
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          {c.title && <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: theme.foreground, fontFamily: theme.fontHeading }}>{c.title}</h2>}
          {c.subtitle && <p className="mt-4 text-lg" style={{ color: theme.mutedFg }}>{c.subtitle}</p>}
        </div>
        <div className={`grid gap-6 ${c.tiers?.length === 1 ? "mx-auto max-w-md" : "md:grid-cols-2 lg:grid-cols-3"}`}>
          {c.tiers?.map((tier: any, i: number) => {
            const features = (tier.features ?? "").split("\n").filter(Boolean);
            const highlight = tier.highlighted;
            return (
              <div key={i} className="relative flex flex-col rounded-xl border p-6 shadow-sm" style={{ borderColor: highlight ? theme.accent : theme.border, background: theme.background, borderRadius: theme.radius, boxShadow: highlight ? `0 10px 30px -10px ${theme.accent}40` : undefined, transform: highlight ? "scale(1.02)" : undefined }}>
                {highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider" style={{ background: theme.accent, color: theme.accentFg }}>Most popular</div>}
                <h3 className="text-lg font-semibold" style={{ color: theme.foreground }}>{tier.name}</h3>
                {tier.description && <p className="mt-1 text-sm" style={{ color: theme.mutedFg }}>{tier.description}</p>}
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight" style={{ color: theme.foreground }}>{c.currency}{tier.price}</span>
                  <span className="text-sm" style={{ color: theme.mutedFg }}>{c.period}</span>
                </div>
                <ul className="mt-6 flex flex-1 flex-col gap-2">
                  {features.map((f: string, j: number) => (
                    <li key={j} className="flex items-start gap-2 text-sm" style={{ color: theme.foreground }}>
                      <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: theme.accent }} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {tier.ctaLabel && <a href={tier.ctaHref} className="mt-6 inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold transition-transform hover:scale-105" style={{ background: highlight ? theme.accent : theme.primary, color: highlight ? theme.accentFg : theme.primaryFg }}>{tier.ctaLabel}</a>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Faq({ config, theme }: { config: any; theme: Theme }) {
  const c = config;
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <section id="faq" className="px-6 py-16 sm:py-24" style={{ background: theme.background }}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          {c.title && <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: theme.foreground, fontFamily: theme.fontHeading }}>{c.title}</h2>}
          {c.subtitle && <p className="mt-4 text-lg" style={{ color: theme.mutedFg }}>{c.subtitle}</p>}
        </div>
        <div className="flex flex-col gap-3">
          {c.items?.map((item: any, i: number) => {
            const open = openIdx === i;
            return (
              <div key={i} className="overflow-hidden rounded-xl border" style={{ borderColor: theme.border, background: theme.background, borderRadius: theme.radius }}>
                <button type="button" onClick={() => setOpenIdx(open ? null : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left" style={{ color: theme.foreground }}>
                  <span className="font-semibold">{item.question}</span>
                  <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: theme.mutedFg }} />
                </button>
                <div className="grid transition-all" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
                  <div className="overflow-hidden"><p className="px-5 pb-4 text-sm leading-relaxed" style={{ color: theme.mutedFg }}>{item.answer}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Cta({ config, theme }: { config: any; theme: Theme }) {
  const c = config;
  const bg = c.variant === "gradient" ? `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)` : c.variant === "muted" ? theme.muted : theme.primary;
  const fg = c.variant === "muted" ? theme.foreground : theme.primaryFg;
  const mutedFg = c.variant === "muted" ? theme.mutedFg : "rgba(255,255,255,0.85)";
  const btnBorder = c.variant === "muted" ? theme.border : "rgba(255,255,255,0.3)";
  return (
    <section className="px-6 py-16 sm:py-24" style={{ background: theme.background }}>
      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl px-8 py-12 text-center sm:px-16 sm:py-16" style={{ background: bg, color: fg, borderRadius: theme.radius }}>
          {c.eyebrow && <p className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: mutedFg }}>{c.eyebrow}</p>}
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: fg, fontFamily: theme.fontHeading }}>{c.title}</h2>
          {c.subtitle && <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg" style={{ color: mutedFg }}>{c.subtitle}</p>}
          {(c.primaryCtaLabel || c.secondaryCtaLabel) && (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {c.primaryCtaLabel && <a href={c.primaryCtaHref} className="inline-flex items-center gap-1 rounded-md px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-105" style={{ background: theme.background, color: theme.foreground }}>{c.primaryCtaLabel}</a>}
              {c.secondaryCtaLabel && <a href={c.secondaryCtaHref} className="inline-flex items-center gap-1 rounded-md border px-5 py-2.5 text-sm font-semibold" style={{ borderColor: btnBorder, color: fg, background: "transparent" }}>{c.secondaryCtaLabel}</a>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function Newsletter({ config, theme }: { config: any; theme: Theme }) {
  const c = config;
  return (
    <section id="waitlist" className="px-6 py-16 sm:py-24" style={{ background: theme.muted }}>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: theme.foreground, fontFamily: theme.fontHeading }}>{c.title}</h2>
        {c.subtitle && <p className="mt-4 text-base sm:text-lg" style={{ color: theme.mutedFg }}>{c.subtitle}</p>}
        <form onSubmit={(e) => e.preventDefault()} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
          <input type="email" placeholder={c.placeholder ?? "you@email.com"} className="flex-1 rounded-md border px-4 py-2.5 text-sm outline-none" style={{ borderColor: theme.border, background: theme.background, color: theme.foreground }} />
          <button type="submit" className="inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-105" style={{ background: theme.primary, color: theme.primaryFg }}>{c.buttonLabel ?? "Subscribe"}</button>
        </form>
        {c.footnote && <p className="mt-4 text-xs" style={{ color: theme.mutedFg }}>{c.footnote}</p>}
      </div>
    </section>
  );
}

export function Footer({ config, theme }: { config: any; theme: Theme }) {
  const c = config;
  return (
    <footer className="border-t px-6 py-12" style={{ background: theme.background, borderColor: theme.border }}>
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8" style={{ gridTemplateColumns: `2fr repeat(${c.columns?.length ?? 3}, 1fr)` }}>
          <div>
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-md font-bold" style={{ background: theme.primary, color: theme.primaryFg }}>{c.brand?.[0]?.toUpperCase() ?? "A"}</div>
              <span className="font-semibold" style={{ color: theme.foreground, fontFamily: theme.fontHeading }}>{c.brand}</span>
            </div>
            {c.tagline && <p className="mt-3 max-w-xs text-sm" style={{ color: theme.mutedFg }}>{c.tagline}</p>}
          </div>
          {c.columns?.map((col: any, i: number) => (
            <div key={i}>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: theme.foreground }}>{col.title}</h4>
              <ul className="flex flex-col gap-2">
                {col.links?.map((link: any, j: number) => <li key={j}><a href={link.href} className="text-sm transition-opacity hover:opacity-70" style={{ color: theme.mutedFg }}>{link.label}</a></li>)}
              </ul>
            </div>
          ))}
        </div>
        {c.copyright && <div className="mt-10 border-t pt-6 text-center text-xs" style={{ borderColor: theme.border, color: theme.mutedFg }}>{c.copyright}</div>}
      </div>
    </footer>
  );
}
