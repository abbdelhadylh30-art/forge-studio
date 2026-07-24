"use client";

import { useBuilder, useCurrentPage } from "@/lib/builder/store/builder-store";
import { getSectionType } from "@/lib/builder/sections/registry";
import { SectionRenderer } from "../sections/SectionRenderer";
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Plus, Copy, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForge } from "@/lib/forge/store";
import { SectionErrorBoundary } from "./SectionErrorBoundary";
import { InsertBetweenHandle } from "./InsertBetweenHandle";
import type { SectionKind } from "@/lib/builder/sections/types";

export function BuilderCanvas() {
  const page = useCurrentPage();
  const { site, selectedSectionId, selectSection, reorderSections, device, addSection } = useBuilder();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const handleCanvasClick = (e: React.MouseEvent) => { if (e.target === e.currentTarget) selectSection(null); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); const kind = e.dataTransfer.getData("application/x-section-kind"); if (!kind || !getSectionType(kind as SectionKind)) return; addSection(kind as SectionKind); };

  if (!page) {
    return (<div className="grid h-full place-items-center bg-slate-100"><div className="text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-slate-200 text-slate-400"><MousePointerClick className="h-6 w-6" /></div><p className="mt-3 text-sm font-medium text-slate-600">No page selected</p><p className="mt-1 text-xs text-slate-400">Add a page from the top bar to get started.</p></div></div>);
  }

  const widthClass = device === "mobile" ? "max-w-[420px]" : device === "tablet" ? "max-w-[820px]" : "max-w-full";

  return (
    <div className="relative h-full overflow-y-auto overflow-x-hidden bg-slate-100 builder-scroll" onClick={handleCanvasClick} onDragOver={handleDragOver} onDrop={handleDrop}>
      <div className="pointer-events-none absolute inset-0 opacity-[0.4]" style={{ backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
      <div className={`relative mx-auto ${widthClass} transition-all duration-300 px-2 md:px-4`}>
        <div className="min-h-full shadow-xl" style={{ background: site.themeTokens.background, fontFamily: site.themeTokens.font, color: site.themeTokens.foreground }}>
          {page.sections.length === 0 ? <EmptyState /> : (
            <>
              <div className="relative py-1"><InsertBetweenHandle index={0} label="Insert at top" /></div>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e: DragEndEvent) => { const { active, over } = e; if (!over || active.id === over.id) return; const oldIndex = page.sections.findIndex((s) => s.id === active.id); const newIndex = page.sections.findIndex((s) => s.id === over.id); if (oldIndex === -1 || newIndex === -1) return; reorderSections(arrayMove(page.sections, oldIndex, newIndex)); }}>
                <SortableContext items={page.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  {page.sections.map((sec, idx) => (
                    <div key={sec.id}>
                      <SortableSection sectionId={sec.id} section={sec} theme={site.themeTokens} selected={selectedSectionId === sec.id} onSelect={selectSection} index={idx} />
                      <div className="relative py-1"><InsertBetweenHandle index={idx + 1} /></div>
                    </div>
                  ))}
                </SortableContext>
              </DndContext>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SortableSection({ sectionId, section, theme, selected, onSelect, index }: {
  sectionId: string;
  section: import("@/lib/builder/sections/types").SectionInstance;
  theme: import("@/lib/builder/sections/types").ThemeTokens;
  selected: boolean;
  onSelect: (id: string) => void;
  index: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sectionId });
  const removeSection = useBuilder((s) => s.removeSection);
  const duplicateSection = useBuilder((s) => s.duplicateSection);
  const style: React.CSSProperties = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 50 : "auto" };
  return (
    <div ref={setNodeRef} style={style} className={`group relative ${selected ? "outline outline-2 outline-violet-400 outline-offset-[-2px]" : ""}`}>
      <div className={`absolute right-2 top-2 z-20 flex items-center gap-1 rounded-md bg-white/95 p-0.5 shadow-md backdrop-blur transition-opacity duration-150 ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
        <button type="button" {...attributes} {...listeners} className="grid h-7 w-7 cursor-grab place-items-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing" onClick={(e) => e.stopPropagation()} aria-label="Drag to reorder"><GripVertical className="h-4 w-4" /></button>
        <button type="button" className="grid h-7 w-7 place-items-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-700" onClick={(e) => { e.stopPropagation(); duplicateSection(sectionId); }} aria-label="Duplicate"><Copy className="h-4 w-4" /></button>
        <button type="button" className="grid h-7 w-7 place-items-center rounded text-red-500 hover:bg-red-500 hover:text-white" onClick={(e) => { e.stopPropagation(); removeSection(sectionId); }} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
      </div>
      <div className={`absolute left-2 top-2 z-20 grid h-6 min-w-6 place-items-center rounded-full bg-violet-600 px-1.5 text-[10px] font-bold text-white shadow-md transition-opacity duration-150 ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>{index + 1}</div>
      <div>
        <SectionErrorBoundary sectionId={sectionId} sectionKind={section.kind}>
          <SectionRenderer section={section} theme={theme} editable selected={selected} onSelect={onSelect} />
        </SectionErrorBoundary>
      </div>
    </div>
  );
}

function EmptyState() {
  const setView = useForge((s) => s.setView);
  return (
    <div className="grid min-h-[60vh] place-items-center px-6 py-20 text-center">
      <div className="max-w-md space-y-4" style={{ animation: "pfFadeInUp 0.4s ease both" }}>
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-500"><Plus className="h-7 w-7" /></div>
        <div><h3 className="text-lg font-semibold">This page is empty</h3><p className="mt-1.5 text-sm text-slate-500">Drag a section from the library, or click the + handles above and between sections to insert.</p></div>
        <div className="flex justify-center gap-2"><Button onClick={() => setView("templates")} className="gap-1.5"><Plus className="h-4 w-4" /> Browse templates</Button></div>
      </div>
    </div>
  );
}
