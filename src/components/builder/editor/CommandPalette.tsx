"use client";

/**
 * Global command palette (Tier 3 — cmdk upgrade).
 *
 * Replaces the hand-rolled arrow-key palette with the shadcn/cmdk primitive:
 * fuzzy search, grouped commands, native keyboard navigation, shortcuts.
 *
 * Mounted once at the app root (page.tsx) and view-aware — builder commands
 * appear in the builder, auditor commands in the auditor, navigation and
 * preferences everywhere.
 */

import { useState, useEffect, useCallback } from "react";
import { useBuilder } from "@/lib/builder/store/builder-store";
import { useForge } from "@/lib/forge/store";
import { usePFStore } from "@/lib/pixelforge/store/pf-store";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem, CommandShortcut, CommandSeparator,
} from "@/components/ui/command";
import {
  Eye, Download, Palette, ShieldCheck, Copy, RotateCcw, Save, History,
  Layout, Home, Sun, Moon, BookOpenCheck, Plus, Monitor, CheckCircle2, Sparkles, Hammer,
} from "lucide-react";
import { THEME_PRESETS, type SectionKind } from "@/lib/builder/sections/types";
import { SECTION_TYPES } from "@/lib/builder/sections/registry";
import { downloadLedgerPayload } from "@/lib/integrations/build-ledger";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const builder = useBuilder();
  const forge = useForge();
  const pf = usePFStore();
  const { resolvedTheme, setTheme } = useTheme();
  const view = useForge((s) => s.view);

  // Cmd+K / Ctrl+K toggles — works in every view.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const run = useCallback((action: () => void) => {
    setOpen(false);
    action();
  }, []);

  const toggleTheme = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(next);
    toast({ title: next === "dark" ? "Dark mode on" : "Light mode on", description: "Theme saved for next visits." });
  };

  const saveAuditSnapshot = () => {
    const entry = usePFStore.getState().saveSnapshot();
    if (entry) {
      toast({ title: `Saved “${entry.name}” to audit history`, description: `Score ${entry.score}/100 · see the dashboard for the full history.` });
    } else {
      toast({ title: "Nothing to save yet", description: "Open the auditor and score a page first." });
    }
  };

  const trackInLedger = () => {
    if (view === "auditor") {
      const s = usePFStore.getState();
      if (!s.currentHTML) {
        toast({ title: "Audit a page first, then track it in Build Ledger." });
        return;
      }
      const fixes = s.changeLog.filter((c) => !c.reverted).length;
      const filename = downloadLedgerPayload(
        {
          name: s.projectName,
          description: `Landing page audited with Forge Studio — final score ${s.scoreData?.score ?? 0}/100.`,
          clientName: s.clientName,
          liveUrl: s.projectUrl,
          tags: ["forge-studio", "landing-page", "audited"],
          notes: `Audit score: ${s.scoreData?.score ?? 0}/100. ${fixes} fix(es) applied.`,
        },
        s.projectName
      );
      toast({ title: `Downloaded ${filename}`, description: "Import it in Build Ledger → Import." });
    } else {
      const site = useBuilder.getState().site;
      const filename = downloadLedgerPayload(
        {
          name: site.name,
          description: site.description || `Landing page built with Forge Studio (${site.pages.length} page${site.pages.length === 1 ? "" : "s"}).`,
          tags: ["forge-studio", "landing-page", "built"],
          notes: `Built with Forge Studio. Pages: ${site.pages.map((p) => p.name).join(", ")}.`,
        },
        site.slug || site.name
      );
      toast({ title: `Downloaded ${filename}`, description: "Import it in Build Ledger → Import." });
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen} className="max-w-xl">
      <CommandInput placeholder="Type a command or search…" />
      <CommandList className="max-h-[420px]">
        <CommandEmpty>No commands found.</CommandEmpty>

        {/* ── Navigate ─────────────────────────────────────────────── */}
        <CommandGroup heading="Navigate">
          {view !== "dashboard" && (
            <CommandItem onSelect={() => run(() => forge.setView("dashboard"))}>
              <Home className="h-4 w-4" /> Back to dashboard
            </CommandItem>
          )}
          {view !== "builder" && (
            <CommandItem onSelect={() => run(() => forge.setView("builder"))}>
              <Layout className="h-4 w-4" /> Open page builder
            </CommandItem>
          )}
          {view !== "auditor" && (
            <CommandItem onSelect={() => run(() => forge.setView("auditor"))}>
              <ShieldCheck className="h-4 w-4" /> Open page auditor
            </CommandItem>
          )}
          {view !== "templates" && (
            <CommandItem onSelect={() => run(() => forge.setView("templates"))}>
              <Sparkles className="h-4 w-4" /> Browse templates
            </CommandItem>
          )}
          {view !== "sites" && (
            <CommandItem onSelect={() => run(() => forge.setView("sites"))}>
              <Hammer className="h-4 w-4" /> Open Sites studio (landing-forge)
            </CommandItem>
          )}
        </CommandGroup>

        {/* ── Preferences ──────────────────────────────────────────── */}
        <CommandGroup heading="Preferences">
          <CommandItem onSelect={() => run(toggleTheme)}>
            {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            Switch to {resolvedTheme === "dark" ? "light" : "dark"} mode
            <CommandShortcut>Theme</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        {/* ── Audit history + Ledger bridge (context-aware) ─────────── */}
        <CommandGroup heading="Audit & Track">
          <CommandItem onSelect={() => run(saveAuditSnapshot)}>
            <History className="h-4 w-4" /> Save audit snapshot
            <CommandShortcut>History</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(trackInLedger)}>
            <BookOpenCheck className="h-4 w-4" /> Track in Build Ledger
            <CommandShortcut>Export</CommandShortcut>
          </CommandItem>
          {view === "builder" && (
            <CommandItem onSelect={() => run(() => forge.transferToAuditor(builder.exportHTML(), builder.site.name))}>
              <ShieldCheck className="h-4 w-4" /> Audit this page
              <CommandShortcut>Send</CommandShortcut>
            </CommandItem>
          )}
        </CommandGroup>

        {view === "builder" && (
          <>
            <CommandSeparator />
            {/* ── Builder: view & edit ──────────────────────────────── */}
            <CommandGroup heading="Builder">
              <CommandItem onSelect={() => run(() => builder.setPreviewMode(!builder.previewMode))}>
                <Eye className="h-4 w-4" /> Toggle preview mode
                <CommandShortcut>Ctrl+P</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => run(() => builder.undo())}>
                <RotateCcw className="h-4 w-4" /> Undo
                <CommandShortcut>Ctrl+Z</CommandShortcut>
              </CommandItem>
              <CommandItem disabled={!builder.selectedSectionId} onSelect={() => run(() => builder.selectedSectionId && builder.copySection(builder.selectedSectionId))}>
                <Copy className="h-4 w-4" /> Copy selected section
                <CommandShortcut>Ctrl+C</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => run(() => builder.pasteSection(builder.selectedSectionId ?? undefined))}>
                <Plus className="h-4 w-4" /> Paste section
                <CommandShortcut>Ctrl+V</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => run(() => builder.saveVersion(`Snapshot ${new Date().toLocaleString()}`))}>
                <Save className="h-4 w-4" /> Save version snapshot
              </CommandItem>
              <CommandItem onSelect={() => run(() => {
                const html = builder.exportHTML();
                if (html) {
                  const blob = new Blob([html], { type: "text/html" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${builder.site.slug || "site"}.html`;
                  a.click();
                  URL.revokeObjectURL(url);
                }
              })}>
                <Download className="h-4 w-4" /> Quick export HTML
              </CommandItem>
            </CommandGroup>

            {/* ── Builder: themes ───────────────────────────────────── */}
            <CommandGroup heading="Apply theme">
              {THEME_PRESETS.map((p) => (
                <CommandItem key={p.name} value={`theme ${p.name}`} onSelect={() => run(() => builder.applyThemePreset(p.tokens))}>
                  <Palette className="h-4 w-4" /> {p.name}
                  {builder.site.themeId === p.name.toLowerCase() && <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-emerald-500" />}
                </CommandItem>
              ))}
            </CommandGroup>

            {/* ── Builder: add sections ─────────────────────────────── */}
            <CommandGroup heading="Add section">
              {SECTION_TYPES.map((t) => (
                <CommandItem
                  key={t.kind}
                  value={`add section ${t.label} ${t.kind}`}
                  onSelect={() => run(() => builder.addSection(t.kind as SectionKind))}
                >
                  <t.icon className="h-4 w-4" /> Add {t.label}
                  <CommandShortcut>{t.category}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {view === "auditor" && pf.currentHTML && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Auditor">
              <CommandItem onSelect={() => run(() => usePFStore.getState().undo())}>
                <RotateCcw className="h-4 w-4" /> Undo audit change
                <CommandShortcut>Ctrl+Z</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => run(() => usePFStore.getState().redo())}>
                <Monitor className="h-4 w-4" /> Redo audit change
                <CommandShortcut>Ctrl+Y</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
