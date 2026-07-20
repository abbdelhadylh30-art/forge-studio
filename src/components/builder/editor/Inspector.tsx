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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Plus, Trash2, ChevronUp, ChevronDown, Copy, Trash, Sparkles,
  ChevronsUpDown, Wand2, MousePointerClick, Check, RefreshCw,
} from "lucide-react";
import { useState } from "react";

const GROUP_LABELS: Record<string, string> = {
  content: "Content",
  style: "Style & Colors",
  layout: "Layout",
  advanced: "Advanced",
};

export function BuilderInspector() {
  const section = useSelectedSection();
  const { selectedSectionId, duplicateSection, removeSection, moveSection, currentPageId, site } = useBuilder();
  const page = useBuilder((s) => s.site.pages.find((p) => p.id === (s.currentPageId || s.site.pages[0]?.id)));
  if (!section) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-500">
          <MousePointerClick className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold">Pick a section to edit</p>
        <p className="text-xs text-slate-500 max-w-[220px]">Click any section in the canvas to tweak its copy, colors, and layout. Hover a section to drag, duplicate, or delete it.</p>
      </div>
    );
  }
  const type = getSectionType(section.kind);
  const idx = page?.sections.findIndex((s) => s.id === section.id) ?? -1;
  const total = page?.sections.length ?? 0;

  // Group fields by their `group` property (defaults to "content")
  const groups: Record<string, FieldSchema[]> = {};
  for (const f of type.schema) {
    const g = f.group ?? "content";
    if (!groups[g]) groups[g] = [];
    groups[g].push(f);
  }
  const groupKeys = Object.keys(groups);

  return (
    <div className="flex h-full flex-col bg-white text-slate-900">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="flex items-center justify-between p-3">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{type.category}</div>
            <div className="text-sm font-semibold truncate">{type.label}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Section {idx + 1} of {total}</div>
          </div>
          <div className="flex gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => idx > 0 && moveSection(idx, idx - 1)} disabled={idx <= 0} title="Move up" aria-label="Move section up"><ChevronUp className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => idx < total - 1 && moveSection(idx, idx + 1)} disabled={idx >= total - 1} title="Move down" aria-label="Move section down"><ChevronDown className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => selectedSectionId && duplicateSection(selectedSectionId)} title="Duplicate" aria-label="Duplicate section"><Copy className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => selectedSectionId && removeSection(selectedSectionId)} title="Delete" aria-label="Delete section"><Trash className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3">
          {groupKeys.length === 1 ? (
            // Single group — render flat
            <div className="space-y-4">
              {groups[groupKeys[0]].map((field) => <FieldEditor key={field.key} field={field} sectionId={section.id} />)}
            </div>
          ) : (
            // Multiple groups — render as collapsibles
            <div className="space-y-2">
              {groupKeys.map((g, gi) => (
                <CollapsibleGroup key={g} title={GROUP_LABELS[g] ?? g} defaultOpen={gi === 0}>
                  <div className="space-y-4">
                    {groups[g].map((field) => <FieldEditor key={field.key} field={field} sectionId={section.id} />)}
                  </div>
                </CollapsibleGroup>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
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
      <CollapsibleContent className="px-3 pb-3">
        <Separator className="mb-3" />
        {children}
      </CollapsibleContent>
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
      <Label htmlFor={`${sectionId}-${field.key}`} className="text-xs font-medium flex items-center">
        {field.label}
        {field.aiSuggest && <AIBadge />}
      </Label>
      {renderField(field, value, (v) => update(sectionId, { [field.key]: v }), sectionId)}
    </div>
  );
}

function renderField(field: FieldSchema, value: any, onChange: (v: any) => void, idPrefix?: string) {
  const fieldId = idPrefix ? `${idPrefix}-${field.key}` : field.key;
  switch (field.type) {
    case "text":
      return (
        <div className="flex gap-1">
          <Input id={fieldId} value={value ?? ""} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} className="h-8 text-sm" />
          {field.aiSuggest && <AISuggestButton fieldKey={field.key} current={value ?? ""} onSuggest={onChange} />}
        </div>
      );
    case "textarea":
      return (
        <div className="flex flex-col gap-1">
          <Textarea id={fieldId} value={value ?? ""} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} rows={3} className="text-sm" />
          {field.aiSuggest && <AISuggestButton fieldKey={field.key} current={value ?? ""} onSuggest={onChange} />}
        </div>
      );
    case "color":
      return (
        <div className="flex items-center gap-2">
          <div className="relative">
            <input type="color" value={value ?? "#000000"} onChange={(e) => onChange(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-slate-200 p-1" />
          </div>
          <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="h-8 text-sm font-mono" />
        </div>
      );
    case "number":
      return <Input type="number" value={value ?? 0} min={field.min} max={field.max} step={field.step} onChange={(e) => onChange(Number(e.target.value))} className="h-8 text-sm" />;
    case "boolean":
      return (
        <div className="flex items-center gap-2 py-1">
          <Switch id={fieldId} checked={!!value} onCheckedChange={onChange} />
          <span className="text-xs text-slate-500">{value ? "Enabled" : "Disabled"}</span>
        </div>
      );
    case "select":
      return (
        <Select value={String(value ?? "")} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select…" /></SelectTrigger>
          <SelectContent>{field.options?.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
        </Select>
      );
    case "image":
      return (
        <div className="space-y-1.5">
          <Input value={value ?? ""} placeholder="https://…" onChange={(e) => onChange(e.target.value)} className="h-8 text-sm" />
          {value && (
            <div className="relative h-16 w-full overflow-hidden rounded border border-slate-200 bg-slate-50">
              {/* User-supplied URL preview — Next/Image can't handle arbitrary URLs safely */}
              <img src={value} alt="" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
          )}
        </div>
      );
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
  const addItem = () => {
    const newItem: Record<string, any> = {};
    field.itemSchema?.forEach((f) => { newItem[f.key] = f.type === "boolean" ? false : f.type === "list" ? [] : ""; });
    update(sectionId, { [field.key]: [...items, newItem] });
  };
  const removeItem = (idx: number) => update(sectionId, { [field.key]: items.filter((_, i) => i !== idx) });
  const moveItem = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items]; [next[idx], next[target]] = [next[target], next[idx]];
    update(sectionId, { [field.key]: next });
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">{field.label}</Label>
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={addItem} disabled={items.length >= maxItems}>
          <Plus className="mr-1 h-3 w-3" /> Add
        </Button>
      </div>
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
                  <Label className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center">{sub.label}{sub.aiSuggest && <AIBadge />}</Label>
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

function AIBadge() {
  return <span className="ml-1.5 inline-flex items-center gap-0.5 rounded bg-violet-100 px-1 py-px text-[9px] font-semibold uppercase text-violet-600"><Sparkles className="h-2.5 w-2.5" /> AI</span>;
}

const TONE_OPTIONS = [
  { id: "confident", label: "Confident", desc: "Crisp, Stripe-style" },
  { id: "friendly", label: "Friendly", desc: "Warm, Notion-style" },
  { id: "bold", label: "Bold", desc: "Direct, Nike-style" },
  { id: "minimal", label: "Minimal", desc: "Understated, Muji-style" },
  { id: "playful", label: "Playful", desc: "Witty, Mailchimp-style" },
] as const;

type ToneId = (typeof TONE_OPTIONS)[number]["id"];

function AISuggestButton({ fieldKey, current, onSuggest }: { fieldKey: string; current: string; onSuggest: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tone, setTone] = useState<ToneId>("confident");
  const [variants, setVariants] = useState<string[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const siteName = useBuilder((s) => s.site.name);

  const fetchVariants = async (selectedTone: ToneId) => {
    setLoading(true);
    setWarning(null);
    try {
      const res = await fetch("/api/ai-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: fieldKey === "headline" ? "headline"
            : fieldKey === "subhead" || fieldKey === "subtitle" ? "subhead"
            : fieldKey === "eyebrow" ? "eyebrow"
            : fieldKey === "question" ? "faq_question"
            : fieldKey === "answer" ? "faq_answer"
            : fieldKey === "quote" ? "testimonial"
            : "headline",
          current,
          tone: selectedTone,
          variants: 3,
          context: { siteName },
        }),
      });
      if (!res.ok) throw new Error("AI request failed");
      const data = await res.json();
      if (data.variants && Array.isArray(data.variants)) {
        setVariants(data.variants);
        if (data.warning) setWarning(data.warning);
      } else if (data.text) {
        // Backwards-compat with the old single-text response
        setVariants([data.text]);
      }
    } catch (err) {
      console.warn("AI suggest failed:", err);
      setWarning("Couldn't reach the AI service. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && variants.length === 0) {
      fetchVariants(tone);
    }
  };

  const handleToneChange = (next: ToneId) => {
    setTone(next);
    fetchVariants(next);
  };

  const applyVariant = (v: string) => {
    onSuggest(v);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 shrink-0 px-2 text-xs gap-1"
          title="Generate 3 AI variants — pick one to apply"
        >
          <Wand2 className="h-3 w-3" />
          Suggest
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b border-slate-200 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-violet-500" />
            <span className="text-xs font-semibold">AI suggestions</span>
            {loading && <span className="ml-auto text-[10px] text-slate-400">Generating…</span>}
          </div>
          <div className="flex flex-wrap gap-1">
            {TONE_OPTIONS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleToneChange(t.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  tone === t.id
                    ? "bg-violet-100 text-violet-700 border border-violet-300"
                    : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
                title={t.desc}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="max-h-[280px] overflow-y-auto p-2 space-y-1.5 builder-scroll">
          {variants.length === 0 && !loading && (
            <div className="text-center py-6 text-xs text-slate-400">No suggestions yet.</div>
          )}
          {loading && variants.length === 0 && (
            <>
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 rounded-md bg-slate-100 animate-pulse" />
              ))}
            </>
          )}
          {variants.map((v, i) => (
            <button
              key={i}
              type="button"
              onClick={() => applyVariant(v)}
              className="group w-full text-left p-2.5 rounded-md border border-slate-200 bg-white hover:border-violet-400 hover:bg-violet-50/40 transition-colors"
            >
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-bold text-slate-400 mt-0.5">{i + 1}</span>
                <span className="flex-1 text-xs text-slate-700 leading-relaxed">{v}</span>
                <Check className="h-3.5 w-3.5 text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
              </div>
            </button>
          ))}
          {warning && (
            <div className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded p-2 leading-relaxed">
              {warning}
            </div>
          )}
        </div>
        <div className="border-t border-slate-200 p-2 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">Click a variant to apply it</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px] gap-1"
            onClick={() => fetchVariants(tone)}
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Regenerate
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
