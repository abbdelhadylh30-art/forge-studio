"use client";

import { useState, useEffect, useRef } from "react";
import { useBuilder } from "@/lib/builder/store/builder-store";
import { useForge } from "@/lib/forge/store";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Eye, Download, Palette, ShieldCheck, Plus, Copy, RotateCcw, Save, History } from "lucide-react";
import { THEME_PRESETS } from "@/lib/builder/sections/types";
import { SECTION_TYPES } from "@/lib/builder/sections/registry";
import type { SectionKind } from "@/lib/builder/sections/types";

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  group: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const builder = useBuilder();
  const forge = useForge();

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIdx(0);
    }
  }, [open]);

  // Build commands
  const commands: Command[] = [
    ...SECTION_TYPES.map((t) => ({
      id: `add-${t.kind}`,
      label: `Add ${t.label} section`,
      hint: t.description,
      icon: t.icon,
      action: () => { builder.addSection(t.kind as SectionKind); setOpen(false); },
      group: "Add Section",
    })),
    { id: "preview", label: "Toggle preview mode", hint: "Hide editor chrome", icon: Eye, action: () => { builder.setPreviewMode(!builder.previewMode); setOpen(false); }, group: "View" },
    { id: "undo", label: "Undo", hint: "Ctrl+Z", icon: RotateCcw, action: () => { builder.undo(); setOpen(false); }, group: "Edit" },
    { id: "copy", label: "Copy selected section", hint: "Ctrl+C", icon: Copy, action: () => { if (builder.selectedSectionId) builder.copySection(builder.selectedSectionId); setOpen(false); }, group: "Edit" },
    { id: "paste", label: "Paste section", hint: "Ctrl+V", icon: Copy, action: () => { builder.pasteSection(builder.selectedSectionId ?? undefined); setOpen(false); }, group: "Edit" },
    { id: "audit", label: "Audit this page", hint: "Send to auditor", icon: ShieldCheck, action: () => { forge.transferToAuditor(builder.exportHTML(), builder.site.name); setOpen(false); }, group: "Audit" },
    { id: "export", label: "Export site", hint: "HTML / JSON / ZIP", icon: Download, action: () => { document.querySelector<HTMLButtonElement>("[aria-label='Export']")?.click(); setOpen(false); }, group: "Export" },
    { id: "save-version", label: "Save version snapshot", hint: "Name this state", icon: Save, action: () => { const name = prompt("Version name:"); if (name) builder.saveVersion(name); setOpen(false); }, group: "Versions" },
    { id: "dashboard", label: "Back to dashboard", icon: Plus, action: () => { forge.setView("dashboard"); setOpen(false); }, group: "Navigation" },
    ...THEME_PRESETS.map((p) => ({
      id: `theme-${p.name}`,
      label: `Theme: ${p.name}`,
      icon: Palette,
      action: () => { builder.applyThemePreset(p.tokens); setOpen(false); },
      group: "Theme",
    })),
  ];

  const filtered = commands.filter((c) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return c.label.toLowerCase().includes(q) || c.hint?.toLowerCase().includes(q) || c.group.toLowerCase().includes(q);
  });

  // Group filtered commands
  const groups: Record<string, Command[]> = {};
  for (const c of filtered) {
    if (!groups[c.group]) groups[c.group] = [];
    groups[c.group].push(c);
  }
  const flatFiltered = filtered;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, flatFiltered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      flatFiltered[selectedIdx]?.action();
    }
  };

  if (!open) return null;

  let runningIdx = -1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden" onKeyDown={handleKeyDown}>
        <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0); }}
            placeholder="Type a command or search…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-400">ESC</kbd>
        </div>
        <div className="max-h-[400px] overflow-y-auto builder-scroll">
          {Object.keys(groups).length === 0 && (
            <div className="py-8 text-center text-sm text-slate-400">No commands found</div>
          )}
          {Object.entries(groups).map(([groupName, cmds]) => (
            <div key={groupName}>
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-50/50">{groupName}</div>
              {cmds.map((cmd) => {
                runningIdx++;
                const isSelected = runningIdx === selectedIdx;
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.id}
                    type="button"
                    onMouseEnter={() => setSelectedIdx(runningIdx)}
                    onClick={cmd.action}
                    className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${isSelected ? "bg-violet-50" : "hover:bg-slate-50"}`}
                  >
                    <div className={`grid h-7 w-7 shrink-0 place-items-center rounded ${isSelected ? "bg-violet-100 text-violet-600" : "bg-slate-100 text-slate-500"}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-900">{cmd.label}</div>
                      {cmd.hint && <div className="text-[11px] text-slate-400">{cmd.hint}</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
