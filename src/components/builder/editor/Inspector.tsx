"use client";

import { useBuilder, useSelectedSection } from "@/lib/builder/store/builder-store";
import { getSectionType } from "@/lib/builder/sections/registry";
import type { FieldSchema } from "@/lib/builder/sections/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Trash2, ChevronUp, ChevronDown, Copy, Trash, ChevronsUpDown, MousePointerClick } from "lucide-react";
import { useState } from "react";

const GROUP_LABELS: Record<string, string> = { content: "Content", style: "Style & Colors", layout: "Layout", advanced: "Advanced" };

export function BuilderInspector() {
  const section = useSelectedSection();
  const { selectedSectionId, duplicateSection, removeSection, moveSection } = useBuilder();
  const page = useBuilder((s) => s.site.pages.find((p) => p.id === (s.currentPageId || s.site.pages[0]?.id)));
  if (!section) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-500"><MousePointerClick className="h-6 w-6" /></div>
        <p className="text-sm font-semibold">Pick a section to edit</p>
        <p className="text-xs text-slate-500 max-w-[220px]">Click any section in the canvas to tweak its copy, colors, and layout.</p>
        <p className="text-[10px] text-slate-400 max-w-[220px] mt-1">Tip: double-click any headline or button on the canvas to edit it inline.</p>
      </div>
    );
  }
  const type = getSectionType(section.kind);
  const idx = page?.sections.findIndex((s) => s.id === section.id) ?? -1;
  const total = page?.sections.length ?? 0;
  const groups: Record<string, FieldSchema[]> = {};
  for (const f of type.schema) { const g = f.group ?? "content"; if (!groups[g]) groups[g] = []; groups[g].push(f); }
  const groupKeys = Object.keys(groups);

  return (
    <div className="flex h-full flex-col bg-white text-slate-900">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="flex items-center justify-between p-3">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{type.category}</div>
            <div className="text-sm font-semibold truncate">{type.label}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Section {idx + 1} of {total}</div>
          </div>
          <div className="flex gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => idx > 0 && moveSection(idx, idx - 1)} disabled={idx <= 0} aria-label="Move up"><ChevronUp className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => idx < total - 1 && moveSection(idx, idx + 1)} disabled={idx >= total - 1} aria-label="Move down"><ChevronDown className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => selectedSectionId && duplicateSection(selectedSectionId)} aria-label="Duplicate"><Copy className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => selectedSectionId && removeSection(selectedSectionId)} aria-label="Delete"><Trash className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto builder-scroll">
        <div className="p-3">
          {groupKeys.length === 1 ? (
            <div className="space-y-4">{groups[groupKeys[0]].map((field) => <FieldEditor key={field.key} field={field} sectionId={section.id} />)}</div>
          ) : (
            <div className="space-y-2">
              {groupKeys.map((g, gi) => (
                <CollapsibleGroup key={g} title={GROUP_LABELS[g] ?? g} defaultOpen={gi === 0}>
                  <div className="space-y-4">{groups[g].map((field) => <FieldEditor key={field.key} field={field} sectionId={section.id} />)}</div>
                </CollapsibleGroup>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CollapsibleGroup({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-md border border-slate-200 bg-slate-50/50">
      <CollapsibleTrigger asChild>
        <button className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-slate-100/70 transition-colors" type="button">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">{title}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3"><Separator className="mb-3" />{children}</CollapsibleContent>
    </Collapsible>
  );
}

function FieldEditor({ field, sectionId }: { field: FieldSchema; sectionId: string }) {
  const value = useBuilder((s) => {
    const pageId = s.currentPageId || s.site.pages[0]?.id;
    const page = s.site.pages.find((p) => p.id === pageId);
    const sec = page?.sections.find((x) => x.id === sectionId);
    return sec?.config?.[field.key];
  });
  const update = useBuilder((s) => s.updateSectionConfig);
  if (field.type === "list") return <ListFieldEditor field={field} sectionId={sectionId} />;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`${sectionId}-${field.key}`} className="text-xs font-medium flex items-center">{field.label}</Label>
      {renderField(field, value, (v) => update(sectionId, { [field.key]: v }), sectionId)}
    </div>
  );
}

function renderField(field: FieldSchema, value: any, onChange: (v: any) => void, idPrefix?: string) {
  const fieldId = idPrefix ? `${idPrefix}-${field.key}` : field.key;
  switch (field.type) {
    case "text": return <Input id={fieldId} value={value ?? ""} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} className="h-8 text-sm" />;
    case "textarea": return <Textarea id={fieldId} value={value ?? ""} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} rows={3} className="text-sm" />;
    case "color": return (<div className="flex items-center gap-2"><div className="relative"><input type="color" value={value ?? "#000000"} onChange={(e) => onChange(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-slate-200 p-1" /></div><Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="h-8 text-sm font-mono" /></div>);
    case "number": return <Input type="number" value={value ?? 0} min={field.min} max={field.max} step={field.step} onChange={(e) => onChange(Number(e.target.value))} className="h-8 text-sm" />;
    case "boolean": return (<div className="flex items-center gap-2 py-1"><Switch id={fieldId} checked={!!value} onCheckedChange={onChange} /><span className="text-xs text-slate-500">{value ? "Enabled" : "Disabled"}</span></div>);
    case "select": return (<Select value={String(value ?? "")} onValueChange={onChange}><SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{field.options?.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select>);
    case "image": return (<div className="space-y-1.5"><Input value={value ?? ""} placeholder="https://…" onChange={(e) => onChange(e.target.value)} className="h-8 text-sm" />{value && (<div className="relative h-16 w-full overflow-hidden rounded border border-slate-200 bg-slate-50"><img src={value} alt="" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} /></div>)}</div>);
    default: return null;
  }
}

function ListFieldEditor({ field, sectionId }: { field: FieldSchema; sectionId: string }) {
  const value = useBuilder((s) => {
    const pageId = s.currentPageId || s.site.pages[0]?.id;
    const page = s.site.pages.find((p) => p.id === pageId);
    const sec = page?.sections.find((x) => x.id === sectionId);
    return (sec?.config?.[field.key] as any[]) ?? [];
  });
  const update = useBuilder((s) => s.updateSectionConfig);
  const items = Array.isArray(value) ? value : [];
  const maxItems = field.maxItems ?? 20;
  const updateItem = (idx: number, key: string, v: any) => update(sectionId, { [field.key]: items.map((it, i) => (i === idx ? { ...it, [key]: v } : it)) });
  const addItem = () => { const newItem: Record<string, any> = {}; field.itemSchema?.forEach((f) => { newItem[f.key] = f.type === "boolean" ? false : f.type === "list" ? [] : ""; }); update(sectionId, { [field.key]: [...items, newItem] }); };
  const removeItem = (idx: number) => update(sectionId, { [field.key]: items.filter((_, i) => i !== idx) });
  const moveItem = (idx: number, dir: -1 | 1) => { const target = idx + dir; if (target < 0 || target >= items.length) return; const next = [...items]; [next[idx], next[target]] = [next[target], next[idx]]; update(sectionId, { [field.key]: next }); };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between"><Label className="text-xs font-medium">{field.label}</Label><Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={addItem} disabled={items.length >= maxItems}><Plus className="mr-1 h-3 w-3" /> Add</Button></div>
      <Separator />
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="space-y-2 rounded-md border border-slate-200 bg-slate-50/60 p-2" style={{ animation: "pfFadeInUp 0.2s ease both" }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Item {idx + 1}</span>
              <div className="flex gap-0.5">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveItem(idx, -1)} disabled={idx === 0} aria-label="Move up"><ChevronUp className="h-3 w-3" /></Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveItem(idx, 1)} disabled={idx === items.length - 1} aria-label="Move down"><ChevronDown className="h-3 w-3" /></Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => removeItem(idx)} aria-label="Remove"><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
            <div className="space-y-2">
              {field.itemSchema?.map((sub) => (
                <div key={sub.key} className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center">{sub.label}</Label>
                  {sub.type === "list" ? <ListFieldEditor field={sub} sectionId={`${sectionId}.${field.key}.${idx}`} /> : renderField(sub, item[sub.key], (v) => updateItem(idx, sub.key, v), `${sectionId}.${field.key}.${idx}`)}
                </div>
              ))}
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="py-3 text-center text-xs text-slate-400">No items yet. Click "Add" to create one.</p>}
      </div>
    </div>
  );
}
