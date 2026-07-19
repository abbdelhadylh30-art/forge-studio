"use client";

import { useState } from "react";
import { useBuilder } from "@/lib/builder/store/builder-store";
import { useForge } from "@/lib/forge/store";
import { TEMPLATES, buildSiteFromTemplate } from "@/lib/builder/templates/templates";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Sparkles, Plus, FileText } from "lucide-react";

const CATEGORIES = ["all", "saas", "portfolio", "agency", "ecommerce", "startup"] as const;

export function TemplatesGallery() {
  const { setView } = useForge();
  const { loadSite, newBlankSite } = useBuilder();
  const [filter, setFilter] = useState<(typeof CATEGORIES)[number]>("all");
  const [query, setQuery] = useState("");
  const filtered = TEMPLATES.filter((t) => {
    if (filter !== "all" && t.category !== filter) return false;
    if (query && !t.name.toLowerCase().includes(query.toLowerCase()) && !t.description.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setView("dashboard")} aria-label="Back to Dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Builder Templates</h1>
              <p className="text-xs text-slate-500">{filtered.length} of {TEMPLATES.length} templates</p>
            </div>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search templates…" className="h-9 pl-8 text-sm" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Filter chips */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition-all ${
                filter === c
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {c}
            </button>
          ))}
          <div className="ml-auto">
            <Button variant="outline" size="sm" onClick={() => { newBlankSite("Untitled page"); setView("builder"); }} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Blank page
            </Button>
          </div>
        </div>

        {/* Templates grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tpl, idx) => {
            const hero = tpl.buildPages()[0]?.sections.find((s) => s.kind === "hero");
            const headline = (hero?.config?.headline as string) ?? tpl.name;
            const subhead = (hero?.config?.subhead as string) ?? tpl.description;
            const pages = tpl.buildPages();
            return (
              <Card
                key={tpl.slug}
                className="group cursor-pointer overflow-hidden border-slate-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                onClick={() => { loadSite(buildSiteFromTemplate(tpl)); setView("builder"); }}
                style={{ animation: `pfFadeInUp 0.4s ease ${0.04 * idx}s both` }}
              >
                <div className="relative aspect-[16/10] overflow-hidden" style={{ background: `linear-gradient(135deg, ${tpl.theme.primary}, ${tpl.theme.accent})` }}>
                  {/* Mock UI */}
                  <div className="absolute inset-0 flex flex-col p-4 text-white">
                    <div className="flex items-center gap-2">
                      <div className="grid h-5 w-5 place-items-center rounded bg-white/25 text-[10px] font-bold backdrop-blur">{tpl.name[0]}</div>
                      <div className="flex gap-1.5">
                        <span className="h-1 w-6 rounded-full bg-white/30" />
                        <span className="h-1 w-4 rounded-full bg-white/20" />
                        <span className="h-1 w-5 rounded-full bg-white/20" />
                      </div>
                      <span className="ml-auto rounded bg-white/20 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider backdrop-blur">{tpl.category}</span>
                    </div>
                    <div className="mt-auto space-y-1.5">
                      <div className="space-y-1">
                        <div className="text-base font-bold leading-tight line-clamp-2 drop-shadow-sm">{headline}</div>
                        <div className="text-[10px] opacity-80 line-clamp-1">{subhead}</div>
                      </div>
                      <div className="inline-flex rounded bg-white/20 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider backdrop-blur">
                        Start free →
                      </div>
                    </div>
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-md">
                      <Sparkles className="h-3.5 w-3.5 text-violet-600" /> Use template
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{tpl.name}</div>
                    <Badge variant="secondary" className="text-[10px] capitalize">{tpl.category}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{tpl.description}</p>
                  <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="uppercase tracking-wider">Theme:</span>
                    <div className="flex gap-0.5">
                      <span className="h-3 w-3 rounded-full ring-1 ring-black/5" style={{ background: tpl.theme.primary }} />
                      <span className="h-3 w-3 rounded-full ring-1 ring-black/5" style={{ background: tpl.theme.accent }} />
                    </div>
                    <span className="mx-1 h-3 w-px bg-slate-200" />
                    <span className="inline-flex items-center gap-1">
                      <FileText className="h-3 w-3" /> {pages.length} page{pages.length > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="grid place-items-center py-24 text-center" style={{ animation: "pfFadeInUp 0.3s ease both" }}>
            <div>
              <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                <Search className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold">No templates match your search</p>
              <p className="mt-1 text-xs text-slate-500">Try a different keyword or category.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => { setQuery(""); setFilter("all"); }}
              >
                Reset filters
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
