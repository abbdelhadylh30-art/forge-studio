"use client";

import { usePFStore } from "@/lib/pixelforge/store/pf-store";
import { useState } from "react";
import { ListChecks, X, RotateCcw } from "lucide-react";

export function ChangelogFab() {
  const { changeLog, revertChange } = usePFStore();
  const [open, setOpen] = useState(false);
  const count = changeLog.filter((c) => !c.reverted).length;
  if (count === 0) return null;
  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-[200] bg-[var(--pf-panel)] border border-[var(--pf-border)] rounded-full px-3.5 py-1.5 text-[11px] font-bold text-[var(--pf-text)] hover:border-[var(--pf-accent)] hover:text-[var(--pf-accent)] shadow-lg flex items-center gap-1.5 transition-all"
      >
        <ListChecks className="w-3 h-3" />
        Changes
        <span className="bg-[var(--pf-accent)] text-white rounded-full px-1.5 py-0 text-[10px] font-bold">{count}</span>
      </button>
      {open && (
        <div className="fixed bottom-16 right-5 z-[200] bg-[var(--pf-panel)] border border-[var(--pf-border)] rounded-lg w-[320px] max-h-[400px] overflow-y-auto pf-scroll shadow-2xl">
          <div className="flex items-center justify-between p-3 border-b border-[var(--pf-border)]">
            <span className="text-xs font-bold">Change log ({count})</span>
            <button onClick={() => setOpen(false)} className="text-[var(--pf-text-dim)] hover:text-[var(--pf-text)]"><X className="w-3.5 h-3.5" /></button>
          </div>
          <div className="p-2">
            {changeLog.map((c) => (
              <div key={c.id} className={`p-2 mb-1 rounded border border-[var(--pf-border)] bg-white/[0.02] ${c.reverted ? "opacity-50" : ""}`}>
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-[var(--pf-text)]">{c.title}</div>
                    <div className="text-[10px] text-[var(--pf-text-dim)] leading-relaxed mt-0.5">{c.description}</div>
                    <div className="text-[9px] text-[var(--pf-text-dim)] mt-1">{new Date(c.timestamp).toLocaleTimeString()}</div>
                  </div>
                  {!c.reverted && (
                    <button
                      onClick={() => {
                        revertChange(c.id);
                      }}
                      className="text-[10px] font-semibold text-[var(--pf-text-dim)] hover:text-[var(--pf-warning)] px-1.5 py-0.5 rounded bg-white/[0.05] border border-[var(--pf-border)] hover:border-[var(--pf-warning)] hover:bg-[rgba(245,158,11,0.08)]"
                      title="Mark as reverted (will undo on next refresh)"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
