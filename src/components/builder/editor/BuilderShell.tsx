"use client";

import { useBuilder, consumeBuilderAutosave } from "@/lib/builder/store/builder-store";
import { BuilderTopBar, SectionLibrary } from "./TopBar";
import { BuilderCanvas } from "./Canvas";
import { BuilderInspector } from "./Inspector";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { TEMPLATES, buildSiteFromTemplate } from "@/lib/builder/templates/templates";
import { useForge } from "@/lib/forge/store";

export function BuilderShell() {
  const { libraryOpen, inspectorOpen, undo, redo, selectSection, site, loadSite, currentPageId, setCurrentPageId, setLibraryOpen, setInspectorOpen } = useBuilder();
  const { consumeTransfer } = useForge();
  const didInit = useRef(false);

  // On first mount: try to recover from autosave. If none, consume any
  // pending transfer from the auditor. If neither, load the default template.
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    const transfer = consumeTransfer();
    if (transfer && transfer.source === "auditor") {
      const { loadFromHTML } = useBuilder.getState();
      loadFromHTML(transfer.html, transfer.name);
      return;
    }

    const saved = consumeBuilderAutosave();
    if (saved && saved.site.pages.length > 0) {
      loadSite(saved.site);
      const targetPageId = saved.currentPageId && saved.site.pages.some((p) => p.id === saved.currentPageId)
        ? saved.currentPageId
        : saved.site.pages[0].id;
      setCurrentPageId(targetPageId);
      return;
    }

    if (site.pages.length === 0 || (site.pages.length === 1 && site.pages[0].sections.length === 0)) {
      const saas = TEMPLATES[0];
      if (saas) loadSite(buildSiteFromTemplate(saas));
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (typing) return;
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if (meta && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) { e.preventDefault(); redo(); }
      else if (e.key === "Escape") {
        // Close mobile drawers first, then deselect
        if (libraryOpen) { setLibraryOpen(false); return; }
        if (inspectorOpen) { setInspectorOpen(false); return; }
        selectSection(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, selectSection, libraryOpen, inspectorOpen, setLibraryOpen, setInspectorOpen]);

  return (
    <div className="flex h-screen flex-col bg-slate-100 overflow-hidden">
      <BuilderTopBar />
      <div className="relative flex min-h-0 flex-1">
        {/* Desktop side panels — fixed width, hidden on mobile */}
        <aside
          className={cn("hidden md:flex shrink-0 overflow-hidden border-r border-slate-200 bg-white transition-all duration-300 ease-out", libraryOpen ? "w-64" : "w-0")}
          aria-hidden={!libraryOpen}
        >
          <div className="h-full w-64"><SectionLibrary /></div>
        </aside>

        {/* Canvas — always visible, takes full width on mobile */}
        <main className="min-w-0 flex-1 overflow-hidden"><BuilderCanvas /></main>

        {/* Desktop inspector */}
        <aside
          className={cn("hidden md:flex shrink-0 overflow-hidden border-l border-slate-200 bg-white transition-all duration-300 ease-out", inspectorOpen ? "w-80" : "w-0")}
          aria-hidden={!inspectorOpen}
        >
          <div className="h-full w-80"><BuilderInspector /></div>
        </aside>

        {/* Mobile library drawer — slides in from the left */}
        {libraryOpen && (
          <>
            <div
              className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setLibraryOpen(false)}
              aria-hidden="true"
            />
            <aside className="md:hidden fixed left-0 top-14 bottom-0 z-50 w-[85vw] max-w-xs bg-white shadow-xl" style={{ animation: "slideInLeft 0.25s ease both" }}>
              <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Section Library</span>
                <button onClick={() => setLibraryOpen(false)} className="grid h-7 w-7 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close library">✕</button>
              </div>
              <div className="h-[calc(100%-41px)]"><SectionLibrary /></div>
            </aside>
          </>
        )}

        {/* Mobile inspector drawer — slides in from the right */}
        {inspectorOpen && (
          <>
            <div
              className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setInspectorOpen(false)}
              aria-hidden="true"
            />
            <aside className="md:hidden fixed right-0 top-14 bottom-0 z-50 w-[85vw] max-w-sm bg-white shadow-xl" style={{ animation: "slideInRight 0.25s ease both" }}>
              <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Inspector</span>
                <button onClick={() => setInspectorOpen(false)} className="grid h-7 w-7 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close inspector">✕</button>
              </div>
              <div className="h-[calc(100%-41px)]"><BuilderInspector /></div>
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
