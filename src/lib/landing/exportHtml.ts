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

/** Vanilla-JS behaviors for the static snapshot (FAQ accordion, countdown
 *  timers, gallery slider, stories progress, smooth scroll, entrance
 *  animations). The same markup runs in the React app with live state — this
 *  script only wakes it up in the exported file. */
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
  // live countdowns — [data-lf-countdown] with data-deadline, digits in [data-lf-cd]
  "(function () {",
  "  var cds = document.querySelectorAll('[data-lf-countdown]');",
  "  if (!cds.length) return;",
  "  var UNITS = [",
  "    { id: 'd', per: 86400000 },",
  "    { id: 'h', per: 3600000 },",
  "    { id: 'm', per: 60000 },",
  "    { id: 's', per: 1000 }",
  "  ];",
  "  function pad(n) { return String(n).padStart(2, '0'); }",
  "  function render() {",
  "    for (var i = 0; i < cds.length; i++) {",
  "      var el = cds[i];",
  "      var target = Date.parse(el.getAttribute('data-deadline') || '');",
  "      if (isNaN(target)) continue;",
  "      var left = Math.max(0, target - Date.now());",
  "      for (var u = 0; u < UNITS.length; u++) {",
  "        var unit = UNITS[u];",
  "        var cell = el.querySelector('[data-lf-cd=\"' + unit.id + '\"]');",
  "        if (!cell) continue;",
  "        cell.textContent = pad(Math.floor(left / unit.per));",
  "        left -= Math.floor(left / unit.per) * unit.per;",
  "      }",
  "    }",
  "  }",
  "  render();",
  "  setInterval(render, 1000);",
  "})();",
  // gallery slider — [data-lf-slider] with track, prev/next buttons and dots
  "(function () {",
  "  var sliders = document.querySelectorAll('[data-lf-slider]');",
  "  for (var i = 0; i < sliders.length; i++) {",
  "    (function (root) {",
  "      var track = root.querySelector('[data-lf-slider-track]');",
  "      var slides = track ? track.children : [];",
  "      if (!track || slides.length < 2) return;",
  "      var dots = root.querySelectorAll('[data-lf-dot]');",
  "      var counter = null;",
  "      var idx = 0;",
  "      function paint() {",
  "        track.style.transform = 'translateX(-' + (idx * 100) + '%)';",
  "        for (var d = 0; d < dots.length; d++) {",
  "          var on = d === idx;",
  "          dots[d].setAttribute('aria-current', on ? 'true' : 'false');",
  "          dots[d].style.width = on ? '20px' : '6px';",
  "          dots[d].style.background = on ? 'var(--lf-accent)' : 'var(--lf-border)';",
  "        }",
  "      }",
  "      var prev = root.querySelector('[data-lf-prev]');",
  "      var next = root.querySelector('[data-lf-next]');",
  "      if (prev) prev.addEventListener('click', function () { idx = (idx - 1 + slides.length) % slides.length; paint(); });",
  "      if (next) next.addEventListener('click', function () { idx = (idx + 1) % slides.length; paint(); });",
  "      for (var d2 = 0; d2 < dots.length; d2++) {",
  "        (function (n) { dots[n].addEventListener('click', function () { idx = n; paint(); }); })(d2);",
  "      }",
  "      paint();",
  "    })(sliders[i]);",
  "  }",
  "})();",
  // stories progress — scroll position → segmented rail fill
  "(function () {",
  "  var roots = document.querySelectorAll('[data-lf-stories]');",
  "  for (var i = 0; i < roots.length; i++) {",
  "    (function (root) {",
  "      var rail = root.querySelector('[data-lf-story-segs]');",
  "      var segs = root.querySelectorAll('[data-lf-story-seg]');",
  "      var scroller = rail ? rail.nextElementSibling : null;",
  "      if (!rail || !segs.length || !scroller) return;",
  "      scroller.addEventListener('scroll', function () {",
  "        var step = scroller.scrollWidth / Math.max(1, scroller.children.length);",
  "        var active = Math.round(scroller.scrollLeft / Math.max(1, step));",
  "        for (var s = 0; s < segs.length; s++) {",
  "          var fill = segs[s].firstElementChild;",
  "          if (fill) fill.style.width = (s <= active ? '100%' : '0%');",
  "        }",
  "      }, { passive: true });",
  "    })(roots[i]);",
  "  }",
  "})();",
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
