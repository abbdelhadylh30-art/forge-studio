"use client";

import { usePFStore } from "@/lib/pixelforge/store/pf-store";
import { SAMPLE_PAGE_HTML, sanitizeImportedHTML } from "@/lib/pixelforge/scoring/sample-page";
import { useState, useRef } from "react";
import {
  LayoutGrid, Undo2, Redo2, Upload, FileText, Download,
  GitCompare, FlaskConical, MoreHorizontal,
  Globe, X, ChevronRight, RefreshCw,
} from "lucide-react";

interface TopBarProps {
  onOpenImport: () => void;
  onOpenCompetitor: () => void;
  onOpenAB: () => void;
  onOpenTools: () => void;
  onOpenExport: () => void;
  onToast: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
}

export function TopBar({ onOpenImport, onOpenCompetitor, onOpenAB, onOpenTools, onOpenExport, onToast }: TopBarProps) {
  const {
    projectName, currentHTML, setHTML, urlMode, setUrlMode, urlBarInput, setUrlBarInput,
    setUrlBarStatus, urlBarStatus, whitelabelActive, whitelabelBrand,
    undo, redo, canUndo, canRedo,
  } = usePFStore();
  const [fetching, setFetching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGo = async () => {
    const url = urlBarInput.trim();
    if (!url) return;
    if (urlMode === "live") {
      try {
        const fullUrl = url.startsWith("http") ? url : `https://${url}`;
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${fullUrl}</title><style>body,html{margin:0;height:100vh}iframe{width:100%;height:100%;border:none}</style></head><body><iframe src="${fullUrl}" sandbox="allow-same-origin allow-scripts allow-popups allow-forms"></iframe></body></html>`;
        setHTML(html, { resetHistory: true });
        setUrlBarStatus(`Live view: ${fullUrl}`, "success");
        onToast("Live view loaded (may be limited by CORS)", "info");
      } catch (e: any) {
        setUrlBarStatus(`Error: ${e.message}`, "error");
      }
      return;
    }
    setFetching(true);
    setUrlBarStatus("Fetching…", "info");
    try {
      const fullUrl = url.startsWith("http") ? url : `https://${url}`;
      const res = await fetch(`/api/fetch-url?url=${encodeURIComponent(fullUrl)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setHTML(data.html, { resetHistory: true });
      setUrlBarStatus(`Loaded ${(data.size / 1024).toFixed(1)} KB`, "success");
      onToast(`Auditing ${data.finalUrl}`, "success");
    } catch (e: any) {
      setUrlBarStatus(e.message || "Couldn't fetch that URL", "error");
      onToast(e.message || "Couldn't fetch that URL. Check the address and try again.", "error");
    } finally {
      setFetching(false);
    }
  };

  const handleDemo = () => {
    setHTML(SAMPLE_PAGE_HTML, { resetHistory: true });
    onToast("Demo page loaded", "success");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const html = sanitizeImportedHTML(String(reader.result));
      setHTML(html, { resetHistory: true });
      onToast(`Imported ${file.name}`, "success");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleExport = () => {
    if (!currentHTML) {
      onToast("Import a page first", "warning");
      return;
    }
    onOpenExport();
  };

  return (
    <header className="flex items-center gap-2 px-3 py-2 bg-[var(--pf-panel)] border-b border-[var(--pf-border)] z-50 shrink-0 overflow-x-auto pf-scroll md:overflow-visible">
      {/* Logo */}
      <div className="flex items-center gap-2 font-extrabold text-[15px] text-[var(--pf-text-bright)] tracking-tight shrink-0">
        <div className="w-[26px] h-[26px] rounded-md flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg,#5c8def,#a78bfa)" }}>
          <LayoutGrid className="w-4 h-4 text-white" />
        </div>
        {whitelabelActive ? whitelabelBrand : "Forge Studio"}
        <span className="text-[10px] text-[var(--pf-text-dim)] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/[0.06]">Auditor</span>
        {projectName && (
          <>
            <span className="text-[var(--pf-text-dim)] font-normal mx-1">/</span>
            <span className="text-[13px] text-[var(--pf-text)] font-medium truncate max-w-[180px]">{projectName}</span>
          </>
        )}
      </div>

      <div className="w-px h-[22px] bg-[var(--pf-border)] mx-1" />

      {/* URL bar */}
      <div className="flex items-center gap-1.5 flex-1 min-w-[120px] max-w-[480px] mx-1 shrink-1">
        <div className="relative flex-1 flex items-center group">
          <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--pf-text-dim)] pointer-events-none group-focus-within:text-[var(--pf-accent)] transition-colors" />
          <input
            type="text"
            value={urlBarInput}
            onChange={(e) => setUrlBarInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGo()}
            placeholder="Enter URL to audit (e.g. stripe.com)…"
            autoComplete="off"
            spellCheck={false}
            className="w-full pl-7 pr-16 py-1.5 bg-white/[0.06] border border-[var(--pf-border)] rounded-md text-[var(--pf-text-bright)] text-xs font-medium placeholder:text-[var(--pf-text-dim)] focus:border-[var(--pf-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--pf-accent-glow)] transition-all"
          />
          {urlBarInput && (
            <button
              onClick={() => { setUrlBarInput(""); setUrlBarStatus("", "info"); }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full bg-white/10 text-[var(--pf-text-dim)] text-[10px] flex items-center justify-center hover:bg-white/20 hover:text-[var(--pf-text)] transition-colors"
              aria-label="Clear URL"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
        {/* Live/Fetch toggle */}
        <div className="flex rounded border border-[var(--pf-border)] overflow-hidden shrink-0">
          <button
            onClick={() => setUrlMode("live")}
            className={`px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-colors ${urlMode === "live" ? "text-[var(--pf-accent)] bg-[rgba(92,141,239,0.12)]" : "text-[var(--pf-text-dim)] hover:text-[var(--pf-text)] hover:bg-white/5"}`}
            title="Live mode — open the URL directly in an iframe (may be CORS-limited)"
          >
            Live
          </button>
          <button
            onClick={() => setUrlMode("fetch")}
            className={`px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-colors ${urlMode === "fetch" ? "text-[var(--pf-accent)] bg-[rgba(92,141,239,0.12)]" : "text-[var(--pf-text-dim)] hover:text-[var(--pf-text)] hover:bg-white/5"}`}
            title="Fetch mode — server-side proxy that strips scripts (safer, full scoring)"
          >
            Fetch
          </button>
        </div>
        <button
          onClick={handleGo}
          disabled={fetching || !urlBarInput.trim()}
          className="flex items-center gap-1 px-3 py-1.5 bg-[var(--pf-accent)] text-white rounded-md text-[11.5px] font-semibold hover:bg-[#6f9cf5] hover:shadow-[0_0_14px_var(--pf-accent-glow)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {fetching ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ChevronRight className="w-3 h-3" />}
          {fetching ? "..." : "Go"}
        </button>
        {urlBarStatus?.msg && (
          <span className={`text-[10px] truncate max-w-[140px] ${
            urlBarStatus.type === "error" ? "text-[var(--pf-error)]" :
            urlBarStatus.type === "success" ? "text-[var(--pf-success)]" :
            urlBarStatus.type === "warning" ? "text-[var(--pf-warning)]" :
            "text-[var(--pf-text-dim)]"
          }`}>
            {urlBarStatus.msg}
          </span>
        )}
      </div>

      <div className="w-px h-[22px] bg-[var(--pf-border)] mx-1" />

      {/* Actions — grouped into logical segments */}
      <div className="flex items-center gap-1 ml-auto shrink-0">
        {/* History segment */}
        <div className="flex items-center gap-0.5 rounded-md bg-white/[0.03] p-0.5">
          <button
            onClick={undo}
            disabled={!canUndo()}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
            className="grid h-6 w-7 place-items-center rounded text-[var(--pf-text-dim)] hover:text-[var(--pf-text)] hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo()}
            title="Redo (Ctrl+Shift+Z)"
            aria-label="Redo"
            className="grid h-6 w-7 place-items-center rounded text-[var(--pf-text-dim)] hover:text-[var(--pf-text)] hover:bg-white/5 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Source segment */}
        <div className="flex items-center gap-0.5 rounded-md bg-white/[0.03] p-0.5">
          <button onClick={onOpenImport} title="Import HTML file" className="flex items-center gap-1 px-1.5 py-1 rounded text-[10px] font-semibold text-[var(--pf-text-dim)] hover:text-[var(--pf-text)] hover:bg-white/5 transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Import</span>
          </button>
          <button onClick={handleDemo} title="Load demo page" className="flex items-center gap-1 px-1.5 py-1 rounded text-[10px] font-semibold text-[var(--pf-text-dim)] hover:text-[var(--pf-text)] hover:bg-white/5 transition-colors">
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Demo</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} title="Upload HTML file directly" className="flex items-center gap-1 px-1.5 py-1 rounded text-[10px] font-semibold text-[var(--pf-text-dim)] hover:text-[var(--pf-text)] hover:bg-white/5 transition-colors" aria-label="Upload HTML file">
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Upload</span>
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept=".html,.htm" onChange={handleFileUpload} className="hidden" />

        {/* Analysis segment */}
        <div className="flex items-center gap-0.5 rounded-md bg-white/[0.03] p-0.5">
          <button onClick={onOpenCompetitor} title="Compare side-by-side with a competitor URL" className="flex items-center gap-1 px-1.5 py-1 rounded text-[10px] font-semibold text-[var(--pf-text-dim)] hover:text-[var(--pf-text)] hover:bg-white/5 transition-colors">
            <GitCompare className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Compare</span>
          </button>
          <button onClick={onOpenAB} title="A/B test two versions" className="flex items-center gap-1 px-1.5 py-1 rounded text-[10px] font-semibold text-[var(--pf-text-dim)] hover:text-[var(--pf-text)] hover:bg-white/5 transition-colors">
            <FlaskConical className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">A/B</span>
          </button>
          <button onClick={onOpenTools} title="More tools (10 tools)" className="flex items-center gap-1 px-1.5 py-1 rounded text-[10px] font-semibold text-[var(--pf-text-dim)] hover:text-[var(--pf-text)] hover:bg-white/5 transition-colors">
            <MoreHorizontal className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Tools</span>
          </button>
        </div>

        {/* Export (primary) */}
        <button onClick={handleExport} className="flex items-center gap-1 px-3 py-1.5 bg-[var(--pf-accent)] text-white rounded-md text-[11.5px] font-semibold hover:bg-[#6f9cf5] hover:shadow-[0_0_14px_var(--pf-accent-glow)] transition-all ml-1">
          <Download className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Download Improved</span>
          <span className="md:hidden">Export</span>
        </button>
      </div>
    </header>
  );
}
