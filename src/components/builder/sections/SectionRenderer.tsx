"use client";

import { useMemo } from "react";
import { themeToInlineStyle } from "@/lib/builder/sections/theme-utils";
import type { SectionInstance, ThemeTokens } from "@/lib/builder/sections/types";
import { useBuilder } from "@/lib/builder/store/builder-store";
import { Navbar, Hero, LogoCloud, Features, Stats, Gallery, Testimonials, Pricing, Faq, Cta, Newsletter, Footer, Announcement, Problem, Solution, VideoSection, Comparison, Guarantee, ContactForm } from "./AllSections";
import { SectionEditContext } from "./InlineText";

export function SectionRenderer({ section, theme, editable, selected, onSelect }: {
  section: SectionInstance;
  theme: ThemeTokens;
  editable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
}) {
  const style = themeToInlineStyle(theme);
  const updateSectionConfig = useBuilder((s) => s.updateSectionConfig);

  const editCtx = useMemo<React.ContextType<typeof SectionEditContext>>(
    () => editable ? { sectionId: section.id, onEditField: (key: string, value: string) => updateSectionConfig(section.id, { [key]: value }) } : null,
    [editable, section.id, updateSectionConfig]
  );

  const isHidden = (section.config as any)?.__hidden === true;
  const rawHTML = (section.config as any)?.__rawHTML as string | undefined;

  if (rawHTML) {
    const inner = (<div className="w-full"><iframe srcDoc={rawHTML} sandbox="allow-same-origin allow-popups allow-forms" className="w-full border-0" style={{ minHeight: "80vh", display: "block" }} title="Imported page" /></div>);
    if (!editable) return <div data-lf-section={section.id} style={style} className="lf-section">{inner}</div>;
    return (
      <div data-lf-section={section.id} style={style} onClick={(e) => { e.stopPropagation(); onSelect?.(section.id); }} className={`lf-section relative group cursor-pointer transition-all ${selected ? "outline outline-2 -outline-offset-2" : "hover:outline hover:outline-1 hover:-outline-offset-1"}`}>
        <div className={`absolute left-2 top-2 z-10 flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider shadow-sm transition-opacity ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} style={{ background: theme.primary, color: theme.primaryFg }}>Imported HTML</div>
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
      case "announcement": return <Announcement config={section.config} theme={theme} />;
      case "problem": return <Problem config={section.config} theme={theme} />;
      case "solution": return <Solution config={section.config} theme={theme} />;
      case "video": return <VideoSection config={section.config} theme={theme} />;
      case "comparison": return <Comparison config={section.config} theme={theme} />;
      case "guarantee": return <Guarantee config={section.config} theme={theme} />;
      case "contactform": return <ContactForm config={section.config} theme={theme} />;
      default: return <div className="p-8 text-center" style={{ color: theme.mutedFg }}>Unknown section: {section.kind}</div>;
    }
  })();

  if (!editable) {
    if (isHidden) return <div data-lf-section={section.id} style={style} className="lf-section" />;
    return <div data-lf-section={section.id} style={style} className="lf-section">{inner}</div>;
  }

  if (isHidden) {
    return (
      <SectionEditContext.Provider value={editCtx}>
        <div data-lf-section={section.id} style={style} onClick={(e) => { e.stopPropagation(); onSelect?.(section.id); }} className={`lf-section relative group cursor-pointer transition-all ${selected ? "outline outline-2 -outline-offset-2" : "hover:outline hover:outline-1 hover:-outline-offset-1"}`}>
          <div className="flex min-h-[80px] items-center justify-center border-2 border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">{section.kind} — hidden</div>
        </div>
      </SectionEditContext.Provider>
    );
  }

  return (
    <SectionEditContext.Provider value={editCtx}>
      <div data-lf-section={section.id} style={style} onClick={(e) => { if (editable) { e.stopPropagation(); onSelect?.(section.id); } }} className={`lf-section relative group cursor-pointer transition-all ${selected ? "outline outline-2 -outline-offset-2" : "hover:outline hover:outline-1 hover:-outline-offset-1"}`} data-selected={selected ? "1" : "0"}>
        <div className={`absolute left-2 top-2 z-10 flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider shadow-sm transition-opacity ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} style={{ background: theme.primary, color: theme.primaryFg }}>{section.kind}</div>
        {inner}
      </div>
    </SectionEditContext.Provider>
  );
}
