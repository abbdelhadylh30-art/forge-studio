"use client";

import { useEffect, useState } from "react";
import { usePFStore } from "@/lib/pixelforge/store/pf-store";
import { TopBar } from "./TopBar";
import { DeviceBar } from "./DeviceBar";
import { LayerPanel } from "./LayerPanel";
import { Preview } from "./Preview";
import { RightPanel } from "./RightPanel";
import { GuideOverlay } from "./GuideOverlay";
import { ChangelogFab } from "./ChangelogFab";
import { ImportModal } from "../modals/ImportModal";
import { CompetitorModal } from "../modals/CompetitorModal";
import { ABModal } from "../modals/ABModal";
import { ToolsModal } from "../modals/ToolsModal";
import { ExportModal } from "../modals/ExportModal";
import { SAMPLE_PAGE_HTML } from "@/lib/pixelforge/scoring/sample-page";
import { useToasts, useConfetti, useImprovementToast } from "../shared/utils";
import { CheckCircle2 } from "lucide-react";

export function AppShell() {
  const {
    setHTML, undo, redo, canUndo, canRedo, selectedSelector, setSelectedSelector,
  } = usePFStore();
  const { toasts, pushToast } = useToasts();
  const { pieces: confetti, fire: fireConfetti } = useConfetti();
  const { show: improvementShow, diff: improvementDiff, fire: fireImprovement } = useImprovementToast();

  const [importOpen, setImportOpen] = useState(false);
  const [competitorOpen, setCompetitorOpen] = useState(false);
  const [abOpen, setAbOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (typing) return;
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if (meta && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) { e.preventDefault(); redo(); }
      else if (e.key === "Escape") { setSelectedSelector(null); setImportOpen(false); setCompetitorOpen(false); setAbOpen(false); setToolsOpen(false); setExportOpen(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, setSelectedSelector]);

  // First mount: auto-load the demo page so the user sees a working audit immediately
  useEffect(() => {
    if (!usePFStore.getState().currentHTML) {
      setHTML(SAMPLE_PAGE_HTML, { resetHistory: true });
    }
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--pf-bg)] text-[var(--pf-text)]">
      <TopBar
        onOpenImport={() => setImportOpen(true)}
        onOpenCompetitor={() => setCompetitorOpen(true)}
        onOpenAB={() => setAbOpen(true)}
        onOpenTools={() => setToolsOpen(true)}
        onOpenExport={() => setExportOpen(true)}
        onToast={pushToast}
      />
      <DeviceBar />
      <div className="flex flex-1 overflow-hidden">
        <LayerPanel />
        <main className="flex-1 min-w-0">
          <Preview />
        </main>
        <RightPanel
          onToast={pushToast}
          onImprovement={fireImprovement}
          onConfetti={fireConfetti}
        />
      </div>

      {/* Modals */}
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} onToast={pushToast} />
      <CompetitorModal open={competitorOpen} onClose={() => setCompetitorOpen(false)} onToast={pushToast} />
      <ABModal open={abOpen} onClose={() => setAbOpen(false)} onToast={pushToast} />
      <ToolsModal open={toolsOpen} onClose={() => setToolsOpen(false)} onToast={pushToast} />
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} onToast={pushToast} />

      {/* Guide overlay */}
      <GuideOverlay onToast={pushToast} />

      {/* Changelog FAB */}
      <ChangelogFab />

      {/* Confetti */}
      {confetti.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[1000] overflow-hidden">
          {confetti.map((p) => (
            <div
              key={p.id}
              className="absolute w-2 h-3 rounded-sm"
              style={{
                left: `${p.left}%`,
                top: "-10px",
                background: p.bg,
                animation: `pfConfettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
              }}
            />
          ))}
        </div>
      )}

      {/* Improvement toast */}
      {improvementShow && (
        <div
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[600] px-9 py-5 rounded-xl bg-[var(--pf-panel)] border-2 border-[var(--pf-success)] text-center shadow-[0_0_40px_rgba(61,214,140,0.2)]"
          style={{ animation: "pfScorePulse 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}
        >
          <div className="text-[42px] font-black text-[var(--pf-success)]">+{improvementDiff}</div>
          <div className="text-[13px] text-[var(--pf-text-dim)] mt-0.5">points gained</div>
        </div>
      )}

      {/* Toast stack */}
      <div className="fixed bottom-4 right-4 z-[999] flex flex-col gap-1.5">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="px-4 py-2.5 rounded-lg text-[12.5px] font-medium shadow-lg max-w-[300px]"
            style={{
              background: t.type === "success" ? "var(--pf-success)" : t.type === "error" ? "var(--pf-error)" : t.type === "warning" ? "var(--pf-warning)" : "var(--pf-accent)",
              color: t.type === "success" || t.type === "warning" ? "#0a0c10" : "#fff",
              animation: "pfToastIn 0.3s ease, pfToastOut 0.3s ease 2.7s forwards",
            }}
          >
            {t.type === "success" && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5" />}
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
