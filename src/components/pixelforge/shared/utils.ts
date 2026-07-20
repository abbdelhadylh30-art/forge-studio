"use client";

import { useEffect, useRef, useState } from "react";

/** Toast system — minimal, matches v19 styling */
export function useToasts() {
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: string }[]>([]);
  const pushToast = (msg: string, type: "success" | "error" | "info" | "warning" = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  };
  return { toasts, pushToast };
}

/** Confetti effect — ported from v19 triggerConfetti */
export function useConfetti() {
  const [pieces, setPieces] = useState<{ id: number; left: number; bg: string; delay: number; duration: number }[]>([]);
  const fire = () => {
    const colors = ["#5c8def", "#3dd68c", "#f0b429", "#a78bfa", "#ec4899", "#f472b6"];
    const next = Array.from({ length: 60 }, (_, i) => ({
      id: Date.now() + i,
      left: Math.random() * 100,
      bg: colors[i % colors.length],
      delay: Math.random() * 0.3,
      duration: 1.8 + Math.random() * 1.2,
    }));
    setPieces(next);
    setTimeout(() => setPieces([]), 3500);
  };
  return { pieces, fire };
}

/** Improvement toast — shows the +N points gained */
export function useImprovementToast() {
  const [show, setShow] = useState(false);
  const [diff, setDiff] = useState(0);
  const fire = (diff: number) => {
    setDiff(diff);
    setShow(true);
    setTimeout(() => setShow(false), 1800);
  };
  return { show, diff, fire };
}

/** Detect outside click — used for dropdowns */
export function useOutsideClick<T extends HTMLElement>(onOutside: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onOutside]);
  return ref;
}

/** Format a timestamp as relative time (e.g. "2m ago") */
export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

/** Truncate with ellipsis */
export function truncate(s: string, n: number): string {
  return s.length > n ? s.substring(0, n - 1) + "…" : s;
}
