/**
 * PixelForge v19 — Core Types
 * ---------------------------
 * 1:1 port of the v19 vanilla-JS data model to TypeScript.
 * Every field here mirrors the original; the scoring engine, quick-fixes,
 * and UI all consume these exact shapes.
 */

export type Category = "seo" | "content" | "a11y" | "structure" | "perf";

export type Severity = "error" | "warning" | "success";

export type DeviceMode = "desktop" | "laptop" | "tablet" | "mobile";
export type EditorMode = "edit" | "preview";
export type UrlMode = "live" | "fetch";
export type PanelTab = "score" | "edit" | "og" | "share";

export interface Issue {
  id: string;
  cat: Category;
  title: string;
  desc: string;
  fix: string;
  severity: Severity;
  selector: string | null;
  pts: number;
  max: number;
  quickFix: string | null;
  impact: number; // 1-3
  visibility: number; // 1-3
  ease: number; // 1-3
  priority: number; // impact × visibility × ease
  why?: string;
  resolved?: boolean;
}

export interface CategoryScore {
  earned: number;
  total: number;
}

export interface ScoreData {
  score: number;
  desktopScore: number;
  mobileScore: number;
  issues: Issue[];
  earned: number;
  total: number;
  cats: Record<Category, CategoryScore>;
}

export interface ChangeLogItem {
  id: string;
  fixId: string;
  title: string;
  description: string;
  before: string;
  after: string;
  timestamp: number;
  reverted?: boolean;
  revertFn?: () => void;
}

export interface TeamComment {
  id: string;
  author: string;
  text: string;
  selector?: string;
  timestamp: number;
}

export interface ABVariant {
  id: string;
  name: string;
  html: string;
  score: number | null;
  isWinner: boolean;
}

export interface CompetitorResult {
  url: string;
  score: number;
  html: string;
  issues: Issue[];
}

export interface PageSpeedResult {
  totalTime: number;
  badge: "fast" | "moderate" | "slow";
  breakdown: { label: string; value: number; rating: "fast" | "moderate" | "slow" }[];
}

export interface AboveFoldResult {
  score: number;
  issues: string[];
  description: string;
}

export interface ConversionFactor {
  label: string;
  score: number;
  weight: number;
}

export interface ConversionResult {
  score: number;
  factors: ConversionFactor[];
  description: string;
}

export interface GuideStep {
  id: string;
  category: Category;
  title: string;
  body: string;
  do: string;
  impact: string;
  why: string;
  selector: string | null;
  quickFix?: string | null;
  manualCheck?: boolean;
}

export interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

export interface PFTheme {
  bg: string;
  panel: string;
  panelHover: string;
  border: string;
  text: string;
  textDim: string;
  textBright: string;
  accent: string;
  accentDim: string;
  accentGlow: string;
  success: string;
  successDim: string;
  warning: string;
  warningDim: string;
  error: string;
  errorDim: string;
  radius: string;
  radiusLg: string;
}

export const PF_THEME: PFTheme = {
  bg: "#0a0c10",
  panel: "#12151c",
  panelHover: "#1a1e2a",
  border: "#1e2230",
  text: "#e0e4ec",
  textDim: "#6b7394",
  textBright: "#ffffff",
  accent: "#5c8def",
  accentDim: "#3a5f9e",
  accentGlow: "rgba(92,141,239,0.3)",
  success: "#3dd68c",
  successDim: "rgba(61,214,140,0.15)",
  warning: "#f0b429",
  warningDim: "rgba(240,180,41,0.15)",
  error: "#ef5c5c",
  errorDim: "rgba(239,92,92,0.15)",
  radius: "8px",
  radiusLg: "12px",
};

export const CATEGORY_META: Record<Category, { label: string; color: string; gradient: string; max: number }> = {
  seo: { label: "SEO", color: "#818cf8", gradient: "linear-gradient(90deg,#5c8def,#818cf8)", max: 20 },
  content: { label: "Content", color: "#34d399", gradient: "linear-gradient(90deg,#3dd68c,#34d399)", max: 25 },
  a11y: { label: "A11y", color: "#fbbf24", gradient: "linear-gradient(90deg,#f59e0b,#fbbf24)", max: 25 },
  structure: { label: "Structure", color: "#a78bfa", gradient: "linear-gradient(90deg,#8b5cf6,#a78bfa)", max: 20 },
  perf: { label: "Performance", color: "#f472b6", gradient: "linear-gradient(90deg,#ec4899,#f472b6)", max: 30 },
};

export const CATEGORIES: Category[] = ["seo", "content", "a11y", "structure", "perf"];

export const MOBILE_PENALTY_ISSUES = [
  "font-display", "lazy-load", "hero-preload", "script-blocking", "srcset-missing",
  "font-size", "touch-targets", "no-responsive-css", "viewport-missing", "viewport-width",
  "dom-size", "img-size", "dns-prefetch", "icon-font", "autocomplete",
];

/** Total max points across all categories = 120 (scaled to 100 in UI) */
export const TOTAL_MAX_POINTS = 120;

export function scaleTo100(earned: number, total: number): number {
  return total > 0 ? Math.round((earned / total) * 100) : 0;
}
