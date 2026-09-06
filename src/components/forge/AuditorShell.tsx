"use client";

import { useForge } from "@/lib/forge/store";
import { AppShell } from "@/components/pixelforge/editor/AppShell";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Wraps the PixelForge AppShell with a "Back to Dashboard" header button.
 * (v2.0.0: the "Edit in builder" transfer bridge was retired together with
 * the legacy Page Builder.)
 *
 * NOTE: Transfer + autosave recovery are handled inside AppShell's mount
 * effect (it has direct access to the pf-store, and React fires child effects
 * before parent effects, so doing it there avoids a race with the demo load).
 */
export function AuditorShell() {
  const { setView } = useForge();

  return (
    <TooltipProvider delayDuration={300}>
      <div>
        {/* Floating control — appears above the auditor's own top bar */}
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
        <AppShell />
      </div>
    </TooltipProvider>
  );
}
