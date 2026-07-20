"use client";

import { usePFStore } from "@/lib/pixelforge/store/pf-store";
import { ScorePanel } from "../panels/ScorePanel";
import { EditPanel } from "../panels/EditPanel";
import { OGPanel } from "../panels/OGPanel";
import { SharePanel } from "../panels/SharePanel";
import { ChevronRight, type LucideIcon } from "lucide-react";
import type { PanelTab } from "@/lib/pixelforge/types";
import {
  Gauge, Pencil, Globe, Share2,
} from "lucide-react";

interface RightPanelProps {
  onToast: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
  onImprovement: (diff: number) => void;
  onConfetti: () => void;
}

const TABS: { id: PanelTab; label: string; icon: LucideIcon }[] = [
  { id: "score", label: "Score", icon: Gauge },
  { id: "edit", label: "Edit", icon: Pencil },
  { id: "og", label: "OG", icon: Globe },
  { id: "share", label: "Share", icon: Share2 },
];

export function RightPanel(props: RightPanelProps) {
  const { activeTab, setActiveTab, rightCollapsed, toggleRight } = usePFStore();
  const issueCount = usePFStore((s) => s.scoreData?.issues?.length ?? 0);

  if (rightCollapsed) {
    return (
      <button
        onClick={toggleRight}
        className="w-8 flex flex-col items-center justify-start py-3 bg-[var(--pf-panel)] border-l border-[var(--pf-border)] text-[var(--pf-text-dim)] hover:text-[var(--pf-text)]"
      >
        <ChevronRight className="w-3 h-3" />
        {TABS.map((t) => {
          const Icon = t.icon;
          return <Icon key={t.id} className="w-3.5 h-3.5 mt-3" />;
        })}
      </button>
    );
  }

  return (
    <aside className="w-[340px] bg-[var(--pf-panel)] border-l border-[var(--pf-border)] flex flex-col overflow-hidden shrink-0">
      {/* Tabs */}
      <div className="flex border-b border-[var(--pf-border)] shrink-0 bg-[var(--pf-bg)]">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              aria-label={`${t.label} tab`}
              role="tab"
              aria-selected={active}
              className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-[11px] font-semibold uppercase tracking-wider transition-all border-b-2 relative ${
                active
                  ? "text-[var(--pf-accent)] border-[var(--pf-accent)] bg-[var(--pf-panel)]"
                  : "text-[var(--pf-text-dim)] border-transparent hover:text-[var(--pf-text)] hover:bg-white/[0.02]"
              }`}
            >
              <Icon className="w-3 h-3" />
              {t.label}
              {t.id === "score" && issueCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0 rounded-full text-[9px] font-bold bg-[var(--pf-error)] text-white">{issueCount}</span>
              )}
            </button>
          );
        })}
        <button onClick={toggleRight} className="px-2 text-[var(--pf-text-dim)] hover:text-[var(--pf-text)] hover:bg-white/5 border-b-2 border-transparent transition-colors" aria-label="Collapse right panel">
          <ChevronRight className="w-3.5 h-3.5 rotate-180" />
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-y-auto pf-scroll">
        {activeTab === "score" && <ScorePanel {...props} />}
        {activeTab === "edit" && <EditPanel onToast={props.onToast} />}
        {activeTab === "og" && <OGPanel onToast={props.onToast} />}
        {activeTab === "share" && <SharePanel onToast={props.onToast} />}
      </div>
    </aside>
  );
}
