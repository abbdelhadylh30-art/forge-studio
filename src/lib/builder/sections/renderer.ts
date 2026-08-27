/**
 * Forge Studio — Builder: HTML Renderer
 * Server-side pure-string templating. Produces clean HTML that can be
 * exported as a standalone file OR sent to the auditor for scoring.
 *
 * Uses the Tailwind v4 browser bundle (@tailwindcss/browser) to generate
 * all utility classes at runtime. This ensures the exported HTML looks
 * pixel-identical to the editor preview — every Tailwind class the
 * components use is available, no hand-maintained CSS subset to drift.
 *
 * The theme tokens (--lf-* variables) are still inlined so sections that
 * reference them via inline styles keep working.
 */

import type { PageData, SectionInstance, SiteData, ThemeTokens } from "./types";
import { renderIconSvg } from "./icon-paths";

export function renderSiteHTML(site: SiteData, page: PageData): string {
  const css = extractCss(site.themeTokens);
  const js = extractJs();
  // Filter out hidden sections — they should not appear in exported HTML.
  const visibleSections = page.sections.filter((s) => !(s.config as Record<string, unknown>)?.__hidden);
  // Build body with wave dividers between sections that have different backgrounds
  const bodyParts: string[] = [];
  for (let i = 0; i < visibleSections.length; i++) {
    bodyParts.push(renderSection(visibleSections[i], site.themeTokens));
    // Add wave divider between sections if the next section exists
    if (i < visibleSections.length - 1) {
      const nextBg = getSectionBackground(visibleSections[i + 1], site.themeTokens);
      const curBg = getSectionBackground(visibleSections[i], site.themeTokens);
      if (nextBg !== curBg) {
        bodyParts.push(renderWaveDivider(nextBg));
      }
    }
  }
  const body = bodyParts.join("\n");
  const title = page.seo?.title || `${site.name} — ${page.name}`;
  const description = page.seo?.description || site.description || "";
  const ogImage = page.seo?.ogImage || "";
  const og = [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}" />` : "",
    `<meta name="twitter:card" content="${ogImage ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    ogImage ? `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />` : "",
  ].filter(Boolean).join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<meta name="theme-color" content="${site.themeTokens.primary}" />
<meta name="generator" content="Forge Studio" />
${og}
<!-- Google Fonts — matches the fonts available in the editor -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@400;700;900&family=Noto+Sans+Arabic:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
<!-- Tailwind v4 browser bundle — scans the DOM and generates all utility classes used -->
<script src="https://unpkg.com/@tailwindcss/browser@4"></script>
<!-- Forge Studio theme tokens + premium styles -->
<style>\n${css}\n</style>
</head>
<body class="antialiased">
<!-- Ambient background blobs — subtle floating gradients for depth -->
<div class="lf-ambient">
  <div class="lf-blob lf-blob-1"></div>
  <div class="lf-blob lf-blob-2"></div>
  <div class="lf-blob lf-blob-3"></div>
</div>
<!-- Noise texture overlay — prevents "digital smoothness", adds tactility -->
<div class="lf-noise"></div>
${body}
<button type="button" class="lf-theme-toggle" aria-label="Toggle dark mode">🌙 <span>Dark</span></button>
<!-- Forge Studio scroll animations + interactions -->
<script>${js}</script>
</body>
</html>`;
}

function extractCss(t: ThemeTokens): string {
  // Theme tokens + premium base styles.
  // No *{margin:0;padding:0} — Tailwind v4 preflight handles resets, and
  // unlayered CSS would override Tailwind's @layer utilities.
  return `:root{--lf-primary:${t.primary};--lf-primary-fg:${t.primaryFg};--lf-accent:${t.accent};--lf-accent-fg:${t.accentFg};--lf-bg:${t.background};--lf-fg:${t.foreground};--lf-muted:${t.muted};--lf-muted-fg:${t.mutedFg};--lf-border:${t.border};--lf-font:${t.font};--lf-font-heading:${t.fontHeading};--lf-radius:${t.radius}}
html{scroll-behavior:smooth}
body{font-family:var(--lf-font);color:var(--lf-fg);background:var(--lf-bg);line-height:1.6;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;overflow-x:hidden}
a{color:inherit;text-decoration:none}
img{max-width:100%;height:auto;display:block}
button{font:inherit;cursor:pointer;border:none;background:none}
.lf-section{width:100%}
h1,h2,h3,h4{font-family:var(--lf-font-heading);letter-spacing:-0.02em}
h1{letter-spacing:-0.03em}
summary::-webkit-details-marker{display:none}
summary{list-style:none}

/* ─── Premium typography ─── */
.lf-eyebrow{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:0.75rem;font-weight:500;text-transform:uppercase;letter-spacing:0.1em}

/* ─── Ambient background blobs ─── */
.lf-ambient{position:fixed;inset:0;pointer-events:none;z-index:-1;overflow:hidden}
.lf-blob{position:absolute;border-radius:50%;filter:blur(80px);opacity:0.15;animation:lfFloat 20s ease-in-out infinite}
.lf-blob-1{top:-10%;left:10%;width:500px;height:500px;background:var(--lf-accent);animation-delay:0s}
.lf-blob-2{top:20%;right:-5%;width:400px;height:400px;background:var(--lf-primary);animation-delay:-7s}
.lf-blob-3{bottom:10%;left:30%;width:450px;height:450px;background:var(--lf-accent);animation-delay:-14s}
@keyframes lfFloat{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(30px,-30px) scale(1.05)}66%{transform:translate(-20px,20px) scale(0.95)}}
@media(prefers-reduced-motion:reduce){.lf-blob{animation:none}}

/* ─── Glassmorphism navbar ─── */
header{backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);background:color-mix(in srgb,var(--lf-bg) 80%,transparent);transition:box-shadow .3s ease,background .3s ease}
header.lf-scrolled{box-shadow:0 1px 3px rgba(0,0,0,0.05),0 10px 30px -10px rgba(0,0,0,0.1);background:color-mix(in srgb,var(--lf-bg) 95%,transparent)}

/* ─── Premium buttons ─── */
.lf-btn{position:relative;overflow:hidden;transition:transform .2s cubic-bezier(0.4,0,0.2,1),box-shadow .2s ease}
.lf-btn-primary{background:linear-gradient(135deg,var(--lf-primary) 0%,var(--lf-accent) 100%);box-shadow:0 4px 14px color-mix(in srgb,var(--lf-accent) 40%,transparent),inset 0 1px 0 rgba(255,255,255,0.2)}
.lf-btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 25px color-mix(in srgb,var(--lf-accent) 50%,transparent),inset 0 1px 0 rgba(255,255,255,0.3)}
.lf-btn-primary:active{transform:translateY(0)}
.lf-btn-secondary{background:transparent;border:1px solid var(--lf-border);transition:border-color .2s ease,transform .2s ease}
.lf-btn-secondary:hover{border-color:var(--lf-accent);transform:translateY(-2px)}

/* ─── Premium cards ─── */
.lf-card{background:color-mix(in srgb,var(--lf-bg) 80%,transparent);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid color-mix(in srgb,var(--lf-border) 50%,transparent);transition:transform .3s cubic-bezier(0.4,0,0.2,1),box-shadow .3s ease}
.lf-card:hover{transform:translateY(-4px);box-shadow:0 20px 40px -12px rgba(0,0,0,0.12),0 8px 16px -4px rgba(0,0,0,0.06)}

/* ─── Hero image mouse-tracking 3D tilt (see also below) ─── */

/* ─── Scroll entrance animations ─── */
.lf-reveal{opacity:0;transform:translateY(24px);transition:opacity .6s cubic-bezier(0.4,0,0.2,1),transform .6s cubic-bezier(0.4,0,0.2,1)}
.lf-reveal.lf-visible{opacity:1;transform:translateY(0)}
.lf-reveal-stagger>*{opacity:0;transform:translateY(20px);transition:opacity .5s ease,transform .5s ease}
.lf-reveal-stagger.lf-visible>*{opacity:1;transform:translateY(0)}
.lf-reveal-stagger.lf-visible>*:nth-child(1){transition-delay:0ms}
.lf-reveal-stagger.lf-visible>*:nth-child(2){transition-delay:80ms}
.lf-reveal-stagger.lf-visible>*:nth-child(3){transition-delay:160ms}
.lf-reveal-stagger.lf-visible>*:nth-child(4){transition-delay:240ms}
.lf-reveal-stagger.lf-visible>*:nth-child(5){transition-delay:320ms}
.lf-reveal-stagger.lf-visible>*:nth-child(6){transition-delay:400ms}
@media(prefers-reduced-motion:reduce){.lf-reveal,.lf-reveal-stagger>*{opacity:1;transform:none;transition:none}}

/* ─── Pricing highlighted card glow ─── */
.lf-pricing-highlight{position:relative}
.lf-pricing-highlight::before{content:'';position:absolute;inset:-2px;border-radius:calc(var(--lf-radius) + 2px);background:linear-gradient(135deg,var(--lf-accent),var(--lf-primary));opacity:0.3;filter:blur(8px);z-index:-1}

/* ─── Smooth link underline ─── */
.lf-link{position:relative}
.lf-link::after{content:'';position:absolute;bottom:-2px;left:0;width:0;height:1px;background:var(--lf-accent);transition:width .3s ease}
.lf-link:hover::after{width:100%}

/* ─── Noise texture overlay ─── */
.lf-noise{position:fixed;inset:0;pointer-events:none;z-index:9998;opacity:0.025;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}

/* ─── Section wave dividers ─── */
.lf-divider{position:relative;height:60px;overflow:hidden}
.lf-divider svg{position:absolute;bottom:0;left:0;width:100%;height:100%}
.lf-divider-top{margin-bottom:-1px}
.lf-divider-bottom{margin-top:-1px;transform:rotate(180deg)}

/* ─── Hero image mouse-tracking 3D tilt ─── */
.lf-hero-tilt{perspective:1000px}
.lf-hero-img{transform-style:preserve-3d;transition:transform .4s cubic-bezier(0.4,0,0.2,1);will-change:transform}

/* ─── Stat count-up ─── */
.lf-stat-value{font-variant-numeric:tabular-nums}

/* ══════════════════════════════════════════════════════════════════
   LandingForge v21 engine — carousels, galleries, toggles, tabs,
   countdown, mobile menu, forms, toast, dark-mode export.
   Ported from Landing Page Editor PRO v21.
   ══════════════════════════════════════════════════════════════════ */

/* ─── Hero carousel ─── */
.lf-hcarousel{position:relative;overflow:hidden;border-radius:var(--lf-radius)}
.lf-hcarousel-slide{position:absolute;inset:0;opacity:0;transition:opacity .7s ease,transform .7s ease;pointer-events:none}
.lf-hcarousel-slide.lf-active{opacity:1;pointer-events:auto}
.lf-hcarousel-slide img{width:100%;height:100%;object-fit:cover}
.lf-hcarousel.lf-anim-zoom .lf-hcarousel-slide{transform:scale(1.12)}
.lf-hcarousel.lf-anim-zoom .lf-hcarousel-slide.lf-active{transform:scale(1)}
.lf-hcarousel.lf-anim-flip .lf-hcarousel-slide{transform:rotateY(90deg)}
.lf-hcarousel.lf-anim-flip .lf-hcarousel-slide.lf-active{transform:rotateY(0)}
.lf-hcarousel.lf-anim-cube .lf-hcarousel-slide{transform:rotateX(90deg) scale(.85);transform-origin:center bottom}
.lf-hcarousel.lf-anim-cube .lf-hcarousel-slide.lf-active{transform:rotateX(0) scale(1)}
.lf-hcarousel-slide{aspect-ratio:16/10}
.lf-hdots{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:2}
.lf-hdot{width:8px;height:8px;border-radius:9999px;background:rgba(255,255,255,.5);cursor:pointer;transition:all .3s ease;border:none;padding:0}
.lf-hdot.lf-active{background:#fff;width:24px}
@media(prefers-reduced-motion:reduce){.lf-hcarousel-slide{transition:none;transform:none}}

/* ─── Gallery: horizontal scroll-snap ─── */
.lf-gallery-h{display:flex;gap:1rem;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:8px;-webkit-overflow-scrolling:touch}
.lf-gallery-h>*{flex:0 0 min(420px,80vw);scroll-snap-align:center}
.lf-gallery-h::-webkit-scrollbar{height:6px}
.lf-gallery-h::-webkit-scrollbar-thumb{background:color-mix(in srgb,var(--lf-muted-fg) 40%,transparent);border-radius:3px}
/* ─── Gallery: accordion ─── */
.lf-gallery-acc{display:flex;gap:.5rem;height:420px}
.lf-gallery-acc-item{flex:1;position:relative;overflow:hidden;border-radius:var(--lf-radius);cursor:pointer;transition:flex .55s cubic-bezier(.4,0,.2,1);min-width:64px}
.lf-gallery-acc-item img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .55s ease}
.lf-gallery-acc-item figcaption{position:absolute;bottom:0;left:0;right:0;padding:1rem;color:#fff;background:linear-gradient(to top,rgba(0,0,0,.75),transparent);font-size:.85rem;opacity:0;transition:opacity .4s ease .1s}
.lf-gallery-acc-item.lf-expanded{flex:5}
.lf-gallery-acc-item.lf-expanded figcaption{opacity:1}
/* ─── Gallery: ticker ─── */
.lf-gallery-ticker{overflow:hidden;position:relative}
.lf-gallery-ticker-track{display:flex;gap:1rem;width:max-content;animation:lfGalleryTicker 30s linear infinite}
.lf-gallery-ticker:hover .lf-gallery-ticker-track{animation-play-state:paused}
.lf-gallery-ticker-track>*{flex:0 0 auto}
@keyframes lfGalleryTicker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
/* ─── Gallery: stories ─── */
.lf-gallery-stories{position:relative;overflow:hidden;border-radius:var(--lf-radius)}
.lf-gallery-stories .lf-gslide{display:none;position:relative}
.lf-gallery-stories .lf-gslide.lf-active{display:block}
.lf-gallery-stories .lf-gslide img{width:100%;aspect-ratio:4/5;object-fit:cover}
.lf-stories-progress{position:absolute;top:12px;left:12px;right:12px;display:flex;gap:4px;z-index:2}
.lf-stories-bar{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.35);overflow:hidden}
.lf-stories-bar>span{display:block;height:100%;width:0;background:#fff}
.lf-stories-bar.lf-completed>span{width:100%}
.lf-stories-bar.lf-active>span{animation:lfStoryFill var(--lf-story-dur,5s) linear forwards}
@keyframes lfStoryFill{from{width:0}to{width:100%}}
.lf-stories-cap{position:absolute;bottom:0;left:0;right:0;padding:1.5rem 1.25rem .875rem;color:#fff;background:linear-gradient(to top,rgba(0,0,0,.8),transparent);font-size:.95rem}
/* ─── Gallery: vertical fade ─── */
.lf-gallery-v .lf-gslide{display:none}
.lf-gallery-v .lf-gslide.lf-active{display:block;animation:lfFadeUp .6s ease}
@keyframes lfFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.lf-gnav{display:flex;align-items:center;justify-content:center;gap:1rem;margin-top:1.25rem}
.lf-garrow{display:grid;place-items:center;width:40px;height:40px;border-radius:9999px;border:1px solid var(--lf-border);background:var(--lf-bg);color:var(--lf-fg);cursor:pointer;transition:all .2s ease}
.lf-garrow:hover{border-color:var(--lf-accent);color:var(--lf-accent);transform:scale(1.06)}
.lf-gcount{font-size:.85rem;color:var(--lf-muted-fg);font-variant-numeric:tabular-nums}

/* ─── Testimonials carousel ─── */
.lf-tcarousel{overflow:hidden;position:relative}
.lf-ttrack{display:flex;transition:transform .6s cubic-bezier(.4,0,.2,1)}
.lf-ttrack>*{flex:0 0 100%;padding:0 .25rem;box-sizing:border-box}
@media(min-width:768px){.lf-ttrack>*{flex:0 0 50%}}
@media(min-width:1024px){.lf-ttrack>*{flex:0 0 33.3333%}}

/* ─── Pricing billing toggle ─── */
.lf-billing-toggle{display:inline-flex;gap:.25rem;padding:.3rem;border-radius:9999px;border:1px solid var(--lf-border);background:var(--lf-muted);margin:0 auto 3rem}
.lf-billing-btn{padding:.5rem 1.5rem;border-radius:9999px;font-size:.875rem;font-weight:600;color:var(--lf-muted-fg);cursor:pointer;transition:all .25s ease;background:transparent;border:none}
.lf-billing-btn.lf-active{background:var(--lf-bg);color:var(--lf-fg);box-shadow:0 2px 8px rgba(0,0,0,.08)}
.lf-save-badge{display:inline-block;margin-left:.5rem;padding:.1rem .5rem;border-radius:9999px;font-size:.65rem;font-weight:700;background:rgba(16,185,129,.12);color:#10b981;vertical-align:middle}
.lf-price{transition:opacity .25s ease}
.lf-price.lf-swapping{opacity:0}

/* ─── Single offer card ─── */
.lf-offer-card{position:relative;max-width:28rem;margin:0 auto;border-radius:calc(var(--lf-radius) + 4px);border:1px solid var(--lf-border);background:var(--lf-bg);padding:3rem 2.5rem;box-shadow:0 4px 12px rgba(0,0,0,.08),0 24px 64px rgba(0,0,0,.08);text-align:center}
.lf-offer-urgency{position:absolute;top:-.9rem;left:50%;transform:translateX(-50%);padding:.35rem 1.1rem;border-radius:9999px;font-size:.7rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;background:linear-gradient(135deg,#ef4444,#f97316);color:#fff;box-shadow:0 4px 20px rgba(239,68,68,.35);white-space:nowrap}
.lf-offer-original{display:block;font-size:1.05rem;color:var(--lf-muted-fg);text-decoration:line-through;margin-bottom:.25rem}

/* ─── FAQ cards ─── */
.lf-faq-cards{display:grid;gap:1.25rem;grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}
.lf-faq-card{padding:1.5rem;border-radius:var(--lf-radius);border:1px solid var(--lf-border);background:var(--lf-bg);transition:transform .25s ease,box-shadow .25s ease}
.lf-faq-card:hover{transform:translateY(-3px);box-shadow:0 12px 32px -8px rgba(0,0,0,.1)}

/* ─── Tabs (problem) ─── */
.lf-tabs{display:flex;flex-wrap:wrap;justify-content:center;gap:.5rem;margin-bottom:2rem}
.lf-tab-btn{padding:.6rem 1.4rem;border-radius:9999px;border:1px solid var(--lf-border);background:var(--lf-bg);color:var(--lf-muted-fg);font-size:.875rem;font-weight:600;cursor:pointer;transition:all .25s ease}
.lf-tab-btn:hover{border-color:var(--lf-accent);color:var(--lf-accent)}
.lf-tab-btn.lf-active{background:var(--lf-primary);border-color:var(--lf-primary);color:var(--lf-primary-fg)}
.lf-tab-panel{display:none;animation:lfFadeUp .45s ease}
.lf-tab-panel.lf-active{display:block}

/* ─── Countdown ─── */
.lf-countdown{display:inline-flex;gap:.5rem}
.lf-cd-box{display:flex;flex-direction:column;align-items:center;min-width:3rem;padding:.4rem .5rem;border-radius:.5rem;background:rgba(255,255,255,.15);font-variant-numeric:tabular-nums}
.lf-cd-num{font-size:1.05rem;font-weight:700;line-height:1.2}
.lf-cd-lbl{font-size:.6rem;text-transform:uppercase;letter-spacing:.08em;opacity:.85}

/* ─── Mobile menu ─── */
.lf-burger{display:flex;flex-direction:column;justify-content:center;gap:5px;width:42px;height:42px;padding:0 9px;border-radius:.5rem;border:1px solid var(--lf-border);cursor:pointer;background:transparent}
.lf-burger span{display:block;height:2px;border-radius:2px;background:var(--lf-fg);transition:transform .3s ease,opacity .3s ease}
.lf-burger.lf-open span:nth-child(1){transform:translateY(7px) rotate(45deg)}
.lf-burger.lf-open span:nth-child(2){opacity:0}
.lf-burger.lf-open span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
.lf-mobile-panel{position:absolute;top:100%;left:0;right:0;border-bottom:1px solid var(--lf-border);background:var(--lf-bg);padding:1rem 1.5rem 1.25rem;display:none;z-index:40}
.lf-mobile-panel.lf-open{display:block;animation:lfFadeUp .3s ease}
.lf-mobile-panel a{display:block;padding:.65rem .5rem;border-radius:.5rem;font-size:.95rem;font-weight:500;color:var(--lf-fg)}
.lf-mobile-panel a:hover{background:var(--lf-muted)}
@media(min-width:768px){.lf-burger{display:none}.lf-mobile-panel{display:none!important}}
@media(max-width:767px){.lf-nav-links,.lf-nav-cta{display:none!important}}

/* ─── Toast ─── */
.lf-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(10px);padding:.8rem 1.5rem;border-radius:.6rem;font-size:.875rem;font-weight:500;color:#fff;background:#22c55e;box-shadow:0 10px 40px rgba(0,0,0,.2);z-index:99999;opacity:0;transition:all .35s ease;pointer-events:none;max-width:90vw;text-align:center}
.lf-toast.lf-show{opacity:1;transform:translateX(-50%) translateY(0)}
.lf-toast.lf-error{background:#ef4444}

/* ─── Dark-mode export toggle ─── */
.lf-theme-toggle{position:fixed;bottom:20px;right:20px;z-index:9990;display:flex;align-items:center;gap:.5rem;padding:.55rem .95rem;border-radius:9999px;border:1px solid var(--lf-border);background:color-mix(in srgb,var(--lf-bg) 85%,transparent);backdrop-filter:blur(10px);color:var(--lf-fg);font-size:.8rem;font-weight:600;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,.12);transition:transform .2s ease}
.lf-theme-toggle:hover{transform:scale(1.05)}
html.lf-dark{--lf-bg:#0f172a;--lf-fg:#e2e8f0;--lf-muted:#1e293b;--lf-muted-fg:#94a3b8;--lf-border:#334155;filter:none}
html.lf-dark body{background:var(--lf-bg);color:var(--lf-fg)}
html.lf-dark .lf-card,html.lf-dark .lf-faq-card{background:color-mix(in srgb,#1e293b 85%,transparent);border-color:#334155}
html.lf-dark .lf-billing-btn.lf-active{background:#1e293b;color:#f1f5f9}
html.lf-dark .lf-mobile-panel{background:#0f172a}
html.lf-dark .lf-garrow{background:#1e293b;color:#e2e8f0}
html.lf-dark input,html.lf-dark textarea,html.lf-dark select{background:#0f172a!important;color:#e2e8f0!important;border-color:#334155!important}
html.lf-dark .lf-theme-toggle{background:#1e293b;border-color:#334155;color:#e2e8f0}

/* ─── Video cinematic ─── */
.lf-video-cinematic{position:relative;min-height:90vh;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#000}
.lf-video-cinematic iframe{position:absolute;top:50%;left:50%;width:100vw;height:56.25vw;min-height:100vh;min-width:177.78vh;transform:translate(-50%,-50%);border:0;pointer-events:none}
.lf-video-cinematic .lf-video-veil{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.65),rgba(0,0,0,.4) 40%,rgba(0,0,0,.75));z-index:1}
.lf-video-cinematic .lf-video-content{position:relative;z-index:2;text-align:center;color:#fff;padding:4rem 1.5rem;max-width:52rem;margin:0 auto}
.lf-video-cinematic .lf-video-content h2{font-size:clamp(2rem,5vw,3.5rem);font-weight:700;margin-bottom:1rem;color:#fff;text-shadow:0 4px 30px rgba(0,0,0,.5)}
.lf-video-cinematic .lf-video-content p{color:rgba(255,255,255,.85);font-size:clamp(1rem,2vw,1.2rem)}

/* ─── Comparison check/cross icons ─── */
.lf-cmp-yes{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:9999px;background:rgba(16,185,129,.12);color:#10b981;font-weight:700}
.lf-cmp-no{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:9999px;background:rgba(239,68,68,.1);color:#ef4444;font-weight:700}

/* ─── Contact form toast + honeypot ─── */
.lf-form input:focus,.lf-form textarea:focus{outline:none;border-color:var(--lf-accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--lf-accent) 18%,transparent)}
.lf-honey{position:absolute;left:-9999px;opacity:0;height:0;width:0}
@media(prefers-reduced-motion:reduce){.lf-gallery-ticker-track{animation-duration:120s}}`;
}

function extractJs(): string {
  // Scroll-triggered reveal animations + navbar scroll shadow +
  // mouse-tracking 3D tilt on hero image + count-up on stats.
  // Uses Intersection Observer — no dependencies, ~2KB.
  return `(function(){
  // ─── Navbar scroll shadow ───
  var header = document.querySelector('header');
  if(header){
    var onScroll = function(){ if(window.scrollY > 10){ header.classList.add('lf-scrolled'); } else { header.classList.remove('lf-scrolled'); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ─── Scroll reveal ───
  var reveals = document.querySelectorAll('.lf-reveal, .lf-reveal-stagger');
  if(reveals.length && 'IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add('lf-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    reveals.forEach(function(el){ io.observe(el); });
  } else {
    reveals.forEach(function(el){ el.classList.add('lf-visible'); });
  }

  // ─── Mouse-tracking 3D tilt on hero image ───
  var tiltContainer = document.querySelector('.lf-hero-tilt');
  var tiltImg = document.querySelector('.lf-hero-img');
  if(tiltContainer && tiltImg && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    var maxTilt = 8; // max degrees
    tiltContainer.addEventListener('mousemove', function(e){
      var rect = tiltContainer.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var rotateY = ((x / rect.width) - 0.5) * 2 * maxTilt;
      var rotateX = -((y / rect.height) - 0.5) * 2 * maxTilt;
      tiltImg.style.transform = 'perspective(1000px) rotateY(' + rotateY + 'deg) rotateX(' + rotateX + 'deg)';
    });
    tiltContainer.addEventListener('mouseleave', function(){
      tiltImg.style.transform = 'perspective(1000px) rotateY(-2deg) rotateX(1deg)';
    });
  }

  // ─── Stat count-up animation ───
  var stats = document.querySelectorAll('.lf-stat-value[data-count]');
  if(stats.length && 'IntersectionObserver' in window){
    var statIo = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(!e.isIntersecting) return;
        statIo.unobserve(e.target);
        var el = e.target;
        var target = el.getAttribute('data-count');
        var prefix = el.getAttribute('data-prefix') || '';
        var suffix = el.getAttribute('data-suffix') || '';
        // If target is not a pure number, just show it (e.g. "4.9/5", "Custom")
        var num = parseFloat(target);
        if(isNaN(num) || target.length > 6){ el.textContent = target; return; }
        var duration = 1500;
        var startTime = null;
        function animate(ts){
          if(!startTime) startTime = ts;
          var progress = Math.min((ts - startTime) / duration, 1);
          // Ease out cubic
          var eased = 1 - Math.pow(1 - progress, 3);
          var current = num * eased;
          // Format: if target had decimals, preserve them
          var decimals = (target.split('.')[1] || '').length;
          el.textContent = prefix + current.toFixed(decimals) + suffix;
          if(progress < 1) requestAnimationFrame(animate);
        }
        if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
          el.textContent = target;
        } else {
          el.textContent = '0';
          requestAnimationFrame(animate);
        }
      });
    }, { threshold: 0.5 });
    stats.forEach(function(el){ statIo.observe(el); });
  }

  // ════════════════════════════════════════════════════════
  // LandingForge v21 engine — interactive behaviours
  // ════════════════════════════════════════════════════════

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─── Toast helper ───
  function lfToast(msg, isError){
    var t = document.querySelector('.lf-toast');
    if(!t){ t = document.createElement('div'); t.className = 'lf-toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.className = 'lf-toast lf-show' + (isError ? ' lf-error' : '');
    clearTimeout(t._timer);
    t._timer = setTimeout(function(){ t.className = 'lf-toast' + (isError ? ' lf-error' : ''); }, 3500);
  }

  // ─── Hero carousel ───
  document.querySelectorAll('.lf-hcarousel').forEach(function(car){
    var slides = Array.prototype.slice.call(car.querySelectorAll('.lf-hcarousel-slide'));
    if(slides.length < 2) return;
    var dotsWrap = car.querySelector('.lf-hdots');
    var autoplay = parseInt(car.getAttribute('data-autoplay') || '0', 10);
    var cur = 0, timer = null;
    slides.forEach(function(_, i){
      if(!dotsWrap) return;
      var d = document.createElement('button');
      d.className = 'lf-hdot' + (i === 0 ? ' lf-active' : '');
      d.setAttribute('aria-label', 'Slide ' + (i + 1));
      d.addEventListener('click', function(){ show(i); start(); });
      dotsWrap.appendChild(d);
    });
    function show(n){
      cur = ((n % slides.length) + slides.length) % slides.length;
      slides.forEach(function(s, i){ s.classList.toggle('lf-active', i === cur); });
      if(dotsWrap) Array.prototype.forEach.call(dotsWrap.children, function(d, i){ d.classList.toggle('lf-active', i === cur); });
    }
    function next(){ show(cur + 1); }
    function start(){ if(timer) clearInterval(timer); timer = null; if(autoplay > 0 && !reduceMotion) timer = setInterval(next, autoplay * 1000); }
    // Touch swipe
    var sx = 0;
    car.addEventListener('touchstart', function(e){ sx = e.touches[0].clientX; }, { passive: true });
    car.addEventListener('touchend', function(e){ var dx = sx - e.changedTouches[0].clientX; if(Math.abs(dx) > 50) dx > 0 ? next() : show(cur - 1); }, { passive: true });
    start();
  });

  // ─── Gallery engines (vertical fade + stories + accordion) ───
  document.querySelectorAll('[data-lf-gallery]').forEach(function(sec){
    var style = sec.getAttribute('data-lf-gallery');
    var autoplay = parseInt(sec.getAttribute('data-lf-autoplay') || '0', 10);
    if(style === 'accordion'){
      var items = sec.querySelectorAll('.lf-gallery-acc-item');
      Array.prototype.forEach.call(items, function(item, i){
        item.addEventListener('click', function(){
          Array.prototype.forEach.call(items, function(it, j){ it.classList.toggle('lf-expanded', i === j); });
        });
      });
      return;
    }
    if(style !== 'vertical' && style !== 'stories') return;
    var slides = Array.prototype.slice.call(sec.querySelectorAll('.lf-gslide'));
    if(slides.length < 2) return;
    var bars = sec.querySelectorAll('.lf-stories-bar');
    var counter = sec.querySelector('.lf-gcount');
    var cur = 0, timer = null;
    var dur = autoplay > 0 ? autoplay : 5;
    function show(n){
      cur = ((n % slides.length) + slides.length) % slides.length;
      slides.forEach(function(s, i){ s.classList.toggle('lf-active', i === cur); });
      if(bars.length) Array.prototype.forEach.call(bars, function(b, i){
        b.classList.toggle('lf-completed', i < cur);
        b.classList.toggle('lf-active', i === cur);
        var fill = b.querySelector('span');
        if(fill){
          fill.style.animation = 'none';
          if(i === cur){ void fill.offsetWidth; fill.style.animation = ''; }
        }
      });
      if(counter) counter.textContent = (cur + 1) + ' / ' + slides.length;
    }
    function next(){ show(cur + 1); }
    function start(){
      if(timer) clearInterval(timer); timer = null;
      if(autoplay > 0 && !reduceMotion) timer = setInterval(next, dur * 1000);
    }
    sec.querySelectorAll('.lf-garrow.lf-prev').forEach(function(b){ b.addEventListener('click', function(){ show(cur - 1); start(); }); });
    sec.querySelectorAll('.lf-garrow.lf-next').forEach(function(b){ b.addEventListener('click', function(){ show(cur + 1); start(); }); });
    var track = sec.querySelector('.lf-gwrap');
    if(track){
      var sx = 0;
      track.addEventListener('touchstart', function(e){ sx = e.touches[0].clientX; }, { passive: true });
      track.addEventListener('touchend', function(e){ var dx = sx - e.changedTouches[0].clientX; if(Math.abs(dx) > 50){ dx > 0 ? next() : show(cur - 1); start(); } }, { passive: true });
    }
    sec.addEventListener('mouseenter', function(){ if(timer){ clearInterval(timer); timer = null; } });
    sec.addEventListener('mouseleave', start);
    start();
  });

  // ─── Testimonials carousel ───
  document.querySelectorAll('.lf-tcarousel').forEach(function(car){
    var track = car.querySelector('.lf-ttrack');
    if(!track) return;
    var slides = track.children.length;
    var counter = car.querySelector('.lf-gcount');
    var autoplay = parseInt(car.getAttribute('data-autoplay') || '0', 10);
    var cur = 0, timer = null;
    function perView(){ return window.innerWidth >= 1024 ? 3 : window.innerWidth >= 768 ? 2 : 1; }
    function maxIdx(){ return Math.max(0, slides - perView()); }
    function show(n){
      cur = Math.min(Math.max(n, 0), maxIdx());
      track.style.transform = 'translateX(-' + (cur * (100 / perView())) + '%)';
      if(counter) counter.textContent = Math.min(cur + 1, slides) + ' / ' + slides;
    }
    function next(){ show(cur >= maxIdx() ? 0 : cur + 1); }
    function start(){ if(timer) clearInterval(timer); timer = null; if(autoplay > 0 && !reduceMotion) timer = setInterval(next, autoplay * 1000); }
    car.querySelectorAll('.lf-garrow.lf-prev').forEach(function(b){ b.addEventListener('click', function(){ show(cur - 1); start(); }); });
    car.querySelectorAll('.lf-garrow.lf-next').forEach(function(b){ b.addEventListener('click', function(){ next(); start(); }); });
    var rt;
    window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(function(){ show(cur); }, 150); });
    start();
  });

  // ─── Pricing billing toggle ───
  document.querySelectorAll('.lf-billing-toggle').forEach(function(toggle){
    var btns = toggle.querySelectorAll('.lf-billing-btn');
    var wrap = toggle.closest('section');
    btns.forEach(function(btn){
      btn.addEventListener('click', function(){
        var period = btn.getAttribute('data-period');
        btns.forEach(function(b){ b.classList.toggle('lf-active', b === btn); });
        wrap.querySelectorAll('.lf-price').forEach(function(p){
          p.classList.add('lf-swapping');
          setTimeout(function(){
            p.textContent = period === 'yearly' ? (p.getAttribute('data-yearly') || p.textContent) : (p.getAttribute('data-monthly') || p.textContent);
            var per = p.parentElement.querySelector('.lf-per');
            if(per) per.textContent = period === 'yearly' ? (p.getAttribute('data-yearly-per') || '/yr') : (p.getAttribute('data-monthly-per') || '/mo');
            p.classList.remove('lf-swapping');
          }, 180);
        });
      });
    });
  });

  // ─── Tabs (problem section) ───
  document.querySelectorAll('.lf-tabs').forEach(function(tabs){
    var btns = tabs.querySelectorAll('.lf-tab-btn');
    var wrap = tabs.parentElement;
    var panels = wrap.querySelectorAll('.lf-tab-panel');
    btns.forEach(function(btn, i){
      btn.addEventListener('click', function(){
        btns.forEach(function(b, j){ b.classList.toggle('lf-active', i === j); });
        panels.forEach(function(p, j){ p.classList.toggle('lf-active', i === j); });
      });
    });
  });

  // ─── Countdown ───
  document.querySelectorAll('.lf-countdown[data-target]').forEach(function(cd){
    var target = new Date(cd.getAttribute('data-target')).getTime();
    if(isNaN(target)) return;
    var d = cd.querySelector('[data-cd=d]'), h = cd.querySelector('[data-cd=h]'), m = cd.querySelector('[data-cd=m]'), s = cd.querySelector('[data-cd=s]');
    function pad(n){ return String(n).padStart(2, '0'); }
    function tick(){
      var rem = Math.max(0, target - Date.now());
      if(d) d.textContent = pad(Math.floor(rem / 86400000));
      if(h) h.textContent = pad(Math.floor((rem % 86400000) / 3600000));
      if(m) m.textContent = pad(Math.floor((rem % 3600000) / 60000));
      if(s) s.textContent = pad(Math.floor((rem % 60000) / 1000));
      if(rem <= 0) clearInterval(iv);
    }
    tick();
    var iv = setInterval(tick, 1000);
  });

  // ─── Mobile menu ───
  document.querySelectorAll('.lf-burger').forEach(function(burger){
    var panel = document.querySelector('.lf-mobile-panel');
    if(!panel) return;
    burger.addEventListener('click', function(){
      burger.classList.toggle('lf-open');
      panel.classList.toggle('lf-open');
      burger.setAttribute('aria-expanded', panel.classList.contains('lf-open') ? 'true' : 'false');
    });
    panel.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ burger.classList.remove('lf-open'); panel.classList.remove('lf-open'); }); });
  });

  // ─── Contact form (Google Sheets / FormSubmit.co / demo) ───
  document.querySelectorAll('form[data-lf-form]').forEach(function(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var honey = form.querySelector('input[name="_honey"]');
      if(honey && honey.value) return; // bot
      var type = form.getAttribute('data-lf-form');
      var webAppUrl = form.getAttribute('data-webapp-url') || '';
      var emailRecip = form.getAttribute('data-email-recipient') || '';
      var successMsg = form.getAttribute('data-success-msg') || 'Thank you! Your message has been sent.';
      var redirectUrl = form.getAttribute('data-redirect-url') || '';
      var btn = form.querySelector('button[type="submit"]');
      var orig = btn ? btn.innerHTML : '';
      function done(ok){
        if(btn){ btn.disabled = false; btn.innerHTML = orig; }
        if(ok){
          lfToast(successMsg, false);
          form.reset();
          if(redirectUrl) setTimeout(function(){ window.location.href = redirectUrl; }, 1200);
        } else {
          lfToast('Error sending message. Please try again.', true);
        }
      }
      if(type === 'email'){
        if(!emailRecip || emailRecip.indexOf('@') === -1){ lfToast('Recipient email not configured.', true); return; }
        // FormSubmit.co — real POST (page navigates away on success)
        var f = form;
        f.action = 'https://formsubmit.co/' + encodeURIComponent(emailRecip);
        f.method = 'POST';
        f.target = '_blank';
        var addHidden = function(name, value){
          var el = f.querySelector('input[name="' + name + '"]');
          if(!el){ el = document.createElement('input'); el.type = 'hidden'; el.name = name; f.appendChild(el); }
          el.value = value;
        };
        addHidden('_subject', form.getAttribute('data-email-subject') || 'New Contact Form Submission');
        addHidden('_captcha', 'false');
        addHidden('_template', 'table');
        lfToast('Opening your email handler…', false);
        f.submit();
        return;
      }
      if(type === 'sheet'){
        if(!webAppUrl || webAppUrl.indexOf('script.google.com') === -1){ lfToast('Google Sheet URL not configured. Add it in the section settings.', true); return; }
        if(btn){ btn.disabled = true; btn.innerHTML = 'Sending…'; }
        var data = { _timestamp: new Date().toISOString() };
        new FormData(form).forEach(function(v, k){ if(k !== '_honey') data[k] = v; });
        fetch(webAppUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
          .then(function(){ done(true); })
          .catch(function(){ done(false); });
        return;
      }
      // Demo mode
      if(btn){ btn.disabled = true; btn.innerHTML = 'Sending…'; }
      setTimeout(function(){ done(true); }, 700);
    });
  });

  // ─── Dark-mode export toggle ───
  var dt = document.querySelector('.lf-theme-toggle');
  if(dt){
    var root = document.documentElement;
    try{ if(localStorage.getItem('lf-theme') === 'dark') root.classList.add('lf-dark'); }catch(err){}
    dt.addEventListener('click', function(){
      root.classList.toggle('lf-dark');
      try{ localStorage.setItem('lf-theme', root.classList.contains('lf-dark') ? 'dark' : 'light'); }catch(err){}
    });
  }
})();`;
}

function escapeHtml(s: unknown): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Get the background color a section will use, for wave divider color matching. */
function getSectionBackground(section: SectionInstance, t: ThemeTokens): string {
  const c = section.config as any;
  // Sections that use muted background
  const mutedSections = ["stats", "testimonials", "newsletter", "problem", "comparison", "guarantee"];
  if (mutedSections.includes(section.kind)) return t.muted;
  // CTA uses its variant background
  if (section.kind === "cta") {
    if (c.variant === "gradient") return `linear-gradient(135deg, ${t.primary} 0%, ${t.accent} 100%)`;
    if (c.variant === "muted") return t.muted;
    return t.primary;
  }
  // Announcement uses custom bg
  if (section.kind === "announcement") return c.bgColor || t.primary;
  // Hero variants
  if (section.kind === "hero" && c.variant === "gradient") return `linear-gradient(135deg, ${t.primary} 0%, ${t.accent} 100%)`;
  if (section.kind === "hero" && c.variant === "card") return t.muted;
  // Default: theme background
  return t.background;
}

/** Render a wave SVG divider in the color of the NEXT section. */
function renderWaveDivider(nextBg: string): string {
  // If it's a gradient, just use a flat color (gradients can't be in SVG fill easily)
  const bg = nextBg.startsWith("linear-gradient") ? "var(--lf-bg)" : nextBg;
  return `<div class="lf-divider lf-divider-bottom" style="background:transparent"><svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><path d="M0,30 C480,60 960,0 1440,30 L1440,60 L0,60 Z" fill="${bg}"/></svg></div>`;
}

function renderSection(section: SectionInstance, theme: ThemeTokens): string {
  const c = section.config as any;
  switch (section.kind) {
    case "navbar": return renderNavbar(c, theme);
    case "hero": return renderHero(c, theme);
    case "logocloud": return renderLogoCloud(c, theme);
    case "features": return renderFeatures(c, theme);
    case "stats": return renderStats(c, theme);
    case "gallery": return renderGallery(c, theme);
    case "testimonials": return renderTestimonials(c, theme);
    case "pricing": return renderPricing(c, theme);
    case "faq": return renderFaq(c, theme);
    case "cta": return renderCta(c, theme);
    case "newsletter": return renderNewsletter(c, theme);
    case "footer": return renderFooter(c, theme);
    case "announcement": return renderAnnouncement(c, theme);
    case "problem": return renderProblem(c, theme);
    case "solution": return renderSolution(c, theme);
    case "video": return renderVideo(c, theme);
    case "comparison": return renderComparison(c, theme);
    case "guarantee": return renderGuarantee(c, theme);
    case "contactform": return renderContactForm(c, theme);
    case "legal": return renderLegal(c, theme);
    default: return "";
  }
}

function renderNavbar(c: any, t: ThemeTokens): string {
  const links = (c.links || []).map((l: any) => `<a href="${escapeHtml(l.href)}" class="lf-link text-sm font-medium" style="color:${t.foreground}">${escapeHtml(l.label)}</a>`).join("\n");
  const mobileLinks = (c.links || []).map((l: any) => `<a href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a>`).join("\n");
  const ctaBtn = c.ctaLabel ? `<a href="${escapeHtml(c.ctaHref)}" class="lf-nav-cta lf-btn lf-btn-primary inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold" style="color:${t.primaryFg}">${escapeHtml(c.ctaLabel)}</a>` : "";
  return `<header class="border-b" style="background:${c.transparent ? "transparent" : t.background};border-color:${t.border};position:${c.sticky ? "sticky" : "relative"};top:0;z-index:30">
  <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
    <div class="flex items-center gap-2">
      ${c.logoUrl ? `<img src="${escapeHtml(c.logoUrl)}" alt="${escapeHtml(c.brand)}" style="height:1.75rem" />` : `<div style="display:grid;place-items:center;width:1.75rem;height:1.75rem;border-radius:.375rem;background:${t.primary};color:${t.primaryFg};font-weight:700">${escapeHtml(c.brand?.[0]?.toUpperCase() ?? "A")}</div>`}
      <span class="font-semibold" style="color:${t.foreground}">${escapeHtml(c.brand)}</span>
    </div>
    <nav class="lf-nav-links hidden items-center gap-6 md:flex">${links}</nav>
    ${ctaBtn}
    ${(c.links || []).length ? `<button type="button" class="lf-burger" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button>` : ""}
  </div>
  ${(c.links || []).length ? `<div class="lf-mobile-panel">${mobileLinks}${c.ctaLabel ? `<a href="${escapeHtml(c.ctaHref)}" class="lf-nav-cta" style="margin-top:.5rem;text-align:center;padding:.7rem .5rem;border-radius:.5rem;font-weight:600;background:${t.primary};color:${t.primaryFg}">${escapeHtml(c.ctaLabel)}</a>` : ""}</div>` : ""}
</header>`;
}

function renderHero(c: any, t: ThemeTokens): string {
  const variant = c.variant ?? "centered";
  const isSplit = variant === "split-left" || variant === "split-right";
  const align = c.align ?? (isSplit ? "left" : "center");
  // Media: carousel when multiple images, single image otherwise.
  const images: { url: string; alt?: string }[] = (c.images || []).filter((i: any) => i?.url);
  const single = c.imageUrl ? `<div class="lf-hero-tilt"><img src="${escapeHtml(c.imageUrl)}" alt="" class="lf-hero-img w-full rounded-xl shadow-2xl" style="border-radius:${t.radius}" /></div>` : `<div class="grid aspect-video w-full place-items-center rounded-xl shadow-xl" style="background:${t.muted};border-radius:${t.radius}"><span class="text-sm" style="color:${t.mutedFg}">Image placeholder</span></div>`;
  const media = images.length > 1
    ? `<div class="lf-hcarousel lf-anim-${escapeHtml(c.carouselAnim || "fade")}" data-autoplay="${Number(c.carouselAutoplay ?? 5)}">${images.map((img, i) => `<div class="lf-hcarousel-slide${i === 0 ? " lf-active" : ""}"><img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.alt ?? "")}" /></div>`).join("")}<div class="lf-hdots"></div></div>`
    : images.length === 1
      ? `<div class="lf-hero-tilt"><img src="${escapeHtml(images[0].url)}" alt="${escapeHtml(images[0].alt ?? "")}" class="lf-hero-img w-full rounded-xl shadow-2xl" style="border-radius:${t.radius}" /></div>`
      : single;
  const text = `<div class="lf-reveal flex flex-col gap-5 ${align === "center" ? "items-center text-center" : "items-start text-left"}">
    ${c.eyebrow ? `<span class="lf-eyebrow inline-flex items-center rounded-full px-3 py-1" style="background:${t.muted};color:${t.mutedFg}">${escapeHtml(c.eyebrow)}</span>` : ""}
    <h1 class="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl" style="color:${t.foreground};font-weight:600">${escapeHtml(c.headline)}</h1>
    ${c.subhead ? `<p class="max-w-2xl text-base sm:text-lg" style="color:${t.mutedFg};line-height:1.7">${escapeHtml(c.subhead)}</p>` : ""}
    <div class="mt-2 flex flex-wrap gap-3 ${align === "center" ? "justify-center" : ""}">
      ${c.primaryCtaLabel ? `<a href="${escapeHtml(c.primaryCtaHref)}" class="lf-btn lf-btn-primary inline-flex items-center rounded-md px-5 py-2.5 text-sm font-semibold" style="color:${t.primaryFg}">${escapeHtml(c.primaryCtaLabel)}</a>` : ""}
      ${c.secondaryCtaLabel ? `<a href="${escapeHtml(c.secondaryCtaHref)}" class="lf-btn lf-btn-secondary inline-flex items-center rounded-md px-5 py-2.5 text-sm font-semibold" style="color:${t.foreground}">${escapeHtml(c.secondaryCtaLabel)}</a>` : ""}
    </div>
  </div>`;
  if (variant === "fullscreen") {
    return `<section class="relative flex min-h-[90vh] items-center justify-center overflow-hidden px-6" style="background:linear-gradient(135deg,${t.primary} 0%,${t.accent} 100%)">
  ${c.imageUrl || images.length ? `<div class="absolute inset-0"><img src="${escapeHtml(images.length ? images[0].url : c.imageUrl)}" alt="" class="h-full w-full object-cover" style="opacity:.35" /></div>` : ""}
  <div class="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">${text.replace(`items-start text-left`, `items-center text-center`)}</div>
</section>`;
  }
  if (variant === "gradient") {
    return `<section class="px-6 py-20 sm:py-32" style="background:linear-gradient(135deg,${t.primary} 0%,${t.accent} 100%)">
  <div class="mx-auto max-w-3xl"><div class="flex flex-col items-center text-center">${text.replace(`style="color:${t.foreground};font-weight:600"`, `style="color:${t.primaryFg};font-weight:600"`).replace(`style="color:${t.mutedFg};line-height:1.7"`, `style="color:rgba(255,255,255,.85);line-height:1.7"`).replace(`style="background:${t.muted};color:${t.mutedFg}"`, `style="background:rgba(255,255,255,.15);color:${t.primaryFg}"`)}</div></div>
</section>`;
  }
  if (variant === "card") {
    return `<section class="px-6 py-20 sm:py-32" style="background:${t.muted}">
  <div class="mx-auto max-w-2xl"><div class="lf-reveal rounded-2xl border p-8 text-center shadow-xl sm:p-12" style="background:${t.background};border-color:${t.border};border-radius:${t.radius}"><div class="flex flex-col items-center text-center">${text}</div></div></div>
</section>`;
  }
  if (variant === "minimalist") {
    return `<section class="px-6 py-24 sm:py-36" style="background:${t.background}">
  <div class="mx-auto max-w-3xl"><div class="flex flex-col items-center gap-4 text-center">
    ${c.eyebrow ? `<span class="text-xs font-medium uppercase tracking-widest" style="color:${t.mutedFg}">${escapeHtml(c.eyebrow)}</span>` : ""}
    <h1 class="text-3xl font-medium leading-tight tracking-tight sm:text-4xl lg:text-5xl" style="color:${t.foreground}">${escapeHtml(c.headline)}</h1>
    ${c.subhead ? `<p class="max-w-xl text-base" style="color:${t.mutedFg}">${escapeHtml(c.subhead)}</p>` : ""}
    ${c.primaryCtaLabel ? `<a href="${escapeHtml(c.primaryCtaHref)}" class="mt-4 text-sm font-semibold underline" style="color:${t.accent}">${escapeHtml(c.primaryCtaLabel)} →</a>` : ""}
  </div></div>
</section>`;
  }
  return `<section class="px-6 py-20 sm:py-32" style="background:${t.background}">
    <div class="mx-auto max-w-6xl">
      ${isSplit ? `<div class="grid items-center gap-12 md:grid-cols-2 ${variant === "split-right" ? "md:[&>*:first-child]:order-2" : ""}">${text}<div class="lf-reveal">${media}</div></div>` : `<div class="flex flex-col items-center text-center">${text}</div>`}
    </div>
  </section>`;
}

function renderLogoCloud(c: any, t: ThemeTokens): string {
  const logos = (c.logos || []).map((l: any) => l.url ? `<img src="${escapeHtml(l.url)}" alt="${escapeHtml(l.name)}" style="height:1.75rem" />` : `<span class="text-xl font-bold tracking-tight" style="color:${t.foreground}">${escapeHtml(l.name)}</span>`).join("\n");
  return `<section class="px-6 py-12" style="background:${t.background}"><div class="mx-auto max-w-6xl">${c.title ? `<p class="mb-8 text-center text-sm font-medium uppercase tracking-wider" style="color:${t.mutedFg}">${escapeHtml(c.title)}</p>` : ""}<div class="flex flex-wrap items-center justify-center gap-x-10 gap-y-6" style="opacity:.7">${logos}</div></div></section>`;
}

function renderFeatures(c: any, t: ThemeTokens): string {
  const cols = Number(c.columns ?? 3);
  const items = (c.items || []).map((it: any) => `<div class="lf-card group rounded-xl p-6" style="border-color:${t.border};border-radius:${t.radius}"><div class="mb-4 grid h-10 w-10 place-items-center rounded-lg" style="background:${t.muted};color:${t.accent}">${renderIconSvg(it.icon, "h-5 w-5")}</div><h3 class="mb-2 text-lg font-semibold" style="color:${t.foreground}">${escapeHtml(it.title)}</h3>${it.description ? `<p class="text-sm" style="color:${t.mutedFg};line-height:1.6">${escapeHtml(it.description)}</p>` : ""}</div>`).join("\n");
  return `<section id="features" class="px-6 py-20 sm:py-32" style="background:${t.background}"><div class="mx-auto max-w-6xl"><div class="lf-reveal mx-auto mb-16 max-w-2xl text-center">${c.eyebrow ? `<p class="lf-eyebrow mb-3" style="color:${t.accent}">${escapeHtml(c.eyebrow)}</p>` : ""}<h2 class="text-3xl font-bold tracking-tight sm:text-4xl" style="color:${t.foreground};font-weight:600">${escapeHtml(c.title)}</h2>${c.subtitle ? `<p class="mt-4 text-lg" style="color:${t.mutedFg};line-height:1.7">${escapeHtml(c.subtitle)}</p>` : ""}</div><div class="lf-reveal-stagger grid gap-6" style="grid-template-columns:repeat(auto-fit,minmax(${cols === 4 ? "240" : "280"}px,1fr))">${items}</div></div></section>`;
}

function renderStats(c: any, t: ThemeTokens): string {
  const stats = (c.stats || []).map((s: any) => {
    // Parse the value into a numeric part + prefix/suffix for count-up animation
    // e.g. "10K+" → data-count="10" data-suffix="K+"
    //      "47%" → data-count="47" data-suffix="%"
    //      "4.9/5" → data-count="4.9" data-suffix="/5"
    //      "5 min" → data-count="5" data-suffix=" min"
    const val = String(s.value || "");
    const match = val.match(/^([¥$€£]?)([\d.]+)(.*)$/);
    let countAttr = "";
    if (match) {
      const prefix = match[1];
      const num = match[2];
      const suffix = match[3];
      countAttr = ` data-count="${escapeHtml(num)}" data-prefix="${escapeHtml(prefix)}" data-suffix="${escapeHtml(suffix)}"`;
    }
    return `<div class="text-center lf-reveal"><div class="lf-stat-value text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl" style="color:${t.foreground};font-weight:600"${countAttr}>${escapeHtml(s.value)}</div><div class="mt-2 text-sm font-medium" style="color:${t.mutedFg}">${escapeHtml(s.label)}</div></div>`;
  }).join("\n");
  return `<section class="px-6 py-16 sm:py-24" style="background:${t.muted}"><div class="mx-auto max-w-6xl">${c.title ? `<h2 class="mb-12 text-center text-2xl font-bold tracking-tight" style="color:${t.foreground}">${escapeHtml(c.title)}</h2>` : ""}<div class="grid grid-cols-2 gap-8 sm:grid-cols-4">${stats}</div></div></section>`;
}

function renderGallery(c: any, t: ThemeTokens): string {
  const style = c.style || "grid";
  const cols = Number(c.columns ?? 3);
  const autoplay = Number(c.autoplay ?? 5);
  const images: { url: string; caption?: string }[] = (c.images || []).filter((i: any) => i?.url);
  const title = c.title ? `<h2 class="lf-reveal mb-10 text-center text-3xl font-bold tracking-tight sm:text-4xl" style="color:${t.foreground}">${escapeHtml(c.title)}</h2>` : "";
  const imgFig = (img: any) => `<img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.caption ?? "")}" class="w-full h-full object-cover" />`;
  const open = `<section id="work" data-lf-gallery="${style}" data-lf-autoplay="${autoplay}" class="px-6 py-16 sm:py-24" style="background:${t.background}"><div class="mx-auto max-w-6xl">${title}`;
  if (style === "horizontal") {
    return `${open}<div class="lf-gallery-h">${images.map((img) => `<figure class="overflow-hidden rounded-xl" style="border-radius:${t.radius}"><div class="relative overflow-hidden" style="aspect-ratio:4/3;background:${t.muted}">${imgFig(img)}</div>${img.caption ? `<figcaption class="mt-2 text-sm" style="color:${t.mutedFg}">${escapeHtml(img.caption)}</figcaption>` : ""}</figure>`).join("")}</div></div></section>`;
  }
  if (style === "accordion") {
    return `${open}<div class="lf-gallery-acc">${images.map((img, i) => `<figure class="lf-gallery-acc-item${i === 0 ? " lf-expanded" : ""}">${imgFig(img)}<figcaption>${escapeHtml(img.caption ?? "")}</figcaption></figure>`).join("")}</div></div></section>`;
  }
  if (style === "ticker") {
    const track = images.map((img) => `<figure class="overflow-hidden rounded-xl" style="border-radius:${t.radius};width:300px"><div class="relative overflow-hidden" style="aspect-ratio:4/3;background:${t.muted}">${imgFig(img)}</div></figure>`).join("");
    return `${open}<div class="lf-gallery-ticker"><div class="lf-gallery-ticker-track">${track}${track}</div></div></div></section>`;
  }
  if (style === "stories") {
    return `${open}<div class="lf-gallery-stories" style="max-width:420px;margin:0 auto">
      <div class="lf-stories-progress">${images.map((_, i) => `<div class="lf-stories-bar${i === 0 ? " lf-active" : ""}"><span></span></div>`).join("")}</div>
      <div class="lf-gwrap">${images.map((img, i) => `<div class="lf-gslide${i === 0 ? " lf-active" : ""}">${imgFig(img)}${img.caption ? `<div class="lf-stories-cap">${escapeHtml(img.caption)}</div>` : ""}</div>`).join("")}</div>
    </div>
    <div class="lf-gnav"><button type="button" class="lf-garrow lf-prev" aria-label="Previous">←</button><span class="lf-gcount">1 / ${images.length}</span><button type="button" class="lf-garrow lf-next" aria-label="Next">→</button></div>
    </div></section>`;
  }
  if (style === "vertical") {
    return `${open}<div style="max-width:640px;margin:0 auto"><div class="lf-gallery-v lf-gwrap">${images.map((img, i) => `<div class="lf-gslide${i === 0 ? " lf-active" : ""}"><figure class="overflow-hidden rounded-xl" style="border-radius:${t.radius}"><div class="relative overflow-hidden" style="aspect-ratio:4/3;background:${t.muted}">${imgFig(img)}</div>${img.caption ? `<figcaption class="mt-2 text-sm" style="color:${t.mutedFg}">${escapeHtml(img.caption)}</figcaption>` : ""}</figure></div>`).join("")}</div></div>
    <div class="lf-gnav"><button type="button" class="lf-garrow lf-prev" aria-label="Previous">←</button><span class="lf-gcount">1 / ${images.length}</span><button type="button" class="lf-garrow lf-next" aria-label="Next">→</button></div>
    </div></section>`;
  }
  // Default: grid
  const grid = images.map((img) => `<figure class="overflow-hidden rounded-xl" style="border-radius:${t.radius}"><div class="relative overflow-hidden" style="aspect-ratio:4/3;background:${t.muted}">${imgFig(img)}</div>${img.caption ? `<figcaption class="mt-2 text-sm" style="color:${t.mutedFg}">${escapeHtml(img.caption)}</figcaption>` : ""}</figure>`).join("\n");
  return `<section id="work" class="px-6 py-16 sm:py-24" style="background:${t.background}"><div class="mx-auto max-w-6xl">${title}<div class="grid gap-4" style="grid-template-columns:repeat(auto-fit,minmax(${cols === 4 ? "220" : "260"}px,1fr))">${grid}</div></div></section>`;
}

function renderTestimonials(c: any, t: ThemeTokens): string {
  const items = (c.items || []).map((it: any) => `<figure class="lf-card flex flex-col gap-4 rounded-xl p-6" style="border-color:${t.border};border-radius:${t.radius}"><blockquote class="text-base leading-relaxed" style="color:${t.foreground};font-size:1.05rem;line-height:1.7">&ldquo;${escapeHtml(it.quote)}&rdquo;</blockquote><figcaption class="mt-auto flex items-center gap-3">${it.avatar ? `<img src="${escapeHtml(it.avatar)}" alt="${escapeHtml(it.name)}" class="h-10 w-10 rounded-full object-cover" />` : `<div class="grid h-10 w-10 place-items-center rounded-full text-sm font-bold" style="background:${t.primary};color:${t.primaryFg}">${escapeHtml(it.name?.[0]?.toUpperCase())}</div>`}<div><div class="text-sm font-semibold" style="color:${t.foreground}">${escapeHtml(it.name)}</div>${it.role ? `<div class="text-xs" style="color:${t.mutedFg}">${escapeHtml(it.role)}</div>` : ""}</div></figcaption></figure>`).join("\n");
  const title = c.title ? `<h2 class="lf-reveal mb-16 text-center text-3xl font-bold tracking-tight sm:text-4xl" style="color:${t.foreground};font-weight:600">${escapeHtml(c.title)}</h2>` : "";
  if (c.style === "carousel") {
    const autoplay = Number(c.autoplay ?? 5);
    return `<section id="testimonials" class="px-6 py-20 sm:py-32" style="background:${t.muted}"><div class="mx-auto max-w-6xl">${title}<div class="lf-tcarousel" data-autoplay="${autoplay}"><div class="lf-ttrack">${(c.items || []).map((it: any) => `<div>${`<figure class="lf-card flex h-full flex-col gap-4 rounded-xl p-6" style="border-color:${t.border};border-radius:${t.radius}"><blockquote class="text-base leading-relaxed" style="color:${t.foreground};font-size:1.05rem;line-height:1.7">&ldquo;${escapeHtml(it.quote)}&rdquo;</blockquote><figcaption class="mt-auto flex items-center gap-3">${it.avatar ? `<img src="${escapeHtml(it.avatar)}" alt="${escapeHtml(it.name)}" class="h-10 w-10 rounded-full object-cover" />` : `<div class="grid h-10 w-10 place-items-center rounded-full text-sm font-bold" style="background:${t.primary};color:${t.primaryFg}">${escapeHtml(it.name?.[0]?.toUpperCase())}</div>`}<div><div class="text-sm font-semibold" style="color:${t.foreground}">${escapeHtml(it.name)}</div>${it.role ? `<div class="text-xs" style="color:${t.mutedFg}">${escapeHtml(it.role)}</div>` : ""}</div></figcaption></figure>`}</div>`).join("")}</div></div><div class="lf-gnav"><button type="button" class="lf-garrow lf-prev" aria-label="Previous">←</button><span class="lf-gcount">1 / ${(c.items || []).length}</span><button type="button" class="lf-garrow lf-next" aria-label="Next">→</button></div></div></section>`;
  }
  return `<section id="testimonials" class="px-6 py-20 sm:py-32" style="background:${t.muted}"><div class="mx-auto max-w-6xl">${title}<div class="lf-reveal-stagger grid gap-6 md:grid-cols-3">${items}</div></div></section>`;
}

function renderPricing(c: any, t: ThemeTokens): string {
  const style = c.style || "tiers";
  const head = `<div class="lf-reveal mx-auto mb-16 max-w-2xl text-center">${c.title ? `<h2 class="text-3xl font-bold tracking-tight sm:text-4xl" style="color:${t.foreground};font-weight:600">${escapeHtml(c.title)}</h2>` : ""}${c.subtitle ? `<p class="mt-4 text-lg" style="color:${t.mutedFg};line-height:1.7">${escapeHtml(c.subtitle)}</p>` : ""}</div>`;
  const tierCard = (tier: any, opts: { monthly?: string; yearly?: string } = {}) => {
    const features = (tier.features ?? "").split("\n").filter(Boolean).map((f: string) => `<li class="flex items-start gap-2 text-sm" style="color:${t.foreground}"><span style="color:${t.accent}">✓</span><span>${escapeHtml(f)}</span></li>`).join("\n");
    const highlight = tier.highlighted;
    const priceAttrs = opts.monthly ? ` data-monthly="${escapeHtml(opts.monthly)}" data-yearly="${escapeHtml(opts.yearly || opts.monthly)}" data-monthly-per="/mo" data-yearly-per="/yr"` : "";
    return `<div class="${highlight ? 'lf-pricing-highlight lf-card' : 'lf-card'} relative flex flex-col rounded-xl p-6" style="border-color:${highlight ? t.accent : t.border};border-radius:${t.radius}${highlight ? `;box-shadow:0 20px 50px -15px ${t.accent}50;transform:scale(1.03)` : ""}">${highlight ? `<div class="lf-eyebrow" style="position:absolute;top:-.75rem;left:50%;transform:translateX(-50%);background:${t.accent};color:${t.accentFg};padding:.3rem .9rem;border-radius:9999px;font-weight:600">Most popular</div>` : ""}<h3 class="text-lg font-semibold" style="color:${t.foreground}">${escapeHtml(tier.name)}</h3>${tier.description ? `<p class="mt-1 text-sm" style="color:${t.mutedFg}">${escapeHtml(tier.description)}</p>` : ""}<div class="mt-4 flex items-baseline gap-1"><span class="lf-price text-4xl font-bold tracking-tight" style="color:${t.foreground};font-weight:600"${priceAttrs}>${escapeHtml(opts.monthly || `${c.currency}${tier.price}`)}</span><span class="lf-per text-sm" style="color:${t.mutedFg}">${escapeHtml(c.period)}</span></div><ul class="mt-6 flex flex-1 flex-col gap-2.5">${features}</ul>${tier.ctaLabel ? `<a href="${escapeHtml(tier.ctaHref)}" class="lf-btn ${highlight ? 'lf-btn-primary' : 'lf-btn-secondary'} mt-6 inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold" style="${highlight ? `color:${t.accentFg}` : `color:${t.foreground}`}">${escapeHtml(tier.ctaLabel)}</a>` : ""}</div>`;
  };
  if (style === "single") {
    const tier = (c.tiers || [])[0] || {};
    const features = (tier.features ?? "").split("\n").filter(Boolean).map((f: string) => `<li class="flex items-start gap-2 text-sm" style="color:${t.foreground}"><span style="color:${t.accent}">✓</span><span>${escapeHtml(f)}</span></li>`).join("\n");
    return `<section id="pricing" class="px-6 py-20 sm:py-32" style="background:${t.background}"><div class="mx-auto max-w-6xl">${head}<div class="lf-reveal"><div class="lf-offer-card">${c.urgencyBadge ? `<div class="lf-offer-urgency">${escapeHtml(c.urgencyBadge)}</div>` : ""}${tier.name ? `<h3 class="text-lg font-semibold" style="color:${t.foreground}">${escapeHtml(tier.name)}</h3>` : ""}${c.originalPrice ? `<span class="lf-offer-original">${escapeHtml(c.currency)}${escapeHtml(c.originalPrice)}</span>` : ""}<div class="flex items-baseline justify-center gap-1" style="margin:.5rem 0 1rem"><span class="text-5xl font-bold tracking-tight" style="color:${t.foreground};font-weight:600">${escapeHtml(c.currency)}${escapeHtml(tier.price)}</span><span class="text-sm" style="color:${t.mutedFg}">${escapeHtml(c.period)}</span></div>${tier.description ? `<p class="text-sm" style="color:${t.mutedFg}">${escapeHtml(tier.description)}</p>` : ""}<ul class="mx-auto mt-6 flex max-w-sm flex-col gap-2.5 text-left">${features}</ul>${tier.ctaLabel ? `<a href="${escapeHtml(tier.ctaHref)}" class="lf-btn lf-btn-primary mt-8 inline-flex w-full items-center justify-center rounded-md px-5 py-3 text-base font-semibold" style="color:${t.accentFg}">${escapeHtml(tier.ctaLabel)}</a>` : ""}${c.guaranteeNote ? `<p class="mt-4 text-xs" style="color:${t.mutedFg}">${escapeHtml(c.guaranteeNote)}</p>` : ""}</div></div></div></section>`;
  }
  if (style === "toggle") {
    const saveBadge = c.saveBadge ? `<span class="lf-save-badge">${escapeHtml(c.saveBadge)}</span>` : "";
    const monthly = c.toggleMonthlyLabel || "Monthly";
    const yearly = c.toggleYearlyLabel || "Yearly";
    return `<section id="pricing" class="px-6 py-20 sm:py-32" style="background:${t.background}"><div class="mx-auto max-w-6xl">${head}<div style="text-align:center"><div class="lf-billing-toggle"><button type="button" class="lf-billing-btn lf-active" data-period="monthly">${escapeHtml(monthly)}</button><button type="button" class="lf-billing-btn" data-period="yearly">${escapeHtml(yearly)}${saveBadge}</button></div></div><div class="lf-reveal-stagger grid gap-6 md:grid-cols-3">${(c.tiers || []).map((tier: any) => tierCard(tier, { monthly: `${c.currency}${tier.price}`, yearly: tier.yearlyPrice ? `${c.currency}${tier.yearlyPrice}` : undefined })).join("\n")}</div></div></section>`;
  }
  return `<section id="pricing" class="px-6 py-20 sm:py-32" style="background:${t.background}"><div class="mx-auto max-w-6xl">${head}<div class="lf-reveal-stagger grid gap-6 md:grid-cols-3">${(c.tiers || []).map((tier: any) => tierCard(tier)).join("\n")}</div></div></section>`;
}

function renderFaq(c: any, t: ThemeTokens): string {
  const title = `<div class="mb-10 text-center">${c.title ? `<h2 class="text-3xl font-bold tracking-tight sm:text-4xl" style="color:${t.foreground}">${escapeHtml(c.title)}</h2>` : ""}${c.subtitle ? `<p class="mt-4 text-lg" style="color:${t.mutedFg}">${escapeHtml(c.subtitle)}</p>` : ""}</div>`;
  if (c.style === "cards") {
    const cards = (c.items || []).map((it: any) => `<div class="lf-faq-card"><h3 class="mb-2 text-base font-semibold" style="color:${t.foreground}">${escapeHtml(it.question)}</h3><p class="text-sm leading-relaxed" style="color:${t.mutedFg}">${escapeHtml(it.answer)}</p></div>`).join("\n");
    return `<section id="faq" class="px-6 py-16 sm:py-24" style="background:${t.background}"><div class="mx-auto max-w-6xl">${title}<div class="lf-faq-cards lf-reveal-stagger">${cards}</div></div></section>`;
  }
  const items = (c.items || []).map((it: any, i: number) => `<details class="overflow-hidden rounded-xl border" style="border-color:${t.border};background:${t.background};border-radius:${t.radius}"${i === 0 ? " open" : ""}><summary class="flex w-full items-center justify-between gap-4 px-5 py-4 font-semibold" style="color:${t.foreground};list-style:none;cursor:pointer">${escapeHtml(it.question)}<span style="color:${t.mutedFg}">▾</span></summary><p class="px-5 pb-4 text-sm leading-relaxed" style="color:${t.mutedFg}">${escapeHtml(it.answer)}</p></details>`).join("\n");
  return `<section id="faq" class="px-6 py-16 sm:py-24" style="background:${t.background}"><div class="mx-auto max-w-3xl">${title}<div class="flex flex-col gap-3">${items}</div></div></section>`;
}

function renderCta(c: any, t: ThemeTokens): string {
  const bg = c.variant === "gradient" ? `linear-gradient(135deg, ${t.primary} 0%, ${t.accent} 100%)` : c.variant === "muted" ? t.muted : t.primary;
  const fg = c.variant === "muted" ? t.foreground : t.primaryFg;
  const mutedFg = c.variant === "muted" ? t.mutedFg : "rgba(255,255,255,0.85)";
  return `<section class="px-6 py-20 sm:py-32" style="background:${t.background}"><div class="mx-auto max-w-5xl"><div class="lf-reveal rounded-2xl px-8 py-16 text-center sm:px-16 sm:py-20" style="background:${bg};color:${fg};border-radius:${t.radius};box-shadow:0 20px 60px -20px color-mix(in srgb,var(--lf-accent) 40%,transparent)">${c.eyebrow ? `<p class="lf-eyebrow mb-4" style="color:${mutedFg}">${escapeHtml(c.eyebrow)}</p>` : ""}<h2 class="text-3xl font-bold tracking-tight sm:text-4xl" style="color:${fg};font-weight:600">${escapeHtml(c.title)}</h2>${c.subtitle ? `<p class="mx-auto mt-4 max-w-2xl text-base sm:text-lg" style="color:${mutedFg};line-height:1.7">${escapeHtml(c.subtitle)}</p>` : ""}${(c.primaryCtaLabel || c.secondaryCtaLabel) ? `<div class="mt-8 flex flex-wrap justify-center gap-3">${c.primaryCtaLabel ? `<a href="${escapeHtml(c.primaryCtaHref)}" class="lf-btn inline-flex items-center rounded-md px-5 py-2.5 text-sm font-semibold" style="background:${t.background};color:${t.foreground};box-shadow:0 4px 14px rgba(0,0,0,0.15)">${escapeHtml(c.primaryCtaLabel)}</a>` : ""}${c.secondaryCtaLabel ? `<a href="${escapeHtml(c.secondaryCtaHref)}" class="lf-btn lf-btn-secondary inline-flex items-center rounded-md px-5 py-2.5 text-sm font-semibold" style="border-color:rgba(255,255,255,.3);color:${fg}">${escapeHtml(c.secondaryCtaLabel)}</a>` : ""}</div>` : ""}</div></div></section>`;
}

function renderNewsletter(c: any, t: ThemeTokens): string {
  return `<section id="waitlist" class="px-6 py-16 sm:py-24" style="background:${t.muted}"><div class="mx-auto max-w-2xl text-center"><h2 class="text-3xl font-bold tracking-tight sm:text-4xl" style="color:${t.foreground}">${escapeHtml(c.title)}</h2>${c.subtitle ? `<p class="mt-4 text-base sm:text-lg" style="color:${t.mutedFg}">${escapeHtml(c.subtitle)}</p>` : ""}<form class="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row" onsubmit="event.preventDefault();this.querySelector('button').textContent='Subscribed ✓'"><input type="email" placeholder="${escapeHtml(c.placeholder ?? "you@email.com")}" class="flex-1 rounded-md border px-4 py-2.5 text-sm" style="border-color:${t.border};background:${t.background};color:${t.foreground}" /><button type="submit" class="inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-105" style="background:${t.primary};color:${t.primaryFg}">${escapeHtml(c.buttonLabel ?? "Subscribe")}</button></form>${c.footnote ? `<p class="mt-4 text-xs" style="color:${t.mutedFg}">${escapeHtml(c.footnote)}</p>` : ""}</div></section>`;
}

function renderFooter(c: any, t: ThemeTokens): string {
  const cols = (c.columns || []).map((col: any) => `<div><h4 class="mb-3 text-xs font-semibold uppercase tracking-wider" style="color:${t.foreground}">${escapeHtml(col.title)}</h4><ul class="flex flex-col gap-2">${(col.links || []).map((l: any) => `<li><a href="${escapeHtml(l.href)}" class="text-sm" style="color:${t.mutedFg}">${escapeHtml(l.label)}</a></li>`).join("")}</ul></div>`).join("\n");
  return `<footer class="border-t px-6 py-12" style="background:${t.background};border-color:${t.border}"><div class="mx-auto max-w-6xl"><div class="grid gap-8 md:grid-cols-4"><div><div class="flex items-center gap-2"><div style="display:grid;place-items:center;width:1.75rem;height:1.75rem;border-radius:.375rem;background:${t.primary};color:${t.primaryFg};font-weight:700">${escapeHtml(c.brand?.[0]?.toUpperCase() ?? "A")}</div><span class="font-semibold" style="color:${t.foreground}">${escapeHtml(c.brand)}</span></div>${c.tagline ? `<p class="mt-3 text-sm" style="color:${t.mutedFg};max-width:24rem">${escapeHtml(c.tagline)}</p>` : ""}</div>${cols}</div>${c.copyright ? `<div class="mt-10 border-t pt-6 text-center text-xs" style="border-color:${t.border};color:${t.mutedFg}">${escapeHtml(c.copyright)}</div>` : ""}</div></footer>`;
}

// Phase 2A: String renderers for new sections

function renderAnnouncement(c: any, t: ThemeTokens): string {
  const bg = c.bgColor || t.primary;
  const fg = c.textColor || t.primaryFg;
  if (c.variant === "ticker") {
    const items = Array(5).fill(`<span class="mx-8 text-sm font-medium">${escapeHtml(c.message)} ${c.linkLabel ? `<a href="${escapeHtml(c.linkHref)}" class="underline ml-2">${escapeHtml(c.linkLabel)}</a>` : ""}</span>`).join("");
    return `<div class="overflow-hidden py-2" style="background:${bg};color:${fg}"><div style="display:inline-block;white-space:nowrap;animation:lfTicker 20s linear infinite">${items}</div></div>`;
  }
  if (c.variant === "countdown") {
    const cd = `<div class="lf-countdown" data-target="${escapeHtml(c.countdownDate || "")}"><div class="lf-cd-box"><span class="lf-cd-num" data-cd="d">00</span><span class="lf-cd-lbl">days</span></div><div class="lf-cd-box"><span class="lf-cd-num" data-cd="h">00</span><span class="lf-cd-lbl">hrs</span></div><div class="lf-cd-box"><span class="lf-cd-num" data-cd="m">00</span><span class="lf-cd-lbl">min</span></div><div class="lf-cd-box"><span class="lf-cd-num" data-cd="s">00</span><span class="lf-cd-lbl">sec</span></div></div>`;
    return `<div class="flex flex-wrap items-center justify-center gap-3 py-2 px-6 text-center" style="background:${bg};color:${fg}"><span class="text-sm font-medium">${escapeHtml(c.message)}</span>${cd}${c.linkLabel ? `<a href="${escapeHtml(c.linkHref)}" class="text-sm font-semibold underline">${escapeHtml(c.linkLabel)} →</a>` : ""}</div>`;
  }
  return `<div class="flex items-center justify-center gap-3 py-2 px-6 text-center" style="background:${bg};color:${fg}"><span class="text-sm font-medium">${escapeHtml(c.message)}</span>${c.linkLabel ? `<a href="${escapeHtml(c.linkHref)}" class="text-sm font-semibold underline ml-2">${escapeHtml(c.linkLabel)} →</a>` : ""}</div>`;
}

function renderProblem(c: any, t: ThemeTokens): string {
  const head = `<div class="mb-12 text-center">${c.eyebrow ? `<p class="mb-3 text-sm font-semibold uppercase tracking-wider" style="color:${t.accent}">${escapeHtml(c.eyebrow)}</p>` : ""}<h2 class="text-3xl font-bold tracking-tight" style="color:${t.foreground}">${escapeHtml(c.title)}</h2>${c.subtitle ? `<p class="mt-4 text-lg" style="color:${t.mutedFg}">${escapeHtml(c.subtitle)}</p>` : ""}</div>`;
  if (c.style === "tabs") {
    const tabs = (c.items || []).map((item: any, i: number) => `<button type="button" class="lf-tab-btn${i === 0 ? " lf-active" : ""}">${escapeHtml(item.title)}</button>`).join("");
    const panels = (c.items || []).map((item: any, i: number) => `<div class="lf-tab-panel${i === 0 ? " lf-active" : ""}"><div class="mx-auto max-w-2xl rounded-xl border p-8 text-center" style="border-color:${t.border};background:${t.background};border-radius:${t.radius}"><h3 class="mb-3 text-2xl font-semibold" style="color:${t.foreground}">${escapeHtml(item.title)}</h3>${item.description ? `<p class="text-base leading-relaxed" style="color:${t.mutedFg}">${escapeHtml(item.description)}</p>` : ""}</div></div>`).join("\n");
    return `<section class="px-6 py-24" style="background:${t.muted}"><div class="mx-auto max-w-4xl">${head}<div class="lf-tabs">${tabs}</div>${panels}</div></section>`;
  }
  const items = (c.items || []).map((item: any) => `<div class="rounded-xl border p-6" style="border-color:${t.border};background:${t.background};border-radius:${t.radius}"><h3 class="mb-2 text-lg font-semibold" style="color:${t.foreground}">${escapeHtml(item.title)}</h3>${item.description ? `<p class="text-sm" style="color:${t.mutedFg}">${escapeHtml(item.description)}</p>` : ""}</div>`).join("\n");
  return `<section class="px-6 py-24" style="background:${t.muted}"><div class="mx-auto max-w-4xl">${head}<div class="grid gap-4 md:grid-cols-3">${items}</div></div></section>`;
}

function renderSolution(c: any, t: ThemeTokens): string {
  const items = (c.items || []).map((item: any) => `<div class="rounded-xl border p-6" style="border-color:${t.border};background:${t.muted};border-radius:${t.radius}"><h3 class="mb-2 text-lg font-semibold" style="color:${t.foreground}">${escapeHtml(item.title)}</h3>${item.description ? `<p class="text-sm" style="color:${t.mutedFg}">${escapeHtml(item.description)}</p>` : ""}</div>`).join("\n");
  return `<section class="px-6 py-24" style="background:${t.background}"><div class="mx-auto max-w-4xl"><div class="mb-12 text-center">${c.eyebrow ? `<p class="mb-3 text-sm font-semibold uppercase tracking-wider" style="color:${t.accent}">${escapeHtml(c.eyebrow)}</p>` : ""}<h2 class="text-3xl font-bold tracking-tight" style="color:${t.foreground}">${escapeHtml(c.title)}</h2>${c.subtitle ? `<p class="mt-4 text-lg" style="color:${t.mutedFg}">${escapeHtml(c.subtitle)}</p>` : ""}</div><div class="grid gap-4 md:grid-cols-3">${items}</div></div></section>`;
}

function getVideoEmbedUrl(url: string): string {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return url;
}

function renderVideo(c: any, t: ThemeTokens): string {
  const embed = c.videoUrl ? getVideoEmbedUrl(c.videoUrl) : "";
  const variant = c.variant || "centered";
  if (variant === "cinematic") {
    return `<section class="lf-video-cinematic">${embed ? `<iframe src="${escapeHtml(embed)}" title="${escapeHtml(c.title || "Video")}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe><div class="lf-video-veil"></div>` : `<div class="lf-video-veil" style="background:${t.primary}"></div>`}<div class="lf-video-content">${c.title ? `<h2>${escapeHtml(c.title)}</h2>` : ""}${c.subtitle ? `<p>${escapeHtml(c.subtitle)}</p>` : ""}</div></section>`;
  }
  const inner = `<div class="overflow-hidden rounded-xl shadow-xl" style="border-radius:${t.radius}"><div class="relative aspect-video" style="background:${t.muted}">${embed ? `<iframe src="${escapeHtml(embed)}" class="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="${escapeHtml(c.title || "Video")}"></iframe>` : ""}</div></div>`;
  const head = (c.title || c.subtitle) ? `<div><h2 class="mb-4 text-3xl font-bold tracking-tight sm:text-4xl" style="color:${t.foreground}">${escapeHtml(c.title)}</h2>${c.subtitle ? `<p class="text-lg" style="color:${t.mutedFg}">${escapeHtml(c.subtitle)}</p>` : ""}</div>` : "";
  if (variant === "split-left" || variant === "split-right") {
    return `<section class="px-6 py-24" style="background:${t.background}"><div class="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2 ${variant === "split-right" ? "md:[&>*:first-child]:order-2" : ""}">${head}${inner}</div></section>`;
  }
  if (variant === "full") {
    return `<section class="py-0" style="background:${t.background}"><div class="w-full">${inner}</div></section>`;
  }
  return `<section class="px-6 py-24" style="background:${t.background}"><div class="mx-auto max-w-4xl">${(c.title || c.subtitle) ? `<div class="mb-8 text-center">${c.title ? `<h2 class="mb-3 text-3xl font-bold tracking-tight" style="color:${t.foreground}">${escapeHtml(c.title)}</h2>` : ""}${c.subtitle ? `<p class="text-lg" style="color:${t.mutedFg}">${escapeHtml(c.subtitle)}</p>` : ""}</div>` : ""}${inner}</div></section>`;
}

function renderComparison(c: any, t: ThemeTokens): string {
  // "yes"/"no" values render as colored check/cross icons (LandingForge matrix style);
  // anything else renders as text.
  const cell = (v: string, kind: "you" | "them") => {
    const s = String(v ?? "").trim().toLowerCase();
    if (s === "yes" || s === "✓" || s === "true") return `<span class="lf-cmp-yes">✓</span>`;
    if (s === "no" || s === "—" || s === "-" || s === "false" || s === "") return `<span class="lf-cmp-no">✗</span>`;
    return `<span style="color:${kind === "you" ? t.accent : t.mutedFg}">${escapeHtml(v)}</span>`;
  };
  const rows = (c.features || []).map((f: any, i: number) => `<tr style="border-top:1px solid ${t.border};background:${i % 2 === 0 ? t.background : "transparent"}"><td class="px-4 py-3 text-sm" style="color:${t.foreground}">${escapeHtml(f.label)}</td><td class="px-4 py-3 text-center text-sm font-semibold">${cell(f.you, "you")}</td><td class="px-4 py-3 text-center text-sm">${cell(f.competitor, "them")}</td></tr>`).join("");
  return `<section class="px-6 py-24" style="background:${t.muted}"><div class="mx-auto max-w-3xl"><div class="mb-10 text-center">${c.title ? `<h2 class="text-3xl font-bold tracking-tight" style="color:${t.foreground}">${escapeHtml(c.title)}</h2>` : ""}${c.subtitle ? `<p class="mt-4 text-lg" style="color:${t.mutedFg}">${escapeHtml(c.subtitle)}</p>` : ""}</div><div class="overflow-hidden rounded-xl border" style="border-color:${t.border};border-radius:${t.radius}"><table class="w-full"><thead><tr style="background:${t.background}"><th class="px-4 py-3 text-left text-sm font-semibold" style="color:${t.foreground}">Feature</th><th class="px-4 py-3 text-center text-sm font-semibold" style="color:${t.accent}">${escapeHtml(c.youName || "You")}</th><th class="px-4 py-3 text-center text-sm font-semibold" style="color:${t.mutedFg}">${escapeHtml(c.competitorName || "Others")}</th></tr></thead><tbody>${rows}</tbody></table></div></div></section>`;
}

function renderGuarantee(c: any, t: ThemeTokens): string {
  return `<section class="px-6 py-12" style="background:${t.muted}"><div class="mx-auto max-w-3xl"><div class="flex flex-col items-center gap-6 rounded-2xl border-2 border-dashed p-8 text-center sm:flex-row sm:text-left" style="border-color:${t.accent};border-radius:${t.radius}"><div class="grid h-16 w-16 shrink-0 place-items-center rounded-full" style="background:${t.accent};color:${t.accentFg}">${renderIconSvg(c.icon || "ShieldCheck", "h-8 w-8")}</div><div class="flex-1"><div class="mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider" style="background:${t.accent};color:${t.accentFg}">${escapeHtml(c.badge)}</div><h3 class="text-xl font-bold" style="color:${t.foreground}">${escapeHtml(c.title)}</h3>${c.description ? `<p class="mt-2 text-sm" style="color:${t.mutedFg}">${escapeHtml(c.description)}</p>` : ""}</div></div></div></section>`;
}

function renderContactForm(c: any, t: ThemeTokens): string {
  // Real form handling (LandingForge v21): Google Sheets Web App POST, FormSubmit.co
  // email delivery, or a demo toast. Configured per-section; honeypot included.
  const formType = c.formType || "demo";
  const attrs = `data-lf-form="${formType}"${c.webappUrl ? ` data-webapp-url="${escapeHtml(c.webappUrl)}"` : ""}${c.emailRecipient ? ` data-email-recipient="${escapeHtml(c.emailRecipient)}"` : ""}${c.emailSubject ? ` data-email-subject="${escapeHtml(c.emailSubject)}"` : ""}${c.redirectUrl ? ` data-redirect-url="${escapeHtml(c.redirectUrl)}"` : ""} data-success-msg="${escapeHtml(c.successMsg || "Thank you! Your message has been sent.")}"`;
  const field = (name: string, label: string, type = "text", required = true) => `<div><label class="mb-1 block text-xs font-medium" for="lf-${name}" style="color:${t.foreground}">${escapeHtml(label)}${required ? "" : ` <span style="opacity:.5">(optional)</span>`}</label><input id="lf-${name}" type="${type}" name="${name}"${required ? " required" : ""} class="w-full rounded-md border px-4 py-2.5 text-sm" style="border-color:${t.border};background:${t.background};color:${t.foreground}" /></div>`;
  return `<section class="px-6 py-24" style="background:${t.background}"><div class="mx-auto max-w-2xl">${(c.title || c.subtitle) ? `<div class="mb-8 text-center">${c.title ? `<h2 class="mb-3 text-3xl font-bold tracking-tight" style="color:${t.foreground}">${escapeHtml(c.title)}</h2>` : ""}${c.subtitle ? `<p class="text-lg" style="color:${t.mutedFg}">${escapeHtml(c.subtitle)}</p>` : ""}</div>` : ""}<div class="lf-form rounded-xl border p-8" style="border-color:${t.border};border-radius:${t.radius}"><form class="flex flex-col gap-4" ${attrs}>${field("name", c.nameLabel || "Name")}${field("email", c.emailLabel || "Email", "email")}${c.showPhone ? field("phone", c.phoneLabel || "Phone", "tel", false) : ""}${c.showCompany ? field("company", c.companyLabel || "Company", "text", false) : ""}<div><label class="mb-1 block text-xs font-medium" for="lf-message" style="color:${t.foreground}">${escapeHtml(c.messageLabel || "Message")}</label><textarea id="lf-message" name="message" rows="4" required class="w-full rounded-md border px-4 py-2.5 text-sm" style="border-color:${t.border};background:${t.background};color:${t.foreground}"></textarea></div><input type="text" name="_honey" class="lf-honey" tabindex="-1" autocomplete="off" aria-hidden="true" /><button type="submit" class="lf-btn lf-btn-primary inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold" style="color:${t.primaryFg}">${escapeHtml(c.buttonLabel || "Send")}</button></form></div></div></section>`;
}

function renderLegal(c: any, t: ThemeTokens): string {
  const replacePlaceholders = (text: string) => text.replace(/\{\{company\}\}/g, c.companyName || "the Company").replace(/\{\{email\}\}/g, c.contactEmail || "support@example.com").replace(/\{\{date\}\}/g, c.lastUpdated || new Date().toISOString().split("T")[0]);
  const paragraphs = (c.content || "").split("\n").filter(Boolean).map(replacePlaceholders);
  const paraHtml = paragraphs.map((p: string) => `<p class="text-sm leading-relaxed" style="color:${t.foreground}">${escapeHtml(p)}</p>`).join("\n");
  return `<section class="px-6 py-24" style="background:${t.background}"><div class="mx-auto max-w-3xl"><div class="mb-8">${c.title ? `<h1 class="mb-2 text-3xl font-bold tracking-tight" style="color:${t.foreground}">${escapeHtml(c.title)}</h1>` : ""}${c.lastUpdated ? `<p class="text-sm" style="color:${t.mutedFg}">Last updated: ${escapeHtml(c.lastUpdated)}</p>` : ""}</div><div class="space-y-4">${paraHtml}</div>${c.contactEmail ? `<div class="mt-10 border-t pt-6" style="border-color:${t.border}"><p class="text-sm" style="color:${t.mutedFg}">Questions? Email us at <a href="mailto:${escapeHtml(c.contactEmail)}" class="font-semibold underline" style="color:${t.accent}">${escapeHtml(c.contactEmail)}</a></p></div>` : ""}</div></section>`;
}
