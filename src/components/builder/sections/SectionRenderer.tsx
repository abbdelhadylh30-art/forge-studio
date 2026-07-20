"use client";

import { themeToInlineStyle } from "@/lib/builder/sections/theme-utils";
import type { SectionInstance, ThemeTokens } from "@/lib/builder/sections/types";
import { Navbar, Hero, LogoCloud, Features, Stats, Gallery, Testimonials, Pricing, Faq, Cta, Newsletter, Footer } from "./AllSections";

export function SectionRenderer({ section, theme, editable, selected, onSelect }: {
  section: SectionInstance;
  theme: ThemeTokens;
  editable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
}) {
  const style = themeToInlineStyle(theme);

  // Handle raw HTML sections (transferred from the auditor)
  const rawHTML = (section.config as any)?.__rawHTML as string | undefined;
  if (rawHTML) {
    const inner = (
      <div className="w-full">
        <iframe srcDoc={rawHTML} sandbox="allow-same-origin allow-popups allow-forms" className="w-full border-0" style={{ minHeight: "80vh", display: "block" }} title="Imported page" />
      </div>
    );
    if (!editable) return <div data-lf-section={section.id} style={style} className="lf-section">{inner}</div>;
    return (
      <div
        data-lf-section={section.id}
        style={style}
        onClick={(e) => { e.stopPropagation(); onSelect?.(section.id); }}
        className={`lf-section relative group cursor-pointer transition-all ${selected ? "outline outline-2 -outline-offset-2" : "hover:outline hover:outline-1 hover:-outline-offset-1"}`}
      >
        <div className={`absolute left-2 top-2 z-10 flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider shadow-sm transition-opacity ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} style={{ background: theme.primary, color: theme.primaryFg }}>
          Imported HTML
        </div>
        {inner}
      </div>
    );
  }

  const inner = (() => {
    switch (section.kind) {
      case "navbar": return <Navbar config={section.config} theme={theme} />;
      case "hero": return <Hero config={section.config} theme={theme} />;
      case "logocloud": return <LogoCloud config={section.config} theme={theme} />;
      case "features": return <Features config={section.config} theme={theme} />;
      case "stats": return <Stats config={section.config} theme={theme} />;
      case "gallery": return <Gallery config={section.config} theme={theme} />;
      case "testimonials": return <Testimonials config={section.config} theme={theme} />;
      case "pricing": return <Pricing config={section.config} theme={theme} />;
      case "faq": return <Faq config={section.config} theme={theme} />;
      case "cta": return <Cta config={section.config} theme={theme} />;
      case "newsletter": return <Newsletter config={section.config} theme={theme} />;
      case "footer": return <Footer config={section.config} theme={theme} />;
      default: return <div className="p-8 text-center" style={{ color: theme.mutedFg }}>Unknown section: {section.kind}</div>;
    }
  })();

  if (!editable) {
    return <div data-lf-section={section.id} style={style} className="lf-section">{inner}</div>;
  }

  return (
    <div
      data-lf-section={section.id}
      style={style}
      onClick={(e) => { if (editable) { e.stopPropagation(); onSelect?.(section.id); } }}
      className={`lf-section relative group cursor-pointer transition-all ${selected ? "outline outline-2 -outline-offset-2" : "hover:outline hover:outline-1 hover:-outline-offset-1"}`}
      data-selected={selected ? "1" : "0"}
    >
      <div
        className={`absolute left-2 top-2 z-10 flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider shadow-sm transition-opacity ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
        style={{ background: theme.primary, color: theme.primaryFg }}
      >
        {section.kind}
      </div>
      {inner}
    </div>
  );
}
