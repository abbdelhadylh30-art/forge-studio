"use client";

import { usePFStore } from "@/lib/pixelforge/store/pf-store";
import { ModalShell } from "./CompetitorModal";
import { Download, FileText, FileCode, Mail, Loader2, CheckCircle2, BookOpenCheck } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadLedgerPayload } from "@/lib/integrations/build-ledger";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  onToast: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
}

export function ExportModal({ open, onClose, onToast }: ExportModalProps) {
  const { currentHTML, scoreData, projectName, projectUrl, clientName, changeLog } = usePFStore();
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [email, setEmail] = useState("");
  const [sendingReport, setSendingReport] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  const downloadHTML = () => {
    if (!currentHTML) return;
    // Generate the download client-side — no API needed.
    // The HTML is already in memory; we just wrap it in a Blob and trigger
    // a download. This is faster (no network round-trip) and works offline.
    const blob = new Blob([currentHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/\s+/g, "-")}-improved.html`;
    a.click();
    URL.revokeObjectURL(url);
    onToast("Improved HTML downloaded", "success");
    onClose();
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

  const trackInLedger = () => {
    if (!currentHTML) {
      onToast("Audit a page first, then track it in Build Ledger.", "info");
      return;
    }
    const fixes = changeLog.filter((c) => !c.reverted).length;
    const filename = downloadLedgerPayload(
      {
        name: projectName,
        description: `Landing page audited with Forge Studio — final score ${scoreData?.score ?? 0}/100.`,
        clientName,
        liveUrl: projectUrl,
        tags: ["forge-studio", "landing-page", "audited"],
        notes: [
          `Audit score: ${scoreData?.score ?? 0}/100 (desktop ${scoreData?.desktopScore ?? 0}, mobile ${scoreData?.mobileScore ?? 0}).`,
          `${fixes} fix${fixes === 1 ? "" : "es"} applied in this session.`,
          projectUrl ? `Source: ${projectUrl}` : null,
        ].filter(Boolean).join("\n"),
      },
      projectName
    );
    onToast(`Downloaded ${filename} — import it in Build Ledger → Import`, "success");
  };

  const sendReport = async () => {
    if (!email.trim() || !email.includes("@")) {
      onToast("Please enter a valid email address.", "warning");
      return;
    }
    setSendingReport(true);
    try {
      const report = {
        project: projectName,
        date: new Date().toISOString(),
        finalScore: scoreData?.score ?? 0,
        desktopScore: scoreData?.desktopScore ?? 0,
        mobileScore: scoreData?.mobileScore ?? 0,
        categories: scoreData?.cats,
        issues: scoreData?.issues,
        changesApplied: changeLog.filter((c) => !c.reverted).map((c) => ({ title: c.title, description: c.description, fixId: c.fixId })),
      };
      const res = await fetch("/api/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          projectName,
          score: scoreData?.score ?? 0,
          desktopScore: scoreData?.desktopScore ?? 0,
          mobileScore: scoreData?.mobileScore ?? 0,
          issueCount: scoreData?.issues.length ?? 0,
          fixCount: changeLog.filter((c) => !c.reverted).length,
          report: JSON.stringify(report),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to queue report.");
      }
      setReportSent(true);
      onToast("Report queued — we'll email it to you shortly.", "success");
    } catch (e: any) {
      onToast(`Couldn't queue report: ${e.message}`, "error");
    } finally {
      setSendingReport(false);
    }
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

      {/* Tier 3 — cross-product bridge */}
      <button
        onClick={trackInLedger}
        className="w-full flex items-center gap-3 p-3 mb-3 rounded-lg border border-[var(--pf-border)] bg-gradient-to-r from-[rgba(92,141,239,0.08)] to-[rgba(167,139,250,0.08)] hover:from-[rgba(92,141,239,0.16)] hover:to-[rgba(167,139,250,0.16)] hover:border-[var(--pf-accent)] transition-all text-left"
        title="Export this audit as a Build Ledger project entry"
      >
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#5c8def] to-[#a78bfa] text-white shadow">
          <BookOpenCheck className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold flex items-center gap-1.5">
            Track in Build Ledger
            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-[rgba(92,141,239,0.15)] text-[#5c8def]">New</span>
          </div>
          <div className="text-[10px] text-[var(--pf-text-dim)] leading-relaxed mt-0.5">
            Export this page as a project entry — import it in Build Ledger to track it alongside your client pipeline.
          </div>
        </div>
      </button>

      {scoreData && (
        <div className="p-3 rounded-lg bg-white/[0.03] border border-[var(--pf-border)] mb-3">
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

      {/* Optional email upsell — NOT a gate. User already got their download. */}
      <div className="rounded-lg border border-[var(--pf-border)] bg-white/[0.02] p-3">
        {reportSent ? (
          <div className="flex items-center gap-2 text-[12px] text-[var(--pf-success)]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Thanks! We'll email the full report to <strong>{email}</strong> shortly.</span>
          </div>
        ) : (
          <>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={emailOptIn}
                onChange={(e) => setEmailOptIn(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[var(--pf-border)] accent-[var(--pf-accent)]"
              />
              <div className="flex-1">
                <div className="text-[12px] font-semibold text-[var(--pf-text)] flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[var(--pf-accent)]" />
                  Also email me the audit report
                </div>
                <div className="text-[10.5px] text-[var(--pf-text-dim)] mt-0.5 leading-relaxed">
                  Get a copy of the full score breakdown + fixes list in your inbox. We won't spam you — just this one report.
                </div>
              </div>
            </label>
            {emailOptIn && (
              <div className="mt-3 flex gap-1.5">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-8 text-xs flex-1 bg-white/[0.04] border-[var(--pf-border)] text-[var(--pf-text)] placeholder:text-[var(--pf-text-dim)]"
                />
                <button
                  onClick={sendReport}
                  disabled={sendingReport || !email.trim()}
                  className="flex items-center gap-1.5 px-3 h-8 rounded-md bg-[var(--pf-accent)] text-white text-[11px] font-semibold hover:bg-[#6f9cf5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  {sendingReport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                  {sendingReport ? "Sending…" : "Send"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </ModalShell>
  );
}
