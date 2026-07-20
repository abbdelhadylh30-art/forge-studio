"use client";

import { useState } from "react";
import { usePFStore } from "@/lib/pixelforge/store/pf-store";
import { runScoring } from "@/lib/pixelforge/scoring/engine";
import { X, GitCompare, Trophy } from "lucide-react";

interface CompetitorModalProps {
  open: boolean;
  onClose: () => void;
  onToast: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
}

export function CompetitorModal({ open, onClose, onToast }: CompetitorModalProps) {
  const { scoreData, currentHTML, projectName } = usePFStore();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ yourScore: number; theirScore: number; theirUrl: string } | null>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      onToast("Enter a competitor URL", "warning");
      return;
    }
    setLoading(true);
    try {
      const fullUrl = url.startsWith("http") ? url : `https://${url}`;
      const res = await fetch(`/api/fetch-url?url=${encodeURIComponent(fullUrl)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      // Score the fetched HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.html, "text/html");
      const sd = runScoring({ doc });
      const yourScore = scoreData?.score ?? 0;
      setResult({ yourScore, theirScore: sd.score, theirUrl: data.finalUrl });
      onToast(`Competitor scored ${sd.score}/100`, sd.score > yourScore ? "warning" : "success");
    } catch (e: any) {
      onToast(`Failed: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <ModalShell open={open} onClose={onClose} title="Compare with Competitor" icon={GitCompare}>
      <p className="text-[12.5px] text-[var(--pf-text-dim)] mb-3 leading-relaxed">
        Enter a competitor URL to fetch and score it side-by-side with your page.
      </p>
      <div className="flex gap-1.5 mb-3">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
          placeholder="competitor.com"
          className="flex-1 px-3 py-2 bg-white/[0.04] border border-[var(--pf-border)] rounded text-[var(--pf-text)] text-xs focus:border-[var(--pf-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--pf-accent-glow)]"
        />
        <button onClick={handleAnalyze} disabled={loading} className="pf-btn pf-btn-primary pf-btn-sm">
          {loading ? "..." : "Analyze"}
        </button>
      </div>
      {result && (
        <div className="grid grid-cols-2 gap-3 mt-3">
          <CompetitorCard
            label="Your page"
            name={projectName}
            score={result.yourScore}
            winner={result.yourScore >= result.theirScore}
          />
          <CompetitorCard
            label="Competitor"
            name={result.theirUrl}
            score={result.theirScore}
            winner={result.theirScore > result.yourScore}
          />
        </div>
      )}
      {!result && !loading && (
        <div className="text-center py-8 text-[var(--pf-text-dim)] text-xs">
          <GitCompare className="w-10 h-10 mx-auto mb-2 opacity-25" />
          Enter a URL above to compare scores.
        </div>
      )}
    </ModalShell>
  );
}

function CompetitorCard({ label, name, score, winner }: { label: string; name: string; score: number; winner: boolean }) {
  const color = score >= 80 ? "var(--pf-success)" : score >= 50 ? "var(--pf-warning)" : "var(--pf-error)";
  return (
    <div
      className={`rounded-lg p-3.5 text-center border ${winner ? "border-[var(--pf-success)] bg-[rgba(61,214,140,0.05)]" : "border-[var(--pf-border)] bg-white/[0.03]"}`}
    >
      <div className="text-[10px] uppercase tracking-wider text-[var(--pf-text-dim)] mb-1.5">{label}</div>
      <div className="text-[32px] font-black tabular-nums" style={{ color }}>{score}</div>
      <div className="text-[11px] text-[var(--pf-text-dim)] mt-1 truncate">{name}</div>
      {winner && (
        <div className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 bg-[var(--pf-success-dim)] text-[var(--pf-success)] rounded-full text-[11px] font-bold">
          <Trophy className="w-3 h-3" /> Winner
        </div>
      )}
    </div>
  );
}

export function ModalShell({ open, onClose, title, icon: Icon, children }: { open: boolean; onClose: () => void; title: string; icon: any; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center bg-black/75 backdrop-blur-md transition-opacity duration-200"
      style={{ opacity: open ? 1 : 0, pointerEvents: open ? "all" : "none" }}
    >
      <div className="bg-[var(--pf-panel)] border border-[var(--pf-border)] rounded-xl p-6 max-w-[520px] w-[90%] max-h-[80vh] overflow-y-auto pf-scroll shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-extrabold text-[var(--pf-text-bright)] flex items-center gap-2">
            <Icon className="w-4 h-4 text-[var(--pf-accent)]" />
            {title}
          </h2>
          <button onClick={onClose} className="text-[var(--pf-text-dim)] hover:text-[var(--pf-text)] p-1"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
