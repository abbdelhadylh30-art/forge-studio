/**
 * Forge Studio — Builder: Theme utilities + icon resolver
 */

import type { ThemeTokens } from "./types";
import {
  Rocket, Palette, Code, LineChart, ShieldCheck, Sparkles, Activity, GitBranch,
  Gauge, Bell, Workflow, Compass, PenTool, Layout, Clapperboard, Megaphone,
  Package, Recycle, Shield, Zap, Lock, Feather, Droplets, Link, BrainCircuit,
  FileText, Star, Check, ArrowRight, type LucideIcon,
} from "lucide-react";

export function themeToInlineStyle(t: ThemeTokens): React.CSSProperties {
  return {
    "--lf-primary": t.primary,
    "--lf-primary-fg": t.primaryFg,
    "--lf-accent": t.accent,
    "--lf-accent-fg": t.accentFg,
    "--lf-bg": t.background,
    "--lf-fg": t.foreground,
    "--lf-muted": t.muted,
    "--lf-muted-fg": t.mutedFg,
    "--lf-border": t.border,
    "--lf-font": t.font,
    "--lf-font-heading": t.fontHeading,
    "--lf-radius": t.radius,
  } as React.CSSProperties;
}

const ICONS: Record<string, LucideIcon> = {
  Rocket, Palette, Code, LineChart, ShieldCheck, Sparkles, Activity, GitBranch,
  Gauge, Bell, Workflow, Compass, PenTool, Layout, Clapperboard, Megaphone,
  Package, Recycle, Shield, Zap, Lock, Feather, Droplets, Link, BrainCircuit,
  FileText, Star, Check, ArrowRight,
};

export function resolveIcon(name: string | undefined): LucideIcon {
  if (!name) return Sparkles;
  return ICONS[name] ?? Sparkles;
}
