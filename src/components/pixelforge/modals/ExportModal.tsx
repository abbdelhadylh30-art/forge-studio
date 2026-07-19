"use client";

import { usePFStore } from "@/lib/pixelforge/store/pf-store";
import { ModalShell } from "./CompetitorModal";
import { Download, FileText, FileCode } from "lucide-react";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  onToast: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
}

export function ExportModal({ open, onClose, onToast }: ExportModalProps) {
  const { currentHTML, scoreData, projectName, changeLog } = usePFStore();

  const downloadHTML = async () => {
    if (!currentHTML) return;
    try {
      const res = await fetch("/api/export-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: currentHTML,
          filename: `${projectName.toLowerCase().replace(/\s+/g, "-")}-improved.html`,
        }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName.toLowerCase().replace(/\s+/g, "-")}-improved.html`;
      a.click();
      URL.revokeObjectURL(url);
      onToast("Improved HTML downloaded", "success");
      onClose();
    } catch (e: any) {
      onToast(`Export failed: ${e.message}`, "error");
    }
  };

  const downloadJSON = () => {
    if (!currentHTML) return;
    const report = {
      project: projectName,
      date: new Date().toISOString(),
      initialScore: usePFStore.getState().initialScore,
      finalScore: scoreData?.score ?? 0,
      desktopScore: scoreData?.desktopScore ?? 0,
      mobileScore: scoreData?.mobileScore ?? 0,
      categories: scoreData?.cats,
      issues: scoreData?.issues,
      changesApplied: changeLog.filter((c) => !c.reverted).map((c) => ({ title: c.title, description: c.description, fixId: c.fixId })),
      html: currentHTML,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/\s+/g, "-")}-audit.json`;
    a.click();
    URL.revokeObjectURL(url);
    onToast("Audit report (JSON) downloaded", "success");
  };

  return (
    <ModalShell open={open} onClose={onClose} title="Download Improved Page" icon={Download}>
      <p className="text-[12.5px] text-[var(--pf-text-dim)] mb-4 leading-relaxed">
        Download your optimized page with all fixes applied. Choose HTML to host anywhere, or JSON for a full audit report.
      </p>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <button onClick={downloadHTML} className="flex flex-col items-center gap-2 p-4 rounded-lg border border-[var(--pf-border)] bg-white/[0.03] hover:bg-white/[0.08] hover:border-[var(--pf-accent)] transition-all">
          <FileCode className="w-6 h-6 text-[var(--pf-accent)]" />
          <div className="text-xs font-semibold">Standalone HTML</div>
          <div className="text-[10px] text-[var(--pf-text-dim)] text-center">Self-contained .html file ready to deploy</div>
        </button>
        <button onClick={downloadJSON} className="flex flex-col items-center gap-2 p-4 rounded-lg border border-[var(--pf-border)] bg-white/[0.03] hover:bg-white/[0.08] hover:border-[var(--pf-accent)] transition-all">
          <FileText className="w-6 h-6 text-[var(--pf-accent)]" />
          <div className="text-xs font-semibold">Audit JSON</div>
          <div className="text-[10px] text-[var(--pf-text-dim)] text-center">Full report with scores, issues, and changes</div>
        </button>
      </div>

      {scoreData && (
        <div className="p-3 rounded-lg bg-white/[0.03] border border-[var(--pf-border)]">
          <div className="text-[10px] uppercase tracking-wider text-[var(--pf-text-dim)] mb-1.5">Audit summary</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[18px] font-black">{scoreData.score}</div>
              <div className="text-[9px] text-[var(--pf-text-dim)]">Overall</div>
            </div>
            <div>
              <div className="text-[18px] font-black text-[var(--pf-accent)]">{scoreData.desktopScore}</div>
              <div className="text-[9px] text-[var(--pf-text-dim)]">Desktop</div>
            </div>
            <div>
              <div className="text-[18px] font-black text-[var(--pf-warning)]">{scoreData.mobileScore}</div>
              <div className="text-[9px] text-[var(--pf-text-dim)]">Mobile</div>
            </div>
          </div>
          <div className="text-[11px] text-[var(--pf-text-dim)] mt-2">
            {changeLog.filter((c) => !c.reverted).length} fixes applied
          </div>
        </div>
      )}
    </ModalShell>
  );
}
