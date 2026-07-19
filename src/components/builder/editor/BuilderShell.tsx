"use client";

import { useBuilder } from "@/lib/builder/store/builder-store";
import { BuilderTopBar, SectionLibrary } from "./TopBar";
import { BuilderCanvas } from "./Canvas";
import { BuilderInspector } from "./Inspector";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { TEMPLATES, buildSiteFromTemplate } from "@/lib/builder/templates/templates";

export function BuilderShell() {
  const { libraryOpen, inspectorOpen, undo, redo, selectSection, site, loadSite, currentPageId, setCurrentPageId } = useBuilder();

  // On first mount: if no sections, load the SaaS template
  useEffect(() => {
    if (site.pages.length === 0 || (site.pages.length === 1 && site.pages[0].sections.length === 0)) {
      const saas = TEMPLATES[0];
      if (saas) loadSite(buildSiteFromTemplate(saas));
    }
  }, []);

  // Ensure currentPageId is set
  useEffect(() => {
    if (!currentPageId && site.pages[0]) setCurrentPageId(site.pages[0].id);
  }, [currentPageId, site.pages, setCurrentPageId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (typing) return;
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if (meta && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) { e.preventDefault(); redo(); }
      else if (e.key === "Escape") selectSection(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, selectSection]);

  return (
    <div className="flex h-screen flex-col bg-slate-100">
      <BuilderTopBar />
      <div className="flex min-h-0 flex-1">
        <aside
          className={cn("shrink-0 overflow-hidden border-r border-slate-200 bg-white transition-all duration-300 ease-out", libraryOpen ? "w-64" : "w-0")}
          aria-hidden={!libraryOpen}
        >
          <div className="h-full w-64"><SectionLibrary /></div>
        </aside>
        <main className="min-w-0 flex-1"><BuilderCanvas /></main>
        <aside
          className={cn("shrink-0 overflow-hidden border-l border-slate-200 bg-white transition-all duration-300 ease-out", inspectorOpen ? "w-80" : "w-0")}
          aria-hidden={!inspectorOpen}
        >
          <div className="h-full w-80"><BuilderInspector /></div>
        </aside>
      </div>
    </div>
  );
}
