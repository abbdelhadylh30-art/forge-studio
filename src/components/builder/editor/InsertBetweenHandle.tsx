"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { SECTION_TYPES } from "@/lib/builder/sections/registry";
import type { SectionKind } from "@/lib/builder/sections/types";
import { useBuilder } from "@/lib/builder/store/builder-store";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  structure: "Structure",
  conversion: "Conversion",
  social: "Social proof",
  media: "Media",
};

export function InsertBetweenHandle({ index, label }: { index: number; label?: string }) {
  const addSection = useBuilder((s) => s.addSection);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const handleAdd = (kind: SectionKind) => {
    addSection(kind, index);
    setOpen(false);
    setQuery("");
  };

  const filtered = SECTION_TYPES.filter((t) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
  });

  const categories = Object.keys(CATEGORY_LABELS);

  return (
    <div className="group/insert relative z-10 flex h-0 items-center justify-center">
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 transition-all",
          open ? "bg-violet-300" : "bg-transparent group-hover/insert:bg-violet-200"
        )}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "pointer-events-auto relative grid h-6 w-6 place-items-center rounded-full border bg-white shadow-sm transition-all",
              open
                ? "border-violet-400 text-violet-600 opacity-100"
                : "border-slate-200 text-slate-400 opacity-0 group-hover/insert:opacity-100 hover:border-violet-300 hover:text-violet-500"
            )}
            aria-label={label ?? `Insert section at position ${index + 1}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="center" side="bottom" sideOffset={4}>
          <div className="border-b border-slate-200 p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search sections…" className="h-7 pl-8 text-xs" autoFocus />
            </div>
          </div>
          <div className="max-h-[320px] overflow-y-auto builder-scroll">
            {categories.map((cat) => {
              const types = filtered.filter((t) => t.category === cat);
              if (types.length === 0) return null;
              return (
                <div key={cat} className="p-1.5">
                  <div className="px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">{CATEGORY_LABELS[cat]}</div>
                  {types.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button key={t.kind} type="button" onClick={() => handleAdd(t.kind as SectionKind)} className="flex w-full items-start gap-2 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-slate-100">
                        <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded bg-slate-100 text-slate-500"><Icon className="h-3 w-3" /></div>
                        <div className="min-w-0 flex-1"><div className="text-xs font-medium">{t.label}</div><div className="line-clamp-1 text-[10px] text-slate-400">{t.description}</div></div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
            {filtered.length === 0 && <div className="py-6 text-center text-xs text-slate-400">No sections match</div>}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
