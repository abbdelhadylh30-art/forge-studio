"use client";

import { usePFStore } from "@/lib/pixelforge/store/pf-store";
import { ModalShell } from "./CompetitorModal";
import {
  FileText, Tag, ShoppingBag, Users, Activity, Flame,
  Target, MessageSquare, MoreHorizontal, type LucideIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { runScoring, calculateConversionScore } from "@/lib/pixelforge/scoring/engine";
import { calculatePageSpeed, analyzeAboveFold } from "@/lib/pixelforge/scoring/engine";

interface ToolsModalProps {
  open: boolean;
  onClose: () => void;
  onToast: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
}

type ToolId = "pdf" | "whitelabel" | "platforms" | "clients" | "monitor" | "heatmap" | "conversion" | "team" | "speed" | "abovefold" | null;

export function ToolsModal({ open, onClose, onToast }: ToolsModalProps) {
  const { currentHTML, scoreData, teamComments, addTeamComment, whitelabelActive, whitelabelBrand, setWhitelabel, projectUrl } = usePFStore();
  const [activeTool, setActiveTool] = useState<ToolId>(null);
  const [commentText, setCommentText] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("Anonymous");
  const [heatmapHotspots, setHeatmapHotspots] = useState<{ x: number; y: number; intensity: number }[]>([]);
  const [monitorActive, setMonitorActive] = useState(false);
  const [monitorHistory, setMonitorHistory] = useState<{ date: string; score: number; diff: number }[]>([]);

  // Real PageSpeed Insights (Tier 2): Lighthouse lab data + CrUX field data
  // for imported URLs. Falls back to the DOM-heuristic sim when offline or
  // when auditing a local/edited page with no source URL.
  const [psiLoading, setPsiLoading] = useState(false);
  const [psiError, setPsiError] = useState<string | null>(null);
  const [psiStrategy, setPsiStrategy] = useState<"mobile" | "desktop">("mobile");
  const [psiResult, setPsiResult] = useState<{
    score: number | null;
    metrics: { id: string; label: string; value: string; score: number | null }[];
    opportunities: { id: string; title: string; savingsMs: number }[];
    fieldData: { category: string; fcp: string; lcp: string; cls: string } | null;
  } | null>(null);

  const runPsi = async () => {
    if (!projectUrl) return;
    setPsiLoading(true);
    setPsiError(null);
    setPsiResult(null);
    try {
      const res = await fetch(`/api/pagespeed?url=${encodeURIComponent(projectUrl)}&strategy=${psiStrategy}`);
      const data = await res.json();
      if (!res.ok) {
        setPsiError(data?.error ?? "PageSpeed test failed.");
      } else {
        setPsiResult(data);
      }
    } catch {
      setPsiError("Network error — couldn't reach the PageSpeed service.");
    } finally {
      setPsiLoading(false);
    }
  };

  // Auto Monitor: re-audit the iframe every 10s while monitoring is active.
  // This is a REAL re-audit (calls runScoring on the live iframe document),
  // not a fake timer. Useful for catching score drift while you apply fixes.
  useEffect(() => {
    if (!monitorActive) return;
    const interval = setInterval(() => {
      const iframe = document.querySelector("iframe[title='preview']") as HTMLIFrameElement | null;
      const doc = iframe?.contentDocument;
      if (!doc || !doc.body) return;
      try {
        const sd = runScoring({ doc });
        const prev = monitorHistory[monitorHistory.length - 1];
        const diff = prev ? sd.score - prev.score : 0;
        setMonitorHistory((h) => [...h, { date: new Date().toLocaleTimeString(), score: sd.score, diff }].slice(-30));
        // Alert if score dropped below 70
        if (sd.score < 70 && (prev?.score ?? 100) >= 70) {
          onToast(`Score dropped below 70 → ${sd.score}`, "warning");
        }
      } catch (e) {
        console.warn("Monitor re-audit failed:", e);
      }
    }, 10_000);
    return () => clearInterval(interval);
  }, [monitorActive, monitorHistory, onToast]);

  const tools: { id: ToolId; label: string; desc: string; icon: LucideIcon; category: string; badge?: string }[] = [
    { id: "pdf", label: "PDF Report", desc: "Print-ready audit summary to share with stakeholders", icon: FileText, category: "Business" },
    { id: "whitelabel", label: "White Label", desc: "Rebrand the auditor with your own name and logo", icon: Tag, category: "Business" },
    { id: "platforms", label: "Platform Export", desc: "Wrap HTML for Shopify, WordPress, Webflow, ClickFunnels", icon: ShoppingBag, category: "Business" },
    { id: "clients", label: "Client Mode", desc: "Group audits by client (local save only)", icon: Users, category: "Business" },
    { id: "monitor", label: "Auto Monitor", desc: "Re-audit on a timer and track score over time", icon: Activity, category: "Behemoth", badge: "Beta" },
    { id: "heatmap", label: "Heatmap Sim", desc: "Simulated click hotspots — not real visitor data", icon: Flame, category: "Behemoth", badge: "Sim" },
    { id: "conversion", label: "Conversion Score", desc: "Heuristic estimate of conversion probability", icon: Target, category: "Behemoth", badge: "Estimate" },
    { id: "team", label: "Team Comments", desc: "Leave comments on the audit (local only)", icon: MessageSquare, category: "Behemoth" },
    { id: "speed", label: "Page Speed", desc: "Real Google PageSpeed (Lighthouse + CrUX) with offline sim fallback", icon: Activity, category: "Conversion", badge: "Live" },
    { id: "abovefold", label: "Above Fold", desc: "Score what visitors see before scrolling", icon: Target, category: "Conversion" },
  ];

  const renderTool = () => {
    if (!activeTool) return null;
    if (!currentHTML) {
      return <div className="text-center py-8 text-[var(--pf-text-dim)] text-xs">Import a page first to use this tool.</div>;
    }

    if (activeTool === "pdf") {
      return (
        <div>
          <div className="rounded-lg p-4 mb-3 border border-[var(--pf-border)] bg-white/[0.03]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg,#5c8def,#a78bfa)" }}>
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--pf-text-bright)]">{whitelabelActive ? whitelabelBrand : "Forge Studio"} Audit Report</div>
                <div className="text-[11px] text-[var(--pf-text-dim)]">{new Date().toLocaleDateString()}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 mb-3">
              <div className="w-15 h-15 rounded-full flex items-center justify-center text-[22px] font-black" style={{
                width: 60, height: 60, borderRadius: "50%",
                background: (scoreData?.score ?? 0) >= 80 ? "var(--pf-success)" : (scoreData?.score ?? 0) >= 50 ? "var(--pf-warning)" : "var(--pf-error)",
                color: "#0a0c10",
              }}>{scoreData?.score ?? 0}</div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--pf-text-dim)]">Overall score</div>
                <div className="text-[24px] font-black">{scoreData?.score ?? 0}/100</div>
                <div className="text-[11px] text-[var(--pf-text-dim)]">Desktop {scoreData?.desktopScore} · Mobile {scoreData?.mobileScore}</div>
              </div>
            </div>
            <div className="text-[11px] text-[var(--pf-text-dim)] leading-relaxed">
              {scoreData?.issues.length ?? 0} issues found · {(scoreData?.issues.filter(i => i.quickFix).length ?? 0)} auto-fixable
            </div>
          </div>
          <button
            onClick={() => {
              // Use browser print to PDF (works well in headless + normal)
              onToast("Use your browser's 'Save as PDF' option to export", "info");
              window.print();
            }}
            className="pf-btn pf-btn-primary pf-btn-sm w-full"
          >
            Generate PDF (print dialog)
          </button>
        </div>
      );
    }

    if (activeTool === "whitelabel") {
      return (
        <div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] mb-3 cursor-pointer hover:bg-white/[0.06]" onClick={() => setWhitelabel(!whitelabelActive)}>
            <div>
              <div className="text-xs font-semibold">White label mode</div>
              <div className="text-[10px] text-[var(--pf-text-dim)] mt-0.5">Replace "Forge Studio" branding with your own</div>
            </div>
            <div className={`w-10 h-5.5 rounded-full relative transition-colors ${whitelabelActive ? "bg-[var(--pf-success)]" : "bg-[var(--pf-border)]"}`} style={{ width: 40, height: 22 }}>
              <div className="absolute w-4.5 h-4.5 bg-white rounded-full top-0.5 transition-all" style={{
                width: 18, height: 18,
                left: whitelabelActive ? 20 : 2,
              }} />
            </div>
          </div>
          <label className="pf-edit-label">Brand name</label>
          <input
            value={whitelabelBrand}
            onChange={(e) => setWhitelabel(true, e.target.value)}
            className="pf-edit-input mb-3"
            placeholder="Your Agency"
          />
          <p className="text-[11px] text-[var(--pf-text-dim)] leading-relaxed">
            When enabled, the top bar shows your brand name instead of "Forge Studio". PDF reports also use your brand.
          </p>
        </div>
      );
    }

    if (activeTool === "platforms") {
      const platforms = [
        { name: "Shopify", desc: "Theme file", fmt: "shopify" },
        { name: "WordPress", desc: "Custom HTML block", fmt: "wordpress" },
        { name: "Webflow", desc: "Embed code", fmt: "webflow" },
        { name: "ClickFunnels", desc: "Custom HTML element", fmt: "clickfunnels" },
      ];
      return (
        <div className="grid grid-cols-2 gap-2">
          {platforms.map((p) => (
            <button
              key={p.fmt}
              onClick={() => {
                // Export HTML wrapped for the target platform
                let wrapped = currentHTML;
                if (p.fmt === "wordpress") wrapped = `<!-- Forge Studio optimized page -->\n${currentHTML}\n<!-- /Forge Studio -->`;
                if (p.fmt === "shopify") wrapped = `{% comment %}Forge Studio optimized{% endcomment %}\n${currentHTML}`;
                if (p.fmt === "clickfunnels") wrapped = `<!-- Forge Studio export for ClickFunnels -->\n${currentHTML}`;
                if (p.fmt === "webflow") wrapped = `<!-- Paste into Webflow Embed element -->\n${currentHTML}`;
                const blob = new Blob([wrapped], { type: "text/html" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `pixelforge-${p.fmt}.html`;
                a.click();
                URL.revokeObjectURL(url);
                onToast(`Exported for ${p.name}`, "success");
              }}
              className="flex items-center gap-2 p-3 rounded-lg border border-[var(--pf-border)] bg-white/[0.03] hover:bg-white/[0.08] hover:border-[var(--pf-accent)] transition-all text-left"
            >
              <ShoppingBag className="w-5 h-5 text-[var(--pf-accent)]" />
              <div>
                <div className="text-xs font-semibold">{p.name}</div>
                <div className="text-[10px] text-[var(--pf-text-dim)]">{p.desc}</div>
              </div>
            </button>
          ))}
        </div>
      );
    }

    if (activeTool === "clients") {
      return (
        <div>
          <p className="text-[12px] text-[var(--pf-text-dim)] mb-3 leading-relaxed">Manage multiple audits organized by client. Each client can have multiple audit projects.</p>
          <button
            onClick={() => onToast("Client mode requires DB persistence — coming soon. Use multiple browser tabs for now.", "info")}
            className="w-full p-2.5 rounded border border-dashed border-[var(--pf-accent)] bg-[rgba(92,141,239,0.1)] text-[var(--pf-accent)] text-xs font-semibold hover:bg-[rgba(92,141,239,0.15)]"
          >
            + Add new client
          </button>
          <div className="mt-3 text-center py-4 text-[var(--pf-text-dim)] text-xs">
            No clients saved yet.
          </div>
        </div>
      );
    }

    if (activeTool === "monitor") {
      const intervalSec = 10; // re-audit every 10 seconds (demo-friendly; in production this would be daily)
      const handleToggle = () => {
        if (!monitorActive) {
          // Starting: capture current score as the baseline
          const baseline = scoreData?.score ?? 0;
          setMonitorHistory([{ date: new Date().toLocaleTimeString(), score: baseline, diff: 0 }]);
          setMonitorActive(true);
          onToast(`Monitor started — re-auditing every ${intervalSec}s`, "success");
        } else {
          setMonitorActive(false);
          onToast("Monitor stopped", "info");
        }
      };
      const clearHistory = () => {
        setMonitorHistory([]);
        onToast("History cleared", "info");
      };
      const minScore = Math.min(...monitorHistory.map((h) => h.score), scoreData?.score ?? 0);
      const maxScore = Math.max(...monitorHistory.map((h) => h.score), scoreData?.score ?? 0);
      return (
        <div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] mb-3">
            <div className={`w-2.5 h-2.5 rounded-full ${monitorActive ? "bg-[var(--pf-success)]" : "bg-[var(--pf-text-dim)]"}`} style={monitorActive ? { animation: "pfPinPulse 2s ease infinite" } : {}} />
            <div className="flex-1">
              <div className="text-xs font-semibold">Auto monitor</div>
              <div className="text-[10px] text-[var(--pf-text-dim)]">
                Re-audit every {intervalSec}s · Alert if score drops below 70
              </div>
            </div>
            <button onClick={handleToggle} className="pf-btn pf-btn-primary pf-btn-sm">
              {monitorActive ? "Stop" : "Start"}
            </button>
          </div>
          {monitorHistory.length > 0 ? (
            <div className="text-[11px] text-[var(--pf-text-dim)]">
              <div className="flex items-center justify-between mb-1.5">
                <div className="font-semibold uppercase tracking-wider text-[10px]">History ({monitorHistory.length})</div>
                <button onClick={clearHistory} className="text-[10px] text-[var(--pf-text-dim)] hover:text-[var(--pf-error)] underline">Clear</button>
              </div>
              {/* Sparkline */}
              {monitorHistory.length >= 2 && (
                <div className="mb-3 p-2 rounded bg-white/[0.03]">
                  <svg viewBox="0 0 200 50" className="w-full h-12" preserveAspectRatio="none">
                    <polyline
                      points={monitorHistory.map((h, i) => {
                        const x = (i / (monitorHistory.length - 1)) * 200;
                        const range = maxScore - minScore || 1;
                        const y = 45 - ((h.score - minScore) / range) * 40;
                        return `${x},${y}`;
                      }).join(" ")}
                      fill="none"
                      stroke="var(--pf-accent)"
                      strokeWidth="1.5"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                  <div className="flex justify-between text-[9px] mt-1">
                    <span>Min: <span className="text-[var(--pf-error)] font-bold">{minScore}</span></span>
                    <span>Max: <span className="text-[var(--pf-success)] font-bold">{maxScore}</span></span>
                    <span>Last: <span className="text-[var(--pf-text-bright)] font-bold">{monitorHistory[monitorHistory.length - 1].score}</span></span>
                  </div>
                </div>
              )}
              <div className="max-h-[200px] overflow-y-auto pf-scroll">
                {monitorHistory.slice().reverse().map((h, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
                    <span className="w-[80px] text-[10px] text-[var(--pf-text-dim)] tabular-nums">{h.date}</span>
                    <span className="font-bold tabular-nums">{h.score}</span>
                    {h.diff !== 0 && (
                      <span className={`text-[10px] font-semibold ${h.diff > 0 ? "text-[var(--pf-success)]" : "text-[var(--pf-error)]"}`}>
                        {h.diff > 0 ? "↑" : "↓"} {Math.abs(h.diff)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-[var(--pf-text-dim)] text-xs">
              Click <span className="font-semibold text-[var(--pf-text)]">Start</span> to begin monitoring. The score will be re-checked every {intervalSec} seconds.
            </div>
          )}
        </div>
      );
    }

    if (activeTool === "heatmap") {
      const generate = () => {
        const hotspots = Array.from({ length: 8 }, () => ({
          x: 10 + Math.random() * 80,
          y: 5 + Math.random() * 90,
          intensity: 0.3 + Math.random() * 0.7,
        }));
        setHeatmapHotspots(hotspots);
        onToast("Heatmap generated", "success");
      };
      return (
        <div>
          <p className="text-[12px] text-[var(--pf-text-dim)] mb-3">Simulated click heatmap showing where visitors are likely to focus.</p>
          <div className="relative bg-white/[0.03] rounded-lg overflow-hidden mb-3" style={{ minHeight: 200 }}>
            {heatmapHotspots.map((h, i) => (
              <div
                key={i}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: `${h.x}%`, top: `${h.y}%`,
                  width: 60 + h.intensity * 40, height: 60 + h.intensity * 40,
                  transform: "translate(-50%, -50%)",
                  background: `radial-gradient(circle, rgba(239,92,92,${h.intensity}) 0%, rgba(240,180,41,${h.intensity * 0.6}) 40%, rgba(61,214,140,${h.intensity * 0.3}) 70%, transparent 100%)`,
                }}
              />
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 mb-3 text-[10px] text-[var(--pf-text-dim)]">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[var(--pf-error)]" /> Hot</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[var(--pf-warning)]" /> Warm</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[var(--pf-success)]" /> Cold</span>
          </div>
          <button onClick={generate} className="pf-btn pf-btn-primary pf-btn-sm w-full">Regenerate heatmap</button>
        </div>
      );
    }

    if (activeTool === "conversion" && scoreData) {
      const conv = calculateConversionScore(scoreData);
      return (
        <div>
          <div className="flex items-center gap-4 p-4 rounded-lg mb-3" style={{ background: "linear-gradient(135deg,rgba(92,141,239,0.08),rgba(167,139,250,0.08))" }}>
            <div className="w-[70px] h-[70px] rounded-full flex items-center justify-center text-[24px] font-black relative" style={{
              color: conv.score >= 70 ? "var(--pf-success)" : conv.score >= 40 ? "var(--pf-warning)" : "var(--pf-error)",
            }}>
              {conv.score}
              <div className="absolute inset-[3px] rounded-full border-[3px] border-[var(--pf-border)]" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-wider text-[var(--pf-text-dim)]">Conversion probability</div>
              <div className="text-[28px] font-black">{conv.score}/100</div>
              <div className="text-[11px] text-[var(--pf-text-dim)] mt-1 leading-relaxed">{conv.description}</div>
            </div>
          </div>
          <div className="space-y-1">
            {conv.factors.map((f) => (
              <div key={f.label} className="flex items-center gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
                <div className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]" style={{
                  background: f.score >= 70 ? "var(--pf-success-dim)" : f.score >= 40 ? "var(--pf-warning-dim)" : "var(--pf-error-dim)",
                  color: f.score >= 70 ? "var(--pf-success)" : f.score >= 40 ? "var(--pf-warning)" : "var(--pf-error)",
                }}>{f.score >= 70 ? "✓" : "!"}</div>
                <span className="flex-1 text-xs">{f.label}</span>
                <span className="font-bold text-xs">{f.score}</span>
                <span className="text-[10px] text-[var(--pf-text-dim)] w-8 text-right">{f.weight}%</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeTool === "team") {
      return (
        <div>
          <p className="text-[12px] text-[var(--pf-text-dim)] mb-3">Leave comments for teammates reviewing this audit.</p>
          <div className="flex gap-1.5 mb-2">
            <input
              value={commentAuthor}
              onChange={(e) => setCommentAuthor(e.target.value)}
              placeholder="Your name"
              className="w-[100px] px-2 py-1.5 bg-white/[0.04] border border-[var(--pf-border)] rounded text-xs"
            />
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && commentText.trim()) {
                  addTeamComment(commentAuthor || "Anonymous", commentText.trim());
                  setCommentText("");
                  onToast("Comment added", "success");
                }
              }}
              placeholder="Add a comment..."
              className="flex-1 px-2 py-1.5 bg-white/[0.04] border border-[var(--pf-border)] rounded text-xs"
            />
            <button
              onClick={() => {
                if (!commentText.trim()) return;
                addTeamComment(commentAuthor || "Anonymous", commentText.trim());
                setCommentText("");
                onToast("Comment added", "success");
              }}
              className="pf-btn pf-btn-primary pf-btn-sm"
            >Post</button>
          </div>
          <div className="max-h-[200px] overflow-y-auto pf-scroll">
            {teamComments.length === 0 && <div className="text-center py-6 text-[var(--pf-text-dim)] text-xs">No comments yet.</div>}
            {teamComments.map((c) => (
              <div key={c.id} className="flex gap-2.5 p-2.5 bg-white/[0.03] rounded mb-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ background: "linear-gradient(135deg,#5c8def,#a78bfa)" }}>
                  {c.author[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-[11px] font-semibold">{c.author}</div>
                  <div className="text-[11px] text-[var(--pf-text-dim)] mt-0.5 leading-relaxed">{c.text}</div>
                  <div className="text-[9px] text-[var(--pf-text-dim)] mt-1">{new Date(c.timestamp).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeTool === "speed") {
      const scoreColor = (n: number | null) =>
        n == null ? "var(--pf-text-dim)"
        : n >= 90 ? "var(--pf-success)"
        : n >= 50 ? "var(--pf-warning)"
        : "var(--pf-error)";
      const ring = (n: number) =>
        `conic-gradient(${n >= 90 ? "var(--pf-success)" : n >= 50 ? "var(--pf-warning)" : "var(--pf-error)"} ${n * 3.6}deg, rgba(255,255,255,0.06) 0deg)`;
      return (
        <div>
          {/* ── Real Google PageSpeed Insights ─────────────────────────── */}
          <div className="rounded-lg p-3 mb-3 border border-[var(--pf-border)] bg-white/[0.03]">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--pf-text-dim)]">Real PageSpeed</span>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-[var(--pf-primary-dim,rgba(92,141,239,0.15))] text-[var(--pf-primary,#5c8def)]">Lighthouse + CrUX</span>
              </div>
              <div className="flex rounded overflow-hidden border border-[var(--pf-border)]">
                {(["mobile", "desktop"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => { setPsiStrategy(s); setPsiResult(null); setPsiError(null); }}
                    className={`px-2.5 py-1 text-[9px] font-bold uppercase transition-colors ${psiStrategy === s ? "bg-[var(--pf-primary,#5c8def)] text-white" : "text-[var(--pf-text-dim)] hover:bg-white/[0.04]"}`}
                  >{s}</button>
                ))}
              </div>
            </div>

            {!projectUrl ? (
              <div className="text-center py-4">
                <p className="text-[11px] text-[var(--pf-text-dim)] leading-relaxed">
                  Import a page by URL (top bar) to unlock real Google PageSpeed data —
                  Lighthouse lab metrics plus real-user Chrome UX Report field data.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={runPsi}
                    disabled={psiLoading}
                    className="pf-btn pf-btn-primary pf-btn-sm disabled:opacity-50"
                  >{psiLoading ? "Running Lighthouse…" : `Test ${psiStrategy === "mobile" ? "Mobile" : "Desktop"}`}</button>
                  <span className="text-[9px] text-[var(--pf-text-dim)] truncate flex-1">{projectUrl}</span>
                </div>

                {psiLoading && (
                  <div className="py-4 text-center">
                    <div className="inline-block w-6 h-6 border-2 border-[var(--pf-primary,#5c8def)] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[10px] text-[var(--pf-text-dim)] mt-2">Google is rendering the page — this can take 20–30 seconds.</p>
                  </div>
                )}

                {psiError && (
                  <div className="p-2.5 rounded bg-[var(--pf-error-dim)] border border-[var(--pf-error)]/30 text-[10px] text-[var(--pf-error)] leading-relaxed">{psiError}</div>
                )}

                {psiResult && (
                  <div>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="relative w-16 h-16 rounded-full flex items-center justify-center shrink-0" style={{ background: ring(psiResult.score ?? 0) }}>
                        <div className="absolute inset-[5px] rounded-full bg-[var(--pf-bg,#151923)] flex items-center justify-center">
                          <span className="text-[18px] font-black" style={{ color: scoreColor(psiResult.score) }}>{psiResult.score ?? "—"}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] uppercase tracking-wider text-[var(--pf-text-dim)]">Performance score ({psiStrategy})</div>
                        <div className="text-[11px] text-[var(--pf-text-dim)] leading-relaxed mt-0.5">
                          Lab data from Google&apos;s Lighthouse. {psiResult.fieldData ? `Real users: ${psiResult.fieldData.category} (FCP ${psiResult.fieldData.fcp}, LCP ${psiResult.fieldData.lcp}, CLS ${psiResult.fieldData.cls}).` : "No CrUX field data (site has too little traffic)."}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 mb-2">
                      {psiResult.metrics.map((m) => (
                        <div key={m.id} className="flex items-center gap-1.5 p-1.5 bg-white/[0.02] rounded text-[10px]">
                          <span className="flex-1 text-[var(--pf-text-dim)] truncate">{m.label}</span>
                          <span className="font-bold" style={{ color: scoreColor(m.score == null ? null : Math.round(m.score * 100)) }}>{m.value}</span>
                        </div>
                      ))}
                    </div>

                    {psiResult.opportunities.length > 0 && (
                      <div>
                        <div className="text-[9px] uppercase tracking-wider text-[var(--pf-text-dim)] mb-1.5">Top opportunities</div>
                        <div className="space-y-1">
                          {psiResult.opportunities.map((o) => (
                            <div key={o.id} className="flex items-center gap-2 p-1.5 bg-white/[0.02] rounded text-[10px]">
                              <span className="flex-1 truncate">{o.title}</span>
                              <span className="font-bold text-[var(--pf-success)] shrink-0">−{(o.savingsMs / 1000).toFixed(1)}s</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Offline simulation (kept as fallback) ───────────────────── */}
          <div className="rounded-lg p-3 border border-[var(--pf-border)]">
            <div className="text-[9px] uppercase tracking-wider text-[var(--pf-text-dim)] mb-2">Offline estimate (DOM heuristics)</div>
            {(() => {
              try {
                const iframe = document.querySelector("iframe[title='preview']") as HTMLIFrameElement | null;
                const doc = iframe?.contentDocument;
                if (!doc) return <div className="text-center py-3 text-[var(--pf-text-dim)] text-xs">Preview not ready.</div>;
                const speed = calculatePageSpeed(doc);
                return (
                  <div>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="text-[24px] font-black" style={{
                        color: speed.badge === "fast" ? "var(--pf-success)" : speed.badge === "moderate" ? "var(--pf-warning)" : "var(--pf-error)",
                      }}>{(speed.totalTime / 1000).toFixed(2)}s</div>
                      <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${speed.badge === "fast" ? "bg-[var(--pf-success-dim)] text-[var(--pf-success)]" : speed.badge === "moderate" ? "bg-[var(--pf-warning-dim)] text-[var(--pf-warning)]" : "bg-[var(--pf-error-dim)] text-[var(--pf-error)]"}`}>
                        {speed.badge}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {speed.breakdown.map((b) => (
                        <div key={b.label} className="flex items-center gap-1.5 p-1.5 bg-white/[0.02] rounded text-[10px]">
                          <span className="flex-1 text-[var(--pf-text-dim)]">{b.label}</span>
                          <span className="font-bold" style={{ color: b.rating === "fast" ? "var(--pf-success)" : b.rating === "moderate" ? "var(--pf-warning)" : "var(--pf-error)" }}>{b.value}ms</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-[var(--pf-text-dim)] mt-2">Simulated from the in-editor DOM — instant, works offline, reflects your edits.</p>
                  </div>
                );
              } catch { return null; }
            })()}
          </div>
        </div>
      );
    }

    if (activeTool === "abovefold") {
      try {
        const iframe = document.querySelector("iframe[title='preview']") as HTMLIFrameElement | null;
        const doc = iframe?.contentDocument;
        if (!doc) return null;
        const af = analyzeAboveFold(doc);
        return (
          <div>
            <div className="flex items-center gap-3 mb-3 p-3 rounded-lg" style={{ background: "linear-gradient(135deg,rgba(92,141,239,0.05),rgba(167,139,250,0.05))" }}>
              <div className="text-[28px] font-black" style={{
                color: af.score >= 80 ? "var(--pf-success)" : af.score >= 50 ? "var(--pf-warning)" : "var(--pf-error)",
              }}>{af.score}</div>
              <div className="flex-1">
                <div className="text-[10px] uppercase tracking-wider text-[var(--pf-text-dim)]">Above-the-fold score</div>
                <div className="text-[11px] text-[var(--pf-text-dim)] leading-relaxed mt-0.5">{af.description}</div>
              </div>
            </div>
            {af.issues.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {af.issues.map((iss, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[rgba(239,92,92,0.1)] text-[var(--pf-error)]">{iss}</span>
                ))}
              </div>
            )}
          </div>
        );
      } catch { return null; }
    }

    return null;
  };

  if (!activeTool) {
    return (
      <ModalShell open={open} onClose={onClose} title="Tools" icon={MoreHorizontal}>
        <div className="grid grid-cols-2 gap-2">
          {tools.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTool(t.id)}
                className="flex items-start gap-2 p-3 rounded-lg border border-[var(--pf-border)] bg-white/[0.03] hover:bg-white/[0.08] hover:border-[var(--pf-accent)] transition-all text-left"
              >
                <Icon className="w-4 h-4 text-[var(--pf-accent)] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-xs font-semibold">{t.label}</div>
                  <div className="text-[10px] text-[var(--pf-text-dim)] truncate">{t.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </ModalShell>
    );
  }

  const tool = tools.find((t) => t.id === activeTool)!;
  return (
    <ModalShell open={open} onClose={() => { setActiveTool(null); onClose(); }} title={tool.label} icon={tool.icon}>
      <button onClick={() => setActiveTool(null)} className="text-[10px] text-[var(--pf-text-dim)] hover:text-[var(--pf-text)] mb-3 inline-flex items-center gap-1">← Back to tools</button>
      {renderTool()}
    </ModalShell>
  );
}
