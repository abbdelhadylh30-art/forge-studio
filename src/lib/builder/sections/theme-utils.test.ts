import { describe, it, expect } from "vitest";
import { themeToInlineStyle, resolveIcon } from "./theme-utils";
import { Sparkles, Rocket } from "lucide-react";
import type { ThemeTokens } from "./types";

const THEME: ThemeTokens = {
  primary: "#5c8def",
  primaryFg: "#ffffff",
  accent: "#a855f7",
  accentFg: "#ffffff",
  background: "#ffffff",
  foreground: "#0f172a",
  muted: "#f1f5f9",
  mutedFg: "#64748b",
  border: "#e2e8f0",
  font: "Inter, sans-serif",
  fontHeading: "Inter, sans-serif",
  radius: "12px",
};

describe("themeToInlineStyle", () => {
  it("maps every ThemeTokens field to a CSS custom property", () => {
    const s = themeToInlineStyle(THEME) as Record<string, string>;
    expect(s["--lf-primary"]).toBe("#5c8def");
    expect(s["--lf-primary-fg"]).toBe("#ffffff");
    expect(s["--lf-accent"]).toBe("#a855f7");
    expect(s["--lf-accent-fg"]).toBe("#ffffff");
    expect(s["--lf-bg"]).toBe("#ffffff");
    expect(s["--lf-fg"]).toBe("#0f172a");
    expect(s["--lf-muted"]).toBe("#f1f5f9");
    expect(s["--lf-muted-fg"]).toBe("#64748b");
    expect(s["--lf-border"]).toBe("#e2e8f0");
    expect(s["--lf-font"]).toBe("Inter, sans-serif");
    expect(s["--lf-font-heading"]).toBe("Inter, sans-serif");
    expect(s["--lf-radius"]).toBe("12px");
  });

  it("returns a fresh object each call (no shared mutation)", () => {
    const a = themeToInlineStyle(THEME);
    const b = themeToInlineStyle(THEME);
    expect(a).not.toBe(b); // different references
    expect(a).toEqual(b);  // same contents
  });
});

describe("resolveIcon", () => {
  it("returns the matching icon for a known name", () => {
    expect(resolveIcon("Rocket")).toBe(Rocket);
  });

  it("falls back to Sparkles for unknown names", () => {
    expect(resolveIcon("NonexistentIcon123")).toBe(Sparkles);
  });

  it("falls back to Sparkles for undefined", () => {
    expect(resolveIcon(undefined)).toBe(Sparkles);
  });

  it("falls back to Sparkles for empty string", () => {
    expect(resolveIcon("")).toBe(Sparkles);
  });
});
