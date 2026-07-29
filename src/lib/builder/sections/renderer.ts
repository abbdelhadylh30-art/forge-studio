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
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<meta name="generator" content="Forge Studio" />
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
.lf-stat-value{font-variant-numeric:tabular-nums}`;
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
  const links = (c.links || []).map((l: any) => `<a href="${escapeHtml(l.href)}" style="color:${t.foreground}">${escapeHtml(l.label)}</a>`).join("\n");
  return `<header class="border-b" style="background:${c.transparent ? "transparent" : t.background};border-color:${t.border};position:${c.sticky ? "sticky" : "relative"};top:0;z-index:30">
  <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
    <div class="flex items-center gap-2">
      ${c.logoUrl ? `<img src="${escapeHtml(c.logoUrl)}" alt="${escapeHtml(c.brand)}" style="height:1.75rem" />` : `<div style="display:grid;place-items:center;width:1.75rem;height:1.75rem;border-radius:.375rem;background:${t.primary};color:${t.primaryFg};font-weight:700">${escapeHtml(c.brand?.[0]?.toUpperCase() ?? "A")}</div>`}
      <span class="font-semibold" style="color:${t.foreground}">${escapeHtml(c.brand)}</span>
    </div>
    <nav class="hidden items-center gap-6 md:flex">${links}</nav>
    ${c.ctaLabel ? `<a href="${escapeHtml(c.ctaHref)}" class="inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold" style="background:${t.primary};color:${t.primaryFg}">${escapeHtml(c.ctaLabel)}</a>` : ""}
  </div>
</header>`;
}

function renderHero(c: any, t: ThemeTokens): string {
  const isSplit = c.variant !== "centered";
  const text = `<div class="lf-reveal flex flex-col gap-5 ${c.align === "center" ? "items-center text-center" : "items-start text-left"}">
    ${c.eyebrow ? `<span class="lf-eyebrow inline-flex items-center rounded-full px-3 py-1" style="background:${t.muted};color:${t.mutedFg}">${escapeHtml(c.eyebrow)}</span>` : ""}
    <h1 class="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl" style="color:${t.foreground};font-weight:600">${escapeHtml(c.headline)}</h1>
    ${c.subhead ? `<p class="max-w-2xl text-base sm:text-lg" style="color:${t.mutedFg};line-height:1.7">${escapeHtml(c.subhead)}</p>` : ""}
    <div class="mt-2 flex flex-wrap gap-3 ${c.align === "center" ? "justify-center" : ""}">
      ${c.primaryCtaLabel ? `<a href="${escapeHtml(c.primaryCtaHref)}" class="lf-btn lf-btn-primary inline-flex items-center rounded-md px-5 py-2.5 text-sm font-semibold" style="color:${t.primaryFg}">${escapeHtml(c.primaryCtaLabel)}</a>` : ""}
      ${c.secondaryCtaLabel ? `<a href="${escapeHtml(c.secondaryCtaHref)}" class="lf-btn lf-btn-secondary inline-flex items-center rounded-md px-5 py-2.5 text-sm font-semibold" style="color:${t.foreground}">${escapeHtml(c.secondaryCtaLabel)}</a>` : ""}
    </div>
  </div>`;
  return `<section class="px-6 py-20 sm:py-32" style="background:${t.background}">
    <div class="mx-auto max-w-6xl">
      ${isSplit ? `<div class="grid items-center gap-12 md:grid-cols-2">${text}${c.imageUrl ? `<div class="lf-reveal lf-hero-tilt"><img src="${escapeHtml(c.imageUrl)}" alt="" class="lf-hero-img w-full rounded-xl shadow-2xl" style="border-radius:${t.radius}" /></div>` : `<div class="lf-reveal grid aspect-video w-full place-items-center rounded-xl shadow-xl" style="background:${t.muted};border-radius:${t.radius}"><span class="text-sm" style="color:${t.mutedFg}">Image placeholder</span></div>`}</div>` : `<div class="flex flex-col items-center text-center">${text}</div>`}
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
  const images = (c.images || []).map((img: any) => `<figure class="overflow-hidden rounded-xl" style="border-radius:${t.radius}"><div class="relative overflow-hidden" style="aspect-ratio:4/3;background:${t.muted}"><img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.caption ?? "")}" class="w-full h-full object-cover" /></div>${img.caption ? `<figcaption class="mt-2 text-sm" style="color:${t.mutedFg}">${escapeHtml(img.caption)}</figcaption>` : ""}</figure>`).join("\n");
  return `<section id="work" class="px-6 py-16 sm:py-24" style="background:${t.background}"><div class="mx-auto max-w-6xl">${c.title ? `<h2 class="mb-10 text-center text-3xl font-bold tracking-tight sm:text-4xl" style="color:${t.foreground}">${escapeHtml(c.title)}</h2>` : ""}<div class="grid gap-4" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">${images}</div></div></section>`;
}

function renderTestimonials(c: any, t: ThemeTokens): string {
  const items = (c.items || []).map((it: any) => `<figure class="lf-card flex flex-col gap-4 rounded-xl p-6" style="border-color:${t.border};border-radius:${t.radius}"><blockquote class="text-base leading-relaxed" style="color:${t.foreground};font-size:1.05rem;line-height:1.7">&ldquo;${escapeHtml(it.quote)}&rdquo;</blockquote><figcaption class="mt-auto flex items-center gap-3">${it.avatar ? `<img src="${escapeHtml(it.avatar)}" alt="${escapeHtml(it.name)}" class="h-10 w-10 rounded-full object-cover" />` : `<div class="grid h-10 w-10 place-items-center rounded-full text-sm font-bold" style="background:${t.primary};color:${t.primaryFg}">${escapeHtml(it.name?.[0]?.toUpperCase())}</div>`}<div><div class="text-sm font-semibold" style="color:${t.foreground}">${escapeHtml(it.name)}</div>${it.role ? `<div class="text-xs" style="color:${t.mutedFg}">${escapeHtml(it.role)}</div>` : ""}</div></figcaption></figure>`).join("\n");
  return `<section id="testimonials" class="px-6 py-20 sm:py-32" style="background:${t.muted}"><div class="mx-auto max-w-6xl">${c.title ? `<h2 class="lf-reveal mb-16 text-center text-3xl font-bold tracking-tight sm:text-4xl" style="color:${t.foreground};font-weight:600">${escapeHtml(c.title)}</h2>` : ""}<div class="lf-reveal-stagger grid gap-6 md:grid-cols-3">${items}</div></div></section>`;
}

function renderPricing(c: any, t: ThemeTokens): string {
  const tiers = (c.tiers || []).map((tier: any) => {
    const features = (tier.features ?? "").split("\n").filter(Boolean).map((f: string) => `<li class="flex items-start gap-2 text-sm" style="color:${t.foreground}"><span style="color:${t.accent}">✓</span><span>${escapeHtml(f)}</span></li>`).join("\n");
    const highlight = tier.highlighted;
    return `<div class="${highlight ? 'lf-pricing-highlight lf-card' : 'lf-card'} relative flex flex-col rounded-xl p-6" style="border-color:${highlight ? t.accent : t.border};border-radius:${t.radius}${highlight ? `;box-shadow:0 20px 50px -15px ${t.accent}50;transform:scale(1.03)` : ""}">${highlight ? `<div class="lf-eyebrow" style="position:absolute;top:-.75rem;left:50%;transform:translateX(-50%);background:${t.accent};color:${t.accentFg};padding:.3rem .9rem;border-radius:9999px;font-weight:600">Most popular</div>` : ""}<h3 class="text-lg font-semibold" style="color:${t.foreground}">${escapeHtml(tier.name)}</h3>${tier.description ? `<p class="mt-1 text-sm" style="color:${t.mutedFg}">${escapeHtml(tier.description)}</p>` : ""}<div class="mt-4 flex items-baseline gap-1"><span class="text-4xl font-bold tracking-tight" style="color:${t.foreground};font-weight:600">${escapeHtml(c.currency)}${escapeHtml(tier.price)}</span><span class="text-sm" style="color:${t.mutedFg}">${escapeHtml(c.period)}</span></div><ul class="mt-6 flex flex-1 flex-col gap-2.5">${features}</ul>${tier.ctaLabel ? `<a href="${escapeHtml(tier.ctaHref)}" class="lf-btn ${highlight ? 'lf-btn-primary' : 'lf-btn-secondary'} mt-6 inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold" style="${highlight ? `color:${t.accentFg}` : `color:${t.foreground}`}">${escapeHtml(tier.ctaLabel)}</a>` : ""}</div>`;
  }).join("\n");
  return `<section id="pricing" class="px-6 py-20 sm:py-32" style="background:${t.background}"><div class="mx-auto max-w-6xl"><div class="lf-reveal mx-auto mb-16 max-w-2xl text-center">${c.title ? `<h2 class="text-3xl font-bold tracking-tight sm:text-4xl" style="color:${t.foreground};font-weight:600">${escapeHtml(c.title)}</h2>` : ""}${c.subtitle ? `<p class="mt-4 text-lg" style="color:${t.mutedFg};line-height:1.7">${escapeHtml(c.subtitle)}</p>` : ""}</div><div class="lf-reveal-stagger grid gap-6 md:grid-cols-3">${tiers}</div></div></section>`;
}

function renderFaq(c: any, t: ThemeTokens): string {
  const items = (c.items || []).map((it: any, i: number) => `<details class="overflow-hidden rounded-xl border" style="border-color:${t.border};background:${t.background};border-radius:${t.radius}"${i === 0 ? " open" : ""}><summary class="flex w-full items-center justify-between gap-4 px-5 py-4 font-semibold" style="color:${t.foreground};list-style:none;cursor:pointer">${escapeHtml(it.question)}<span style="color:${t.mutedFg}">▾</span></summary><p class="px-5 pb-4 text-sm leading-relaxed" style="color:${t.mutedFg}">${escapeHtml(it.answer)}</p></details>`).join("\n");
  return `<section id="faq" class="px-6 py-16 sm:py-24" style="background:${t.background}"><div class="mx-auto max-w-3xl"><div class="mb-10 text-center">${c.title ? `<h2 class="text-3xl font-bold tracking-tight sm:text-4xl" style="color:${t.foreground}">${escapeHtml(c.title)}</h2>` : ""}${c.subtitle ? `<p class="mt-4 text-lg" style="color:${t.mutedFg}">${escapeHtml(c.subtitle)}</p>` : ""}</div><div class="flex flex-col gap-3">${items}</div></div></section>`;
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
  return `<div class="flex items-center justify-center gap-3 py-2 px-6 text-center" style="background:${bg};color:${fg}"><span class="text-sm font-medium">${escapeHtml(c.message)}</span>${c.linkLabel ? `<a href="${escapeHtml(c.linkHref)}" class="text-sm font-semibold underline ml-2">${escapeHtml(c.linkLabel)} →</a>` : ""}</div>`;
}

function renderProblem(c: any, t: ThemeTokens): string {
  const items = (c.items || []).map((item: any) => `<div class="rounded-xl border p-6" style="border-color:${t.border};background:${t.background};border-radius:${t.radius}"><h3 class="mb-2 text-lg font-semibold" style="color:${t.foreground}">${escapeHtml(item.title)}</h3>${item.description ? `<p class="text-sm" style="color:${t.mutedFg}">${escapeHtml(item.description)}</p>` : ""}</div>`).join("\n");
  return `<section class="px-6 py-24" style="background:${t.muted}"><div class="mx-auto max-w-4xl"><div class="mb-12 text-center">${c.eyebrow ? `<p class="mb-3 text-sm font-semibold uppercase tracking-wider" style="color:${t.accent}">${escapeHtml(c.eyebrow)}</p>` : ""}<h2 class="text-3xl font-bold tracking-tight" style="color:${t.foreground}">${escapeHtml(c.title)}</h2>${c.subtitle ? `<p class="mt-4 text-lg" style="color:${t.mutedFg}">${escapeHtml(c.subtitle)}</p>` : ""}</div><div class="grid gap-4 md:grid-cols-3">${items}</div></div></section>`;
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
  const inner = `<div class="overflow-hidden rounded-xl shadow-xl" style="border-radius:${t.radius}"><div class="relative aspect-video" style="background:${t.muted}">${embed ? `<iframe src="${escapeHtml(embed)}" class="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="${escapeHtml(c.title || "Video")}"></iframe>` : ""}</div></div>`;
  return `<section class="px-6 py-24" style="background:${t.background}"><div class="mx-auto max-w-4xl">${(c.title || c.subtitle) ? `<div class="mb-8 text-center">${c.title ? `<h2 class="mb-3 text-3xl font-bold tracking-tight" style="color:${t.foreground}">${escapeHtml(c.title)}</h2>` : ""}${c.subtitle ? `<p class="text-lg" style="color:${t.mutedFg}">${escapeHtml(c.subtitle)}</p>` : ""}</div>` : ""}${inner}</div></section>`;
}

function renderComparison(c: any, t: ThemeTokens): string {
  const rows = (c.features || []).map((f: any, i: number) => `<tr style="border-top:1px solid ${t.border};background:${i % 2 === 0 ? t.background : "transparent"}"><td class="px-4 py-3 text-sm" style="color:${t.foreground}">${escapeHtml(f.label)}</td><td class="px-4 py-3 text-center text-sm font-semibold" style="color:${t.accent}">${escapeHtml(f.you)}</td><td class="px-4 py-3 text-center text-sm" style="color:${t.mutedFg}">${escapeHtml(f.competitor)}</td></tr>`).join("");
  return `<section class="px-6 py-24" style="background:${t.muted}"><div class="mx-auto max-w-3xl"><div class="mb-10 text-center">${c.title ? `<h2 class="text-3xl font-bold tracking-tight" style="color:${t.foreground}">${escapeHtml(c.title)}</h2>` : ""}${c.subtitle ? `<p class="mt-4 text-lg" style="color:${t.mutedFg}">${escapeHtml(c.subtitle)}</p>` : ""}</div><div class="overflow-hidden rounded-xl border" style="border-color:${t.border};border-radius:${t.radius}"><table class="w-full"><thead><tr style="background:${t.background}"><th class="px-4 py-3 text-left text-sm font-semibold" style="color:${t.foreground}">Feature</th><th class="px-4 py-3 text-center text-sm font-semibold" style="color:${t.accent}">${escapeHtml(c.youName || "You")}</th><th class="px-4 py-3 text-center text-sm font-semibold" style="color:${t.mutedFg}">${escapeHtml(c.competitorName || "Others")}</th></tr></thead><tbody>${rows}</tbody></table></div></div></section>`;
}

function renderGuarantee(c: any, t: ThemeTokens): string {
  return `<section class="px-6 py-12" style="background:${t.muted}"><div class="mx-auto max-w-3xl"><div class="flex flex-col items-center gap-6 rounded-2xl border-2 border-dashed p-8 text-center sm:flex-row sm:text-left" style="border-color:${t.accent};border-radius:${t.radius}"><div class="grid h-16 w-16 shrink-0 place-items-center rounded-full" style="background:${t.accent};color:${t.accentFg}">${renderIconSvg(c.icon || "ShieldCheck", "h-8 w-8")}</div><div class="flex-1"><div class="mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider" style="background:${t.accent};color:${t.accentFg}">${escapeHtml(c.badge)}</div><h3 class="text-xl font-bold" style="color:${t.foreground}">${escapeHtml(c.title)}</h3>${c.description ? `<p class="mt-2 text-sm" style="color:${t.mutedFg}">${escapeHtml(c.description)}</p>` : ""}</div></div></div></section>`;
}

function renderContactForm(c: any, t: ThemeTokens): string {
  return `<section class="px-6 py-24" style="background:${t.background}"><div class="mx-auto max-w-2xl">${(c.title || c.subtitle) ? `<div class="mb-8 text-center">${c.title ? `<h2 class="mb-3 text-3xl font-bold tracking-tight" style="color:${t.foreground}">${escapeHtml(c.title)}</h2>` : ""}${c.subtitle ? `<p class="text-lg" style="color:${t.mutedFg}">${escapeHtml(c.subtitle)}</p>` : ""}</div>` : ""}<div class="rounded-xl border p-8" style="border-color:${t.border};border-radius:${t.radius}"><form class="flex flex-col gap-4" onsubmit="event.preventDefault()"><div><label class="mb-1 block text-xs font-medium" style="color:${t.foreground}">${escapeHtml(c.nameLabel || "Name")}</label><input type="text" class="w-full rounded-md border px-4 py-2.5 text-sm" style="border-color:${t.border};background:${t.background};color:${t.foreground}" /></div><div><label class="mb-1 block text-xs font-medium" style="color:${t.foreground}">${escapeHtml(c.emailLabel || "Email")}</label><input type="email" class="w-full rounded-md border px-4 py-2.5 text-sm" style="border-color:${t.border};background:${t.background};color:${t.foreground}" /></div><div><label class="mb-1 block text-xs font-medium" style="color:${t.foreground}">${escapeHtml(c.messageLabel || "Message")}</label><textarea rows="4" class="w-full rounded-md border px-4 py-2.5 text-sm" style="border-color:${t.border};background:${t.background};color:${t.foreground}"></textarea></div><button type="submit" class="inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold" style="background:${t.primary};color:${t.primaryFg}">${escapeHtml(c.buttonLabel || "Send")}</button></form></div></div></section>`;
}

function renderLegal(c: any, t: ThemeTokens): string {
  const replacePlaceholders = (text: string) => text.replace(/\{\{company\}\}/g, c.companyName || "the Company").replace(/\{\{email\}\}/g, c.contactEmail || "support@example.com").replace(/\{\{date\}\}/g, c.lastUpdated || new Date().toISOString().split("T")[0]);
  const paragraphs = (c.content || "").split("\n").filter(Boolean).map(replacePlaceholders);
  const paraHtml = paragraphs.map((p: string) => `<p class="text-sm leading-relaxed" style="color:${t.foreground}">${escapeHtml(p)}</p>`).join("\n");
  return `<section class="px-6 py-24" style="background:${t.background}"><div class="mx-auto max-w-3xl"><div class="mb-8">${c.title ? `<h1 class="mb-2 text-3xl font-bold tracking-tight" style="color:${t.foreground}">${escapeHtml(c.title)}</h1>` : ""}${c.lastUpdated ? `<p class="text-sm" style="color:${t.mutedFg}">Last updated: ${escapeHtml(c.lastUpdated)}</p>` : ""}</div><div class="space-y-4">${paraHtml}</div>${c.contactEmail ? `<div class="mt-10 border-t pt-6" style="border-color:${t.border}"><p class="text-sm" style="color:${t.mutedFg}">Questions? Email us at <a href="mailto:${escapeHtml(c.contactEmail)}" class="font-semibold underline" style="color:${t.accent}">${escapeHtml(c.contactEmail)}</a></p></div>` : ""}</div></section>`;
}
