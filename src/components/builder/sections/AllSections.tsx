/**
 * Forge Studio — Builder: All 12 React section components in one file.
 * Each consumes its config + theme tokens and renders with inline styles.
 */

"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Check, AlertCircle, Lightbulb, Video, ShieldCheck } from "lucide-react";
import type { ThemeTokens } from "@/lib/builder/sections/types";
import { resolveIcon } from "@/lib/builder/sections/theme-utils";
import { InlineText } from "./InlineText";

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
  const variant = c.variant ?? "centered";
  const isSplit = variant === "split-left" || variant === "split-right";
  const align = c.align ?? (isSplit ? "left" : "center");
  const textBlock = (
    <div className={`flex flex-col gap-5 ${align === "center" ? "items-center text-center" : "items-start text-left"}`}>
      {c.eyebrow && <InlineText fieldKey="eyebrow" value={c.eyebrow} as="span" className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider" style={{ background: theme.muted, color: theme.mutedFg }} placeholder="Eyebrow…" />}
      <InlineText fieldKey="headline" value={c.headline ?? ""} as="h1" className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl" style={{ color: theme.foreground, fontFamily: theme.fontHeading }} placeholder="Your headline…" />
      <InlineText fieldKey="subhead" value={c.subhead ?? ""} as="p" multiline className="max-w-2xl text-base sm:text-lg" style={{ color: theme.mutedFg }} placeholder="Your subhead…" />
      <div className={`mt-2 flex flex-wrap gap-3 ${align === "center" ? "justify-center" : ""}`}>
        <a href={c.primaryCtaHref ?? "#"} className="inline-flex items-center gap-1 rounded-md px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-105" style={{ background: theme.primary, color: theme.primaryFg }}>
          <InlineText fieldKey="primaryCtaLabel" value={c.primaryCtaLabel ?? ""} as="span" placeholder="Start free" />
        </a>
        <a href={c.secondaryCtaHref ?? "#"} className="inline-flex items-center gap-1 rounded-md border px-5 py-2.5 text-sm font-semibold" style={{ borderColor: theme.border, color: theme.foreground, background: "transparent" }}>
          <InlineText fieldKey="secondaryCtaLabel" value={c.secondaryCtaLabel ?? ""} as="span" placeholder="Watch demo" />
        </a>
      </div>
    </div>
  );

  if (variant === "fullscreen") {
    return (
      <section className="relative grid min-h-screen place-items-center px-6 py-24" style={{ background: c.imageUrl ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${c.imageUrl}) center/cover` : theme.background }}>
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex flex-col items-center gap-5">
            {c.eyebrow && <InlineText fieldKey="eyebrow" value={c.eyebrow} as="span" className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }} placeholder="Eyebrow…" />}
            <InlineText fieldKey="headline" value={c.headline ?? ""} as="h1" className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl" style={{ color: c.imageUrl ? "#fff" : theme.foreground, fontFamily: theme.fontHeading }} placeholder="Your headline…" />
            <InlineText fieldKey="subhead" value={c.subhead ?? ""} as="p" multiline className="max-w-2xl text-base sm:text-lg" style={{ color: c.imageUrl ? "rgba(255,255,255,0.85)" : theme.mutedFg }} placeholder="Your subhead…" />
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <a href={c.primaryCtaHref ?? "#"} className="inline-flex items-center gap-1 rounded-md px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-105" style={{ background: theme.accent, color: theme.accentFg }}><InlineText fieldKey="primaryCtaLabel" value={c.primaryCtaLabel ?? ""} as="span" placeholder="Start free" /></a>
              <a href={c.secondaryCtaHref ?? "#"} className="inline-flex items-center gap-1 rounded-md border px-5 py-2.5 text-sm font-semibold" style={{ borderColor: "rgba(255,255,255,0.3)", color: "#fff", background: "transparent" }}><InlineText fieldKey="secondaryCtaLabel" value={c.secondaryCtaLabel ?? ""} as="span" placeholder="Watch demo" /></a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (variant === "gradient") {
    return (
      <section className="px-6 py-24" style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)` }}>
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex flex-col items-center gap-5">
            {c.eyebrow && <InlineText fieldKey="eyebrow" value={c.eyebrow} as="span" className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }} placeholder="Eyebrow…" />}
            <InlineText fieldKey="headline" value={c.headline ?? ""} as="h1" className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl" style={{ color: "#fff", fontFamily: theme.fontHeading }} placeholder="Your headline…" />
            <InlineText fieldKey="subhead" value={c.subhead ?? ""} as="p" multiline className="max-w-2xl text-base sm:text-lg" style={{ color: "rgba(255,255,255,0.85)" }} placeholder="Your subhead…" />
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <a href={c.primaryCtaHref ?? "#"} className="inline-flex items-center gap-1 rounded-md px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-105" style={{ background: "#fff", color: theme.primary }}><InlineText fieldKey="primaryCtaLabel" value={c.primaryCtaLabel ?? ""} as="span" placeholder="Start free" /></a>
              <a href={c.secondaryCtaHref ?? "#"} className="inline-flex items-center gap-1 rounded-md border px-5 py-2.5 text-sm font-semibold" style={{ borderColor: "rgba(255,255,255,0.3)", color: "#fff", background: "transparent" }}><InlineText fieldKey="secondaryCtaLabel" value={c.secondaryCtaLabel ?? ""} as="span" placeholder="Watch demo" /></a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (variant === "card") {
    return (
      <section className="px-6 py-24" style={{ background: theme.muted }}>
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border p-8 text-center shadow-xl sm:p-12" style={{ background: theme.background, borderColor: theme.border, borderRadius: theme.radius }}>
            <div className="flex flex-col items-center gap-5">
              {c.eyebrow && <InlineText fieldKey="eyebrow" value={c.eyebrow} as="span" className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider" style={{ background: theme.muted, color: theme.mutedFg }} placeholder="Eyebrow…" />}
              <InlineText fieldKey="headline" value={c.headline ?? ""} as="h1" className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl" style={{ color: theme.foreground, fontFamily: theme.fontHeading }} placeholder="Your headline…" />
              <InlineText fieldKey="subhead" value={c.subhead ?? ""} as="p" multiline className="max-w-xl text-base" style={{ color: theme.mutedFg }} placeholder="Your subhead…" />
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                <a href={c.primaryCtaHref ?? "#"} className="inline-flex items-center gap-1 rounded-md px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-105" style={{ background: theme.primary, color: theme.primaryFg }}><InlineText fieldKey="primaryCtaLabel" value={c.primaryCtaLabel ?? ""} as="span" placeholder="Start free" /></a>
                <a href={c.secondaryCtaHref ?? "#"} className="inline-flex items-center gap-1 rounded-md border px-5 py-2.5 text-sm font-semibold" style={{ borderColor: theme.border, color: theme.foreground, background: "transparent" }}><InlineText fieldKey="secondaryCtaLabel" value={c.secondaryCtaLabel ?? ""} as="span" placeholder="Watch demo" /></a>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (variant === "minimalist") {
    return (
      <section className="px-6 py-32" style={{ background: theme.background }}>
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex flex-col items-center gap-4">
            {c.eyebrow && <InlineText fieldKey="eyebrow" value={c.eyebrow} as="span" className="text-xs font-medium uppercase tracking-widest" style={{ color: theme.mutedFg }} placeholder="Eyebrow…" />}
            <InlineText fieldKey="headline" value={c.headline ?? ""} as="h1" className="text-3xl font-medium leading-tight tracking-tight sm:text-4xl lg:text-5xl" style={{ color: theme.foreground, fontFamily: theme.fontHeading }} placeholder="Your headline…" />
            <InlineText fieldKey="subhead" value={c.subhead ?? ""} as="p" multiline className="max-w-xl text-base" style={{ color: theme.mutedFg }} placeholder="Your subhead…" />
            <div className="mt-4">
              <a href={c.primaryCtaHref ?? "#"} className="text-sm font-semibold underline" style={{ color: theme.accent }}>
                <InlineText fieldKey="primaryCtaLabel" value={c.primaryCtaLabel ?? ""} as="span" placeholder="Get started →" />
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-16 sm:py-24" style={{ background: theme.background }}>
      <div className="mx-auto max-w-6xl">
        {isSplit ? (
          <div className={`grid items-center gap-12 md:grid-cols-2 ${variant === "split-right" ? "md:[&>*:first-child]:order-2" : ""}`}>
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

// Phase 2A: 7 new section types

export function Announcement({ config, theme }: { config: any; theme: Theme }) {
  const c = config;
  const bg = c.bgColor || theme.primary;
  const fg = c.textColor || theme.primaryFg;
  if (c.variant === "ticker") {
    return (
      <div className="overflow-hidden py-2" style={{ background: bg, color: fg }}>
        <div className="whitespace-nowrap" style={{ animation: "lfTicker 20s linear infinite", display: "inline-block" }}>
          {Array(5).fill(c.message).map((m, i) => (
            <span key={i} className="mx-8 text-sm font-medium">{m} {c.linkLabel && <a href={c.linkHref} className="underline ml-2">{c.linkLabel}</a>}</span>
          ))}
        </div>
      </div>
    );
  }
  if (c.variant === "countdown") {
    return <CountdownAnnouncement c={c} bg={bg} fg={fg} />;
  }
  return (
    <div className="flex items-center justify-center gap-3 py-2 px-6 text-center" style={{ background: bg, color: fg }}>
      <span className="text-sm font-medium">{c.message}</span>
      {c.linkLabel && <a href={c.linkHref} className="text-sm font-semibold underline ml-2">{c.linkLabel} →</a>}
    </div>
  );
}

function CountdownAnnouncement({ c, bg, fg }: { c: any; bg: string; fg: string }) {
  const target = new Date(c.countdownDate).getTime();
  const [remaining, setRemaining] = useState(() => Math.max(0, target - Date.now()));
  useEffect(() => {
    const interval = setInterval(() => setRemaining(Math.max(0, target - Date.now())), 1000);
    return () => clearInterval(interval);
  }, [target]);
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const mins = Math.floor((remaining % 3600000) / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  return (
    <div className="flex items-center justify-center gap-4 py-2 px-6 text-center" style={{ background: bg, color: fg }}>
      <span className="text-sm font-medium">{c.message}</span>
      <div className="flex gap-2 font-mono text-sm font-bold">
        <span>{String(days).padStart(2, "0")}d</span>
        <span>{String(hours).padStart(2, "0")}h</span>
        <span>{String(mins).padStart(2, "0")}m</span>
        <span>{String(secs).padStart(2, "0")}s</span>
      </div>
    </div>
  );
}

export function Problem({ config, theme }: { config: any; theme: Theme }) {
  const c = config;
  return (
    <section className="px-6 py-16 sm:py-24" style={{ background: theme.muted }}>
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          {c.eyebrow && <p className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: theme.accent }}>{c.eyebrow}</p>}
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: theme.foreground, fontFamily: theme.fontHeading }}>{c.title}</h2>
          {c.subtitle && <p className="mt-4 text-lg" style={{ color: theme.mutedFg }}>{c.subtitle}</p>}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {c.items?.map((item: any, i: number) => (
            <div key={i} className="rounded-xl border p-6" style={{ borderColor: theme.border, background: theme.background, borderRadius: theme.radius }}>
              <div className="mb-3 grid h-10 w-10 place-items-center rounded-full" style={{ background: "#fee2e2", color: "#dc2626" }}><AlertCircle className="h-5 w-5" /></div>
              <h3 className="mb-2 text-lg font-semibold" style={{ color: theme.foreground }}>{item.title}</h3>
              {item.description && <p className="text-sm" style={{ color: theme.mutedFg }}>{item.description}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Solution({ config, theme }: { config: any; theme: Theme }) {
  const c = config;
  return (
    <section className="px-6 py-16 sm:py-24" style={{ background: theme.background }}>
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          {c.eyebrow && <p className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: theme.accent }}>{c.eyebrow}</p>}
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: theme.foreground, fontFamily: theme.fontHeading }}>{c.title}</h2>
          {c.subtitle && <p className="mt-4 text-lg" style={{ color: theme.mutedFg }}>{c.subtitle}</p>}
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {c.items?.map((item: any, i: number) => (
            <div key={i} className="rounded-xl border p-6" style={{ borderColor: theme.border, background: theme.muted, borderRadius: theme.radius }}>
              <div className="mb-3 grid h-10 w-10 place-items-center rounded-full" style={{ background: "#d1fae5", color: "#059669" }}><Lightbulb className="h-5 w-5" /></div>
              <h3 className="mb-2 text-lg font-semibold" style={{ color: theme.foreground }}>{item.title}</h3>
              {item.description && <p className="text-sm" style={{ color: theme.mutedFg }}>{item.description}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function VideoSection({ config, theme }: { config: any; theme: Theme }) {
  const c = config;
  const [playing, setPlaying] = useState(false);
  const getEmbedUrl = (url: string) => {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    return url;
  };
  const inner = (
    <div className="overflow-hidden rounded-xl shadow-xl" style={{ borderRadius: theme.radius }}>
      <div className="relative aspect-video" style={{ background: theme.muted }}>
        {playing ? (
          <iframe src={getEmbedUrl(c.videoUrl)} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen title={c.title || "Video"} />
        ) : (
          <button type="button" onClick={() => setPlaying(true)} className="group h-full w-full" aria-label="Play video">
            {c.thumbnailUrl ? <img src={c.thumbnailUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center" style={{ background: theme.muted }}><Video className="h-16 w-16" style={{ color: theme.mutedFg }} /></div>}
            <div className="absolute inset-0 grid place-items-center bg-black/30 transition-opacity group-hover:bg-black/40">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-110">
                <svg className="h-7 w-7 ml-1" viewBox="0 0 24 24" fill="currentColor" style={{ color: theme.primary }}><path d="M8 5v14l11-7z" /></svg>
              </div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
  if (c.variant === "split-left") {
    return (
      <section className="px-6 py-16 sm:py-24" style={{ background: theme.background }}>
        <div className="mx-auto max-w-6xl grid items-center gap-12 md:grid-cols-2">
          <div>
            {c.title && <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: theme.foreground, fontFamily: theme.fontHeading }}>{c.title}</h2>}
            {c.subtitle && <p className="text-lg" style={{ color: theme.mutedFg }}>{c.subtitle}</p>}
          </div>
          {inner}
        </div>
      </section>
    );
  }
  if (c.variant === "full") {
    return (<section className="px-0 py-0" style={{ background: theme.background }}><div className="w-full">{inner}</div></section>);
  }
  return (
    <section className="px-6 py-16 sm:py-24" style={{ background: theme.background }}>
      <div className="mx-auto max-w-4xl">
        {(c.title || c.subtitle) && (<div className="mb-8 text-center">{c.title && <h2 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: theme.foreground, fontFamily: theme.fontHeading }}>{c.title}</h2>}{c.subtitle && <p className="text-lg" style={{ color: theme.mutedFg }}>{c.subtitle}</p>}</div>)}
        {inner}
      </div>
    </section>
  );
}

export function Comparison({ config, theme }: { config: any; theme: Theme }) {
  const c = config;
  return (
    <section className="px-6 py-16 sm:py-24" style={{ background: theme.muted }}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          {c.title && <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: theme.foreground, fontFamily: theme.fontHeading }}>{c.title}</h2>}
          {c.subtitle && <p className="mt-4 text-lg" style={{ color: theme.mutedFg }}>{c.subtitle}</p>}
        </div>
        <div className="overflow-hidden rounded-xl border" style={{ borderColor: theme.border, borderRadius: theme.radius }}>
          <table className="w-full">
            <thead><tr style={{ background: theme.background }}><th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: theme.foreground }}>Feature</th><th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: theme.accent }}>{c.youName || "You"}</th><th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: theme.mutedFg }}>{c.competitorName || "Others"}</th></tr></thead>
            <tbody>
              {c.features?.map((f: any, i: number) => (
                <tr key={i} style={{ borderTop: `1px solid ${theme.border}`, background: i % 2 === 0 ? theme.background : "transparent" }}>
                  <td className="px-4 py-3 text-sm" style={{ color: theme.foreground }}>{f.label}</td>
                  <td className="px-4 py-3 text-center text-sm font-semibold" style={{ color: theme.accent }}>{f.you}</td>
                  <td className="px-4 py-3 text-center text-sm" style={{ color: theme.mutedFg }}>{f.competitor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export function Guarantee({ config, theme }: { config: any; theme: Theme }) {
  const c = config;
  const IconComponent = resolveIcon(c.icon || "ShieldCheck") as React.ComponentType<{ className?: string }>;
  return (
    <section className="px-6 py-12" style={{ background: theme.muted }}>
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col items-center gap-6 rounded-2xl border-2 border-dashed p-8 text-center sm:flex-row sm:text-left" style={{ borderColor: theme.accent, borderRadius: theme.radius }}>
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full" style={{ background: theme.accent, color: theme.accentFg }}><IconComponent className="h-8 w-8" /></div>
          <div className="flex-1">
            <div className="mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ background: theme.accent, color: theme.accentFg }}>{c.badge}</div>
            <h3 className="text-xl font-bold" style={{ color: theme.foreground, fontFamily: theme.fontHeading }}>{c.title}</h3>
            {c.description && <p className="mt-2 text-sm" style={{ color: theme.mutedFg }}>{c.description}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ContactForm({ config, theme }: { config: any; theme: Theme }) {
  const c = config;
  const formEl = (
    <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
      <div><label className="mb-1 block text-xs font-medium" style={{ color: theme.foreground }}>{c.nameLabel || "Name"}</label><input type="text" className="w-full rounded-md border px-4 py-2.5 text-sm outline-none" style={{ borderColor: theme.border, background: theme.background, color: theme.foreground }} /></div>
      <div><label className="mb-1 block text-xs font-medium" style={{ color: theme.foreground }}>{c.emailLabel || "Email"}</label><input type="email" className="w-full rounded-md border px-4 py-2.5 text-sm outline-none" style={{ borderColor: theme.border, background: theme.background, color: theme.foreground }} /></div>
      <div><label className="mb-1 block text-xs font-medium" style={{ color: theme.foreground }}>{c.messageLabel || "Message"}</label><textarea rows={4} className="w-full rounded-md border px-4 py-2.5 text-sm outline-none" style={{ borderColor: theme.border, background: theme.background, color: theme.foreground }} /></div>
      <button type="submit" className="inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-105" style={{ background: theme.primary, color: theme.primaryFg }}>{c.buttonLabel || "Send"}</button>
    </form>
  );
  return (
    <section className="px-6 py-16 sm:py-24" style={{ background: theme.background }}>
      <div className="mx-auto max-w-2xl">
        {(c.title || c.subtitle) && (<div className="mb-8 text-center">{c.title && <h2 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: theme.foreground, fontFamily: theme.fontHeading }}>{c.title}</h2>}{c.subtitle && <p className="text-lg" style={{ color: theme.mutedFg }}>{c.subtitle}</p>}</div>)}
        <div className="rounded-xl border p-6 sm:p-8" style={{ borderColor: theme.border, borderRadius: theme.radius }}>{formEl}</div>
      </div>
    </section>
  );
}

export function Legal({ config, theme }: { config: any; theme: Theme }) {
  const c = config;
  const replacePlaceholders = (text: string) => {
    return text
      .replace(/\{\{company\}\}/g, c.companyName || "the Company")
      .replace(/\{\{email\}\}/g, c.contactEmail || "support@example.com")
      .replace(/\{\{date\}\}/g, c.lastUpdated || new Date().toISOString().split("T")[0]);
  };
  const paragraphs = (c.content || "").split("\n").filter(Boolean).map(replacePlaceholders);
  return (
    <section className="px-6 py-16 sm:py-24" style={{ background: theme.background }}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          {c.title && <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: theme.foreground, fontFamily: theme.fontHeading }}>{c.title}</h1>}
          {c.lastUpdated && <p className="text-sm" style={{ color: theme.mutedFg }}>Last updated: {c.lastUpdated}</p>}
        </div>
        <div className="space-y-4">
          {paragraphs.map((p: string, i: number) => (
            <p key={i} className="text-sm leading-relaxed" style={{ color: theme.foreground }}>{p}</p>
          ))}
        </div>
        {c.contactEmail && (
          <div className="mt-10 border-t pt-6" style={{ borderColor: theme.border }}>
            <p className="text-sm" style={{ color: theme.mutedFg }}>Questions? Email us at <a href={`mailto:${c.contactEmail}`} className="font-semibold underline" style={{ color: theme.accent }}>{c.contactEmail}</a></p>
          </div>
        )}
      </div>
    </section>
  );
}
