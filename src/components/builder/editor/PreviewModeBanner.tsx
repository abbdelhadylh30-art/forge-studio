"use client";

import { useBuilder } from "@/lib/builder/store/builder-store";
import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * PreviewModeBanner
 * When previewMode is active, shows a slim banner at the top with an "Exit preview"
 * button. The rest of the editor chrome (panels, badges, outlines) is hidden by
 * the BuilderShell conditional rendering.
 */
export function PreviewModeBanner() {
  const previewMode = useBuilder((s) => s.previewMode);
  const setPreviewMode = useBuilder((s) => s.setPreviewMode);
  if (!previewMode) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-3 bg-slate-900 py-1.5 text-white shadow-lg">
      <Eye className="h-3.5 w-3.5 text-emerald-400" />
      <span className="text-xs font-medium">Preview mode — this is how your page will look when published</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 gap-1 px-2 text-xs text-white hover:bg-white/10 hover:text-white"
        onClick={() => setPreviewMode(false)}
      >
        <X className="h-3 w-3" /> Exit preview
      </Button>
    </div>
  );
}
