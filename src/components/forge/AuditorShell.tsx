"use client";

import { useEffect } from "react";
import { usePFStore } from "@/lib/pixelforge/store/pf-store";
import { useForge } from "@/lib/forge/store";
import { useBuilder } from "@/lib/builder/store/builder-store";
import { AppShell } from "@/components/pixelforge/editor/AppShell";
import { ArrowLeft, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Wraps the PixelForge AppShell with:
 * 1. A "Back to Dashboard" + "Edit in builder" header button
 * 2. Logic to consume any pending transfer HTML (from the Builder → Auditor flow)
 */
export function AuditorShell() {
  const { setView, consumeTransfer } = useForge();
  const { setHTML, projectName, currentHTML, setProjectName } = usePFStore();
  const { loadFromHTML } = useBuilder();

  // Consume pending transfer on mount
  useEffect(() => {
    const transfer = consumeTransfer();
    if (transfer && transfer.source === "builder") {
      setHTML(transfer.html, { resetHistory: true });
      setProjectName(transfer.name);
    }
  }, []);

  const handleEditInBuilder = () => {
    if (!currentHTML) return;
    loadFromHTML(currentHTML, projectName);
    setView("builder");
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
      </div>
    </TooltipProvider>
  );
}
