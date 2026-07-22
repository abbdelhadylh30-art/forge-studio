"use client";

import { useSaveStatus } from "@/lib/builder/store/save-status";
import { Check, Loader2, AlertCircle, Cloud } from "lucide-react";
import { useEffect, useState } from "react";

function timeAgo(ts: number | null): string {
  if (!ts) return "";
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return "earlier";
}

export function SaveStatusBadge() {
  const { status, lastSavedAt } = useSaveStatus();
  const [, setTick] = useState(0);
  useEffect(() => {
    if (status !== "idle") return;
    const interval = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(interval);
  }, [status]);

  if (status === "saving") {
    return (
      <span className="flex items-center gap-1 text-[11px] text-slate-500">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="hidden sm:inline">Saving…</span>
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="flex items-center gap-1 text-[11px] text-emerald-600">
        <Check className="h-3 w-3" />
        <span className="hidden sm:inline">Saved</span>
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex items-center gap-1 text-[11px] text-red-600">
        <AlertCircle className="h-3 w-3" />
        <span className="hidden sm:inline">Save failed</span>
      </span>
    );
  }
  const ago = timeAgo(lastSavedAt);
  return (
    <span className="flex items-center gap-1 text-[11px] text-slate-400">
      <Cloud className="h-3 w-3" />
      <span className="hidden sm:inline">{ago ? `Saved ${ago}` : "All changes saved locally"}</span>
    </span>
  );
}
