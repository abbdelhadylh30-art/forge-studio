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
import { parseScripts } from "@/components/sites/shared/scriptInjection"
import { googleFontLinkTags, themeVarsCss } from "./themes"
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

/** Sun/moon icon pair as inline SVG — the exported mode toggle button. */
const SUN_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>'
const MOON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>'

/**
 * Vanilla consent gate for the standalone export. `customJson` is the parsed
 * script list (JSON, `</` escaped) or "null" when only the banner ships.
 * Behavior mirrors the published page: banner reveals when undecided, Accept
 * injects the custom scripts + persists, Decline persists + never injects,
 * decided visitors see no banner and accepted scripts load immediately.
 */
function CONSENT_GATE_SCRIPT(customJson: string): string {
  return [
    "(function () {",
    "  var CUSTOM = " + customJson + ";",
    "  var KEY = 'lf-cookie-consent';",
    "  var state = 'unknown';",
    "  try { state = localStorage.getItem(KEY) || 'unknown'; } catch (e) {}",
    "  var banner = document.querySelector('[data-lf-cookie-banner]');",
    "  function inject() {",
    "    if (!CUSTOM || window.__lfCustomInjected) return;",
    "    window.__lfCustomInjected = true;",
    "    for (var i = 0; i < CUSTOM.length; i++) {",
    "      var s = CUSTOM[i];",
    "      var el = document.createElement('script');",
    "      el.setAttribute('data-lf-custom', 'export');",
    "      if (s.src) { el.src = s.src; el.async = false; }",
    "      else { el.textContent = s.code || ''; }",
    "      (s.head ? document.head : document.body).appendChild(el);",
    "    }",
    "  }",
    "  function hide() { if (banner) banner.setAttribute('hidden', ''); }",
    "  function decide(next) {",
    "    try { localStorage.setItem(KEY, next); } catch (e) {}",
    "    if (next === 'accepted') inject();",
    "    hide();",
    "  }",
    "  if (banner) {",
    "    if (state === 'accepted') { inject(); hide(); }",
    "    else if (state === 'declined') { hide(); }",
    "    else { banner.removeAttribute('hidden'); }",
    "    var acc = banner.querySelector('[data-lf-consent-accept]');",
    "    var dec = banner.querySelector('[data-lf-consent-decline]');",
    "    if (acc) acc.addEventListener('click', function () { decide('accepted'); });",
    "    if (dec) dec.addEventListener('click', function () { decide('declined'); });",
    "  }",
    "})();",
  ].join("\n")
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
  // color-scheme toggle (auto mode) — flips data-lf-mode between light/dark,
  // persisted per visitor; the CSS block resolves both palettes
  "(function () {",
  "  var root = document.querySelector('.lf-root[data-lf-mode=\"auto\"]');",
  "  var btn = document.getElementById('lf-mode-toggle');",
  "  if (!root || !btn) return;",
  "  var saved = null;",
  "  try { saved = localStorage.getItem('lf-visitor-mode'); } catch (e) {}",
  "  if (saved === 'dark' || saved === 'light') root.setAttribute('data-lf-mode', saved);",
  "  function paint() {",
  "    var dark = root.getAttribute('data-lf-mode') !== 'light';",
  "    btn.setAttribute('aria-pressed', dark ? 'false' : 'true');",
  "    btn.title = dark ? 'Switch to light mode' : 'Switch to dark mode';",
  "  }",
  "  btn.addEventListener('click', function () {",
  "    var next = root.getAttribute('data-lf-mode') === 'light' ? 'dark' : 'light';",
  "    root.setAttribute('data-lf-mode', next);",
  "    try { localStorage.setItem('lf-visitor-mode', next); } catch (e) {}",
  "    paint();",
  "  });",
  "  paint();",
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

  // 3. render the page to static markup — themeViaCss: the color variables
  //    ship as a <style> block (themeVarsCss) so auto mode + the visitor toggle
  //    resolve purely in CSS, even with JS off. The consent banner (when the
  //    site enables one) ships hidden inside the themed root; the vanilla
  //    script below reveals it and gates the custom scripts on the decision.
  const consentCfg = localized.legal?.cookieConsent
  const consentOn = consentCfg?.enabled === true
  const markup = renderToStaticMarkup(
    createElement(LandingPreview, {
      config: localized,
      themeViaCss: true,
      ...(consentOn ? { consent: { visible: true, hidden: true } } : {}),
    }),
  )

  // 4. assemble the document
  const title = escapeHtml(config.seo?.title || `${config.brand.name} — ${config.brand.tagline ?? ""}`.trim())
  const description = escapeHtml(config.seo?.description ?? "")
  const brand = escapeHtml(config.brand.name)
  const year = new Date().getFullYear()
  const image = pickShareImage(config)
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  // ✦ Google webfont pairs: preconnect + css2 links (empty for system pairs)
  const fontLinks = googleFontLinkTags(config.brand.font)
  // dual-mode theme variables (dark base + light override + auto media query)
  const themeCss = themeVarsCss(config.themeId, config.brand.accent)
  // visitor mode toggle — only when the site explicitly follows the system
  // ("auto"); an unset brand.mode resolves statically to the theme's built-in
  // mode, and owner-pinned dark/light ships without a toggle
  const liveAuto = config.brand.mode === "auto"
  const modeToggle = liveAuto
    ? [
        '<button id="lf-mode-toggle" type="button" aria-label="Toggle dark mode" title="Switch appearance" style="position:fixed;right:16px;bottom:16px;z-index:9998;width:40px;height:40px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(127,127,127,0.28);border-radius:9999px;cursor:pointer;backdrop-filter:blur(8px);background:rgba(20,20,26,0.55);color:#e8e8ec;transition:background .2s ease,color .2s ease">',
        `<span class="lf-mt-sun">${SUN_SVG}</span>`,
        `<span class="lf-mt-moon">${MOON_SVG}</span>`,
        "</button>",
        "<style>",
        // icon swap driven purely by the sibling selector (no inline display,
        // which would out-rank these rules)
        "#lf-mode-toggle .lf-mt-sun{display:flex}",
        "#lf-mode-toggle .lf-mt-moon{display:none}",
        '.lf-root[data-lf-mode="light"] + #lf-mode-toggle .lf-mt-sun{display:none}',
        '.lf-root[data-lf-mode="light"] + #lf-mode-toggle .lf-mt-moon{display:flex}',
        '.lf-root[data-lf-mode="light"] + #lf-mode-toggle{background:rgba(255,255,255,0.72);color:#26262e;border-color:rgba(38,38,46,0.18)}',
        "</style>",
      ].join("")
    : ""

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

  // ── Custom third-party scripts (GA4, Meta Pixel, chat widgets) ──────────
  // Two delivery modes:
  //   • consent banner ON  → scripts embed as data and only run after the
  //     visitor accepts (Decline = never; JS-off = never, consistent with the
  //     banner staying hidden)
  //   • banner OFF         → head/body scripts emit raw, exactly as configured
  const tracking = config.tracking
  const customParsed = tracking
    ? [
        ...parseScripts(tracking.headScripts).map((s) => ({ ...s, head: true })),
        ...parseScripts(tracking.bodyScripts).map((s) => ({ ...s, head: false })),
      ]
    : []
  const consentScript =
    consentOn && (customParsed.length > 0 || consentCfg)
      ? CONSENT_GATE_SCRIPT(
          customParsed.length > 0
            ? JSON.stringify(customParsed).replace(/<\//g, "<\\/")
            : "null",
        )
      : ""
  const rawHeadScripts = !consentOn && tracking?.headScripts ? tracking.headScripts : ""
  const rawBodyScripts = !consentOn && tracking?.bodyScripts ? tracking.bodyScripts : ""

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
    rawHeadScripts,
    "<style>",
    css,
    "</style>",
    "<style>",
    themeCss,
    "</style>",
    "<style>html{scroll-behavior:smooth}html,body{min-height:100%}</style>",
    // JS-off visitors still see animated content
    "<noscript><style>.lf-anim{opacity:1 !important}</style></noscript>",
    "</head>",
    "<body>",
    markup,
    modeToggle,
    rawBodyScripts,
    "<script>",
    INTERACTIVE_SCRIPT,
    "</script>",
    consentScript ? "<script>" : "",
    consentScript,
    consentScript ? "</script>" : "",
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
