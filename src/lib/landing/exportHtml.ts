"use client"

// ─────────────────────────────────────────────────────────────────────────────
// Standalone-HTML export: renders the landing page to a single self-contained
// .html file (compiled Tailwind CSS inlined + SEO meta + tiny interactivity
// script). Runs fully client-side — the sections are already loaded as React
// components in the browser, so react-dom/server's browser build can render
// them to static markup without touching the network for anything but the CSS.
// ─────────────────────────────────────────────────────────────────────────────
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { LandingPreview } from "@/components/sites/preview/LandingPreview"
import { googleFontLinkTags } from "./themes"
import { applyLocale, dirFor, localesOf } from "./i18n"
import type { LandingConfig } from "./types"

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** Vanilla-JS behaviors for the static snapshot (FAQ accordion, smooth scroll,
 *  entrance animations, dark-mode toggle). */
const INTERACTIVE_SCRIPT = [
  "document.addEventListener('click', function (e) {",
  "  var t = e.target.closest('[data-slot=\"accordion-trigger\"]');",
  "  if (t) {",
  "    e.preventDefault();",
  "    var item = t.closest('[data-slot=\"accordion-item\"]');",
  "    if (!item) return;",
  "    var open = item.getAttribute('data-state') === 'open';",
  "    var next = open ? 'closed' : 'open';",
  "    item.setAttribute('data-state', next);",
  "    t.setAttribute('data-state', next);",
  "    t.setAttribute('aria-expanded', open ? 'false' : 'true');",
  "    var c = item.querySelector('[data-slot=\"accordion-content\"]');",
  "    if (c) {",
  "      c.setAttribute('data-state', next);",
  "      if (open) { c.setAttribute('hidden', ''); } else { c.removeAttribute('hidden'); }",
  "    }",
  "  }",
  "}, false);",
  // entrance animations — reveal .lf-anim sections once when scrolled into view
  "(function () {",
  "  var targets = document.querySelectorAll('.lf-anim');",
  "  if (!targets.length) return;",
  "  if (!('IntersectionObserver' in window)) {",
  "    for (var i = 0; i < targets.length; i++) targets[i].classList.add('lf-in');",
  "    return;",
  "  }",
  "  var io = new IntersectionObserver(function (entries) {",
  "    for (var j = 0; j < entries.length; j++) {",
  "      if (entries[j].isIntersecting) {",
  "        entries[j].target.classList.add('lf-in');",
  "        io.unobserve(entries[j].target);",
  "      }",
  "    }",
  "  }, { threshold: 0.15 });",
  "  for (var k = 0; k < targets.length; k++) io.observe(targets[k]);",
  "})();",
].join("\n")

export interface StandaloneHtml {
  html: string
  bytes: number
}

function pickShareImage(config: LandingConfig): string | null {
  if (config.seo?.ogImage) return config.seo.ogImage
  const hero = config.sections.find((s) => s.type === "hero")
  if (hero && hero.type === "hero" && hero.image && /^https?:/.test(hero.image)) return hero.image
  const gallery = config.sections.find((s) => s.type === "gallery")
  if (gallery && gallery.type === "gallery") {
    const img = gallery.items?.find((i) => i.src && /^https?:/.test(i.src))
    if (img?.src) return img.src
  }
  return null
}

export async function buildStandaloneHtml(config: LandingConfig, locale?: string): Promise<StandaloneHtml> {
  // 1. fetch the pre-compiled stylesheet (served from /api/export/css)
  const cssRes = await fetch("/api/export/css")
  if (!cssRes.ok) throw new Error("Could not load the export stylesheet")
  const css = await cssRes.text()

  // 2. pick the locale (first = default) and apply its translations if any
  const locales = localesOf(config)
  const chosen = locale && locales.some((l) => l.code === locale) ? locale : locales[0].code
  const localized = applyLocale(config, chosen)
  const dir = dirFor(config, chosen)

  // 3. render the page to static markup
  const markup = renderToStaticMarkup(createElement(LandingPreview, { config: localized }))

  // 4. assemble the document
  const title = escapeHtml(config.seo?.title || `${config.brand.name} — ${config.brand.tagline ?? ""}`.trim())
  const description = escapeHtml(config.seo?.description ?? "")
  const brand = escapeHtml(config.brand.name)
  const year = new Date().getFullYear()
  const image = pickShareImage(config)
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  // ✦ Google webfont pairs: preconnect + css2 links (empty for system pairs)
  const fontLinks = googleFontLinkTags(config.brand.font)

  // JSON-LD structured data (WebPage + Organization)
  const jsonLd = escapeHtml(
    JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      ...(description ? { description } : {}),
      ...(config.brand.tagline ? { headline: config.brand.tagline } : {}),
      publisher: { "@type": "Organization", name: brand },
    })
  )

  const html = [
    "<!DOCTYPE html>",
    `<html lang="${escapeHtml(chosen)}" dir="${dir}">`,
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${title}</title>`,
    description ? `<meta name="description" content="${description}">` : "",
    config.seo?.noIndex
      ? '<meta name="robots" content="noindex, nofollow">'
      : '<meta name="robots" content="index, follow">',
    // canonical (best-effort — exports have no canonical home)
    `<link rel="canonical" href="${escapeHtml(origin || ".")}">`,
    // Open Graph
    '<meta property="og:type" content="website">',
    `<meta property="og:title" content="${title}">`,
    description ? `<meta property="og:description" content="${description}">` : "",
    image ? `<meta property="og:image" content="${escapeHtml(image)}">` : "",
    `<meta property="og:site_name" content="${brand}">`,
    `<meta property="og:locale" content="${escapeHtml(chosen)}">`,
    // Twitter card
    '<meta name="twitter:card" content="' + (image ? "summary_large_image" : "summary") + '">',
    `<meta name="twitter:title" content="${title}">`,
    description ? `<meta name="twitter:description" content="${description}">` : "",
    image ? `<meta name="twitter:image" content="${escapeHtml(image)}">` : "",
    // theme color follows the accent when set
    config.brand.accent ? `<meta name="theme-color" content="${escapeHtml(config.brand.accent)}">` : "",
    // structured data
    `<script type="application/ld+json">${jsonLd}</script>`,
    '<meta name="generator" content="Forge Studio — landing sites">',
    ...fontLinks,
    "<style>",
    css,
    "</style>",
    "<style>html{scroll-behavior:smooth}html,body{min-height:100%}</style>",
    // JS-off visitors still see animated content
    "<noscript><style>.lf-anim{opacity:1 !important}</style></noscript>",
    "</head>",
    "<body>",
    markup,
    "<script>",
    INTERACTIVE_SCRIPT,
    "</script>",
    `<!-- Built with Forge Studio Sites · ${year} · ${brand} -->`,
    "</body>",
    "</html>",
  ]
    .filter(Boolean)
    .join("\n")

  return { html, bytes: new Blob([html]).size }
}

/** Trigger a browser download for the generated document. */
export function downloadStandaloneHtml(html: string, slug: string): string {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${slug || "landing"}.html`
  document.body.appendChild(a)
  a.click()
  a.remove()
  // keep the URL alive for the "open in new tab" action that follows
  return url
}
