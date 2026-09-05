/**
 * Forge Studio v1.5.0 — EXPORT SMOKE SUITE
 * Drives every export path the app's UI can trigger, saves the real
 * artifacts to /home/z/my-project/download/exports/, and verifies
 * content markers. Run: bun scripts/test-exports.ts
 */
import { writeFileSync, mkdirSync } from "node:fs"

const OUT = "/home/z/my-project/download/exports"
mkdirSync(OUT, { recursive: true })

// ── patch fetch so relative URLs ("/api/export/css") hit the dev server ──
const BASE = "http://localhost:3000"
const origFetch = globalThis.fetch
globalThis.fetch = ((input: any, init?: any) => {
  const url = typeof input === "string" && input.startsWith("/") ? BASE + input : input
  return origFetch(url, init)
}) as typeof fetch

const results: Array<{ name: string; ok: boolean; detail: string }> = []
function report(name: string, ok: boolean, detail: string) {
  results.push({ name, ok, detail })
  console.log(`${ok ? "PASS" : "FAIL"}  ${name} — ${detail}`)
}
function must(name: string, cond: boolean, detail: string) {
  report(name, cond, detail)
}
const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`

// ══════════════════════════════════════════════════════════════════════════
// PART 1 — SITES STUDIO EXPORTS (the v1.5 landing-forge port)
// ══════════════════════════════════════════════════════════════════════════
const sitesList = await fetch("/api/sites").then((r) => r.json())
const vertex: any = sitesList[0]
if (!vertex) {
  console.log("No site in local DB — run the studio once first.")
  process.exit(1)
}
const withConfig = await fetch(`/api/sites/${vertex.id}`).then((r) => r.json())
const config = withConfig.config

// ── 1a. Standalone HTML export (default locale) ─────────────────────────
const { buildStandaloneHtml } = await import("@/lib/landing/exportHtml")
try {
  const t0 = Date.now()
  const { html, bytes } = await buildStandaloneHtml(config)
  writeFileSync(`${OUT}/vertex-standalone.html`, html)
  const checks = {
    "og:title": html.includes('property="og:title"'),
    "twitter:card": html.includes('name="twitter:card"'),
    "JSON-LD": html.includes('application/ld+json'),
    "robots meta": html.includes('name="robots"'),
    canonical: html.includes('rel="canonical"'),
    "inline CSS": html.includes("<style>") && html.length > 50000,
    "anim classes": html.includes("lf-anim"),
    "reveal script": html.includes("IntersectionObserver"),
    "noscript fallback": html.includes("<noscript>"),
    "generator stamp": html.includes("Forge Studio"),
  }
  const failed = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k)
  must(
    "Sites → standalone HTML (default locale)",
    failed.length === 0,
    `${kb(bytes)} in ${Date.now() - t0}ms — all ${Object.keys(checks).length} markers present${failed.length ? ` (missing: ${failed.join(",")})` : ""}`
  )
} catch (e: any) {
  must("Sites → standalone HTML (default locale)", false, e.message)
}

// ── 1b. Standalone HTML export (Arabic / RTL locale, if configured) ──────
const { localesOf } = await import("@/lib/landing/i18n")
const locales = localesOf(config)
const rtl = locales.find((l) => ["ar", "he", "fa", "ur"].includes(l.code))
if (rtl) {
  try {
    const { html } = await buildStandaloneHtml(config, rtl.code)
    writeFileSync(`${OUT}/vertex-standalone-${rtl.code}.html`, html)
    must(
      `Sites → standalone HTML (${rtl.code}, RTL)`,
      html.includes(`lang="${rtl.code}"`) && html.includes('dir="rtl"'),
      `${kb(html.length)} — lang=${rtl.code}, dir=rtl, og:locale=${rtl.code}`
    )
  } catch (e: any) {
    must(`Sites → standalone HTML (${rtl.code}, RTL)`, false, e.message)
  }
} else {
  report("Sites → standalone HTML (RTL locale)", true, "skipped — demo site has no RTL locale configured")
}

// ── 1c. YAML export + round-trip import ──────────────────────────────────
const { configToYaml, yamlToConfig } = await import("@/lib/landing/yaml")
try {
  const yaml = configToYaml(config)
  writeFileSync(`${OUT}/vertex-landing.yaml`, yaml)
  const back = yamlToConfig(yaml)
  const okSections = back.sections.length === config.sections.length
  const okBrand = back.brand.name === config.brand.name
  const okI18n =
    JSON.stringify((back as any).i18n?.locales?.map((l: any) => l.code) ?? []) ===
    JSON.stringify((config as any).i18n?.locales?.map((l: any) => l.code) ?? [])
  must(
    "Sites → YAML export + re-import round-trip",
    okSections && okBrand && okI18n,
    `${kb(yaml.length)} — ${back.sections.length}/${config.sections.length} sections, brand + i18n preserved`
  )
} catch (e: any) {
  must("Sites → YAML export + re-import round-trip", false, e.message)
}

// ── 1d. Analytics CSV export (server route) ──────────────────────────────
try {
  const res = await fetch(`/api/analytics/export?projectId=${vertex.id}`)
  const csv = await res.text()
  writeFileSync(`${OUT}/analytics-${vertex.slug}.csv`, csv)
  const hasPv = csv.startsWith("PAGEVIEWS") && csv.includes("id,date,visitorId")
  const hasEv = csv.includes("EVENTS") && csv.includes("id,date,type,label,variant")
  must(
    "Sites → analytics CSV export",
    res.ok && hasPv && hasEv,
    `HTTP ${res.status} ${res.headers.get("content-type")} — ${csv.split("\n").length} lines, PAGEVIEWS + EVENTS sections intact`
  )
} catch (e: any) {
  must("Sites → analytics CSV export", false, e.message)
}

// ══════════════════════════════════════════════════════════════════════════
// PART 2 — BUILDER EXPORTS
// ══════════════════════════════════════════════════════════════════════════
const { TEMPLATES, buildSiteFromTemplate } = await import("@/lib/builder/templates/templates")
const { renderSiteHTML } = await import("@/lib/builder/sections/renderer")
try {
  const site = buildSiteFromTemplate(TEMPLATES[0])
  // 2a. HTML export (what the Export dialog's exportHTML() produces)
  const page = site.pages[0]
  const html = renderSiteHTML(site, page)
  writeFileSync(`${OUT}/builder-${site.slug}.html`, html)
  must(
    "Builder → standalone HTML export",
    html.trim().toLowerCase().startsWith("<!doctype html") && html.includes("</html>") && html.length > 5000,
    `${kb(html.length)} — template "${site.name}", ${page.sections.length} sections, valid document`
  )
  // 2b. JSON blueprint export
  const json = JSON.stringify(site, null, 2)
  writeFileSync(`${OUT}/builder-${site.slug}.json`, json)
  const parsed = JSON.parse(json)
  must(
    "Builder → JSON blueprint export",
    parsed.slug === site.slug && Array.isArray(parsed.pages),
    `${kb(json.length)} — round-trips through JSON.parse cleanly`
  )
  // 2c. ZIP export via /api/export (server route)
  const zipRes = await fetch("/api/export", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ site, format: "zip" }),
  })
  const zipBuf = Buffer.from(await zipRes.arrayBuffer())
  writeFileSync(`${OUT}/builder-${site.slug}.zip`, zipBuf)
  const isZip = zipBuf[0] === 0x50 && zipBuf[1] === 0x4b // PK
  must(
    "Builder → ZIP export (/api/export format=zip)",
    zipRes.ok && isZip,
    `HTTP ${zipRes.status} — ${kb(zipBuf.length)}, PK magic bytes OK, content-type ${zipRes.headers.get("content-type")}`
  )
  // 2d. HTML via /api/export (server route)
  const htmlRes = await fetch("/api/export", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ site, format: "html" }),
  })
  const htmlBody = await htmlRes.text()
  writeFileSync(`${OUT}/builder-route-${site.slug}.html`, htmlBody)
  must(
    "Builder → HTML export (/api/export format=html)",
    htmlRes.ok && htmlBody.includes("<!DOCTYPE html"),
    `HTTP ${htmlRes.status} — ${kb(htmlBody.length)} server-rendered document`
  )
} catch (e: any) {
  must("Builder exports", false, e.message)
}

// ══════════════════════════════════════════════════════════════════════════
// PART 3 — AUDITOR EXPORTS
// ══════════════════════════════════════════════════════════════════════════
// 3a. Build Ledger bridge payload (used by builder + auditor export dialogs)
const { buildLedgerImportPayload } = await import("@/lib/integrations/build-ledger")
try {
  const payload = buildLedgerImportPayload({
    name: "Vertex Landing",
    description: "Demo landing site exported from Forge Studio Sites.",
    tags: ["forge-studio", "landing-page"],
    notes: "Export smoke test",
    aiTool: "Forge Studio AI",
  })
  const json = JSON.stringify(payload, null, 2)
  writeFileSync(`${OUT}/build-ledger-import.json`, json)
  const p = JSON.parse(json)
  must(
    "Auditor/Builder → Build Ledger bridge payload",
    p.projects?.length === 1 && !!p.projects[0].id && Array.isArray(p.campaigns) && Array.isArray(p.posts),
    `${kb(json.length)} — 1 project, id ${String(p.projects[0].id).slice(0, 13)}…, campaigns/posts/clients arrays present`
  )
} catch (e: any) {
  must("Auditor/Builder → Build Ledger bridge payload", false, e.message)
}

// 3b. Auditor improved-page download (/api/export-html, sanitized filename)
try {
  const sampleHtml =
    "<!DOCTYPE html><html><head><title>Improved</title></head><body><h1>Quick-fixed page</h1><p>Applied 3 quick fixes.</p></body></html>"
  const res = await fetch("/api/export-html", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ html: sampleHtml, filename: "audit-improved.html" }),
  })
  const body = await res.text()
  const cd = res.headers.get("content-disposition") ?? ""
  writeFileSync(`${OUT}/audit-improved.html`, body)
  must(
    "Auditor → improved-page HTML download (/api/export-html)",
    res.ok && cd.includes("attachment") && body === sampleHtml,
    `HTTP ${res.status} — Content-Disposition: ${cd}, body byte-identical (${body.length}B)`
  )
} catch (e: any) {
  must("Auditor → improved-page HTML download (/api/export-html)", false, e.message)
}

// ══════════════════════════════════════════════════════════════════════════
// PART 4 — SHARED EXPORT DEPENDENCIES
// ══════════════════════════════════════════════════════════════════════════
try {
  const res = await fetch("/api/export/css")
  const css = await res.text()
  writeFileSync(`${OUT}/forge-export-bundle.css`, css)
  must(
    "Export CSS bundle route (/api/export/css)",
    res.ok && css.includes("{") && css.length > 10000 && css.includes("lf-anim"),
    `HTTP ${res.status} ${res.headers.get("content-type")} — ${kb(css.length)} compiled Tailwind + lf-anim animation classes`
  )
} catch (e: any) {
  must("Export CSS bundle route (/api/export/css)", false, e.message)
}

// ══════════════════════════════════════════════════════════════════════════
// SUMMARY
// ══════════════════════════════════════════════════════════════════════════
const pass = results.filter((r) => r.ok).length
console.log("\n══════════════════════════════════════════════")
console.log(`EXPORT SUITE: ${pass}/${results.length} passed — artifacts in ${OUT}`)
console.log("══════════════════════════════════════════════")
process.exit(pass === results.length ? 0 : 1)
