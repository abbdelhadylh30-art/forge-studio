"use client";

import { useState } from "react";
import { usePFStore } from "@/lib/pixelforge/store/pf-store";
import { useForge } from "@/lib/forge/store";
import { useBuilder } from "@/lib/builder/store/builder-store";
import { AppShell } from "@/components/pixelforge/editor/AppShell";
import { ArrowLeft, Layout, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Wraps the PixelForge AppShell with:
 * 1. A "Back to Dashboard" + "Edit in builder" header button
 * 2. Honesty warning when "Edit in builder" is clicked on complex fetched HTML
 *
 * NOTE: Transfer + autosave recovery are handled inside AppShell's mount
 * effect (it has direct access to the pf-store, and React fires child effects
 * before parent effects, so doing it there avoids a race with the demo load).
 */
export function AuditorShell() {
  const { setView } = useForge();
  const { projectName, currentHTML } = usePFStore();
  const { loadFromHTML } = useBuilder();
  const [editWarnOpen, setEditWarnOpen] = useState(false);

  // Heuristic: detect if the current HTML looks like a "complex fetched" page
  // (lots of inline styles, external scripts, or non-Forge structure) that
  // won't translate cleanly into the builder's section model.
  const isComplexHTML = (html: string): boolean => {
    if (!html) return false;
    const inlineStyles = (html.match(/style=/g) || []).length;
    const scriptTags = (html.match(/<script/g) || []).length;
    const divCount = (html.match(/<div/g) || []).length;
    return inlineStyles > 30 || scriptTags > 3 || divCount > 80;
  };

  const handleEditInBuilder = () => {
    if (!currentHTML) return;
    if (isComplexHTML(currentHTML)) {
      setEditWarnOpen(true);
    } else {
      loadFromHTML(currentHTML, projectName);
      setView("builder");
    }
  };

  const confirmEditInBuilder = () => {
    loadFromHTML(currentHTML, projectName);
    setView("builder");
    setEditWarnOpen(false);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="relative">
        {/* Floating transfer controls — appear above the auditor's own top bar */}
        <div className="fixed top-2 left-2 z-[600] flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px] text-[var(--pf-text-dim)] hover:text-[var(--pf-text-bright)] hover:bg-white/5 backdrop-blur-sm"
                onClick={() => setView("dashboard")}
              >
                <ArrowLeft className="mr-1 h-3 w-3" /> Dashboard
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Back to Forge Studio dashboard</TooltipContent>
          </Tooltip>
        </div>
        <div className="fixed top-2 right-2 z-[600]">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 border-[var(--pf-border)] bg-[var(--pf-panel)]/80 backdrop-blur text-[11px] text-[var(--pf-text)] hover:bg-[var(--pf-panel-hover)]"
                onClick={handleEditInBuilder}
                disabled={!currentHTML}
              >
                <Layout className="h-3 w-3" /> Edit in builder
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Send the current HTML to the Builder for further editing</TooltipContent>
          </Tooltip>
        </div>
        <AppShell />

        {/* Honesty warning when sending complex fetched HTML to the builder */}
        <AlertDialog open={editWarnOpen} onOpenChange={setEditWarnOpen}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Heads up — builder works best on Forge-built pages
              </AlertDialogTitle>
              <AlertDialogDescription>
                This page looks like it was fetched from an external site. The builder uses a section-based editor, so imported HTML gets loaded into a single raw-HTML section — you won't be able to drag-and-drop individual elements from the original page. You can still edit the raw HTML, audit it, and export it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmEditInBuilder}>
                Continue to builder
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}
