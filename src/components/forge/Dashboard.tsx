"use client";

import { useForge } from "@/lib/forge/store";
import { useBuilder, peekBuilderAutosave, clearBuilderAutosave } from "@/lib/builder/store/builder-store";
import { TEMPLATES, buildSiteFromTemplate } from "@/lib/builder/templates/templates";
import { usePFStore } from "@/lib/pixelforge/store/pf-store";
import { loadAuditHistory, clearAuditHistory, type AuditHistoryEntry } from "@/lib/pixelforge/audit-history";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Plus, ShieldCheck, Sparkles, Layout, ArrowRight, Wand2, Megaphone,
  CheckCircle2, Zap, Eye, MousePointerClick, Layers, History, X, TrendingUp, Trash2, ExternalLink, Hammer,
  type LucideIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Command, Moon, Sun } from "lucide-react";

interface AutosaveInfo {
  timestamp: number;
  siteName: string;
  pageCount: number;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function ForgeDashboard() {
  const { setView, transferToAuditor } = useForge();
  const { loadSite, newBlankSite, exportHTML, site: builderSite } = useBuilder();
  const { setHTML: setAuditorHTML, projectName: auditorProjectName } = usePFStore();
  const { resolvedTheme, setTheme } = useTheme();
  const [hoveredTool, setHoveredTool] = useState<"builder" | "auditor" | "sites" | null>(null);
  const [autosave, setAutosave] = useState<AutosaveInfo | null>(null);
  const [auditHistory, setAuditHistory] = useState<AuditHistoryEntry[]>([]);

  // next-themes hydration guard — theme is only known client-side. Deferred
  // via rAF so the setState lands in a callback (not synchronously in the
  // effect body, which triggers cascading renders).
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Check for an autosaved project on mount (and when the dashboard re-gains focus)
  useEffect(() => {
    const check = () => setAutosave(peekBuilderAutosave());
    const checkHistory = () => setAuditHistory(loadAuditHistory());
    check();
    checkHistory();
    // Re-check when window regains focus (e.g., user came back from another tab)
    window.addEventListener("focus", check);
    window.addEventListener("focus", checkHistory);
    return () => {
      window.removeEventListener("focus", check);
      window.removeEventListener("focus", checkHistory);
    };
  }, []);

  const dismissAutosave = () => {
    clearBuilderAutosave();
    setAutosave(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0b1020] dark:text-slate-100 relative overflow-hidden transition-colors">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full bg-gradient-to-br from-violet-200/60 via-fuchsia-100/40 to-transparent blur-3xl dark:from-violet-900/30 dark:via-fuchsia-900/20 dark:to-transparent" />
        <div className="absolute -top-40 right-0 h-[420px] w-[420px] rounded-full bg-gradient-to-bl from-cyan-200/60 via-blue-100/40 to-transparent blur-3xl dark:from-cyan-900/25 dark:via-blue-900/15 dark:to-transparent" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[300px] w-[700px] rounded-full bg-gradient-to-r from-amber-100/40 via-rose-100/40 to-violet-100/40 blur-3xl dark:from-amber-900/15 dark:via-rose-900/15 dark:to-violet-900/15" />
      </div>

      <div className="relative">
        {/* Top bar */}
        <header className="border-b border-slate-200/70 bg-white/70 dark:border-slate-800/70 dark:bg-slate-900/70 backdrop-blur-xl sticky top-0 z-30">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-md shadow-violet-500/20">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[15px] font-bold tracking-tight leading-tight">Forge Studio</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-px">Build · Audit · Ship</div>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-1 text-sm">
              <a href="#tools" className="px-3 py-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors">Tools</a>
              <a href="#templates" className="px-3 py-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors">Templates</a>
              <a href="#workflow" className="px-3 py-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors">Workflow</a>
            </nav>
            <div className="flex items-center gap-2">
              {/* Command palette hint — discoverable Ctrl/Cmd+K entry point */}
              <button
                onClick={() => { window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, metaKey: true })); }}
                className="hidden sm:flex items-center gap-2 h-8 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-xs text-slate-400 dark:text-slate-500 hover:border-violet-300 dark:hover:border-violet-600 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                title="Open command palette (Ctrl/Cmd+K)"
              >
                <Command className="h-3 w-3" />
                <span className="font-medium">K</span>
              </button>
              {/* Theme toggle (Tier 4) */}
              {mounted && (
                <button
                  onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                  className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-300 hover:border-violet-300 dark:hover:border-violet-600 transition-colors"
                  aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                  title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              )}
              <Button variant="outline" size="sm" onClick={() => setView("builder")} className="gap-1.5 h-8">
                <Layout className="h-3.5 w-3.5" /> Builder
              </Button>
              <Button variant="outline" size="sm" onClick={() => setView("auditor")} className="gap-1.5 h-8">
                <ShieldCheck className="h-3.5 w-3.5" /> Auditor
              </Button>
              <Button variant="outline" size="sm" onClick={() => setView("sites")} className="gap-1.5 h-8">
                <Hammer className="h-3.5 w-3.5" /> Sites
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6 pb-24">
          {/* Autosave recovery banner */}
          {autosave && (
            <div
              className="mt-6 flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50/80 px-4 py-3 backdrop-blur"
              style={{ animation: "pfFadeInUp 0.3s ease both" }}
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-sm">
                <History className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-900">
                  Welcome back — pick up where you left off
                </div>
                <div className="text-xs text-slate-600 truncate">
                  &ldquo;{autosave.siteName}&rdquo; · {autosave.pageCount} page{autosave.pageCount === 1 ? "" : "s"} · saved {timeAgo(autosave.timestamp)}
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setView("builder")}
                className="h-8 gap-1.5 bg-gradient-to-br from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600"
              >
                Resume <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              <button
                onClick={dismissAutosave}
                className="grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-white/60 hover:text-slate-700 transition-colors"
                aria-label="Dismiss saved project"
                title="Discard the saved project"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Hero */}
          <section className="pt-16 pb-12 text-center" style={{ animation: "pfFadeInUp 0.5s ease both" }}>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50/80 dark:border-violet-800 dark:bg-violet-950/50 px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-300 mb-5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-600" />
              </span>
              Free forever · No sign-up required
            </div>
            <h1 className="text-[42px] sm:text-[56px] font-bold tracking-[-0.025em] leading-[1.05]">
              Build pages that
              <br />
              <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-rose-500 bg-clip-text text-transparent">
                actually convert
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              Drag-drop builder. Five-category auditor. One-click fixes.
              Ship a landing page you'd be proud to share — without code, plugins, or a freelancer.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={() => { newBlankSite("Untitled page"); setView("builder"); }}
                className="h-11 gap-2 px-6 bg-gradient-to-br from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 shadow-md shadow-violet-500/25"
              >
                Start building <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setView("auditor")}
                className="h-11 gap-2 px-6 bg-white/70 backdrop-blur"
              >
                <ShieldCheck className="h-4 w-4" /> Audit a page
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setView("sites")}
                className="h-11 gap-2 px-6 bg-white/70 backdrop-blur"
              >
                <Hammer className="h-4 w-4" /> Publish a live site
              </Button>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> No sign-up, no install</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Export clean HTML</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> 38 one-click fixes</span>
            </div>
          </section>

          {/* Two big tool cards */}
          <section id="tools" className="mb-14 grid gap-5 md:grid-cols-2">
            <ToolCard
              icon={Layout}
              title="Page Builder"
              tagline="Drag-drop sections, swap themes, edit copy inline, and export clean HTML in minutes. No code, no plugins, no setup."
              accent="from-violet-500 to-fuchsia-500"
              glow="shadow-violet-500/20"
              features={["20 section types", "Drag & drop reorder", "8 theme presets", "Multi-page sites", "HTML/ZIP export"]}
              onPrimary={() => { newBlankSite("Untitled page"); setView("builder"); }}
              onSecondary={() => setView("templates")}
              primaryLabel="Start blank page"
              secondaryLabel="Browse templates"
              isHovered={hoveredTool === "builder"}
              onHover={(v) => setHoveredTool(v ? "builder" : null)}
            />
            <ToolCard
              icon={ShieldCheck}
              title="Page Auditor"
              tagline="Drop in any URL or HTML file. Get a 0–100 score across SEO, accessibility, content, structure, and performance — then fix issues with one click."
              accent="from-cyan-500 to-blue-600"
              glow="shadow-cyan-500/20"
              features={["5-category scoring", "43 audit checks", "38 quick-fixes", "Fix All Safe button", "Mobile + desktop split"]}
              onPrimary={() => setView("auditor")}
              onSecondary={() => transferToAuditor(exportHTML(), builderSite.name)}
              primaryLabel="Open auditor"
              secondaryLabel="Audit my builder page"
              isHovered={hoveredTool === "auditor"}
              onHover={(v) => setHoveredTool(v ? "auditor" : null)}
            />
            <ToolCard
              icon={Hammer}
              title="Landing Sites"
              tagline="Forge Studio Sites (from landing-forge): build a page from YAML or an AI prompt, publish it live with built-in privacy-friendly analytics, section-level A/B testing, a leads inbox, and deploy simulation."
              accent="from-emerald-500 to-teal-500"
              glow="shadow-emerald-500/20"
              features={["AI prompt → full page", "YAML import/export", "Live analytics + A/B tests", "Published pages with tracking", "Leads inbox + CSV export"]}
              onPrimary={() => setView("sites")}
              onSecondary={() => setView("sites")}
              primaryLabel="Open Sites studio"
              secondaryLabel="View analytics"
              isHovered={hoveredTool === "sites"}
              onHover={(v) => setHoveredTool(v ? "sites" : null)}
              className="md:col-span-2"
            />
          </section>

          {/* Quick stats */}
          <section className="mb-14 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Section types" value="20" sub="Mix and match" icon={Layout} color="text-violet-500" bg="bg-violet-50" />
            <StatCard label="Audit checks" value="43" sub="Across 5 categories" icon={ShieldCheck} color="text-cyan-500" bg="bg-cyan-50" />
            <StatCard label="One-click fixes" value="38" sub="Apply individually or all at once" icon={Wand2} color="text-emerald-500" bg="bg-emerald-50" />
            <StatCard label="Templates" value="5" sub="Fully editable starting points" icon={Megaphone} color="text-amber-500" bg="bg-amber-50" />
          </section>

          {/* Recent audits (Tier 2 — audit history) */}
          {auditHistory.length > 0 && (
            <section className="mb-14" style={{ animation: "pfFadeInUp 0.4s ease both" }}>
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                    <History className="h-5 w-5 text-cyan-500" /> Recent audits
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">Score snapshots saved locally — open the auditor and hit “Save” to record a result.</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { clearAuditHistory(); setAuditHistory([]); }}
                  className="h-8 gap-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear
                </Button>
              </div>
              <div className="max-h-[420px] overflow-y-auto pr-1 [scrollbar-width:thin]">
                <div className="space-y-2.5">
                  {auditHistory.map((a, idx) => (
                    <AuditHistoryRow key={a.id} entry={a} index={idx} onOpen={() => setView("auditor")} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Template quick-start */}
          <section id="templates" className="mb-14">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Start from a template</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Each template is fully editable — swap the copy, colors, and sections to make it yours.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setView("templates")} className="text-violet-600 dark:text-violet-300 hover:text-violet-700 dark:hover:text-violet-200 hover:bg-violet-50 dark:hover:bg-violet-950/50">
                See all <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <button
                type="button"
                onClick={() => { newBlankSite("Untitled page"); setView("builder"); }}
                className="group flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/50 p-6 text-center transition-all hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50/40 dark:hover:bg-violet-950/30 hover:shadow-md"
              >
                <div className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors group-hover:bg-violet-100 dark:group-hover:bg-violet-900/60 group-hover:text-violet-600 dark:group-hover:text-violet-300">
                  <Plus className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold">Blank page</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Start from scratch</div>
              </button>
              {TEMPLATES.slice(0, 5).map((tpl, idx) => (
                <TemplateCard key={tpl.slug} tpl={tpl} index={idx} onClick={() => { loadSite(buildSiteFromTemplate(tpl)); setView("builder"); }} />
              ))}
            </div>
          </section>

          {/* Workflow explainer */}
          <section id="workflow" className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur p-8 shadow-sm">
            <div className="mb-7 text-center">
              <div className="text-xs font-semibold uppercase tracking-[0.15em] text-violet-600 dark:text-violet-300 mb-1.5">Workflow</div>
              <h2 className="text-xl font-semibold tracking-tight">Three steps. One tab. Zero friction.</h2>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Build a page, audit it, apply fixes, and ship — without leaving the studio.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3 relative">
              {/* Connecting line on md+ */}
              <div className="hidden md:block absolute top-7 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-violet-200 via-fuchsia-200 to-cyan-200 dark:from-violet-800 dark:via-fuchsia-800 dark:to-cyan-800" />
              <WorkflowStep num={1} title="Build" desc="Drag sections onto the canvas, edit copy inline, pick a theme, preview at any device width." icon={Layout} accent="from-violet-500 to-fuchsia-500" />
              <WorkflowStep num={2} title="Audit" desc="Hit 'Audit this page' to send your work to the auditor. Get a score in under a second." icon={ShieldCheck} accent="from-cyan-500 to-blue-600" />
              <WorkflowStep num={3} title="Fix & ship" desc="Apply safe fixes with one click, then export the improved HTML. Or send it back to the builder for another round." icon={Sparkles} accent="from-emerald-500 to-teal-600" />
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-16 text-center text-xs text-slate-400">
            <p>Forge Studio — Build. Audit. Ship.</p>
          </footer>
        </main>
      </div>
    </div>
  );
}

function ToolCard({ icon: Icon, title, tagline, accent, glow, features, onPrimary, onSecondary, primaryLabel, secondaryLabel, isHovered, onHover, className }: {
  icon: LucideIcon; title: string; tagline: string; accent: string; glow: string;
  features: string[];
  onPrimary: () => void; onSecondary: () => void; primaryLabel: string; secondaryLabel: string;
  isHovered: boolean; onHover: (v: boolean) => void;
  className?: string;
}) {
  return (
    <Card
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={`group relative overflow-hidden border-slate-200/70 dark:border-slate-800 transition-all duration-300 hover:shadow-xl ${glow} ${isHovered ? "-translate-y-0.5" : ""} ${className ?? ""}`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
      <div className={`absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${accent} opacity-10 transition-opacity duration-300 ${isHovered ? "opacity-20" : ""}`} />
      <div className="relative p-6">
        <div className={`mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-md transition-transform duration-300 ${isHovered ? "scale-110" : ""}`}>
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-bold tracking-tight">{title}</h3>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{tagline}</p>
        <ul className="mt-4 grid grid-cols-2 gap-1.5">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />
              {f}
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={onPrimary} className={`gap-1.5 bg-gradient-to-br ${accent} hover:opacity-90`}>
            {primaryLabel} <ArrowRight className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" onClick={onSecondary}>{secondaryLabel}</Button>
        </div>
      </div>
    </Card>
  );
}

function StatCard({ label, value, sub, icon: Icon, color, bg }: { label: string; value: string; sub: string; icon: LucideIcon; color: string; bg: string }) {
  return (
    <Card className="p-4 border-slate-200/70 dark:border-slate-800 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
          <div className="mt-1 text-2xl font-bold tracking-tight">{value}</div>
          <div className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">{sub}</div>
        </div>
        <div className={`grid h-9 w-9 place-items-center rounded-lg ${bg}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </div>
    </Card>
  );
}

function TemplateCard({ tpl, index, onClick }: { tpl: typeof TEMPLATES[number]; index: number; onClick: () => void }) {
  const hero = tpl.buildPages()[0]?.sections.find((s) => s.kind === "hero");
  const headline = (hero?.config?.headline as string) ?? tpl.name;
  const subhead = (hero?.config?.subhead as string) ?? tpl.description;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group overflow-hidden rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 text-left transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
      style={{ animation: `pfFadeInUp 0.4s ease ${0.05 * index}s both` }}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden" style={{ background: `linear-gradient(135deg, ${tpl.theme.primary}, ${tpl.theme.accent})` }}>
        {/* Mock UI inside thumbnail */}
        <div className="absolute inset-0 flex flex-col p-4 text-white">
          <div className="flex items-center gap-2">
            <div className="grid h-5 w-5 place-items-center rounded bg-white/25 text-[10px] font-bold backdrop-blur">{tpl.name[0]}</div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-90">{tpl.name.split(" ")[0]}</span>
          </div>
          <div className="mt-auto space-y-1.5">
            <div className="text-base font-bold leading-tight line-clamp-2 drop-shadow-sm">{headline}</div>
            <div className="text-[10px] opacity-80 line-clamp-1">{subhead}</div>
            <div className="inline-flex rounded bg-white/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider backdrop-blur">{tpl.category}</div>
          </div>
        </div>
        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-md">
            <Sparkles className="h-3.5 w-3.5 text-violet-600" /> Use template
          </span>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">{tpl.name}</div>
          <div className="flex gap-0.5">
            <span className="h-2.5 w-2.5 rounded-full ring-1 ring-black/5" style={{ background: tpl.theme.primary }} />
            <span className="h-2.5 w-2.5 rounded-full ring-1 ring-black/5" style={{ background: tpl.theme.accent }} />
          </div>
        </div>
        <div className="mt-1 line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400">{tpl.description}</div>
      </div>
    </button>
  );
}

function WorkflowStep({ num, title, desc, icon: Icon, accent }: { num: number; title: string; desc: string; icon: LucideIcon; accent: string }) {
  return (
    <div className="relative text-center">
      <div className={`relative mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-md`}>
        <Icon className="h-5 w-5" />
        <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-white text-[10px] font-bold text-slate-900 shadow ring-1 ring-slate-200">{num}</span>
      </div>
      <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Step {num}</div>
      <h4 className="mt-1 text-base font-semibold">{title}</h4>
      <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}

/** One audit-history row: score pill, name, client/URL, issue summary, trend vs previous snapshot. */
function AuditHistoryRow({ entry, index, onOpen }: { entry: AuditHistoryEntry; index: number; onOpen: () => void }) {
  const score = entry.score;
  const tone = score >= 80 ? "emerald" : score >= 50 ? "amber" : "rose";
  const toneCls = {
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-200",
    amber: "bg-amber-50 text-amber-600 ring-amber-200",
    rose: "bg-rose-50 text-rose-600 ring-rose-200",
  }[tone];

  // Simple trend: compare with the previous entry in the list (older).
  return (
    <Card
      className="group flex items-center gap-4 border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 px-4 py-3 backdrop-blur transition-all hover:shadow-md hover:border-cyan-200 dark:hover:border-cyan-800"
      style={{ animation: `pfFadeInUp 0.35s ease ${Math.min(index * 0.04, 0.4)}s both` }}
    >
      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ring-1 ${toneCls}`}>
        <div className="text-center leading-none">
          <div className="text-[17px] font-black">{score}</div>
          <div className="mt-0.5 text-[8px] font-bold uppercase tracking-wide opacity-70">/100</div>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">{entry.name}</span>
          {entry.clientName && (
            <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-600 ring-1 ring-violet-200">
              {entry.clientName}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          {entry.url && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <ExternalLink className="h-3 w-3 shrink-0" />
              <span className="truncate">{entry.url.replace(/^https?:\/\//, "")}</span>
            </span>
          )}
          <span className="shrink-0">· {timeAgo(entry.createdAt)}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-400 dark:text-slate-500">
          <span>Desktop {entry.desktopScore}</span>
          <span>Mobile {entry.mobileScore}</span>
          {entry.errorCount > 0 && <span className="text-rose-500">{entry.errorCount} error{entry.errorCount === 1 ? "" : "s"}</span>}
          {entry.warningCount > 0 && <span className="text-amber-500">{entry.warningCount} warning{entry.warningCount === 1 ? "" : "s"}</span>}
          {entry.errorCount === 0 && entry.warningCount === 0 && <span className="text-emerald-500">clean pass</span>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="hidden sm:flex items-center gap-1 text-[10px] font-semibold text-slate-400">
          <TrendingUp className="h-3.5 w-3.5" />
          D {entry.desktopScore - entry.mobileScore > 0 ? `+${entry.desktopScore - entry.mobileScore}` : "0"} mobile gap
        </div>
        <Button variant="outline" size="sm" onClick={onOpen} className="h-8 gap-1.5 opacity-80 transition-opacity group-hover:opacity-100">
          <ShieldCheck className="h-3.5 w-3.5 text-cyan-500" /> Open auditor
        </Button>
      </div>
    </Card>
  );
}
