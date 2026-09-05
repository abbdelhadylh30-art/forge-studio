import type { ThemeId, ThemeMode } from "./types"

// ─────────────────────────────────────────────────────────────────────────────
// Dual-mode themes: every palette ships BOTH a dark and a light variable set.
//   • `mode` is the theme's built-in preference (what an unset brand.mode uses)
//   • brand.mode: "auto" | "dark" | "light" overrides it per site
//   • the published page + standalone export both resolve "auto" against the
//     visitor's system preference, live.
// ─────────────────────────────────────────────────────────────────────────────

export interface ThemeVars {
  bg: string
  bgAlt: string
  surface: string
  text: string
  textMuted: string
  accent: string
  accentText: string
  accentSoft: string // translucent accent for chips/badges
  border: string
  gradient: string
}

export interface ThemeDef {
  id: ThemeId
  name: string
  swatch: string[] // preferred-mode swatch triple [bg, bgAlt, accent]
  swatchAlt: string[] // opposite-mode swatch triple
  /** built-in preference — an unset brand.mode resolves to this (legacy-safe) */
  mode: "dark" | "light"
  dark: ThemeVars
  light: ThemeVars
}

const t = (vars: ThemeVars): ThemeVars => vars

export const THEMES: ThemeDef[] = [
  {
    id: "nebula",
    name: "Nebula",
    swatch: ["#0a0a0f", "#120a1f", "#A78BFA"],
    swatchAlt: ["#faf9ff", "#f1eefb", "#7c3aed"],
    mode: "dark",
    dark: t({
      bg: "#0a0a0f", bgAlt: "#120a1f", surface: "rgba(167,139,250,0.06)",
      text: "#f5f3ff", textMuted: "#a7a2b8", accent: "#A78BFA", accentText: "#12101c",
      accentSoft: "rgba(167,139,250,0.14)", border: "rgba(167,139,250,0.18)",
      gradient: "linear-gradient(135deg, #A78BFA 0%, #f5f3ff 100%)",
    }),
    light: t({
      bg: "#faf9ff", bgAlt: "#f1eefb", surface: "rgba(124,58,237,0.06)",
      text: "#1a1523", textMuted: "#6f6a85", accent: "#7c3aed", accentText: "#ffffff",
      accentSoft: "rgba(124,58,237,0.10)", border: "rgba(26,21,35,0.12)",
      gradient: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
    }),
  },
  {
    id: "ember",
    name: "Ember",
    swatch: ["#120803", "#241005", "#fb923c"],
    swatchAlt: ["#fdfaf7", "#f9f1e9", "#ea580c"],
    mode: "dark",
    dark: t({
      bg: "#120803", bgAlt: "#1e0d04", surface: "rgba(251,146,60,0.06)",
      text: "#fff7ed", textMuted: "#c4b0a0", accent: "#fb923c", accentText: "#1a0d02",
      accentSoft: "rgba(251,146,60,0.14)", border: "rgba(251,146,60,0.18)",
      gradient: "linear-gradient(135deg, #fb923c 0%, #fde68a 100%)",
    }),
    light: t({
      bg: "#fdfaf7", bgAlt: "#f9f1e9", surface: "rgba(234,88,12,0.05)",
      text: "#26160b", textMuted: "#84715f", accent: "#ea580c", accentText: "#ffffff",
      accentSoft: "rgba(234,88,12,0.10)", border: "rgba(38,22,11,0.12)",
      gradient: "linear-gradient(135deg, #ea580c 0%, #fbbf24 100%)",
    }),
  },
  {
    id: "emerald",
    name: "Emerald",
    swatch: ["#04120c", "#07231a", "#34d399"],
    swatchAlt: ["#f7fdfa", "#edf8f3", "#059669"],
    mode: "dark",
    dark: t({
      bg: "#04120c", bgAlt: "#062016", surface: "rgba(52,211,153,0.06)",
      text: "#ecfdf5", textMuted: "#9fbcae", accent: "#34d399", accentText: "#03150e",
      accentSoft: "rgba(52,211,153,0.14)", border: "rgba(52,211,153,0.18)",
      gradient: "linear-gradient(135deg, #34d399 0%, #d1fae5 100%)",
    }),
    light: t({
      bg: "#f7fdfa", bgAlt: "#edf8f3", surface: "rgba(5,150,105,0.05)",
      text: "#06251a", textMuted: "#5e7d70", accent: "#059669", accentText: "#ffffff",
      accentSoft: "rgba(5,150,105,0.10)", border: "rgba(6,37,26,0.12)",
      gradient: "linear-gradient(135deg, #059669 0%, #6ee7b7 100%)",
    }),
  },
  {
    id: "rose",
    name: "Rosé",
    swatch: ["#120509", "#220a12", "#fb7185"],
    swatchAlt: ["#fffafb", "#fdf1f4", "#e11d48"],
    mode: "dark",
    dark: t({
      bg: "#120509", bgAlt: "#1d0910", surface: "rgba(251,113,133,0.06)",
      text: "#fff1f2", textMuted: "#c3a3ab", accent: "#fb7185", accentText: "#210509",
      accentSoft: "rgba(251,113,133,0.14)", border: "rgba(251,113,133,0.18)",
      gradient: "linear-gradient(135deg, #fb7185 0%, #fda4af 100%)",
    }),
    light: t({
      bg: "#fffafb", bgAlt: "#fdf1f4", surface: "rgba(225,29,72,0.05)",
      text: "#260a12", textMuted: "#85606c", accent: "#e11d48", accentText: "#ffffff",
      accentSoft: "rgba(225,29,72,0.10)", border: "rgba(38,10,18,0.12)",
      gradient: "linear-gradient(135deg, #e11d48 0%, #fb7185 100%)",
    }),
  },
  {
    id: "mono",
    name: "Mono",
    swatch: ["#0a0a0a", "#161616", "#fafafa"],
    swatchAlt: ["#ffffff", "#f4f4f5", "#18181b"],
    mode: "dark",
    dark: t({
      bg: "#0a0a0a", bgAlt: "#141414", surface: "rgba(255,255,255,0.04)",
      text: "#fafafa", textMuted: "#a3a3a3", accent: "#fafafa", accentText: "#0a0a0a",
      accentSoft: "rgba(255,255,255,0.10)", border: "rgba(255,255,255,0.14)",
      gradient: "linear-gradient(135deg, #fafafa 0%, #a3a3a3 100%)",
    }),
    light: t({
      bg: "#ffffff", bgAlt: "#f4f4f5", surface: "rgba(0,0,0,0.03)",
      text: "#18181b", textMuted: "#71717a", accent: "#18181b", accentText: "#ffffff",
      accentSoft: "rgba(0,0,0,0.06)", border: "rgba(0,0,0,0.14)",
      gradient: "linear-gradient(135deg, #18181b 0%, #71717a 100%)",
    }),
  },
  {
    id: "paper",
    name: "Paper",
    swatch: ["#faf9f7", "#f1efe9", "#6d28d9"],
    swatchAlt: ["#111013", "#1a181d", "#a78bfa"],
    mode: "light",
    light: t({
      bg: "#faf9f7", bgAlt: "#f1efe9", surface: "rgba(109,40,217,0.05)",
      text: "#1c1917", textMuted: "#78716c", accent: "#6d28d9", accentText: "#faf9f7",
      accentSoft: "rgba(109,40,217,0.10)", border: "rgba(28,25,23,0.12)",
      gradient: "linear-gradient(135deg, #6d28d9 0%, #a78bfa 100%)",
    }),
    dark: t({
      bg: "#111013", bgAlt: "#1a181d", surface: "rgba(167,139,250,0.06)",
      text: "#f4f2ef", textMuted: "#a8a3ad", accent: "#a78bfa", accentText: "#14121a",
      accentSoft: "rgba(167,139,250,0.14)", border: "rgba(167,139,250,0.18)",
      gradient: "linear-gradient(135deg, #a78bfa 0%, #ede9fe 100%)",
    }),
  },
  {
    id: "slate",
    name: "Slate",
    swatch: ["#f8fafc", "#f1f5f9", "#4f46e5"],
    swatchAlt: ["#0b1120", "#111a30", "#818cf8"],
    mode: "light",
    light: t({
      bg: "#f8fafc", bgAlt: "#f1f5f9", surface: "rgba(15,23,42,0.04)",
      text: "#0f172a", textMuted: "#64748b", accent: "#4f46e5", accentText: "#ffffff",
      accentSoft: "rgba(79,70,229,0.10)", border: "rgba(15,23,42,0.12)",
      gradient: "linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)",
    }),
    dark: t({
      bg: "#0b1120", bgAlt: "#111a30", surface: "rgba(129,140,248,0.06)",
      text: "#eef2ff", textMuted: "#9aa4c0", accent: "#818cf8", accentText: "#0b1120",
      accentSoft: "rgba(129,140,248,0.14)", border: "rgba(129,140,248,0.18)",
      gradient: "linear-gradient(135deg, #818cf8 0%, #e0e7ff 100%)",
    }),
  },
  {
    id: "ocean",
    name: "Ocean",
    swatch: ["#f6fdff", "#ecf8fb", "#0891b2"],
    swatchAlt: ["#03141a", "#072029", "#22d3ee"],
    mode: "light",
    light: t({
      bg: "#f6fdff", bgAlt: "#ecf8fb", surface: "rgba(8,145,178,0.05)",
      text: "#083344", textMuted: "#5b7a85", accent: "#0891b2", accentText: "#ffffff",
      accentSoft: "rgba(8,145,178,0.10)", border: "rgba(8,51,68,0.12)",
      gradient: "linear-gradient(135deg, #0891b2 0%, #67e8f9 100%)",
    }),
    dark: t({
      bg: "#03141a", bgAlt: "#072029", surface: "rgba(34,211,238,0.06)",
      text: "#ecfeff", textMuted: "#8fb3bd", accent: "#22d3ee", accentText: "#032027",
      accentSoft: "rgba(34,211,238,0.14)", border: "rgba(34,211,238,0.18)",
      gradient: "linear-gradient(135deg, #22d3ee 0%, #a5f3fc 100%)",
    }),
  },
  {
    id: "gold",
    name: "Gold",
    swatch: ["#faf7f0", "#f3eee0", "#97701a"],
    swatchAlt: ["#0c0a05", "#171207", "#d4af37"],
    mode: "light",
    light: t({
      bg: "#faf7f0", bgAlt: "#f3eee0", surface: "rgba(151,112,26,0.05)",
      text: "#201807", textMuted: "#7c6f52", accent: "#97701a", accentText: "#ffffff",
      accentSoft: "rgba(151,112,26,0.10)", border: "rgba(32,24,7,0.14)",
      gradient: "linear-gradient(135deg, #97701a 0%, #e5c76b 100%)",
    }),
    dark: t({
      bg: "#0c0a05", bgAlt: "#171207", surface: "rgba(212,175,55,0.06)",
      text: "#fdf8e7", textMuted: "#bcb08b", accent: "#d4af37", accentText: "#171207",
      accentSoft: "rgba(212,175,55,0.14)", border: "rgba(212,175,55,0.22)",
      gradient: "linear-gradient(135deg, #d4af37 0%, #f5e7a3 100%)",
    }),
  },
  {
    id: "midnight",
    name: "Midnight",
    swatch: ["#090d1f", "#101636", "#6366f1"],
    swatchAlt: ["#f5f6ff", "#eceefb", "#4f46e5"],
    mode: "dark",
    dark: t({
      bg: "#090d1f", bgAlt: "#101636", surface: "rgba(99,102,241,0.07)",
      text: "#eef2ff", textMuted: "#98a0c2", accent: "#6366f1", accentText: "#0a0e21",
      accentSoft: "rgba(99,102,241,0.15)", border: "rgba(99,102,241,0.20)",
      gradient: "linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)",
    }),
    light: t({
      bg: "#f5f6ff", bgAlt: "#eceefb", surface: "rgba(79,70,229,0.05)",
      text: "#191b33", textMuted: "#66698c", accent: "#4f46e5", accentText: "#ffffff",
      accentSoft: "rgba(79,70,229,0.10)", border: "rgba(25,27,51,0.12)",
      gradient: "linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%)",
    }),
  },
]

export function getTheme(id: ThemeId): ThemeDef {
  return THEMES.find((x) => x.id === id) ?? THEMES[0]
}

/** Variable set for a theme in a given mode (invalid mode → preferred). */
export function themeVars(id: ThemeId, mode: "dark" | "light"): ThemeVars {
  const th = getTheme(id)
  return mode === "dark" ? th.dark : th.light
}

/**
 * Resolve the effective mode.
 *   unset  → the theme's built-in preference (legacy sites stay pixel-identical)
 *   "auto" → the visitor's system preference
 *   forced → itself
 */
export function resolveMode(id: ThemeId, mode: ThemeMode | undefined, prefersDark: boolean): "dark" | "light" {
  if (mode === "auto") return prefersDark ? "dark" : "light"
  if (mode === "dark" || mode === "light") return mode
  return getTheme(id).mode
}

// ── Custom accent derivation (brand kit) ────────────────────────────────────

export const ACCENT_PRESETS: { hex: string; name: string }[] = [
  { hex: "#A78BFA", name: "Violet" },
  { hex: "#fb923c", name: "Amber" },
  { hex: "#34d399", name: "Emerald" },
  { hex: "#fb7185", name: "Rosé" },
  { hex: "#facc15", name: "Gold" },
  { hex: "#22d3ee", name: "Cyan" },
  { hex: "#f472b6", name: "Pink" },
  { hex: "#818cf8", name: "Indigo" },
  { hex: "#d4af37", name: "Champagne" },
]

/** "#a78bfa" | "#A78BFA" | "a78bfa" → {r,g,b}; null when unparsable. */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

/** WCAG-ish relative luminance (0–1). */
function luminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const srgb = [r, g, b].map((c) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
}

/** mix a hex color toward white by ratio (0–1) */
function mixWhite(hex: string, ratio: number): string {
  const c = hexToRgb(hex)
  if (!c) return hex
  const ch = (v: number) => Math.round(v + (255 - v) * ratio)
  return `#${[ch(c.r), ch(c.g), ch(c.b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`
}

/** Validate a user-provided accent color (6-digit hex). */
export function isValidAccent(hex: string | undefined): hex is string {
  return !!hex && /^#?[0-9a-f]{6}$/i.test(hex.trim())
}

// ── Brand font pairs ─────────────────────────────────────────────────────────
// Two tiers:
//  • system stacks — zero network requests, render instantly everywhere
//    (preview, published page, standalone export);
//  • Google webfont pairs (✦) — curated brand-true type streamed from
//    fonts.googleapis.com with preconnects (see googleFonts.ts); the system
//    stack stays as the in-font-family fallback so an offline environment
//    degrades gracefully to the same metrics class.

export type FontPairId =
  | "system"
  | "editorial"
  | "mono"
  | "book"
  | "rounded"
  | "g-sora"
  | "g-playfair"
  | "g-grotesk"
  | "g-jakarta"
  | "g-poppins"
  | "g-arabic"

export interface FontPairDef {
  id: FontPairId
  label: string
  hint: string
  /** headings (h1–h3) inside the preview root */
  display: string
  /** everything else — set as the root font-family (inherited) */
  body: string
  /** Google webfont pair — css2 stylesheet URL (undefined for system stacks) */
  google?: string
}

const SANS = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
const SERIF = "Georgia, 'Iowan Old Style', 'Times New Roman', serif"
const MONO = "ui-monospace, 'Cascadia Code', 'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace"
const ROUNDED = "'Trebuchet MS', 'Segoe UI', ui-rounded, system-ui, sans-serif"

// webfont stacks — the web family first, then the equivalent system fallback
const GF_SORA = "'Sora', " + SANS
const GF_INTER = "'Inter', " + SANS
const GF_PLAYFAIR = "'Playfair Display', " + SERIF
const GF_SOURCE = "'Source Sans 3', " + SANS
const GF_GROTESK = "'Space Grotesk', " + SANS
const GF_DM = "'DM Sans', " + SANS
const GF_JAKARTA = "'Plus Jakarta Sans', " + SANS
const GF_POPPINS = "'Poppins', " + SANS
const GF_ARABIC = "'Noto Sans Arabic', " + SANS

export const FONT_PAIRS: FontPairDef[] = [
  { id: "system", label: "System", hint: "Neutral, platform-native — the default look", display: SANS, body: SANS },
  { id: "editorial", label: "Editorial", hint: "Serif headlines over sans body — magazine feel", display: SERIF, body: SANS },
  { id: "mono", label: "Mono", hint: "Monospaced headlines — developer-tool aesthetic", display: MONO, body: SANS },
  { id: "book", label: "Book", hint: "Serif throughout — calm, literary, long-form", display: SERIF, body: SERIF },
  { id: "rounded", label: "Rounded", hint: "Friendly display face — consumer apps", display: ROUNDED, body: SANS },
  {
    id: "g-sora",
    label: "Sora",
    hint: "Webfont — geometric Sora headlines over Inter body. Modern SaaS confidence.",
    display: GF_SORA,
    body: GF_INTER,
    google: "https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap",
  },
  {
    id: "g-playfair",
    label: "Playfair",
    hint: "Webfont — high-contrast Playfair Display over Source Sans 3. Boutique, editorial luxury.",
    display: GF_PLAYFAIR,
    body: GF_SOURCE,
    google: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Source+Sans+3:wght@400;500;600&display=swap",
  },
  {
    id: "g-grotesk",
    label: "Grotesk",
    hint: "Webfont — Space Grotesk headlines over DM Sans. Dev-tool, technical energy.",
    display: GF_GROTESK,
    body: GF_DM,
    google: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=DM+Sans:wght@400;500;700&display=swap",
  },
  {
    id: "g-jakarta",
    label: "Jakarta",
    hint: "Webfont — Plus Jakarta Sans headlines over Inter. Friendly, confident corporate.",
    display: GF_JAKARTA,
    body: GF_INTER,
    google: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap",
  },
  {
    id: "g-poppins",
    label: "Poppins",
    hint: "Webfont — geometric Poppins headlines over Inter. Warm, consumer-brand energy.",
    display: GF_POPPINS,
    body: GF_INTER,
    google: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap",
  },
  {
    id: "g-arabic",
    label: "Arabic",
    hint: "Webfont — Noto Sans Arabic display + body. Native-quality Arabic (and RTL) typography.",
    display: GF_ARABIC,
    body: GF_ARABIC,
    google: "https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700;800&display=swap",
  },
]

export function getFontPair(id: string | undefined): FontPairDef {
  return FONT_PAIRS.find((f) => f.id === id) ?? FONT_PAIRS[0]
}

export function isFontPairId(v: string | undefined): v is FontPairId {
  return !!v && FONT_PAIRS.some((f) => f.id === v)
}

/** css2 URL when the pair is a Google webfont pair, else null. */
export function googleFontHref(id: string | undefined): string | null {
  return getFontPair(id).google ?? null
}

/** static <head> snippets for the standalone HTML export (preconnect + css2). */
export function googleFontLinkTags(id: string | undefined): string[] {
  const href = googleFontHref(id)
  if (!href) return []
  return [
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    `<link rel="stylesheet" href="${href}">`,
  ]
}

/**
 * Derive the full accent variable set from one brand hex: the accent itself,
 * a contrast-safe accent text color, translucent soft/border tints and a
 * gradient. Returns null if the hex is invalid (caller keeps theme defaults).
 */
export function accentVars(hex: string): Partial<ThemeVars> | null {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  const dark = luminance(rgb) < 0.35
  return {
    accent: hex,
    accentText: dark ? "#fafafa" : "#1a1523",
    accentSoft: `rgba(${rgb.r},${rgb.g},${rgb.b},0.14)`,
    border: `rgba(${rgb.r},${rgb.g},${rgb.b},0.24)`,
    gradient: `linear-gradient(135deg, ${hex} 0%, ${mixWhite(hex, 0.35)} 100%)`,
  }
}

function varsToCss(v: ThemeVars): string {
  return [
    `--lf-bg:${v.bg}`,
    `--lf-bg-alt:${v.bgAlt}`,
    `--lf-surface:${v.surface}`,
    `--lf-text:${v.text}`,
    `--lf-muted:${v.textMuted}`,
    `--lf-accent:${v.accent}`,
    `--lf-accent-contrast:${v.accentText}`,
    `--lf-accent-soft:${v.accentSoft}`,
    `--lf-border:${v.border}`,
    `--lf-gradient:${v.gradient}`,
  ].join(";")
}

/** style object with CSS vars for a theme, spread onto the preview root element.
 *  A valid `accent` hex (brand kit) overrides the theme's accent + derived tints.
 *  A `font` pair (brand kit) sets the display/body font stacks.
 *  `mode` picks the variable set (defaults to the theme's preferred mode). */
export function themeStyle(
  id: ThemeId,
  accent?: string,
  font?: string,
  mode: "dark" | "light" = getTheme(id).mode,
): React.CSSProperties {
  const th = getTheme(id)
  const base = mode === "dark" ? th.dark : th.light
  const vars = accent ? { ...base, ...(accentVars(accent) ?? {}) } : base
  const pair = getFontPair(font)
  return {
    ["--lf-bg" as string]: vars.bg,
    ["--lf-bg-alt" as string]: vars.bgAlt,
    ["--lf-surface" as string]: vars.surface,
    ["--lf-text" as string]: vars.text,
    ["--lf-muted" as string]: vars.textMuted,
    ["--lf-accent" as string]: vars.accent,
    ["--lf-accent-contrast" as string]: vars.accentText,
    ["--lf-accent-soft" as string]: vars.accentSoft,
    ["--lf-border" as string]: vars.border,
    ["--lf-gradient" as string]: vars.gradient,
    ["--lf-font-display" as string]: pair.display,
    ["--lf-font-body" as string]: pair.body,
    background: vars.bg,
    color: vars.text,
    fontFamily: pair.body,
  }
}

/**
 * Theme CSS for the standalone HTML export — the same variable system, but
 * mode-switchable purely via CSS so the exported page follows the visitor's
 * system preference (data-lf-mode="auto") and survives with JS disabled:
 *
 *   .lf-root                                   → dark variables (base)
 *   .lf-root[data-lf-mode="light"]             → light variables
 *   @media (prefers-color-scheme: light)       → light for auto
 *
 * A valid brand accent overrides accent + derived tints in BOTH sets.
 */
export function themeVarsCss(id: ThemeId, accent?: string): string {
  const th = getTheme(id)
  const dark = accent ? { ...th.dark, ...(accentVars(accent) ?? {}) } : th.dark
  const light = accent ? { ...th.light, ...(accentVars(accent) ?? {}) } : th.light
  return [
    `.lf-root{${varsToCss(dark)};background:var(--lf-bg);color:var(--lf-text)}`,
    `.lf-root[data-lf-mode="light"]{${varsToCss(light)}}`,
    `@media (prefers-color-scheme: light){.lf-root[data-lf-mode="auto"]{${varsToCss(light)}}}`,
  ].join("\n")
}
