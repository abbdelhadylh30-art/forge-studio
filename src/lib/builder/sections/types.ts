/**
 * Forge Studio — Builder: Section Type System
 * Ported from LandingForge v4.0. Each section type defines a JSON schema that
 * auto-generates its inspector form. Section instances are plain JSON.
 */

import type { LucideIcon } from "lucide-react";

export type SectionKind =
  | "navbar" | "hero" | "logocloud" | "features" | "stats" | "gallery"
  | "testimonials" | "pricing" | "faq" | "cta" | "newsletter" | "footer";

export interface FieldSchema {
  key: string;
  label: string;
  type: "text" | "textarea" | "color" | "number" | "select" | "boolean" | "image" | "list";
  options?: { label: string; value: string }[];
  placeholder?: string;
  itemSchema?: FieldSchema[];
  maxItems?: number;
  minItems?: number;
  multiple?: boolean;
  min?: number;
  max?: number;
  step?: number;
  aiSuggest?: boolean;
  group?: string;
}

export interface SectionType {
  kind: SectionKind;
  label: string;
  description: string;
  icon: LucideIcon;
  category: "structure" | "conversion" | "social" | "media";
  schema: FieldSchema[];
  defaultConfig: () => Record<string, unknown>;
}

export interface SectionInstance {
  id: string;
  kind: SectionKind;
  config: Record<string, unknown>;
}

export interface PageData {
  id: string;
  name: string;
  slug: string;
  path: string;
  isHome: boolean;
  seo?: { title?: string; description?: string; ogImage?: string };
  sections: SectionInstance[];
}

export interface SiteData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  themeId?: string;
  themeTokens: ThemeTokens;
  pages: PageData[];
}

export interface ThemeTokens {
  primary: string;
  primaryFg: string;
  accent: string;
  accentFg: string;
  background: string;
  foreground: string;
  muted: string;
  mutedFg: string;
  border: string;
  font: string;
  fontHeading: string;
  radius: string;
}

export const DEFAULT_THEME: ThemeTokens = {
  primary: "#0f172a", primaryFg: "#f8fafc",
  accent: "#10b981", accentFg: "#022c22",
  background: "#ffffff", foreground: "#0f172a",
  muted: "#f1f5f9", mutedFg: "#64748b",
  border: "#e2e8f0",
  font: "Inter, system-ui, sans-serif",
  fontHeading: "Inter, system-ui, sans-serif",
  radius: "12px",
};

export const THEME_PRESETS: { name: string; tokens: ThemeTokens }[] = [
  { name: "Slate", tokens: DEFAULT_THEME },
  {
    name: "Midnight",
    tokens: { ...DEFAULT_THEME,
      primary: "#1e1b4b", accent: "#a78bfa", accentFg: "#1e1b4b",
      background: "#0b1020", foreground: "#e2e8f0", muted: "#1e293b", mutedFg: "#94a3b8", border: "#1e293b",
    },
  },
  {
    name: "Sunset",
    tokens: { ...DEFAULT_THEME,
      primary: "#7c2d12", accent: "#f97316", accentFg: "#fff7ed",
      background: "#fffbeb", foreground: "#431407", muted: "#fef3c7", mutedFg: "#92400e", border: "#fde68a",
    },
  },
  {
    name: "Forest",
    tokens: { ...DEFAULT_THEME,
      primary: "#14532d", accent: "#22c55e", accentFg: "#052e16",
      background: "#f7fee7", foreground: "#1a2e05", muted: "#ecfccb", mutedFg: "#3f6212", border: "#d9f99d",
    },
  },
  {
    name: "Rose",
    tokens: { ...DEFAULT_THEME,
      primary: "#831843", accent: "#ec4899", accentFg: "#500724",
      background: "#fff1f2", foreground: "#4c0519", muted: "#ffe4e6", mutedFg: "#9f1239", border: "#fecdd3",
    },
  },
  {
    name: "Ocean",
    tokens: { ...DEFAULT_THEME,
      primary: "#0c4a6e", accent: "#06b6d4", accentFg: "#083344",
      background: "#ecfeff", foreground: "#082f49", muted: "#cffafe", mutedFg: "#155e75", border: "#a5f3fc",
    },
  },
  {
    name: "Mono",
    tokens: { ...DEFAULT_THEME,
      primary: "#000000", accent: "#525252", accentFg: "#ffffff",
      background: "#ffffff", foreground: "#000000", muted: "#f5f5f5", mutedFg: "#737373", border: "#e5e5e5",
    },
  },
];
