"use client";

import { useBuilder } from "@/lib/builder/store/builder-store";
import { useForge } from "@/lib/forge/store";
import { SECTION_TYPES } from "@/lib/builder/sections/registry";
import type { SectionKind } from "@/lib/builder/sections/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  LayoutTemplate, Sparkles, Images, Star,
  type LucideIcon, ArrowLeft, Monitor, Tablet, Smartphone,
  Undo2, Redo2, Download, Palette, PanelLeft, PanelRight,
  ShieldCheck, Search, Plus,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { THEME_PRESETS } from "@/lib/builder/sections/types";
import { useState } from "react";
import { ExportDialog } from "./ExportDialog";

const CATEGORY_LABELS: Record<string, { label: string; icon: LucideIcon }> = {
  structure: { label: "Structure", icon: LayoutTemplate },
  conversion: { label: "Conversion", icon: Sparkles },
  social: { label: "Social proof", icon: Star },
  media: { label: "Media", icon: Images },
};

export function BuilderTopBar() {
  const {
    site, device, setDevice, undo, redo, canUndo, canRedo,
    applyThemePreset, libraryOpen, setLibraryOpen, inspectorOpen, setInspectorOpen,
    currentPageId, setCurrentPageId, addPage, exportHTML,
  } = useBuilder();
  const { setView, transferToAuditor } = useForge();
  const [exportOpen, setExportOpen] = useState(false);
  const [addPageOpen, setAddPageOpen] = useState(false);
  const [newPageName, setNewPageName] = useState("");

  const handleAddPage = () => {
    const name = newPageName.trim() || "Untitled page";
    addPage(name);
    setNewPageName("");
    setAddPageOpen(false);
  };

  return (
    <>
      <TooltipProvider delayDuration={300}>
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-3 text-slate-900 shadow-sm">
          {/* Left: brand + page selector */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => setView("dashboard")} className="grid h-8 w-8 place-items-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors" aria-label="Back to Dashboard">
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Back to Dashboard</TooltipContent>
            </Tooltip>
            <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div className="hidden sm:flex items-baseline gap-1.5">
              <span className="text-sm font-semibold truncate max-w-[160px]">{site.name || "Untitled"}</span>
              <span className="text-[11px] text-slate-400">/ Builder</span>
            </div>
            <div className="mx-1 h-6 w-px bg-slate-200" />
            <Select value={currentPageId || site.pages[0]?.id} onValueChange={setCurrentPageId}>
              <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue placeholder="Page" /></SelectTrigger>
              <SelectContent>
                {site.pages.map((p) => <SelectItem key={p.id} value={p.id} className="text-xs">{p.name} {p.isHome && "· Home"}</SelectItem>)}
              </SelectContent>
            </Select>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1" onClick={() => setAddPageOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add page
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Add a new page</TooltipContent>
            </Tooltip>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-1">
            {/* Device toggle */}
            <div className="flex items-center gap-0.5 rounded-md bg-slate-100 p-0.5">
              {([
                { id: "desktop", icon: Monitor, label: "Desktop" },
                { id: "tablet", icon: Tablet, label: "Tablet" },
                { id: "mobile", icon: Smartphone, label: "Mobile" },
              ] as const).map((it) => {
                const Icon = it.icon; const active = device === it.id;
                return (
                  <Tooltip key={it.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setDevice(it.id)}
                        className={cn("grid h-6 w-7 place-items-center rounded transition-all", active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900")}
                        aria-label={`Preview at ${it.label} width`}
                        aria-pressed={active}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">{it.label}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>

            <div className="mx-1.5 h-6 w-px bg-slate-200" />

            {/* History */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={!canUndo()} aria-label="Undo">
                  <Undo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Undo (Ctrl+Z)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={!canRedo()} aria-label="Redo">
                  <Redo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Redo (Ctrl+Shift+Z)</TooltipContent>
            </Tooltip>

            <div className="mx-1 h-6 w-px bg-slate-200" />

            {/* Theme picker */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-xs">
                  <Palette className="h-3.5 w-3.5" />
                  <span className="h-3.5 w-3.5 rounded-full border ring-1 ring-black/5" style={{ background: site.themeTokens.primary }} />
                  <span className="hidden lg:inline">Theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs">Theme presets</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {THEME_PRESETS.map((p) => (
                  <DropdownMenuItem key={p.name} onClick={() => applyThemePreset(p.tokens)} className="gap-2 text-xs">
                    <div className="flex gap-0.5">
                      <span className="h-3 w-3 rounded-full border ring-1 ring-black/5" style={{ background: p.tokens.primary }} />
                      <span className="h-3 w-3 rounded-full border ring-1 ring-black/5" style={{ background: p.tokens.accent }} />
                    </div>
                    {p.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Panel toggles */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className={cn("h-8 w-8", !libraryOpen && "bg-slate-100")} onClick={() => setLibraryOpen(!libraryOpen)} aria-label="Toggle section library" aria-pressed={libraryOpen}>
                  <PanelLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Section library</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className={cn("h-8 w-8", !inspectorOpen && "bg-slate-100")} onClick={() => setInspectorOpen(!inspectorOpen)} aria-label="Toggle inspector" aria-pressed={inspectorOpen}>
                  <PanelRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Inspector</TooltipContent>
            </Tooltip>

            <div className="mx-1 h-6 w-px bg-slate-200" />

            {/* Audit + Export */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => transferToAuditor(exportHTML(), site.name)}>
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Audit this page</span>
                  <span className="md:hidden">Audit</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Send this page to the Auditor for scoring</TooltipContent>
            </Tooltip>
            <Button variant="default" size="sm" className="h-8 ml-1 gap-1.5 bg-slate-900 hover:bg-slate-700" onClick={() => setExportOpen(true)}>
              <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </header>
      </TooltipProvider>

      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />

      {/* Add Page dialog (replaces browser prompt()) */}
      <Dialog open={addPageOpen} onOpenChange={setAddPageOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add a new page</DialogTitle>
            <DialogDescription>Give the page a name. You can rename it later from the page selector.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="page-name" className="text-xs">Page name</Label>
            <Input
              id="page-name"
              autoFocus
              value={newPageName}
              onChange={(e) => setNewPageName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddPage(); }}
              placeholder="e.g. About, Pricing, Contact…"
              className="h-9"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPageOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPage}>Add page</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function SectionLibrary() {
  const addSection = useBuilder((s) => s.addSection);
  const categories = Object.keys(CATEGORY_LABELS);
  const [query, setQuery] = useState("");
  const filteredTypes = SECTION_TYPES.filter((t) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
  });
  return (
    <div className="flex h-full flex-col bg-white text-slate-900">
      <div className="border-b border-slate-200 p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Section library</div>
            <div className="mt-0.5 text-[11px] text-slate-400">Click to add to the current page</div>
          </div>
        </div>
        <div className="relative mt-2.5">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sections…"
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-3">
          {categories.map((cat) => {
            const types = filteredTypes.filter((t) => t.category === cat);
            if (types.length === 0) return null;
            const CatIcon = CATEGORY_LABELS[cat].icon;
            return (
              <div key={cat}>
                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  <CatIcon className="h-3 w-3" />{CATEGORY_LABELS[cat].label}
                  <span className="ml-auto text-[9px] text-slate-400">{types.length}</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {types.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.kind}
                        type="button"
                        onClick={() => addSection(t.kind as SectionKind)}
                        className="group flex items-start gap-2 rounded-md border border-slate-200 bg-white p-2 text-left transition-all hover:border-violet-400 hover:shadow-sm active:scale-[0.98]"
                      >
                        <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-500 transition-colors group-hover:bg-violet-100 group-hover:text-violet-600">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold">{t.label}</div>
                          <div className="line-clamp-2 text-[10px] text-slate-500">{t.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {filteredTypes.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">No sections match "{query}"</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
