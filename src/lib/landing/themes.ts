import type { ThemeId } from "./types"

export interface ThemeDef {
  id: ThemeId
  name: string
  swatch: string[]
  mode: "dark" | "light"
  /** CSS custom properties applied to the preview root */
  vars: {
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
}

export const THEMES: ThemeDef[] = [
  {
    id: "nebula",
    name: "Nebula",
    swatch: ["#0a0a0f", "#1a0a2e", "#A78BFA"],
    mode: "dark",
    vars: {
      bg: "#0a0a0f",
      bgAlt: "#120a1f",
      surface: "rgba(167,139,250,0.06)",
      text: "#f5f3ff",
      textMuted: "#a7a2b8",
      accent: "#A78BFA",
      accentText: "#12101c",
      accentSoft: "rgba(167,139,250,0.14)",
      border: "rgba(167,139,250,0.18)",
      gradient: "linear-gradient(135deg, #A78BFA 0%, #f5f3ff 100%)",
    },
  },
  {
    id: "ember",
    name: "Ember",
    swatch: ["#120803", "#241005", "#fb923c"],
    mode: "dark",
    vars: {
      bg: "#120803",
      bgAlt: "#1e0d04",
      surface: "rgba(251,146,60,0.06)",
      text: "#fff7ed",
      textMuted: "#c4b0a0",
      accent: "#fb923c",
      accentText: "#1a0d02",
      accentSoft: "rgba(251,146,60,0.14)",
      border: "rgba(251,146,60,0.18)",
      gradient: "linear-gradient(135deg, #fb923c 0%, #fde68a 100%)",
    },
  },
  {
    id: "emerald",
    name: "Emerald",
    swatch: ["#04120c", "#07231a", "#34d399"],
    mode: "dark",
    vars: {
      bg: "#04120c",
      bgAlt: "#062016",
      surface: "rgba(52,211,153,0.06)",
      text: "#ecfdf5",
      textMuted: "#9fbcae",
      accent: "#34d399",
      accentText: "#03150e",
      accentSoft: "rgba(52,211,153,0.14)",
      border: "rgba(52,211,153,0.18)",
      gradient: "linear-gradient(135deg, #34d399 0%, #d1fae5 100%)",
    },
  },
  {
    id: "rose",
    name: "Rosé",
    swatch: ["#120509", "#220a12", "#fb7185"],
    mode: "dark",
    vars: {
      bg: "#120509",
      bgAlt: "#1d0910",
      surface: "rgba(251,113,133,0.06)",
      text: "#fff1f2",
      textMuted: "#c3a3ab",
      accent: "#fb7185",
      accentText: "#210509",
      accentSoft: "rgba(251,113,133,0.14)",
      border: "rgba(251,113,133,0.18)",
      gradient: "linear-gradient(135deg, #fb7185 0%, #fda4af 100%)",
    },
  },
  {
    id: "mono",
    name: "Mono",
    swatch: ["#0a0a0a", "#161616", "#fafafa"],
    mode: "dark",
    vars: {
      bg: "#0a0a0a",
      bgAlt: "#141414",
      surface: "rgba(255,255,255,0.04)",
      text: "#fafafa",
      textMuted: "#a3a3a3",
      accent: "#fafafa",
      accentText: "#0a0a0a",
      accentSoft: "rgba(255,255,255,0.10)",
      border: "rgba(255,255,255,0.14)",
      gradient: "linear-gradient(135deg, #fafafa 0%, #a3a3a3 100%)",
    },
  },
  {
    id: "paper",
    name: "Paper",
    swatch: ["#faf9f7", "#f1efe9", "#6d28d9"],
    mode: "light",
    vars: {
      bg: "#faf9f7",
      bgAlt: "#f1efe9",
      surface: "rgba(109,40,217,0.05)",
      text: "#1c1917",
      textMuted: "#78716c",
      accent: "#6d28d9",
      accentText: "#faf9f7",
      accentSoft: "rgba(109,40,217,0.10)",
      border: "rgba(28,25,23,0.12)",
      gradient: "linear-gradient(135deg, #6d28d9 0%, #a78bfa 100%)",
    },
  },
]

export function getTheme(id: ThemeId): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
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
export function accentVars(hex: string): Partial<ThemeDef["vars"]> | null {
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

/** style object with CSS vars for a theme, spread onto the preview root element.
 *  A valid `accent` hex (brand kit) overrides the theme's accent + derived tints.
 *  A `font` pair (brand kit) sets the display/body font stacks. */
export function themeStyle(id: ThemeId, accent?: string, font?: string): React.CSSProperties {
  const t = getTheme(id)
  const vars = accent ? { ...t.vars, ...(accentVars(accent) ?? {}) } : t.vars
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
