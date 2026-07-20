"use client";

import { usePFStore } from "@/lib/pixelforge/store/pf-store";
import { GUIDE_STEPS } from "@/lib/pixelforge/scoring/guide-steps";
import { applyQuickFix, type QuickFixContext } from "@/lib/pixelforge/fixes/quick-fixes";
import { useEffect, useRef, useState } from "react";
import { CATEGORY_META } from "@/lib/pixelforge/types";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";

interface GuideOverlayProps {
  onToast: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
}

export function GuideOverlay({ onToast }: GuideOverlayProps) {
  const { guideActive, guideStep, setGuideStep, endGuide, markGuideStepDone, guideChecklist, scoreData, setHTML, pushHistory, addChange } = usePFStore();
  const [spotlightRect, setSpotlightRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const step = GUIDE_STEPS[guideStep];
  const totalSteps = GUIDE_STEPS.length;

  // Try to position spotlight on the issue's element.
  // NOTE: this effect only runs when the guide is active; the render guard below
  // handles the inactive case, so we never call setState synchronously in the
  // effect body (satisfies react-hooks/set-state-in-effect).
  useEffect(() => {
    if (!guideActive || !step) {
      return;
    }
    const positionOnElement = () => {
      if (!step.selector) {
        setSpotlightRect(null);
        return;
      }
      try {
        const iframe = document.querySelector("iframe[title='preview']") as HTMLIFrameElement | null;
        const doc = iframe?.contentDocument;
        if (!doc) return;
        const el = doc.querySelector(step.selector) as HTMLElement | null;
        if (!el) {
          setSpotlightRect(null);
          return;
        }
        const r = el.getBoundingClientRect();
        const iframeRect = iframe!.getBoundingClientRect();
        setSpotlightRect({
          top: iframeRect.top + r.top - 6,
          left: iframeRect.left + r.left - 6,
          width: r.width + 12,
          height: r.height + 12,
        });
      } catch {
        setSpotlightRect(null);
      }
    };
    positionOnElement();
    intervalRef.current = setInterval(positionOnElement, 800);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [guideActive, guideStep, step, currentHTMLKey()]);

  if (!guideActive || !step) return null;

  const handleFix = () => {
    if (!step.quickFix) return;
    const iframe = document.querySelector("iframe[title='preview']") as HTMLIFrameElement | null;
    const doc = iframe?.contentDocument;
    if (!doc) return;
    const ctx: QuickFixContext = {
      doc,
      pushHistory,
      syncHTML: () => setHTML("<!DOCTYPE html>\n" + doc.documentElement.outerHTML),
      toast: onToast,
    };
    const result = applyQuickFix(step.quickFix, ctx);
    if (result.applied && result.change) {
      addChange(result.change);
      markGuideStepDone(step.id);
      onToast(`Applied: ${result.change.title}`, "success");
    }
  };

  const next = () => {
    if (guideStep < totalSteps - 1) {
      markGuideStepDone(step.id);
      setGuideStep(guideStep + 1);
    } else {
      markGuideStepDone(step.id);
      endGuide();
      onToast("🎉 Guide complete! Keep fixing issues to maximize your score.", "success");
    }
  };
  const prev = () => guideStep > 0 && setGuideStep(guideStep - 1);

  const meta = CATEGORY_META[step.category];
  const isDone = !!guideChecklist[step.id];

  return (
    <div className="fixed inset-0 z-[800]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={endGuide} />
      {/* Spotlight */}
      {spotlightRect && (
        <div
          className="pf-guide-spotlight"
          style={{
            position: "fixed",
            top: spotlightRect.top,
            left: spotlightRect.left,
            width: spotlightRect.width,
            height: spotlightRect.height,
          }}
        />
      )}
      {/* Label card */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[803] bg-[var(--pf-panel)] border border-[var(--pf-accent)] rounded-xl p-4 max-w-[400px] w-[90%] shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_20px_var(--pf-accent-glow)]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--pf-accent)] text-white font-bold">{guideStep + 1} / {totalSteps}</span>
          <span className="text-[14px] font-bold text-[var(--pf-text-bright)] flex-1">{step.title}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.08] text-[var(--pf-text-dim)] font-semibold">{meta.label}</span>
          <button onClick={endGuide} className="text-[var(--pf-text-dim)] hover:text-[var(--pf-text)] p-0.5"><X className="w-3.5 h-3.5" /></button>
        </div>
        <p className="text-[12px] text-[var(--pf-text)] leading-relaxed mb-3">{step.body}</p>
        <div className="text-[12px] text-[var(--pf-text-bright)] font-semibold p-2 rounded bg-[rgba(61,214,140,0.08)] border border-[rgba(61,214,140,0.2)] mb-3">
          <Check className="w-3 h-3 inline mr-1 text-[var(--pf-success)]" />
          {step.do}
        </div>
        <div className="text-[11px] text-[var(--pf-success)] font-semibold mb-2">{step.impact}</div>
        <div className="text-[11px] text-[var(--pf-text-dim)] leading-relaxed p-2 rounded bg-white/[0.03] border-l-[3px] border-[var(--pf-accent-dim)] mb-3">
          <strong className="text-[var(--pf-text)]">Why:</strong> {step.why}
        </div>
        {/* Nav */}
        <div className="flex items-center gap-1.5 justify-between">
          <button onClick={prev} disabled={guideStep === 0} className="pf-btn pf-btn-ghost pf-btn-sm disabled:opacity-40">
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div className="flex items-center gap-1">
            {GUIDE_STEPS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setGuideStep(i)}
                className={`rounded-full transition-all ${i === guideStep ? "w-4 h-1.5 bg-[var(--pf-accent)]" : guideChecklist[s.id] ? "w-1.5 h-1.5 bg-[var(--pf-success)]" : "w-1.5 h-1.5 bg-[var(--pf-border)]"}`}
              />
            ))}
          </div>
          {step.quickFix && !isDone && (
            <button onClick={handleFix} className="pf-btn pf-btn-success pf-btn-sm">
              <Check className="w-3.5 h-3.5" /> Apply fix
            </button>
          )}
          <button onClick={next} className="pf-btn pf-btn-primary pf-btn-sm">
            {guideStep === totalSteps - 1 ? "Done" : "Next"} <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function currentHTMLKey() {
  return usePFStore.getState().currentHTML.length;
}
