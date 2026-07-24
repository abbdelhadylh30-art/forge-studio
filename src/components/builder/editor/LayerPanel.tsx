"use client";

import { useBuilder, useCurrentPage } from "@/lib/builder/store/builder-store";
import { getSectionType } from "@/lib/builder/sections/registry";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, MousePointerClick } from "lucide-react";
import type { SectionInstance } from "@/lib/builder/sections/types";

function getSectionLabel(section: SectionInstance): string {
  const type = getSectionType(section.kind);
  const c = section.config as Record<string, unknown>;
  const candidates = ["headline", "title", "brand", "question", "name", "eyebrow"];
  for (const key of candidates) {
    const val = c[key];
    if (typeof val === "string" && val.trim()) {
      return val.length > 40 ? val.slice(0, 40) + "…" : val;
    }
  }
  return type?.label ?? section.kind;
}

export function LayerPanel() {
  const page = useCurrentPage();
  const { selectedSectionId, selectSection, toggleSectionVisibility } = useBuilder();

  if (!page || page.sections.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-400"><MousePointerClick className="h-5 w-5" /></div>
        <p className="text-xs font-medium text-slate-600">No sections yet</p>
        <p className="text-[11px] text-slate-400 max-w-[200px]">Sections you add to the page will appear here. Use the Library tab to add new sections.</p>
      </div>
    );
  }

  const handleJump = (id: string) => {
    selectSection(id);
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-lf-section="${id}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  return (
    <div className="flex h-full flex-col bg-white text-slate-900">
      <div className="border-b border-slate-200 px-3 py-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Layers</div>
        <div className="mt-0.5 text-[11px] text-slate-400">{page.sections.length} section{page.sections.length === 1 ? "" : "s"} on {page.name}</div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto builder-scroll">
        <div className="p-2">
          {page.sections.map((sec, idx) => {
            const type = getSectionType(sec.kind);
            const Icon = type?.icon;
            const isSelected = selectedSectionId === sec.id;
            const isHidden = (sec.config as Record<string, unknown>)?.__hidden === true;
            const label = getSectionLabel(sec);
            return (
              <div key={sec.id} role="button" tabIndex={0} onClick={() => handleJump(sec.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleJump(sec.id); } }} className={cn("group/layer mb-1 flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-violet-300", isSelected ? "border-violet-300 bg-violet-50" : "border-transparent hover:border-slate-200 hover:bg-slate-50", isHidden && "opacity-50")}>
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded text-[10px] font-bold text-slate-400">{idx + 1}</span>
                {Icon && <div className="grid h-6 w-6 shrink-0 place-items-center rounded bg-slate-100 text-slate-500"><Icon className="h-3 w-3" /></div>}
                <div className="min-w-0 flex-1"><div className="truncate text-xs font-medium">{type?.label ?? sec.kind}</div><div className="truncate text-[10px] text-slate-400">{label}</div></div>
                <button type="button" onClick={(e) => { e.stopPropagation(); toggleSectionVisibility(sec.id); }} className="grid h-6 w-6 shrink-0 place-items-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors" title={isHidden ? "Show section" : "Hide section"} aria-label={isHidden ? "Show section" : "Hide section"}>{isHidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
