"use client";

import { usePFStore } from "@/lib/pixelforge/store/pf-store";
import { CATEGORY_META, CATEGORIES } from "@/lib/pixelforge/types";
import type { Category, Issue } from "@/lib/pixelforge/types";
import { applyQuickFix, applyAllSafeFixes, type QuickFixContext } from "@/lib/pixelforge/fixes/quick-fixes";
import { runScoring } from "@/lib/pixelforge/scoring/engine";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle, AlertTriangle, CheckCircle2, ChevronDown, Zap,
  Sparkles, Wand2, ListChecks, Info,
} from "lucide-react";

interface ScorePanelProps {
  onToast: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
  onImprovement: (diff: number) => void;
  onConfetti: () => void;
}

interface SeverityFilter {
  errors: Issue[];
  warnings: Issue[];
  info: Issue[];
}

export function ScorePanel({ onToast, onImprovement, onConfetti }: ScorePanelProps) {
  const { scoreData, initialScore, currentHTML, setHTML, pushHistory, addChange, setSelectedSelector, startGuide } = usePFStore();
  const issues = scoreData?.issues ?? [];
  const top3 = useMemo(
    () => [...issues].filter((i) => i.pts < i.max).sort((a, b) => b.priority - a.priority).slice(0, 3),
    [issues]
  );
  const [openIssueId, setOpenIssueId] = useState<string | null>(null);
  const [whyOpen, setWhyOpen] = useState<Record<string, boolean>>({});
  const [severityFilter, setSeverityFilter] = useState<"all" | "error" | "warning" | "info">("all");

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  useEffect(() => {
    iframeRef.current = document.querySelector("iframe[title='preview']") as HTMLIFrameElement;
  }, []);

  if (!scoreData || !currentHTML) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-5 text-center text-[var(--pf-text-dim)] gap-3" style={{ animation: "pfFadeInUp 0.4s ease both" }}>
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--pf-panel-hover)]">
          <Sparkles className="w-7 h-7 opacity-40" />
        </div>
        <h3 className="text-[15px] font-bold text-[var(--pf-text-bright)]">Score your page</h3>
        <p className="text-[12.5px] leading-relaxed max-w-[260px]">
          Import an HTML file or paste a URL above. You'll get a 0–100 score across SEO, accessibility, content, structure, and performance — plus one-click fixes.
        </p>
      </div>
    );
  }

  const buildContext = (opts?: { skipHistory?: boolean }): QuickFixContext => ({
    doc: iframeRef.current!.contentDocument!,
    pushHistory,
    syncHTML: () => {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;
      setHTML("<!DOCTYPE html>\n" + doc.documentElement.outerHTML, opts?.skipHistory ? { skipHistory: true } : undefined);
    },
    toast: onToast,
  });

  /** Re-score the iframe doc synchronously and return the new total score. */
  const computeCurrentScore = (): number => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return scoreData?.score ?? 0;
    try {
      return runScoring({ doc }).score;
    } catch {
      return scoreData?.score ?? 0;
    }
  };

  const handleFix = (issue: Issue) => {
    if (!issue.quickFix) {
      onToast("This one needs a manual fix — open the issue to see how.", "warning");
      return;
    }
    const prev = scoreData.score;
    const ctx = buildContext();
    const result = applyQuickFix(issue.quickFix, ctx);
    if (result.applied && result.change) {
      addChange(result.change);
      const newScore = computeCurrentScore();
      const diff = newScore - prev;
      if (diff > 0) {
        onImprovement(diff);
        if (diff >= 5) onConfetti();
      }
      onToast(`Fixed: ${result.change.title}${diff > 0 ? ` · +${diff} pts` : ""}`, "success");
    } else {
      onToast("Already fixed or no element matched — try another issue.", "info");
    }
  };

  const handleFixAll = () => {
    const prev = scoreData.score;
    pushHistory();
    const ctx = buildContext({ skipHistory: true });
    const { count, changes } = applyAllSafeFixes(ctx);
    changes.forEach((c) => addChange(c));
    const newScore = computeCurrentScore();
    const diff = newScore - prev;
    if (diff > 0) {
      onImprovement(diff);
      onConfetti();
    }
    onToast(
      count === 0
        ? "Nothing to fix — your page is already in good shape."
        : `Applied ${count} ${count === 1 ? "fix" : "fixes"}${diff > 0 ? ` · +${diff} pts` : ""}`,
      "success"
    );
  };

  const score = scoreData.score;
  const badgeClass = score >= 80 ? "green" : score >= 50 ? "yellow" : "red";
  const badgeText = score >= 80 ? "Good" : score >= 50 ? "Needs Work" : "Poor";
  const color = score >= 80 ? "var(--pf-success)" : score >= 50 ? "var(--pf-warning)" : "var(--pf-error)";
  const circumference = 2 * Math.PI * 60;
  const offset = circumference - (score / 100) * circumference;
  const mobileGap = scoreData.desktopScore - scoreData.mobileScore;

  // Group issues by severity for filtering
  const grouped: SeverityFilter = {
    errors: issues.filter((i) => i.severity === "error"),
    warnings: issues.filter((i) => i.severity === "warning"),
    info: issues.filter((i) => i.severity !== "error" && i.severity !== "warning"),
  };
  const filteredIssues = severityFilter === "all" ? issues : grouped[severityFilter];

  return (
    <div className="flex flex-col" style={{ animation: "pfFadeInUp 0.3s ease both" }}>
      {/* Score gauge */}
      <div className="px-4 pt-4 pb-3 text-center">
        <div className="relative w-[150px] h-[150px] mx-auto mb-3">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="60" fill="none" stroke="var(--pf-border)" strokeWidth="8" />
            <circle
              cx="70" cy="70" r="60" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.34,1.56,0.64,1), stroke 0.5s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-[42px] font-black leading-none" style={{ color, transition: "color 0.5s ease" }}>{score}</div>
            <div className="text-[10px] text-[var(--pf-text-dim)] uppercase tracking-[1.2px] mt-0.5 font-semibold">/ 100</div>
          </div>
        </div>
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-1.5 ${
          badgeClass === "green" ? "bg-[var(--pf-success-dim)] text-[var(--pf-success)]" :
          badgeClass === "yellow" ? "bg-[var(--pf-warning-dim)] text-[var(--pf-warning)]" :
          "bg-[var(--pf-error-dim)] text-[var(--pf-error)]"
        }`}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: color }} />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: color }} />
          </span>
          {badgeText}
        </div>
        {initialScore !== null && initialScore !== score && (
          <div className="text-[11px] text-[var(--pf-text-dim)]">
            Started at <span className="text-[var(--pf-text-bright)] font-semibold">{initialScore}</span>
            {" → "}
            <span className="text-[var(--pf-success)] font-semibold">{score}</span>
            <span className="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[var(--pf-success-dim)] text-[var(--pf-success)] text-[10px] font-bold">+{score - initialScore}</span>
          </div>
        )}
      </div>

      {/* Desktop / Mobile scores */}
      <div className={`flex items-center justify-center gap-2 px-4 py-3 border-y border-[var(--pf-border)] ${mobileGap > 15 ? "bg-[rgba(240,180,41,0.05)]" : "bg-white/[0.02]"}`}>
        <DeviceScore label="Desktop" score={scoreData.desktopScore} />
        <span className="text-[var(--pf-text-dim)] opacity-50">/</span>
        <DeviceScore label="Mobile" score={scoreData.mobileScore} />
        {mobileGap > 15 && (
          <div className="ml-2 px-2.5 py-1 rounded bg-[rgba(240,180,41,0.1)] border border-[rgba(240,180,41,0.25)]">
            <div className="text-[11px] font-bold text-[var(--pf-warning)]">{mobileGap}pt gap</div>
            <div className="text-[9px] text-[var(--pf-text-dim)]">Mobile penalty</div>
          </div>
        )}
      </div>

      {/* Category breakdown */}
      <div className="px-4 py-2.5 border-b border-[var(--pf-border)]">
        {CATEGORIES.map((cat: Category) => {
          const meta = CATEGORY_META[cat];
          const data = scoreData.cats[cat];
          const pct = data.total > 0 ? (data.earned / data.total) * 100 : 0;
          return (
            <div key={cat} className="flex items-center gap-1.5 mb-1.5 last:mb-0">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--pf-text-dim)] w-[72px] shrink-0">{meta.label}</span>
              <div className="flex-1 h-[5px] bg-[var(--pf-border)] rounded overflow-hidden">
                <div className="h-full rounded transition-all duration-700 ease-out" style={{ width: `${pct}%`, background: meta.gradient }} />
              </div>
              <span className="text-[11px] font-bold w-9 text-right tabular-nums">{data.earned}/{data.total}</span>
            </div>
          );
        })}
      </div>

      {/* Action buttons — sticky at top so always visible during scroll */}
      <div className="sticky top-0 z-10 bg-[var(--pf-panel)] px-3 py-2.5 border-b border-[var(--pf-border)] flex gap-1.5">
        <button onClick={handleFixAll} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded text-[13px] font-bold transition-all bg-gradient-to-br from-[rgba(61,214,140,0.15)] to-[rgba(52,211,153,0.15)] border border-[rgba(61,214,140,0.3)] text-[var(--pf-success)] hover:shadow-[0_0_20px_rgba(61,214,140,0.3)] hover:border-[rgba(61,214,140,0.5)]">
          <Wand2 className="w-4 h-4" /> Fix All Safe
        </button>
        <button onClick={startGuide} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded text-[13px] font-bold transition-all bg-gradient-to-br from-[rgba(92,141,239,0.15)] to-[rgba(167,139,250,0.15)] border border-[rgba(92,141,239,0.3)] text-[var(--pf-accent)] hover:shadow-[0_0_20px_var(--pf-accent-glow)] hover:border-[rgba(92,141,239,0.5)]">
          <ListChecks className="w-4 h-4" /> Guide Me
        </button>
      </div>

      {/* Top 3 fixes */}
      {top3.length > 0 && (
        <div className="px-3 py-2.5 border-b border-[var(--pf-border)]">
          <div className="flex items-center gap-1.5 mb-2">
            <Zap className="w-3.5 h-3.5 text-[var(--pf-accent)]" />
            <h3 className="text-[11px] font-bold text-[var(--pf-text-bright)] uppercase tracking-wider">Top 3 Fixes</h3>
            <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--pf-accent)] text-white font-bold">PRIORITY</span>
          </div>
          {top3.map((issue, i) => {
            const severityClass = issue.severity === "error" ? "critical" : issue.severity === "warning" ? "important" : "minor";
            return (
              <button
                key={issue.id}
                onClick={() => {
                  if (issue.selector) setSelectedSelector(issue.selector);
                  handleFix(issue);
                }}
                className="w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded mb-1.5 last:mb-0 transition-all border border-[rgba(92,141,239,0.2)] bg-[rgba(92,141,239,0.04)] hover:bg-[rgba(92,141,239,0.1)] hover:border-[rgba(92,141,239,0.35)] hover:translate-x-0.5"
              >
                <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 mt-0.5 ${
                  severityClass === "critical" ? "bg-[var(--pf-error-dim)] text-[var(--pf-error)]" :
                  severityClass === "important" ? "bg-[var(--pf-warning-dim)] text-[var(--pf-warning)]" :
                  "bg-[var(--pf-success-dim)] text-[var(--pf-success)]"
                }`}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-semibold text-[var(--pf-text)]">{issue.title}</div>
                  <div className="text-[11px] text-[var(--pf-text-dim)] leading-relaxed mt-0.5">{issue.desc}</div>
                  <div className={`inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    issue.quickFix ? "bg-[var(--pf-success-dim)] text-[var(--pf-success)]" : "bg-[var(--pf-warning-dim)] text-[var(--pf-warning)]"
                  }`}>
                    {issue.quickFix ? <><Sparkles className="w-2.5 h-2.5" /> One-click fix</> : "Manual fix"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Issues list — with severity filter chips */}
      <div className="px-3 py-2.5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[11px] font-bold text-[var(--pf-text-dim)] uppercase tracking-wider">All Issues</h3>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
            scoreData.issues.length === 0 ? "bg-[var(--pf-success-dim)] text-[var(--pf-success)]" : "bg-[var(--pf-error-dim)] text-[var(--pf-error)]"
          }`}>
            {scoreData.issues.length} found
          </span>
        </div>
        {/* Severity filter */}
        {issues.length > 0 && (
          <div className="flex items-center gap-0.5 mb-2 bg-white/[0.03] p-0.5 rounded-md">
            {([
              { id: "all", label: "All", count: issues.length },
              { id: "error", label: "Errors", count: grouped.errors.length },
              { id: "warning", label: "Warnings", count: grouped.warnings.length },
              { id: "info", label: "Info", count: grouped.info.length },
            ] as const).map((f) => (
              <button
                key={f.id}
                onClick={() => setSeverityFilter(f.id as any)}
                className={`flex-1 px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                  severityFilter === f.id
                    ? "bg-[var(--pf-accent)] text-white"
                    : "text-[var(--pf-text-dim)] hover:text-[var(--pf-text)] hover:bg-white/5"
                }`}
              >
                {f.label} <span className="opacity-70">{f.count}</span>
              </button>
            ))}
          </div>
        )}
        <div className="space-y-1">
          {scoreData.issues.length === 0 && (
            <div className="text-center py-8 text-[var(--pf-text-dim)]" style={{ animation: "pfFadeInUp 0.3s ease both" }}>
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-[var(--pf-success)]" />
              <p className="text-xs font-medium">All clear! No issues detected.</p>
            </div>
          )}
          {filteredIssues.map((issue) => (
            <IssueItem
              key={issue.id}
              issue={issue}
              isOpen={openIssueId === issue.id}
              whyOpen={!!whyOpen[issue.id]}
              onToggle={() => setOpenIssueId(openIssueId === issue.id ? null : issue.id)}
              onToggleWhy={() => setWhyOpen((s) => ({ ...s, [issue.id]: !s[issue.id] }))}
              onFix={() => handleFix(issue)}
              onSelect={() => issue.selector && setSelectedSelector(issue.selector)}
            />
          ))}
          {filteredIssues.length === 0 && issues.length > 0 && (
            <div className="py-4 text-center text-[10px] text-[var(--pf-text-dim)]">No {severityFilter} issues at this level.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function DeviceScore({ label, score }: { label: string; score: number }) {
  const color = score >= 80 ? "var(--pf-success)" : score >= 50 ? "var(--pf-warning)" : "var(--pf-error)";
  return (
    <div className="flex flex-col items-center px-3 py-1.5 rounded-lg bg-white/[0.03]">
      <span className="text-[9px] font-semibold text-[var(--pf-text-dim)] uppercase tracking-wider">{label}</span>
      <span className="text-[22px] font-black leading-tight tabular-nums" style={{ color, transition: "color 0.5s ease" }}>{score}</span>
    </div>
  );
}

function IssueItem({
  issue, isOpen, whyOpen, onToggle, onToggleWhy, onFix, onSelect,
}: {
  issue: Issue;
  isOpen: boolean;
  whyOpen: boolean;
  onToggle: () => void;
  onToggleWhy: () => void;
  onFix: () => void;
  onSelect: () => void;
}) {
  const Icon = issue.severity === "error" ? AlertCircle : issue.severity === "warning" ? AlertTriangle : CheckCircle2;
  const iconColor = issue.severity === "error" ? "var(--pf-error)" : issue.severity === "warning" ? "var(--pf-warning)" : "var(--pf-success)";
  const catBadgeColor = issue.cat === "seo" ? "#818cf8" : issue.cat === "content" ? "#34d399" : issue.cat === "a11y" ? "#fbbf24" : issue.cat === "structure" ? "#a78bfa" : "#f472b6";
  return (
    <div
      className={`rounded mb-1 transition-all border border-transparent ${isOpen ? "bg-[var(--pf-panel-hover)] border-[var(--pf-border)]" : "hover:bg-[var(--pf-panel-hover)] hover:border-[var(--pf-border)]"}`}
    >
      <button
        onClick={onToggle}
        className="w-full text-left flex items-start gap-2 p-2.5"
      >
        <Icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: iconColor }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className="text-[8.5px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0"
              style={{ background: `${catBadgeColor}26`, color: catBadgeColor }}
            >
              {issue.cat}
            </span>
            <span className="text-[12.5px] font-semibold text-[var(--pf-text)] flex-1 truncate">{issue.title}</span>
          </div>
          {isOpen && <div className="text-[11.5px] text-[var(--pf-text-dim)] leading-relaxed mt-1">{issue.desc}</div>}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-[var(--pf-text-dim)] shrink-0 mt-1 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && (
        <div className="px-2.5 pb-2.5 pl-9">
          <div className="text-[11.5px] text-[var(--pf-accent)] mt-1 mb-2">
            <strong className="text-[var(--pf-text)]">Fix:</strong> {issue.fix}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {issue.quickFix && (
              <button
                onClick={onFix}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[rgba(92,141,239,0.12)] text-[var(--pf-accent)] rounded text-[11px] font-semibold hover:bg-[rgba(92,141,239,0.22)] transition-colors"
              >
                <Sparkles className="w-3 h-3" /> Apply Fix
              </button>
            )}
            {issue.selector && (
              <button
                onClick={onSelect}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/[0.06] text-[var(--pf-text-dim)] rounded text-[11px] font-semibold hover:bg-white/10 transition-colors"
              >
                <Info className="w-3 h-3" /> Locate
              </button>
            )}
            <button
              onClick={onToggleWhy}
              className="text-[10px] text-[var(--pf-accent)] font-semibold hover:underline ml-auto"
            >
              {whyOpen ? "Hide why" : "Why this matters"}
            </button>
          </div>
          {whyOpen && (
            <div className="mt-2 p-2.5 bg-[rgba(92,141,239,0.06)] border border-[rgba(92,141,239,0.12)] rounded text-[11px] leading-relaxed text-[var(--pf-text)]" style={{ animation: "pfFadeInUp 0.2s ease both" }}>
              <span className="text-[var(--pf-text-dim)]">Impact:</span>{" "}
              <span className="text-[var(--pf-success)] font-semibold">+{issue.max - issue.pts} pts</span>
              {" "}
              <span className="text-[var(--pf-text-dim)]">if fixed.</span>
              {" "}
              <span className="text-[var(--pf-text-dim)]">This affects {issue.impact >= 3 ? "critical" : issue.impact >= 2 ? "important" : "minor"} user outcomes and is {issue.ease >= 3 ? "easy" : issue.ease >= 2 ? "moderate" : "hard"} to fix.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
