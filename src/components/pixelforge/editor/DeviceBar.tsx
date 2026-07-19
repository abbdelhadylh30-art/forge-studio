"use client";

import { usePFStore } from "@/lib/pixelforge/store/pf-store";
import type { DeviceMode, EditorMode } from "@/lib/pixelforge/types";
import { Monitor, Laptop, Tablet, Smartphone, Pencil, Eye } from "lucide-react";

const DEVICES: { id: DeviceMode; label: string; icon: any; width: string }[] = [
  { id: "desktop", label: "Desktop", icon: Monitor, width: "1280px" },
  { id: "laptop", label: "Laptop", icon: Laptop, width: "1024px" },
  { id: "tablet", label: "Tablet", icon: Tablet, width: "768px" },
  { id: "mobile", label: "Mobile", icon: Smartphone, width: "390px" },
];

const MODES: { id: EditorMode; label: string; icon: any; desc: string }[] = [
  { id: "edit", label: "Edit", icon: Pencil, desc: "Click to select elements" },
  { id: "preview", label: "Preview", icon: Eye, desc: "Interact normally" },
];

export function DeviceBar() {
  const { mode, setMode, device, setDevice } = usePFStore();
  return (
    <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-[var(--pf-panel)] border-b border-[var(--pf-border)] shrink-0">
      {/* Mode toggle */}
      <div className="flex items-center gap-0.5 rounded-md bg-white/[0.04] p-0.5">
        {MODES.map((m) => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              title={m.desc}
              aria-label={`${m.label} mode — ${m.desc}`}
              aria-pressed={active}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11.5px] font-semibold transition-all ${
                active
                  ? "text-[var(--pf-accent)] bg-[rgba(92,141,239,0.14)] shadow-sm"
                  : "text-[var(--pf-text-dim)] hover:text-[var(--pf-text)] hover:bg-white/5"
              }`}
            >
              <Icon className="w-3 h-3" /> {m.label}
            </button>
          );
        })}
      </div>

      <div className="w-px h-[18px] bg-[var(--pf-border)]" />

      {/* Device toggle */}
      <div className="flex items-center gap-0.5 rounded-md bg-white/[0.04] p-0.5">
        {DEVICES.map((d) => {
          const Icon = d.icon;
          const active = device === d.id;
          return (
            <button
              key={d.id}
              onClick={() => setDevice(d.id)}
              title={`${d.label} (${d.width})`}
              aria-label={`Preview at ${d.label} width (${d.width})`}
              aria-pressed={active}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11.5px] font-medium transition-all ${
                active
                  ? "text-[var(--pf-accent)] bg-[rgba(92,141,239,0.14)] shadow-sm"
                  : "text-[var(--pf-text-dim)] hover:text-[var(--pf-text)] hover:bg-white/5"
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{d.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
