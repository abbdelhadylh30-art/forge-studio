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
  const { libraryOpen, inspectorOpen, undo, redo, selectSection, site, loadSite, currentPageId, setCurrentPageId } = useBuilder();
  const { consumeTransfer } = useForge();
  const didInit = useRef(false);

  // On first mount: try to recover from autosave. If none, consume any
  // pending transfer from the auditor. If neither, load the default template.
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    // 1. Check for a pending auditor→builder transfer (highest priority —
    //    the user just clicked "Edit in builder" so that intent wins).
    const transfer = consumeTransfer();
    if (transfer && transfer.source === "auditor") {
      const { loadFromHTML } = useBuilder.getState();
      loadFromHTML(transfer.html, transfer.name);
      return;
    }

    // 2. Try to recover the autosaved site.
    const saved = consumeBuilderAutosave();
    if (saved && saved.site.pages.length > 0) {
      loadSite(saved.site);
      // loadSite sets currentPageId to site.pages[0].id — but the saved
      // currentPageId might point to a different page. Override if valid.
      const targetPageId = saved.currentPageId && saved.site.pages.some((p) => p.id === saved.currentPageId)
        ? saved.currentPageId
        : saved.site.pages[0].id;
      setCurrentPageId(targetPageId);
      return;
    }

    // 3. Fall back to the default template so the user sees something.
    if (site.pages.length === 0 || (site.pages.length === 1 && site.pages[0].sections.length === 0)) {
      const saas = TEMPLATES[0];
      if (saas) loadSite(buildSiteFromTemplate(saas));
    }
  }, []);

  // NOTE: We intentionally do NOT have a "ensure currentPageId is set" effect
  // here. The init effect above handles all three init paths (transfer,
  // autosave, template) and sets currentPageId in each. A separate "ensure"
  // effect would race with the init effect — its closure would capture the
  // pre-init render's stale `currentPageId` (empty string) and `site` (blank
  // site), and would call setCurrentPageId(blankPageId), overwriting the
  // recovery. If you need to add a fallback, read from useBuilder.getState()
  // inside the effect body (not from closure values).

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
