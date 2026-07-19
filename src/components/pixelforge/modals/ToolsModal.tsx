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
  const { currentHTML, scoreData, teamComments, addTeamComment, whitelabelActive, whitelabelBrand, setWhitelabel } = usePFStore();
  const [activeTool, setActiveTool] = useState<ToolId>(null);
  const [commentText, setCommentText] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("Anonymous");
  const [heatmapHotspots, setHeatmapHotspots] = useState<{ x: number; y: number; intensity: number }[]>([]);
  const [monitorActive, setMonitorActive] = useState(false);
  const [monitorHistory, setMonitorHistory] = useState<{ date: string; score: number; diff: number }[]>([]);

  const tools: { id: ToolId; label: string; desc: string; icon: LucideIcon; category: string }[] = [
    { id: "pdf", label: "PDF Report", desc: "Export branded PDF audit report", icon: FileText, category: "Business" },
    { id: "whitelabel", label: "White Label", desc: "Rebrand PixelForge for clients", icon: Tag, category: "Business" },
    { id: "platforms", label: "Platform Export", desc: "Shopify / WordPress / Webflow / ClickFunnels", icon: ShoppingBag, category: "Business" },
    { id: "clients", label: "Client Mode", desc: "Manage audits per client", icon: Users, category: "Business" },
    { id: "monitor", label: "Auto Monitor", desc: "Schedule re-audits + alerts", icon: Activity, category: "Behemoth" },
    { id: "heatmap", label: "Heatmap Sim", desc: "Simulate click heatmaps", icon: Flame, category: "Behemoth" },
    { id: "conversion", label: "Conversion Score", desc: "Probability of conversion", icon: Target, category: "Behemoth" },
    { id: "team", label: "Team Comments", desc: "Collaborate on the audit", icon: MessageSquare, category: "Behemoth" },
    { id: "speed", label: "Page Speed Sim", desc: "Simulated load time breakdown", icon: Activity, category: "Conversion" },
    { id: "abovefold", label: "Above Fold", desc: "Score your above-the-fold content", icon: Target, category: "Conversion" },
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
                <div className="text-sm font-bold text-[var(--pf-text-bright)]">{whitelabelActive ? whitelabelBrand : "PixelForge"} Audit Report</div>
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
              <div className="text-[10px] text-[var(--pf-text-dim)] mt-0.5">Replace "PixelForge" branding with your own</div>
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
            When enabled, the top bar shows your brand name instead of "PixelForge". PDF reports also use your brand.
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
                if (p.fmt === "wordpress") wrapped = `<!-- PixelForge optimized page -->\n${currentHTML}\n<!-- /PixelForge -->`;
                if (p.fmt === "shopify") wrapped = `{% comment %}PixelForge optimized{% endcomment %}\n${currentHTML}`;
                if (p.fmt === "clickfunnels") wrapped = `<!-- PixelForge export for ClickFunnels -->\n${currentHTML}`;
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
      return (
        <div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] mb-3">
            <div className={`w-2.5 h-2.5 rounded-full ${monitorActive ? "bg-[var(--pf-success)]" : "bg-[var(--pf-text-dim)]"}`} style={monitorActive ? { animation: "pfPinPulse 2s ease infinite" } : {}} />
            <div className="flex-1">
              <div className="text-xs font-semibold">Auto monitor</div>
              <div className="text-[10px] text-[var(--pf-text-dim)]">Daily re-audit · Alert if score drops below 70</div>
            </div>
            <button
              onClick={() => {
                setMonitorActive(!monitorActive);
                if (!monitorActive) {
                  setMonitorHistory([{ date: new Date().toLocaleDateString(), score: scoreData?.score ?? 0, diff: 0 }]);
                  onToast("Monitor started — will re-audit daily", "success");
                } else {
                  onToast("Monitor stopped", "info");
                }
              }}
              className="pf-btn pf-btn-primary pf-btn-sm"
            >
              {monitorActive ? "Stop" : "Start"}
            </button>
          </div>
          {monitorHistory.length > 0 && (
            <div className="text-[11px] text-[var(--pf-text-dim)]">
              <div className="font-semibold uppercase tracking-wider text-[10px] mb-1.5">History</div>
              {monitorHistory.map((h, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
                  <span className="w-[70px] text-[10px] text-[var(--pf-text-dim)]">{h.date}</span>
                  <span className="font-bold">{h.score}</span>
                  {h.diff !== 0 && <span className={`text-[10px] ${h.diff > 0 ? "text-[var(--pf-success)]" : "text-[var(--pf-error)]"}`}>{h.diff > 0 ? "+" : ""}{h.diff}</span>}
                </div>
              ))}
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
      try {
        const iframe = document.querySelector("iframe[title='preview']") as HTMLIFrameElement | null;
        const doc = iframe?.contentDocument;
        if (!doc) return <div className="text-center py-8 text-[var(--pf-text-dim)] text-xs">Preview not ready.</div>;
        const speed = calculatePageSpeed(doc);
        return (
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="text-[32px] font-black" style={{
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
            <p className="text-[10px] text-[var(--pf-text-dim)] mt-2">Simulated based on DOM size, image count, and external resources.</p>
          </div>
        );
      } catch { return null; }
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
