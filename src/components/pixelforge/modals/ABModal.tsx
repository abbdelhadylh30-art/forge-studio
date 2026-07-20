"use client";

import { useState } from "react";
import { usePFStore } from "@/lib/pixelforge/store/pf-store";
import { runScoring } from "@/lib/pixelforge/scoring/engine";
import { ModalShell } from "./CompetitorModal";
import { FlaskConical, Upload, Trophy } from "lucide-react";

interface ABModalProps {
  open: boolean;
  onClose: () => void;
  onToast: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
}

export function ABModal({ open, onClose, onToast }: ABModalProps) {
  const { currentHTML, addABVariant, setABVariantScore, setABWinner, abVariants } = usePFStore();
  const [variantA, setVariantA] = useState<string>("");
  const [variantB, setVariantB] = useState<string>("");

  const loadFromCurrent = (which: "A" | "B") => {
    if (which === "A") setVariantA(currentHTML);
    else setVariantB(currentHTML);
  };

  const scoreVariant = (html: string): number => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      return runScoring({ doc }).score;
    } catch {
      return 0;
    }
  };

  const handleCheck = () => {
    if (!variantA || !variantB) {
      onToast("Load both variants first", "warning");
      return;
    }
    const scoreA = scoreVariant(variantA);
    const scoreB = scoreVariant(variantB);
    addABVariant("A", variantA);
    addABVariant("B", variantB);
    const aId = usePFStore.getState().abVariants[usePFStore.getState().abVariants.length - 2]?.id;
    const bId = usePFStore.getState().abVariants[usePFStore.getState().abVariants.length - 1]?.id;
    if (aId) setABVariantScore(aId, scoreA);
    if (bId) setABVariantScore(bId, scoreB);
    if (scoreA >= scoreB) { if (aId) setABWinner(aId); }
    else { if (bId) setABWinner(bId); }
    onToast(`Variant ${scoreA >= scoreB ? "A" : "B"} wins (${Math.max(scoreA, scoreB)} vs ${Math.min(scoreA, scoreB)})`, "success");
  };

  const lastTwo = abVariants.slice(-2);

  return (
    <ModalShell open={open} onClose={onClose} title="A/B Variant Scoring" icon={FlaskConical}>
      <p className="text-[12.5px] text-[var(--pf-text-dim)] mb-3 leading-relaxed">
        Load two HTML variants and see which scores higher. Great for picking between copy or layout changes.
      </p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        {(["A", "B"] as const).map((label) => {
          const html = label === "A" ? variantA : variantB;
          const variant = label === "A" ? lastTwo[0] : lastTwo[1];
          return (
            <div
              key={label}
              className={`border-2 rounded-lg p-5 text-center transition-all ${
                variant?.isWinner ? "border-[var(--pf-success)] bg-[rgba(61,214,140,0.05)]" :
                html ? "border-[var(--pf-border)]" : "border-dashed border-[var(--pf-border)] cursor-pointer hover:border-[var(--pf-accent)] hover:bg-[rgba(92,141,239,0.05)]"
              }`}
              onClick={() => !html && loadFromCurrent(label)}
            >
              <div className="text-[10px] uppercase tracking-wider text-[var(--pf-text-dim)] mb-2">Variant {label}</div>
              {variant?.score != null ? (
                <>
                  <div className="text-[28px] font-black" style={{ color: variant.isWinner ? "var(--pf-success)" : "var(--pf-text-bright)" }}>{variant.score}</div>
                  {variant.isWinner && (
                    <div className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 bg-[var(--pf-success-dim)] text-[var(--pf-success)] rounded-full text-[11px] font-bold">
                      <Trophy className="w-3 h-3" /> Winner
                    </div>
                  )}
                </>
              ) : html ? (
                <>
                  <div className="text-[12px] font-semibold text-[var(--pf-text)] mb-1">Loaded</div>
                  <div className="text-[10px] text-[var(--pf-text-dim)]">{html.length} chars</div>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mx-auto mb-1 text-[var(--pf-text-dim)]" />
                  <div className="text-[11px] text-[var(--pf-text-dim)]">Click to load current page</div>
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 justify-end">
        <button onClick={() => { setVariantA(""); setVariantB(""); }} className="pf-btn pf-btn-ghost pf-btn-sm">Reset</button>
        <button onClick={handleCheck} className="pf-btn pf-btn-primary pf-btn-sm">Score &amp; Compare</button>
      </div>
    </ModalShell>
  );
}
