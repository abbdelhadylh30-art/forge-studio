/**
 * LandingForge v4.0 — HTML/ZIP export
 * -----------------------------------
 * Takes the site blueprint (JSON) and produces either:
 *   - format=html: a self-contained .html file with inline CSS
 *   - format=zip:  a ZIP with index.html + styles.css + README.txt
 *
 * The HTML is built WITHOUT React — pure server-side string templating.
 * This keeps exports clean, dependency-free, and hostable anywhere.
 */

import { NextRequest, NextResponse } from "next/server";
import type { SiteData, ThemeTokens, PageData, SectionInstance } from "@/lib/builder/sections/types";
import { sanitizeFilename } from "@/lib/security/sanitize";

// Inline JSZip-like simple ZIP builder (no extra dep needed at runtime).
// We use a minimal ZIP writer that supports STORE (no compression) which
// is sufficient for static assets and works in every unzip client.
// (We hand-roll it because we can't add arbitrary deps at runtime.)

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !body.site) {
    return NextResponse.json({ error: "Missing site" }, { status: 400 });
  }
  const site: SiteData = body.site;
  const format: "html" | "zip" = body.format === "zip" ? "zip" : "html";

  // For a single-page export we render the home page (or first page).
  const page = site.pages.find((p) => p.isHome) ?? site.pages[0];
  if (!page) {
    return NextResponse.json({ error: "No pages to export" }, { status: 400 });
  }

  const html = renderSite(site, page);

  if (format === "html") {
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  // ZIP
  const css = extractCss(site.themeTokens);
  const readme = renderReadme(site);
  const indexHtml = renderSite(site, page, /* inlineCss */ false);
  const files: { name: string; data: Uint8Array }[] = [
    { name: "index.html", data: new TextEncoder().encode(indexHtml) },
    { name: "styles.css", data: new TextEncoder().encode(css) },
    { name: "README.txt", data: new TextEncoder().encode(readme) },
  ];
  const zipBytes = buildZip(files);
  const safeSlug = sanitizeFilename(site.slug || "site", "site");
  return new NextResponse(zipBytes as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${safeSlug}.zip"`,
    },
  });
}

function renderSite(site: SiteData, page: PageData, inlineCss = true): string {
  const css = extractCss(site.themeTokens);
  const body = page.sections.map((s) => renderSection(s, site.themeTokens)).join("\n");
  const title = page.seo?.title || `${site.name} — ${page.name}`;
  const description = page.seo?.description || site.description || "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<meta name="generator" content="LandingForge v4.0" />
${inlineCss ? `<style>\n${css}\n</style>` : `<link rel="stylesheet" href="styles.css" />`}
</head>
<body>
${body}
</body>
</html>`;
}

function extractCss(t: ThemeTokens): string {
  return `:root {
  --lf-primary: ${t.primary};
  --lf-primary-fg: ${t.primaryFg};
  --lf-accent: ${t.accent};
  --lf-accent-fg: ${t.accentFg};
  --lf-bg: ${t.background};
  --lf-fg: ${t.foreground};
  --lf-muted: ${t.muted};
  --lf-muted-fg: ${t.mutedFg};
  --lf-border: ${t.border};
  --lf-font: ${t.font};
  --lf-font-heading: ${t.fontHeading};
  --lf-radius: ${t.radius};
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  font-family: var(--lf-font);
  color: var(--lf-fg);
  background: var(--lf-bg);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
a { color: inherit; text-decoration: none; }
img { max-width: 100%; height: auto; display: block; }
button { font: inherit; cursor: pointer; border: none; background: none; }
.lf-section { width: 100%; }
.mx-auto { margin-left: auto; margin-right: auto; }
.max-w-6xl { max-width: 72rem; }
.max-w-5xl { max-width: 64rem; }
.max-w-3xl { max-width: 48rem; }
.max-w-2xl { max-width: 42rem; }
.max-w-md { max-width: 28rem; }
.px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
.py-4 { padding-top: 1rem; padding-bottom: 1rem; }
.py-12 { padding-top: 3rem; padding-bottom: 3rem; }
.py-16 { padding-top: 4rem; padding-bottom: 4rem; }
.py-24 { padding-top: 6rem; padding-bottom: 6rem; }
.mb-3 { margin-bottom: 0.75rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-8 { margin-bottom: 2rem; }
.mb-10 { margin-bottom: 2.5rem; }
.mb-12 { margin-bottom: 3rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-3 { margin-top: 0.75rem; }
.mt-4 { margin-top: 1rem; }
.mt-6 { margin-top: 1.5rem; }
.mt-8 { margin-top: 2rem; }
.mt-auto { margin-top: auto; }
.text-center { text-align: center; }
.text-sm { font-size: 0.875rem; }
.text-xs { font-size: 0.75rem; }
.text-base { font-size: 1rem; }
.text-lg { font-size: 1.125rem; }
.text-xl { font-size: 1.25rem; }
.text-2xl { font-size: 1.5rem; }
.text-3xl { font-size: 1.875rem; }
.text-4xl { font-size: 2.25rem; }
.text-5xl { font-size: 3rem; }
.text-6xl { font-size: 3.75rem; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.font-medium { font-weight: 500; }
.uppercase { text-transform: uppercase; }
.tracking-tight { letter-spacing: -0.025em; }
.tracking-wider { letter-spacing: 0.05em; }
.leading-tight { line-height: 1.2; }
.leading-relaxed { line-height: 1.7; }
.rounded { border-radius: var(--lf-radius); }
.rounded-md { border-radius: calc(var(--lf-radius) - 4px); }
.rounded-xl { border-radius: var(--lf-radius); }
.rounded-2xl { border-radius: calc(var(--lf-radius) + 4px); }
.rounded-full { border-radius: 9999px; }
.border { border: 1px solid var(--lf-border); }
.border-t { border-top: 1px solid var(--lf-border); }
.border-b { border-bottom: 1px solid var(--lf-border); }
.inline-flex { display: inline-flex; }
.flex { display: flex; }
.grid { display: grid; }
.hidden { display: none; }
.items-center { align-items: center; }
.items-start { align-items: flex-start; }
.items-baseline { align-items: baseline; }
.justify-between { justify-content: space-between; }
.justify-center { justify-content: center; }
.flex-col { flex-direction: column; }
.flex-wrap { flex-wrap: wrap; }
.gap-1 { gap: 0.25rem; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.gap-4 { gap: 1rem; }
.gap-6 { gap: 1.5rem; }
.gap-8 { gap: 2rem; }
.gap-10 { gap: 2.5rem; }
.gap-12 { gap: 3rem; }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
.shadow-sm { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.shadow-lg { box-shadow: 0 10px 30px -10px rgba(0,0,0,0.15); }
.shadow-xl { box-shadow: 0 20px 40px -10px rgba(0,0,0,0.2); }
.transition-all, .transition-transform, .transition-colors, .transition-opacity { transition: all 0.2s ease; }
.hover\\:scale-105:hover { transform: scale(1.05); }
.hover\\:opacity-70:hover { opacity: 0.7; }
.hover\\:shadow-lg:hover { box-shadow: 0 10px 30px -10px rgba(0,0,0,0.15); }
.opacity-70 { opacity: 0.7; }
.backdrop-blur-sm { backdrop-filter: blur(4px); }
.aspect-video { aspect-ratio: 16 / 9; }
.aspect-\\[4\\/3\\] { aspect-ratio: 4 / 3; }
.object-cover { object-fit: cover; }
.overflow-hidden { overflow: hidden; }
.cursor-pointer { cursor: pointer; }
.sticky { position: sticky; }
.relative { position: relative; }
.z-30 { z-index: 30; }
.top-0 { top: 0; }

/* Responsive: stack on small screens */
@media (max-width: 768px) {
  .md\\:grid-cols-2, .md\\:grid-cols-3, .lg\\:grid-cols-3, .lg\\:grid-cols-4 {
    grid-template-columns: 1fr;
  }
  .md\\:flex { display: flex; }
  .hidden { display: block; }
  .text-6xl { font-size: 2.5rem; }
  .text-5xl { font-size: 2.25rem; }
  .text-4xl { font-size: 1.75rem; }
}
`;
}

function renderSection(section: SectionInstance, theme: ThemeTokens): string {
  const cfg = section.config as any;
  switch (section.kind) {
    case "navbar": return renderNavbar(cfg, theme);
    case "hero": return renderHero(cfg, theme);
    case "logocloud": return renderLogoCloud(cfg, theme);
    case "features": return renderFeatures(cfg, theme);
    case "stats": return renderStats(cfg, theme);
    case "gallery": return renderGallery(cfg, theme);
    case "testimonials": return renderTestimonials(cfg, theme);
    case "pricing": return renderPricing(cfg, theme);
    case "faq": return renderFaq(cfg, theme);
    case "cta": return renderCta(cfg, theme);
    case "newsletter": return renderNewsletter(cfg, theme);
    case "footer": return renderFooter(cfg, theme);
    default: return "";
  }
}

function escapeHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderNavbar(c: any, t: ThemeTokens): string {
  const links = (c.links || []).map((l: any) => `<a href="${escapeHtml(l.href)}" style="color:${t.foreground}">${escapeHtml(l.label)}</a>`).join("\n");
  return `<header class="border-b" style="background:${c.transparent ? "transparent" : t.background};border-color:${t.border};position:${c.sticky ? "sticky" : "relative"};top:0;z-index:30">
  <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
    <div class="flex items-center gap-2">
      ${c.logoUrl ? `<img src="${escapeHtml(c.logoUrl)}" alt="${escapeHtml(c.brand)}" style="height:1.75rem" />` : `<div style="display:grid;place-items:center;width:1.75rem;height:1.75rem;border-radius:0.375rem;background:${t.primary};color:${t.primaryFg};font-weight:700">${escapeHtml(c.brand?.[0]?.toUpperCase() ?? "A")}</div>`}
      <span class="font-semibold" style="color:${t.foreground}">${escapeHtml(c.brand)}</span>
    </div>
    <nav class="hidden items-center gap-6 md:flex">${links}</nav>
    ${c.ctaLabel ? `<a href="${escapeHtml(c.ctaHref)}" class="inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold" style="background:${t.primary};color:${t.primaryFg}">${escapeHtml(c.ctaLabel)}</a>` : ""}
  </div>
</header>`;
}

function renderHero(c: any, t: ThemeTokens): string {
  const isSplit = c.variant !== "centered";
  const text = `<div class="flex flex-col gap-5 ${c.align === "center" ? "items-center text-center" : "items-start text-left"}">
    ${c.eyebrow ? `<span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider" style="background:${t.muted};color:${t.mutedFg}">${escapeHtml(c.eyebrow)}</span>` : ""}
    <h1 class="text-4xl font-bold leading-tight tracking-tight" style="color:${t.foreground};font-size:3rem">${escapeHtml(c.headline)}</h1>
    ${c.subhead ? `<p class="text-base" style="color:${t.mutedFg};max-width:42rem">${escapeHtml(c.subhead)}</p>` : ""}
    <div class="mt-2 flex flex-wrap gap-3 ${c.align === "center" ? "justify-center" : ""}">
      ${c.primaryCtaLabel ? `<a href="${escapeHtml(c.primaryCtaHref)}" class="inline-flex items-center rounded-md px-5 py-2.5 text-sm font-semibold" style="background:${t.primary};color:${t.primaryFg}">${escapeHtml(c.primaryCtaLabel)}</a>` : ""}
      ${c.secondaryCtaLabel ? `<a href="${escapeHtml(c.secondaryCtaHref)}" class="inline-flex items-center rounded-md border px-5 py-2.5 text-sm font-semibold" style="border-color:${t.border};color:${t.foreground}">${escapeHtml(c.secondaryCtaLabel)}</a>` : ""}
    </div>
  </div>`;
  return `<section class="px-6 py-24" style="background:${t.background}">
    <div class="mx-auto max-w-6xl">
      ${isSplit ? `<div class="grid items-center gap-12 md:grid-cols-2">
        ${text}
        ${c.imageUrl ? `<img src="${escapeHtml(c.imageUrl)}" alt="" class="w-full rounded-xl shadow-xl" />` : `<div class="aspect-video w-full rounded-xl" style="background:${t.muted};display:grid;place-items:center"><span style="color:${t.mutedFg}">Image placeholder</span></div>`}
      </div>` : `<div class="flex flex-col items-center text-center">${text}</div>`}
    </div>
  </section>`;
}

function renderLogoCloud(c: any, t: ThemeTokens): string {
  const logos = (c.logos || []).map((l: any) => l.url
    ? `<img src="${escapeHtml(l.url)}" alt="${escapeHtml(l.name)}" style="height:1.75rem" />`
    : `<span class="text-xl font-bold tracking-tight" style="color:${t.foreground}">${escapeHtml(l.name)}</span>`
  ).join("\n");
  return `<section class="px-6 py-12" style="background:${t.background}">
    <div class="mx-auto max-w-6xl">
      ${c.title ? `<p class="mb-8 text-center text-sm font-medium uppercase tracking-wider" style="color:${t.mutedFg}">${escapeHtml(c.title)}</p>` : ""}
      <div class="flex flex-wrap items-center justify-center gap-x-10 gap-y-6" style="opacity:0.7">${logos}</div>
    </div>
  </section>`;
}

function renderFeatures(c: any, t: ThemeTokens): string {
  const cols = Number(c.columns ?? 3);
  const items = (c.items || []).map((it: any) => `<div class="rounded-xl border p-6" style="border-color:${t.border};background:${t.background}">
      <h3 class="mb-2 text-lg font-semibold" style="color:${t.foreground}">${escapeHtml(it.title)}</h3>
      ${it.description ? `<p class="text-sm" style="color:${t.mutedFg}">${escapeHtml(it.description)}</p>` : ""}
    </div>`).join("\n");
  return `<section id="features" class="px-6 py-24" style="background:${t.background}">
    <div class="mx-auto max-w-6xl">
      <div class="mx-auto mb-12 max-w-2xl text-center">
        ${c.eyebrow ? `<p class="mb-3 text-sm font-semibold uppercase tracking-wider" style="color:${t.accent}">${escapeHtml(c.eyebrow)}</p>` : ""}
        <h2 class="text-3xl font-bold tracking-tight" style="color:${t.foreground}">${escapeHtml(c.title)}</h2>
        ${c.subtitle ? `<p class="mt-4 text-lg" style="color:${t.mutedFg}">${escapeHtml(c.subtitle)}</p>` : ""}
      </div>
      <div class="grid gap-6" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr))">${items}</div>
    </div>
  </section>`;
}

function renderStats(c: any, t: ThemeTokens): string {
  const stats = (c.stats || []).map((s: any) => `<div class="text-center">
      <div class="text-3xl font-bold tracking-tight" style="color:${t.foreground};font-size:2.5rem">${escapeHtml(s.value)}</div>
      <div class="mt-2 text-sm font-medium" style="color:${t.mutedFg}">${escapeHtml(s.label)}</div>
    </div>`).join("\n");
  return `<section class="px-6 py-12" style="background:${t.muted}">
    <div class="mx-auto max-w-6xl">
      ${c.title ? `<h2 class="mb-10 text-center text-2xl font-bold tracking-tight" style="color:${t.foreground}">${escapeHtml(c.title)}</h2>` : ""}
      <div class="grid grid-cols-2 gap-8 sm:grid-cols-4">${stats}</div>
    </div>
  </section>`;
}

function renderGallery(c: any, t: ThemeTokens): string {
  const cols = Number(c.columns ?? 3);
  const images = (c.images || []).map((img: any) => `<figure class="overflow-hidden rounded-xl" style="border-radius:${t.radius}">
      <div class="relative overflow-hidden" style="aspect-ratio:4/3;background:${t.muted}">
        <img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.caption ?? "")}" class="w-full h-full object-cover" />
      </div>
      ${img.caption ? `<figcaption class="mt-2 text-sm" style="color:${t.mutedFg}">${escapeHtml(img.caption)}</figcaption>` : ""}
    </figure>`).join("\n");
  return `<section id="work" class="px-6 py-24" style="background:${t.background}">
    <div class="mx-auto max-w-6xl">
      ${c.title ? `<h2 class="mb-10 text-center text-3xl font-bold tracking-tight" style="color:${t.foreground}">${escapeHtml(c.title)}</h2>` : ""}
      <div class="grid gap-4" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">${images}</div>
    </div>
  </section>`;
}

function renderTestimonials(c: any, t: ThemeTokens): string {
  const items = (c.items || []).map((it: any) => `<figure class="flex flex-col gap-4 rounded-xl border p-6" style="border-color:${t.border};background:${t.background};border-radius:${t.radius}">
      <blockquote class="text-base leading-relaxed" style="color:${t.foreground}">&ldquo;${escapeHtml(it.quote)}&rdquo;</blockquote>
      <figcaption class="mt-auto flex items-center gap-3">
        ${it.avatar ? `<img src="${escapeHtml(it.avatar)}" alt="${escapeHtml(it.name)}" class="rounded-full" style="width:2.5rem;height:2.5rem;object-fit:cover" />` : `<div style="display:grid;place-items:center;width:2.5rem;height:2.5rem;border-radius:9999px;background:${t.primary};color:${t.primaryFg};font-weight:700">${escapeHtml(it.name?.[0]?.toUpperCase())}</div>`}
        <div>
          <div class="text-sm font-semibold" style="color:${t.foreground}">${escapeHtml(it.name)}</div>
          ${it.role ? `<div class="text-xs" style="color:${t.mutedFg}">${escapeHtml(it.role)}</div>` : ""}
        </div>
      </figcaption>
    </figure>`).join("\n");
  return `<section id="testimonials" class="px-6 py-24" style="background:${t.muted}">
    <div class="mx-auto max-w-6xl">
      ${c.title ? `<h2 class="mb-12 text-center text-3xl font-bold tracking-tight" style="color:${t.foreground}">${escapeHtml(c.title)}</h2>` : ""}
      <div class="grid gap-6 md:grid-cols-3">${items}</div>
    </div>
  </section>`;
}

function renderPricing(c: any, t: ThemeTokens): string {
  const tiers = (c.tiers || []).map((tier: any) => {
    const features = (tier.features ?? "").split("\n").filter(Boolean).map((f: string) => `<li class="flex items-start gap-2 text-sm" style="color:${t.foreground}">
        <span style="color:${t.accent}">✓</span><span>${escapeHtml(f)}</span>
      </li>`).join("\n");
    const highlight = tier.highlighted;
    return `<div class="relative flex flex-col rounded-xl border p-6" style="border-color:${highlight ? t.accent : t.border};background:${t.background};border-radius:${t.radius}${highlight ? `;box-shadow:0 10px 30px -10px ${t.accent}40;transform:scale(1.02)` : ""}">
      ${highlight ? `<div style="position:absolute;top:-0.75rem;left:50%;transform:translateX(-50%);background:${t.accent};color:${t.accentFg};padding:0.25rem 0.75rem;border-radius:9999px;font-size:0.75rem;font-weight:600;text-transform:uppercase">Most popular</div>` : ""}
      <h3 class="text-lg font-semibold" style="color:${t.foreground}">${escapeHtml(tier.name)}</h3>
      ${tier.description ? `<p class="mt-1 text-sm" style="color:${t.mutedFg}">${escapeHtml(tier.description)}</p>` : ""}
      <div class="mt-4 flex items-baseline gap-1">
        <span class="text-4xl font-bold tracking-tight" style="color:${t.foreground}">${escapeHtml(c.currency)}${escapeHtml(tier.price)}</span>
        <span class="text-sm" style="color:${t.mutedFg}">${escapeHtml(c.period)}</span>
      </div>
      <ul class="mt-6 flex flex-1 flex-col gap-2">${features}</ul>
      ${tier.ctaLabel ? `<a href="${escapeHtml(tier.ctaHref)}" class="mt-6 inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold" style="background:${highlight ? t.accent : t.primary};color:${highlight ? t.accentFg : t.primaryFg}">${escapeHtml(tier.ctaLabel)}</a>` : ""}
    </div>`;
  }).join("\n");
  return `<section id="pricing" class="px-6 py-24" style="background:${t.background}">
    <div class="mx-auto max-w-6xl">
      <div class="mx-auto mb-12 max-w-2xl text-center">
        ${c.title ? `<h2 class="text-3xl font-bold tracking-tight" style="color:${t.foreground}">${escapeHtml(c.title)}</h2>` : ""}
        ${c.subtitle ? `<p class="mt-4 text-lg" style="color:${t.mutedFg}">${escapeHtml(c.subtitle)}</p>` : ""}
      </div>
      <div class="grid gap-6 md:grid-cols-3">${tiers}</div>
    </div>
  </section>`;
}

function renderFaq(c: any, t: ThemeTokens): string {
  const items = (c.items || []).map((it: any, i: number) => `<details class="overflow-hidden rounded-xl border" style="border-color:${t.border};background:${t.background};border-radius:${t.radius}"${i === 0 ? " open" : ""}>
      <summary class="flex w-full items-center justify-between gap-4 px-5 py-4 font-semibold cursor-pointer" style="color:${t.foreground};list-style:none">
        ${escapeHtml(it.question)}
        <span style="color:${t.mutedFg}">▾</span>
      </summary>
      <p class="px-5 pb-4 text-sm leading-relaxed" style="color:${t.mutedFg}">${escapeHtml(it.answer)}</p>
    </details>`).join("\n");
  return `<section id="faq" class="px-6 py-24" style="background:${t.background}">
    <div class="mx-auto max-w-3xl">
      <div class="mb-10 text-center">
        ${c.title ? `<h2 class="text-3xl font-bold tracking-tight" style="color:${t.foreground}">${escapeHtml(c.title)}</h2>` : ""}
        ${c.subtitle ? `<p class="mt-4 text-lg" style="color:${t.mutedFg}">${escapeHtml(c.subtitle)}</p>` : ""}
      </div>
      <div class="flex flex-col gap-3">${items}</div>
    </div>
  </section>`;
}

function renderCta(c: any, t: ThemeTokens): string {
  const bg = c.variant === "gradient"
    ? `linear-gradient(135deg, ${t.primary} 0%, ${t.accent} 100%)`
    : c.variant === "muted" ? t.muted : t.primary;
  const fg = c.variant === "muted" ? t.foreground : t.primaryFg;
  const mutedFg = c.variant === "muted" ? t.mutedFg : "rgba(255,255,255,0.85)";
  return `<section class="px-6 py-24" style="background:${t.background}">
    <div class="mx-auto max-w-5xl">
      <div class="rounded-2xl px-8 py-16 text-center" style="background:${bg};color:${fg};border-radius:${t.radius}">
        ${c.eyebrow ? `<p class="mb-3 text-sm font-semibold uppercase tracking-wider" style="color:${mutedFg}">${escapeHtml(c.eyebrow)}</p>` : ""}
        <h2 class="text-3xl font-bold tracking-tight" style="color:${fg}">${escapeHtml(c.title)}</h2>
        ${c.subtitle ? `<p class="mx-auto mt-4 max-w-2xl text-base" style="color:${mutedFg}">${escapeHtml(c.subtitle)}</p>` : ""}
        ${(c.primaryCtaLabel || c.secondaryCtaLabel) ? `<div class="mt-8 flex flex-wrap justify-center gap-3">
          ${c.primaryCtaLabel ? `<a href="${escapeHtml(c.primaryCtaHref)}" class="inline-flex items-center rounded-md px-5 py-2.5 text-sm font-semibold" style="background:${t.background};color:${t.foreground}">${escapeHtml(c.primaryCtaLabel)}</a>` : ""}
          ${c.secondaryCtaLabel ? `<a href="${escapeHtml(c.secondaryCtaHref)}" class="inline-flex items-center rounded-md border px-5 py-2.5 text-sm font-semibold" style="border-color:rgba(255,255,255,0.3);color:${fg}">${escapeHtml(c.secondaryCtaLabel)}</a>` : ""}
        </div>` : ""}
      </div>
    </div>
  </section>`;
}

function renderNewsletter(c: any, t: ThemeTokens): string {
  return `<section id="waitlist" class="px-6 py-24" style="background:${t.muted}">
    <div class="mx-auto max-w-2xl text-center">
      <h2 class="text-3xl font-bold tracking-tight" style="color:${t.foreground}">${escapeHtml(c.title)}</h2>
      ${c.subtitle ? `<p class="mt-4 text-base" style="color:${t.mutedFg}">${escapeHtml(c.subtitle)}</p>` : ""}
      <form class="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row" onsubmit="event.preventDefault();this.querySelector('button').textContent='Subscribed ✓'">
        <input type="email" placeholder="${escapeHtml(c.placeholder ?? "you@email.com")}" class="flex-1 rounded-md border px-4 py-2.5 text-sm" style="border-color:${t.border};background:${t.background};color:${t.foreground}" />
        <button type="submit" class="inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold" style="background:${t.primary};color:${t.primaryFg}">${escapeHtml(c.buttonLabel ?? "Subscribe")}</button>
      </form>
      ${c.footnote ? `<p class="mt-4 text-xs" style="color:${t.mutedFg}">${escapeHtml(c.footnote)}</p>` : ""}
    </div>
  </section>`;
}

function renderFooter(c: any, t: ThemeTokens): string {
  const cols = (c.columns || []).map((col: any) => `<div>
      <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider" style="color:${t.foreground}">${escapeHtml(col.title)}</h4>
      <ul class="flex flex-col gap-2">
        ${(col.links || []).map((l: any) => `<li><a href="${escapeHtml(l.href)}" class="text-sm" style="color:${t.mutedFg}">${escapeHtml(l.label)}</a></li>`).join("")}
      </ul>
    </div>`).join("\n");
  return `<footer class="border-t px-6 py-12" style="background:${t.background};border-color:${t.border}">
    <div class="mx-auto max-w-6xl">
      <div class="grid gap-8 md:grid-cols-4">
        <div>
          <div class="flex items-center gap-2">
            <div style="display:grid;place-items:center;width:1.75rem;height:1.75rem;border-radius:0.375rem;background:${t.primary};color:${t.primaryFg};font-weight:700">${escapeHtml(c.brand?.[0]?.toUpperCase() ?? "A")}</div>
            <span class="font-semibold" style="color:${t.foreground}">${escapeHtml(c.brand)}</span>
          </div>
          ${c.tagline ? `<p class="mt-3 text-sm" style="color:${t.mutedFg};max-width:24rem">${escapeHtml(c.tagline)}</p>` : ""}
        </div>
        ${cols}
      </div>
      ${c.copyright ? `<div class="mt-10 border-t pt-6 text-center text-xs" style="border-color:${t.border};color:${t.mutedFg}">${escapeHtml(c.copyright)}</div>` : ""}
    </div>
  </footer>`;
}

function renderReadme(site: SiteData): string {
  return `LandingForge Export — ${site.name}
==================================

Generated: ${new Date().toISOString()}
Pages: ${site.pages.length}
Sections: ${site.pages.reduce((s, p) => s + p.sections.length, 0)}

Contents:
  index.html   — the landing page (links to styles.css)
  styles.css   — extracted CSS with your theme tokens
  README.txt   — this file

How to deploy:
  • Static host (Netlify, Vercel, Cloudflare Pages):
      Drag the folder into the dashboard. Done.
  • GitHub Pages:
      Push to a repo, enable Pages in Settings → Pages.
  • Your own server:
      Drop the folder into any web root. No build step.

Theme:
  Primary: ${site.themeTokens.primary}
  Accent:  ${site.themeTokens.accent}

To edit the page later, re-import the JSON blueprint into LandingForge v4.0.
`;
}

// ─── Minimal ZIP writer (STORE method, no compression) ────────────────────
// CRC32 + ZIP record format. Pure JS, no dependencies.

function buildZip(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const records: { name: Uint8Array; data: Uint8Array; crc: number; offset: number }[] = [];
  let offset = 0;

  for (const f of files) {
    const nameBytes = enc.encode(f.name);
    const crc = crc32(f.data);
    // Local file header (30 bytes + name)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const dv = new DataView(localHeader.buffer);
    dv.setUint32(0, 0x04034b50, true);  // signature
    dv.setUint16(4, 20, true);          // version needed
    dv.setUint16(6, 0, true);           // flags
    dv.setUint16(8, 0, true);           // compression (store)
    dv.setUint16(10, 0, true);          // mod time
    dv.setUint16(12, 0, true);          // mod date
    dv.setUint32(14, crc, true);        // crc32
    dv.setUint32(18, f.data.length, true);  // compressed size
    dv.setUint32(22, f.data.length, true);  // uncompressed size
    dv.setUint16(26, nameBytes.length, true);
    dv.setUint16(28, 0, true);          // extra field len
    localHeader.set(nameBytes, 30);

    chunks.push(localHeader);
    chunks.push(f.data);
    records.push({ name: nameBytes, data: f.data, crc, offset });
    offset += localHeader.length + f.data.length;
  }

  const centralDir: Uint8Array[] = [];
  let centralSize = 0;
  for (const r of records) {
    const rec = new Uint8Array(46 + r.name.length);
    const dv = new DataView(rec.buffer);
    dv.setUint32(0, 0x02014b50, true);  // central dir signature
    dv.setUint16(4, 20, true);          // version made by
    dv.setUint16(6, 20, true);          // version needed
    dv.setUint16(8, 0, true);           // flags
    dv.setUint16(10, 0, true);          // compression
    dv.setUint16(12, 0, true);          // mod time
    dv.setUint16(14, 0, true);          // mod date
    dv.setUint32(16, r.crc, true);
    dv.setUint32(20, r.data.length, true);
    dv.setUint32(24, r.data.length, true);
    dv.setUint16(28, r.name.length, true);
    dv.setUint16(30, 0, true);          // extra
    dv.setUint16(32, 0, true);          // comment
    dv.setUint16(34, 0, true);          // disk number
    dv.setUint16(36, 0, true);          // internal attrs
    dv.setUint32(38, 0, true);          // external attrs
    dv.setUint32(42, r.offset, true);   // local header offset
    rec.set(r.name, 46);
    centralDir.push(rec);
    centralSize += rec.length;
  }

  // End of central directory
  const end = new Uint8Array(22);
  const edv = new DataView(end.buffer);
  edv.setUint32(0, 0x06054b50, true);
  edv.setUint16(4, 0, true);
  edv.setUint16(6, 0, true);
  edv.setUint16(8, records.length, true);
  edv.setUint16(10, records.length, true);
  edv.setUint32(12, centralSize, true);
  edv.setUint32(16, offset, true);
  edv.setUint16(20, 0, true);

  // Concat all
  const total = chunks.reduce((a, c) => a + c.length, 0) + centralSize + end.length;
  const out = new Uint8Array(total);
  let cursor = 0;
  for (const c of chunks) { out.set(c, cursor); cursor += c.length; }
  for (const c of centralDir) { out.set(c, cursor); cursor += c.length; }
  out.set(end, cursor);

  return out;
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    t[i] = c;
  }
  return t;
})();

function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}
