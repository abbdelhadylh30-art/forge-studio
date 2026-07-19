"use client";

import { useState, useRef } from "react";
import { usePFStore } from "@/lib/pixelforge/store/pf-store";
import { sanitizeImportedHTML, SAMPLE_PAGE_HTML } from "@/lib/pixelforge/scoring/sample-page";
import { Upload, FileText, X } from "lucide-react";

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onToast: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
}

export function ImportModal({ open, onClose, onToast }: ImportModalProps) {
  const { setHTML } = usePFStore();
  const [pasted, setPasted] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const html = sanitizeImportedHTML(String(reader.result));
      setHTML(html, { resetHistory: true });
      onToast(`Imported ${file.name}`, "success");
      onClose();
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!pasted.trim()) {
      onToast("Paste HTML or upload a file first", "warning");
      return;
    }
    const html = sanitizeImportedHTML(pasted);
    setHTML(html, { resetHistory: true });
    onToast("HTML imported", "success");
    setPasted("");
    onClose();
  };

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/75 backdrop-blur-md opacity-0 pointer-events-none transition-opacity duration-200"
      style={{ opacity: open ? 1 : 0, pointerEvents: open ? "all" : "none" }}
    >
      <div className="bg-[var(--pf-panel)] border border-[var(--pf-border)] rounded-xl p-7 max-w-[560px] w-[92%] max-h-[80vh] overflow-y-auto pf-scroll shadow-2xl">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[18px] font-extrabold text-[var(--pf-text-bright)] tracking-tight">Import Landing Page</h2>
          <button onClick={onClose} className="text-[var(--pf-text-dim)] hover:text-[var(--pf-text)] p-1"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-[12.5px] text-[var(--pf-text-dim)] mb-4 leading-relaxed">
          Upload an HTML file or paste HTML code below. Use the <strong>URL bar</strong> at the top to fetch a page by URL.
        </p>
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${dragOver ? "border-[var(--pf-accent)] bg-[rgba(92,141,239,0.05)]" : "border-[var(--pf-border)] hover:border-[var(--pf-accent)] hover:bg-[rgba(92,141,239,0.05)]"}`}
        >
          <Upload className="w-7 h-7 mx-auto mb-1 text-[var(--pf-text-dim)]" />
          <p className="text-xs text-[var(--pf-text-dim)]">Drop an HTML file here or click to browse</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".html,.htm"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        <div className="text-center text-[var(--pf-text-dim)] text-[11px] my-2">or paste HTML below</div>
        <textarea
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          placeholder="Paste your HTML here..."
          className="w-full h-[200px] p-2.5 bg-white/[0.03] border border-[var(--pf-border)] rounded-lg text-[var(--pf-text)] font-mono text-[11.5px] resize-y leading-relaxed focus:border-[var(--pf-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--pf-accent-glow)]"
        />
        <div className="flex gap-1.5 justify-end mt-3.5 flex-wrap">
          <button onClick={() => { setHTML(SAMPLE_PAGE_HTML, { resetHistory: true }); onToast("Demo page loaded", "success"); onClose(); }} className="pf-btn pf-btn-ghost pf-btn-sm">
            <FileText className="w-3.5 h-3.5" /> Try Demo
          </button>
          <button onClick={onClose} className="pf-btn pf-btn-ghost pf-btn-sm">Cancel</button>
          <button onClick={handleImport} className="pf-btn pf-btn-primary pf-btn-sm">Import &amp; Score</button>
        </div>
      </div>
    </div>
  );
}
