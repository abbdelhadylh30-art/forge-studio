/**
 * Forge Studio — Builder: All React section components in one file.
 * Each consumes its config + theme tokens and renders with inline styles.
 *
 * Mirrors the LandingForge v21 string renderer (src/lib/builder/sections/
 * renderer.ts): hero image carousel, 6 gallery styles, testimonial carousel,
 * pricing single-offer / billing-toggle, FAQ cards, problem tabs, cinematic
 * video, comparison ✓/✗ matrix, contact form extra fields.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, AlertCircle, Lightbulb, Video, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import type { ThemeTokens } from "@/lib/builder/sections/types";
import { resolveIcon } from "@/lib/builder/sections/theme-utils";
import { InlineText } from "./InlineText";

type Theme = ThemeTokens;

/* ─── Shared preview helpers ─────────────────────────────────────────── */

/** Keyframes used by the canvas previews (gallery ticker/stories/vertical,
 *  problem tab panels). Injected per-section so no other file needs edits. */
function PreviewKeyframes() {
  return (
    <style>{`
@keyframes lfGalleryTickerCanvas { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes lfStoryFillCanvas { from { width: 0; } to { width: 100%; } }
@keyframes lfFadeUpCanvas { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
.lf-canvas-ticker:hover .lf-canvas-ticker-track { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .lf-canvas-ticker-track { animation-duration: 120s; } }
`}</style>
  );
}

/** Round prev/next arrows + "n / N" counter (mirrors .lf-gnav in the export). */
function GalleryNav({ theme, counter, onPrev, onNext }: { theme: Theme; counter: string; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="mt-5 flex items-center justify-center gap-4">
      <button type="button" onClick={onPrev} aria-label="Previous" className="grid h-10 w-10 place-items-center rounded-full border transition-transform hover:scale-105" style={{ borderColor: theme.border, background: theme.background, color: theme.foreground }}>
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm tabular-nums" style={{ color: theme.mutedFg }}>{counter}</span>
      <button type="button" onClick={onNext} aria-label="Next" className="grid h-10 w-10 place-items-center rounded-full border transition-transform hover:scale-105" style={{ borderColor: theme.border, background: theme.background, color: theme.foreground }}>
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Measure a container and return the testimonial-carousel per-view count
 *  (3 on ≥1024px, 2 on ≥768px, 1 below) — same breakpoints as the export JS. */
function usePerView(ref: React.RefObject<HTMLDivElement | null>) {
  const [perView, setPerView] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = () => {
      const w = el.clientWidth;
      setPerView(w >= 1024 ? 3 : w >= 768 ? 2 : 1);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return perView;
}

/** Auto-advancing fade carousel for the hero media slot (mirrors .lf-hcarousel).
 *  carouselAutoplay seconds (0 = off, default 5); fade for all animations,
 *  zoom gets a subtle Ken-Burns scale. */
function HeroCarousel({ images, autoplay, anim, theme }: { images: { url: string; alt?: string }[]; autoplay: number; anim?: string; theme: Theme }) {
  const [idx, setIdx] = useState(0);
  const count = images.length;
  useEffect(() => {
    if (autoplay <= 0 || count < 2) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % count), autoplay * 1000);
    return () => clearInterval(t);
  }, [autoplay, count, idx]);
  const zoom = anim === "zoom";
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden shadow-2xl" style={{ borderRadius: theme.radius }}>
      {images.map((img, i) => (
        <img
          key={i}
          src={img.url}
          alt={img.alt ?? ""}
          className="absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-in-out"
          style={{ opacity: i === idx ? 1 : 0, pointerEvents: i === idx ? "auto" : "none", ...(zoom ? { transform: i === idx ? "scale(1)" : "scale(1.12)" } : {}) }}
        />
      ))}
      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIdx(i)}
            aria-label={`Go to slide ${i + 1}`}
            className="h-2 rounded-full transition-all duration-300"
            style={{ width: i === idx ? 24 : 8, background: i === idx ? "#fff" : "rgba(255,255,255,.5)" }}
          />
        ))}
      </div>
    </div>
  );
}

/** Testimonial card — shared by the grid and carousel styles. */
function TestimonialCard({ item, theme }: { item: any; theme: Theme }) {
  return (
    <figure className="flex h-full flex-col gap-4 rounded-xl border p-6" style={{ borderColor: theme.border, background: theme.background, borderRadius: theme.radius }}>
      <blockquote className="text-base leading-relaxed" style={{ color: theme.foreground }}>&ldquo;{item.quote}&rdquo;</blockquote>
      <figcaption className="mt-auto flex items-center gap-3">
        {item.avatar ? <img src={item.avatar} alt={item.name} className="h-10 w-10 rounded-full object-cover" /> : <div className="grid h-10 w-10 place-items-center rounded-full text-sm font-bold" style={{ background: theme.primary, color: theme.primaryFg }}>{item.name?.[0]?.toUpperCase()}</div>}
        <div>
          <div className="text-sm font-semibold" style={{ color: theme.foreground }}>{item.name}</div>
          {item.role && <div className="text-xs" style={{ color: theme.mutedFg }}>{item.role}</div>}
        </div>
      </figcaption>
    </figure>
  );
}

/* ─── Section components ─────────────────────────────────────────────── */

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
  // Media: carousel when 2+ images, single image when 1, imageUrl otherwise.
  const images: { url: string; alt?: string }[] = (c.images || []).filter((i: any) => i?.url);
  const bgImage = images.length ? images[0].url : c.imageUrl;
  const mediaSlot = images.length > 1
    ? <HeroCarousel images={images} autoplay={Number(c.carouselAutoplay ?? 5)} anim={c.carouselAnim} theme={theme} />
    : images.length === 1
      ? <img src={images[0].url} alt={images[0].alt ?? ""} className="w-full rounded-xl shadow-xl" style={{ borderRadius: theme.radius }} />
      : c.imageUrl
        ? <img src={c.imageUrl} alt="" className="w-full rounded-xl shadow-xl" style={{ borderRadius: theme.radius }} />
        : <div className="grid aspect-video w-full place-items-center rounded-xl" style={{ background: theme.muted, borderRadius: theme.radius }}><span className="text-sm" style={{ color: theme.mutedFg }}>Image placeholder</span></div>;
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
      <section className="relative grid min-h-screen place-items-center px-6 py-24" style={{ background: bgImage ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${bgImage}) center/cover` : theme.background }}>
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex flex-col items-center gap-5">
            {c.eyebrow && <InlineText fieldKey="eyebrow" value={c.eyebrow} as="span" className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }} placeholder="Eyebrow…" />}
            <InlineText fieldKey="headline" value={c.headline ?? ""} as="h1" className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl" style={{ color: bgImage ? "#fff" : theme.foreground, fontFamily: theme.fontHeading }} placeholder="Your headline…" />
            <InlineText fieldKey="subhead" value={c.subhead ?? ""} as="p" multiline className="max-w-2xl text-base sm:text-lg" style={{ color: bgImage ? "rgba(255,255,255,0.85)" : theme.mutedFg }} placeholder="Your subhead…" />
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
            {mediaSlot}
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
  const style = c.style || "grid";
  const cols = Number(c.columns ?? 3);
  const autoplay = Number(c.autoplay ?? 5);
  const images: { url: string; caption?: string }[] = (c.images || []).filter((i: any) => i?.url);
  const count = images.length;
  const [expandedIdx, setExpandedIdx] = useState(0); // accordion
  const [slideIdx, setSlideIdx] = useState(0); // stories + vertical
  const slide = images[slideIdx];

  // Stories / vertical auto-advance (autoplay seconds; 0 = off, default 5).
  useEffect(() => {
    if ((style !== "stories" && style !== "vertical") || autoplay <= 0 || count < 2) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setSlideIdx((i) => (i + 1) % count), autoplay * 1000);
    return () => clearInterval(t);
  }, [style, autoplay, count, slideIdx]);

  const title = c.title ? <h2 className="mb-10 text-center text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: theme.foreground, fontFamily: theme.fontHeading }}>{c.title}</h2> : null;
  const frame = (im: { url: string; caption?: string }) => (
    <div className="relative aspect-[4/3] overflow-hidden" style={{ background: theme.muted }}>
      <img src={im.url} alt={im.caption ?? ""} className="h-full w-full object-cover" />
    </div>
  );

  let body: React.ReactNode = null;
  if (style === "horizontal") {
    body = (
      <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}>
        {images.map((im, i) => (
          <figure key={i} className="overflow-hidden rounded-xl" style={{ borderRadius: theme.radius, flex: "0 0 min(420px, 80vw)", scrollSnapAlign: "center" }}>
            {frame(im)}
            {im.caption && <figcaption className="mt-2 text-sm" style={{ color: theme.mutedFg }}>{im.caption}</figcaption>}
          </figure>
        ))}
      </div>
    );
  } else if (style === "accordion") {
    body = (
      <div className="flex h-[420px] gap-2">
        {images.map((im, i) => {
          const expanded = expandedIdx === i;
          return (
            <div
              key={i}
              role="button"
              tabIndex={0}
              aria-expanded={expanded}
              aria-label={im.caption || `Image ${i + 1}`}
              onClick={() => setExpandedIdx(i)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedIdx(i); } }}
              className="relative min-w-16 cursor-pointer overflow-hidden"
              style={{ flex: expanded ? 5 : 1, borderRadius: theme.radius, transition: "flex .55s cubic-bezier(.4,0,.2,1)" }}
            >
              <img src={im.url} alt={im.caption ?? ""} className="absolute inset-0 h-full w-full object-cover" style={{ transition: "transform .55s ease" }} />
              <div className="absolute inset-x-0 bottom-0 p-4 text-sm text-white" style={{ background: "linear-gradient(to top, rgba(0,0,0,.75), transparent)", opacity: expanded ? 1 : 0, transition: "opacity .4s ease .1s" }}>{im.caption ?? ""}</div>
            </div>
          );
        })}
      </div>
    );
  } else if (style === "ticker") {
    body = (
      <div className="lf-canvas-ticker relative overflow-hidden">
        <div className="lf-canvas-ticker-track flex w-max gap-4" style={{ animation: "lfGalleryTickerCanvas 30s linear infinite" }}>
          {[...images, ...images].map((im, i) => (
            <figure key={i} aria-hidden={i >= count} className="overflow-hidden rounded-xl" style={{ borderRadius: theme.radius, width: 300, flex: "0 0 auto" }}>
              {frame(im)}
            </figure>
          ))}
        </div>
      </div>
    );
  } else if (style === "stories") {
    body = (
      <div>
        <div className="relative mx-auto max-w-[420px] overflow-hidden" style={{ borderRadius: theme.radius }}>
          <div className="absolute left-3 right-3 top-3 z-10 flex gap-1">
            {images.map((_, i) => (
              <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,.35)" }}>
                <span className="block h-full" style={{ width: i < slideIdx ? "100%" : 0, background: "#fff", ...(i === slideIdx && autoplay > 0 ? { animation: `lfStoryFillCanvas ${autoplay}s linear forwards` } : {}) }} />
              </div>
            ))}
          </div>
          {slide && (
            <div key={slideIdx}>
              <img src={slide.url} alt={slide.caption ?? ""} className="w-full object-cover" style={{ aspectRatio: "4 / 5" }} />
              {slide.caption && <div className="absolute inset-x-0 bottom-0 p-6 pb-3.5 text-[15px] text-white" style={{ background: "linear-gradient(to top, rgba(0,0,0,.8), transparent)" }}>{slide.caption}</div>}
            </div>
          )}
        </div>
        {count >= 2 && <GalleryNav theme={theme} counter={`${slideIdx + 1} / ${count}`} onPrev={() => setSlideIdx((i) => (i - 1 + count) % count)} onNext={() => setSlideIdx((i) => (i + 1) % count)} />}
      </div>
    );
  } else if (style === "vertical") {
    body = (
      <div>
        <div className="mx-auto max-w-[640px]">
          {slide && (
            <figure key={slideIdx} className="overflow-hidden rounded-xl" style={{ borderRadius: theme.radius, animation: "lfFadeUpCanvas .6s ease" }}>
              {frame(slide)}
              {slide.caption && <figcaption className="mt-2 text-sm" style={{ color: theme.mutedFg }}>{slide.caption}</figcaption>}
            </figure>
          )}
        </div>
        {count >= 2 && <GalleryNav theme={theme} counter={`${slideIdx + 1} / ${count}`} onPrev={() => setSlideIdx((i) => (i - 1 + count) % count)} onNext={() => setSlideIdx((i) => (i + 1) % count)} />}
      </div>
    );
  } else {
    body = (
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${cols === 4 ? "220" : "260"}px, 1fr))` }}>
        {images.map((im, i) => (
          <figure key={i} className="overflow-hidden rounded-xl" style={{ borderRadius: theme.radius }}>
            {frame(im)}
            {im.caption && <figcaption className="mt-2 text-sm" style={{ color: theme.mutedFg }}>{im.caption}</figcaption>}
          </figure>
        ))}
      </div>
    );
  }

  return (
    <section id="work" className="px-6 py-16 sm:py-24" style={{ background: theme.background }}>
      <PreviewKeyframes />
      <div className="mx-auto max-w-6xl">
        {title}
        {body}
      </div>
    </section>
  );
}

export function Testimonials({ config, theme }: { config: any; theme: Theme }) {
  const c = config;
  const style = c.style || "grid";
  const autoplay = Number(c.autoplay ?? 5);
  const items: any[] = c.items || [];
  const count = items.length;
  const viewportRef = useRef<HTMLDivElement>(null);
  const perView = usePerView(viewportRef);
  const [idx, setIdx] = useState(0);
  const maxIdx = Math.max(0, count - perView);
  const cur = Math.min(idx, maxIdx);

  // Carousel auto-advance (autoplay seconds; 0 = off, default 5). Restarting on
  // idx change mirrors the export's "restart timer on interaction" behaviour.
  useEffect(() => {
    if (style !== "carousel" || autoplay <= 0 || count < 2) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setIdx((i) => (i >= Math.max(0, count - perView) ? 0 : i + 1)), autoplay * 1000);
    return () => clearInterval(t);
  }, [style, autoplay, count, perView, idx]);

  const title = c.title ? <h2 className="mb-12 text-center text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: theme.foreground, fontFamily: theme.fontHeading }}>{c.title}</h2> : null;

  if (style === "carousel" && count > 0) {
    return (
      <section id="testimonials" className="px-6 py-16 sm:py-24" style={{ background: theme.muted }}>
        <div className="mx-auto max-w-6xl">
          {title}
          <div ref={viewportRef} className="overflow-hidden">
            <div className="flex" style={{ transform: `translateX(-${cur * (100 / perView)}%)`, transition: "transform .6s cubic-bezier(.4,0,.2,1)" }}>
              {items.map((t, i) => (
                <div key={i} className="px-1" style={{ flex: `0 0 ${100 / perView}%`, boxSizing: "border-box" }}>
                  <TestimonialCard item={t} theme={theme} />
                </div>
              ))}
            </div>
          </div>
          {count >= 2 && <GalleryNav theme={theme} counter={`${Math.min(cur + 1, count)} / ${count}`} onPrev={() => setIdx(Math.max(0, cur - 1))} onNext={() => setIdx(cur >= maxIdx ? 0 : cur + 1)} />}
        </div>
      </section>
    );
  }
  return (
    <section id="testimonials" className="px-6 py-16 sm:py-24" style={{ background: theme.muted }}>
      <div className="mx-auto max-w-6xl">
        {title}
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((t, i) => <TestimonialCard key={i} item={t} theme={theme} />)}
        </div>
      </div>
    </section>
  );
}

export function Pricing({ config, theme }: { config: any; theme: Theme }) {
  const c = config;
  const style = c.style || "tiers";
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const head = (
    <div className="mx-auto mb-12 max-w-2xl text-center">
      {c.title && <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: theme.foreground, fontFamily: theme.fontHeading }}>{c.title}</h2>}
      {c.subtitle && <p className="mt-4 text-lg" style={{ color: theme.mutedFg }}>{c.subtitle}</p>}
    </div>
  );
  const renderTierCard = (tier: any, price: string, period: string, key?: string | number) => {
    const features = (tier.features ?? "").split("\n").filter(Boolean);
    const highlight = tier.highlighted;
    return (
      <div key={key} className="relative flex flex-col rounded-xl border p-6 shadow-sm" style={{ borderColor: highlight ? theme.accent : theme.border, background: theme.background, borderRadius: theme.radius, boxShadow: highlight ? `0 10px 30px -10px ${theme.accent}40` : undefined, transform: highlight ? "scale(1.02)" : undefined }}>
        {highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider" style={{ background: theme.accent, color: theme.accentFg }}>Most popular</div>}
        <h3 className="text-lg font-semibold" style={{ color: theme.foreground }}>{tier.name}</h3>
        {tier.description && <p className="mt-1 text-sm" style={{ color: theme.mutedFg }}>{tier.description}</p>}
        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-4xl font-bold tracking-tight" style={{ color: theme.foreground }}>{price}</span>
          <span className="text-sm" style={{ color: theme.mutedFg }}>{period}</span>
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
  };

  if (style === "single") {
    const tier = (c.tiers || [])[0] || {};
    const features = (tier.features ?? "").split("\n").filter(Boolean);
    return (
      <section id="pricing" className="px-6 py-16 sm:py-24" style={{ background: theme.background }}>
        <div className="mx-auto max-w-6xl">
          {head}
          <div className="relative mx-auto max-w-[28rem] border px-10 py-12 text-center" style={{ borderColor: theme.border, background: theme.background, borderRadius: `calc(${theme.radius} + 4px)`, boxShadow: "0 4px 12px rgba(0,0,0,.08), 0 24px 64px rgba(0,0,0,.08)" }}>
            {c.urgencyBadge && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white" style={{ background: "linear-gradient(135deg, #ef4444, #f97316)", boxShadow: "0 4px 20px rgba(239,68,68,.35)" }}>
                {c.urgencyBadge}
              </div>
            )}
            {tier.name && <h3 className="text-lg font-semibold" style={{ color: theme.foreground }}>{tier.name}</h3>}
            {c.originalPrice && <span className="mb-1 block text-base" style={{ color: theme.mutedFg, textDecoration: "line-through" }}>{c.currency}{c.originalPrice}</span>}
            <div className="mb-4 mt-2 flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold tracking-tight" style={{ color: theme.foreground, fontFamily: theme.fontHeading }}>{c.currency}{tier.price}</span>
              <span className="text-sm" style={{ color: theme.mutedFg }}>{c.period}</span>
            </div>
            {tier.description && <p className="text-sm" style={{ color: theme.mutedFg }}>{tier.description}</p>}
            <ul className="mx-auto mt-6 flex max-w-sm flex-col gap-2.5 text-left">
              {features.map((f: string, j: number) => (
                <li key={j} className="flex items-start gap-2 text-sm" style={{ color: theme.foreground }}>
                  <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: theme.accent }} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            {tier.ctaLabel && (
              <a href={tier.ctaHref} className="mt-8 inline-flex w-full items-center justify-center rounded-md px-5 py-3 text-base font-semibold transition-transform hover:scale-105" style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`, color: theme.accentFg }}>
                {tier.ctaLabel}
              </a>
            )}
            {c.guaranteeNote && <p className="mt-4 text-xs" style={{ color: theme.mutedFg }}>{c.guaranteeNote}</p>}
          </div>
        </div>
      </section>
    );
  }

  if (style === "toggle") {
    const monthlyLabel = c.toggleMonthlyLabel || "Monthly";
    const yearlyLabel = c.toggleYearlyLabel || "Yearly";
    const pillBtn = (active: boolean): React.CSSProperties => active
      ? { background: theme.background, color: theme.foreground, boxShadow: "0 2px 8px rgba(0,0,0,.08)" }
      : { color: theme.mutedFg };
    return (
      <section id="pricing" className="px-6 py-16 sm:py-24" style={{ background: theme.background }}>
        <div className="mx-auto max-w-6xl">
          {head}
          <div className="mb-10 text-center">
            <div className="inline-flex gap-1 rounded-full border p-1.5" style={{ borderColor: theme.border, background: theme.muted }}>
              <button type="button" onClick={() => setBilling("monthly")} aria-pressed={billing === "monthly"} className="rounded-full px-6 py-2 text-sm font-semibold transition-all" style={pillBtn(billing === "monthly")}>
                {monthlyLabel}
              </button>
              <button type="button" onClick={() => setBilling("yearly")} aria-pressed={billing === "yearly"} className="rounded-full px-6 py-2 text-sm font-semibold transition-all" style={pillBtn(billing === "yearly")}>
                {yearlyLabel}
                {c.saveBadge && <span className="ml-2 rounded-full px-2 py-0.5 align-middle text-[10px] font-bold" style={{ background: "rgba(16,185,129,.12)", color: "#10b981" }}>{c.saveBadge}</span>}
              </button>
            </div>
          </div>
          <div className={`grid gap-6 ${c.tiers?.length === 1 ? "mx-auto max-w-md" : "md:grid-cols-2 lg:grid-cols-3"}`}>
            {c.tiers?.map((tier: any, i: number) => renderTierCard(
              tier,
              `${c.currency}${billing === "yearly" ? (tier.yearlyPrice || tier.price) : tier.price}`,
              billing === "yearly" ? "/yr" : "/mo",
              i,
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className="px-6 py-16 sm:py-24" style={{ background: theme.background }}>
      <div className="mx-auto max-w-6xl">
        {head}
        <div className={`grid gap-6 ${c.tiers?.length === 1 ? "mx-auto max-w-md" : "md:grid-cols-2 lg:grid-cols-3"}`}>
          {c.tiers?.map((tier: any, i: number) => renderTierCard(tier, `${c.currency}${tier.price}`, c.period, i))}
        </div>
      </div>
    </section>
  );
}

export function Faq({ config, theme }: { config: any; theme: Theme }) {
  const c = config;
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const titleBlock = (
    <div className="mb-10 text-center">
      {c.title && <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: theme.foreground, fontFamily: theme.fontHeading }}>{c.title}</h2>}
      {c.subtitle && <p className="mt-4 text-lg" style={{ color: theme.mutedFg }}>{c.subtitle}</p>}
    </div>
  );
  if (c.style === "cards") {
    return (
      <section id="faq" className="px-6 py-16 sm:py-24" style={{ background: theme.background }}>
        <div className="mx-auto max-w-6xl">
          {titleBlock}
          <div className="grid gap-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            {c.items?.map((item: any, i: number) => (
              <div key={i} className="rounded-xl border p-6" style={{ borderColor: theme.border, background: theme.background, borderRadius: theme.radius }}>
                <h3 className="mb-2 text-base font-semibold" style={{ color: theme.foreground }}>{item.question}</h3>
                <p className="text-sm leading-relaxed" style={{ color: theme.mutedFg }}>{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  return (
    <section id="faq" className="px-6 py-16 sm:py-24" style={{ background: theme.background }}>
      <div className="mx-auto max-w-3xl">
        {titleBlock}
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
  const [activeTab, setActiveTab] = useState(0);
  const head = (
    <div className="mb-12 text-center">
      {c.eyebrow && <p className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: theme.accent }}>{c.eyebrow}</p>}
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: theme.foreground, fontFamily: theme.fontHeading }}>{c.title}</h2>
      {c.subtitle && <p className="mt-4 text-lg" style={{ color: theme.mutedFg }}>{c.subtitle}</p>}
    </div>
  );
  if (c.style === "tabs") {
    const items: any[] = c.items || [];
    const active = items[activeTab] || items[0];
    return (
      <section className="px-6 py-16 sm:py-24" style={{ background: theme.muted }}>
        <PreviewKeyframes />
        <div className="mx-auto max-w-4xl">
          {head}
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {items.map((item: any, i: number) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveTab(i)}
                className="rounded-full border px-5 py-2.5 text-sm font-semibold transition-all"
                style={activeTab === i
                  ? { background: theme.primary, borderColor: theme.primary, color: theme.primaryFg }
                  : { background: theme.background, borderColor: theme.border, color: theme.mutedFg }}
              >
                {item.title}
              </button>
            ))}
          </div>
          {active && (
            <div key={activeTab} className="mx-auto max-w-2xl rounded-xl border p-8 text-center" style={{ borderColor: theme.border, background: theme.background, borderRadius: theme.radius, animation: "lfFadeUpCanvas .45s ease" }}>
              <h3 className="mb-3 text-2xl font-semibold" style={{ color: theme.foreground, fontFamily: theme.fontHeading }}>{active.title}</h3>
              {active.description && <p className="text-base leading-relaxed" style={{ color: theme.mutedFg }}>{active.description}</p>}
            </div>
          )}
        </div>
      </section>
    );
  }
  return (
    <section className="px-6 py-16 sm:py-24" style={{ background: theme.muted }}>
      <div className="mx-auto max-w-4xl">
        {head}
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
  // Cinematic: full-bleed dark section — thumbnail (or dark placeholder) under
  // a gradient veil with centered white copy (mirrors .lf-video-cinematic).
  if (c.variant === "cinematic") {
    return (
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden" style={{ background: "#000" }}>
        {c.thumbnailUrl ? (
          <img src={c.thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
        ) : (
          <Video aria-hidden className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.12)" }} />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.65), rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.75))" }} />
        <div className="relative z-10 mx-auto max-w-3xl px-6 py-20 text-center">
          {c.title && <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl" style={{ color: "#fff", textShadow: "0 4px 30px rgba(0,0,0,0.5)", fontFamily: theme.fontHeading }}>{c.title}</h2>}
          {c.subtitle && <p className="text-base sm:text-xl" style={{ color: "rgba(255,255,255,0.85)" }}>{c.subtitle}</p>}
        </div>
      </section>
    );
  }
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
  const head = (
    <div>
      {c.title && <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: theme.foreground, fontFamily: theme.fontHeading }}>{c.title}</h2>}
      {c.subtitle && <p className="text-lg" style={{ color: theme.mutedFg }}>{c.subtitle}</p>}
    </div>
  );
  if (c.variant === "split-left" || c.variant === "split-right") {
    return (
      <section className="px-6 py-16 sm:py-24" style={{ background: theme.background }}>
        <div className={`mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2 ${c.variant === "split-right" ? "md:[&>*:first-child]:order-2" : ""}`}>
          {head}
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
  // "yes"/"✓"/"true" → green check, "no"/"—"/"-"/"false"/"" → red cross;
  // anything else renders as text (mirrors .lf-cmp-yes / .lf-cmp-no).
  const renderCell = (v: any, kind: "you" | "them") => {
    const s = String(v ?? "").trim().toLowerCase();
    if (s === "yes" || s === "✓" || s === "true") {
      return <span className="inline-grid h-[22px] w-[22px] place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-600" role="img" aria-label="Yes">✓</span>;
    }
    if (s === "no" || s === "—" || s === "-" || s === "false" || s === "") {
      return <span className="inline-grid h-[22px] w-[22px] place-items-center rounded-full bg-red-100 text-sm font-bold text-red-600" role="img" aria-label="No">✗</span>;
    }
    return <span style={{ color: kind === "you" ? theme.accent : theme.mutedFg }}>{v}</span>;
  };
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
                  <td className="px-4 py-3 text-center text-sm font-semibold">{renderCell(f.you, "you")}</td>
                  <td className="px-4 py-3 text-center text-sm">{renderCell(f.competitor, "them")}</td>
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
  const inputStyle = { borderColor: theme.border, background: theme.background, color: theme.foreground };
  const field = (label: string, type: string = "text") => (
    <div>
      <label className="mb-1 block text-xs font-medium" style={{ color: theme.foreground }}>{label}</label>
      <input type={type} className="w-full rounded-md border px-4 py-2.5 text-sm outline-none" style={inputStyle} />
    </div>
  );
  const formEl = (
    <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
      {field(c.nameLabel || "Name")}
      {field(c.emailLabel || "Email", "email")}
      {c.showPhone && field(c.phoneLabel || "Phone", "tel")}
      {c.showCompany && field(c.companyLabel || "Company")}
      <div>
        <label className="mb-1 block text-xs font-medium" style={{ color: theme.foreground }}>{c.messageLabel || "Message"}</label>
        <textarea rows={4} className="w-full rounded-md border px-4 py-2.5 text-sm outline-none" style={inputStyle} />
      </div>
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
          {paragraphs.map((p, i) => (
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
