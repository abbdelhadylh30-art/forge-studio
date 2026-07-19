"use client";

import { usePFStore } from "@/lib/pixelforge/store/pf-store";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Layers, Box, RefreshCw } from "lucide-react";

interface LayerItem {
  tag: string;
  selector: string;
  text: string;
  depth: number;
  hasChildren: boolean;
}

/** Layer panel — shows the iframe's DOM tree as a clickable list */
export function LayerPanel() {
  const { currentHTML, layerCollapsed, toggleLayer, setSelectedSelector, selectedSelector, mode } = usePFStore();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);

  // Find the preview iframe (it's not a direct child) — query globally
  useEffect(() => {
    const iframe = document.querySelector("iframe[title='preview']") as HTMLIFrameElement | null;
    iframeRef.current = iframe;
    const update = () => {
      const doc = iframe?.contentDocument;
      if (!doc || !doc.body) {
        setLayers([]);
        return;
      }
      const out: LayerItem[] = [];
      const walk = (el: Element, depth: number) => {
        if (depth > 4) return;
        const tag = el.tagName.toLowerCase();
        if (["script", "style", "link", "meta"].includes(tag)) return;
        const text = (el.textContent || "").trim().slice(0, 80);
        const selector = computeSel(el);
        const hasChildren = Array.from(el.children).some((c) => !["script", "style", "link", "meta"].includes(c.tagName.toLowerCase()));
        out.push({ tag, selector, text, depth, hasChildren });
        Array.from(el.children).slice(0, 8).forEach((c) => walk(c, depth + 1));
      };
      walk(doc.body, 0);
      setLayers(out.slice(0, 100));
    };
    const interval = setInterval(update, 1200);
    update();
    return () => clearInterval(interval);
  }, [currentHTML]);

  if (layerCollapsed) {
    return (
      <button
        onClick={toggleLayer}
        className="w-9 flex flex-col items-center justify-start py-3 bg-[var(--pf-panel)] border-r border-[var(--pf-border)] text-[var(--pf-text-dim)] hover:text-[var(--pf-text)] hover:bg-[var(--pf-panel-hover)] transition-colors"
        aria-label="Expand layer panel"
      >
        <Layers className="w-3.5 h-3.5 mb-2" />
        <ChevronLeft className="w-3 h-3 rotate-180" />
      </button>
    );
  }

  return (
    <aside className="w-[230px] bg-[var(--pf-panel)] border-r border-[var(--pf-border)] flex flex-col overflow-hidden shrink-0 transition-all">
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[var(--pf-border)]">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[var(--pf-text-dim)]" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--pf-text-dim)]">Layers</span>
          {layers.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-[var(--pf-text-dim)] font-medium">{layers.length}</span>
          )}
        </div>
        <button onClick={toggleLayer} className="text-[var(--pf-text-dim)] hover:text-[var(--pf-text)] p-0.5 rounded hover:bg-white/5 transition-colors" aria-label="Collapse layer panel">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto pf-scroll p-1.5">
        {layers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-9 text-center text-[var(--pf-text-dim)] gap-2.5" style={{ animation: "pfFadeInUp 0.3s ease both" }}>
            <Box className="w-10 h-10 opacity-25" />
            <p className="text-xs leading-relaxed">Import an HTML page to<br />see its layer structure</p>
          </div>
        ) : (
          layers.map((layer, i) => {
            const selected = layer.selector === selectedSelector;
            const isHovered = hovered === layer.selector;
            const showTooltip = layer.text.length > 28;
            return (
              <button
                key={i}
                onClick={() => mode === "edit" && setSelectedSelector(layer.selector)}
                onMouseEnter={() => setHovered(layer.selector)}
                onMouseLeave={() => setHovered(null)}
                title={showTooltip ? layer.text : undefined}
                className={`group w-full text-left flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-all ${
                  selected
                    ? "bg-[var(--pf-accent-dim)] text-[var(--pf-accent)]"
                    : isHovered
                      ? "bg-[var(--pf-panel-hover)] text-[var(--pf-text)]"
                      : "text-[var(--pf-text-dim)] hover:bg-[var(--pf-panel-hover)] hover:text-[var(--pf-text)]"
                }`}
                style={{ paddingLeft: `${8 + layer.depth * 10}px` }}
              >
                {/* Depth indicator */}
                {layer.depth > 0 && (
                  <span className="absolute" style={{ marginLeft: `${-6 + layer.depth * 10}px` }}>
                    <span className="block h-px w-2 bg-[var(--pf-border)]" />
                  </span>
                )}
                <span className={`text-[9.5px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider shrink-0 transition-colors ${
                  selected ? "bg-[var(--pf-accent)] text-white" : "bg-white/[0.06] text-[var(--pf-text-dim)] group-hover:bg-white/10"
                }`}>
                  {layer.tag}
                </span>
                <span className="flex-1 truncate text-[11px]">{layer.text || <span className="italic opacity-60">(empty)</span>}</span>
                {layer.hasChildren && (
                  <span className="text-[9px] text-[var(--pf-text-dim)] opacity-50">▾</span>
                )}
              </button>
            );
          })
        )}
      </div>
      {/* Footer with refresh hint */}
      {layers.length > 0 && (
        <div className="border-t border-[var(--pf-border)] px-3 py-1.5 text-[9px] text-[var(--pf-text-dim)] flex items-center gap-1">
          <RefreshCw className="w-2.5 h-2.5" /> Auto-refreshes every 1.2s
        </div>
      )}
    </aside>
  );
}

function computeSel(el: Element): string {
  if (el.id) return "#" + (typeof CSS !== "undefined" && CSS.escape ? CSS.escape(el.id) : el.id);
  const parts: string[] = [];
  let cursor: Element | null = el;
  while (cursor && cursor.tagName && cursor.tagName !== "HTML" && cursor.tagName !== "BODY") {
    let sel = cursor.tagName.toLowerCase();
    if (cursor.id) {
      parts.unshift("#" + (typeof CSS !== "undefined" && CSS.escape ? CSS.escape(cursor.id) : cursor.id));
      break;
    }
    const parent = cursor.parentElement;
    if (parent) {
      const sibs = Array.from(parent.children).filter((c) => c.tagName === cursor!.tagName);
      if (sibs.length > 1) sel += `:nth-of-type(${sibs.indexOf(cursor) + 1})`;
    }
    parts.unshift(sel);
    cursor = cursor.parentElement;
  }
  return parts.join(" > ");
}
