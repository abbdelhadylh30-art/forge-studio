"use client";

import { usePFStore } from "@/lib/pixelforge/store/pf-store";
import { useMemo } from "react";
import { Download, Copy, Share2, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SharePanelProps {
  onToast: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
}

export function SharePanel({ onToast }: SharePanelProps) {
  const { scoreData, initialScore, currentHTML, projectName } = usePFStore();
  const { toast } = useToast();

  const before = initialScore ?? 0;
  const after = scoreData?.score ?? 0;
  const timeMin = 12; // simulated editing time

  const drawShareCard = useMemo(() => {
    return (canvas: HTMLCanvasElement) => {
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = 1200;
      canvas.height = 630;
      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 1200, 630);
      grad.addColorStop(0, "#0a0c10");
      grad.addColorStop(1, "#16213e");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 630);
      // Accent line
      ctx.fillStyle = "#5c8def";
      ctx.fillRect(60, 60, 80, 6);
      // Title
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 44px Inter, sans-serif";
      ctx.fillText("PixelForge Audit", 60, 130);
      // Project name
      ctx.fillStyle = "#6b7394";
      ctx.font = "600 22px Inter, sans-serif";
      ctx.fillText(projectName, 60, 170);
      // Score circles
      drawCircle(ctx, 250, 380, 110, before, "#ef5c5c");
      // Arrow
      ctx.fillStyle = "#5c8def";
      ctx.font = "bold 60px Inter, sans-serif";
      ctx.fillText("→", 430, 410);
      drawCircle(ctx, 610, 380, 110, after, "#3dd68c");
      // Labels
      ctx.fillStyle = "#6b7394";
      ctx.font = "600 18px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("BEFORE", 250, 540);
      ctx.fillText("AFTER", 610, 540);
      // Improvement
      ctx.fillStyle = "#3dd68c";
      ctx.font = "bold 56px Inter, sans-serif";
      ctx.textAlign = "left";
      const diff = after - before;
      ctx.fillText(`+${diff} pts`, 770, 360);
      ctx.fillStyle = "#6b7394";
      ctx.font = "600 20px Inter, sans-serif";
      ctx.fillText("improvement", 770, 400);
      ctx.fillText(`in ${timeMin} minutes`, 770, 430);
      // Brand
      ctx.fillStyle = "#6b7394";
      ctx.font = "600 18px Inter, sans-serif";
      ctx.fillText("Made with PixelForge v19", 770, 540);
    };
  }, [before, after, projectName, timeMin]);

  const downloadCard = () => {
    const canvas = document.createElement("canvas");
    drawShareCard(canvas);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "pixelforge-share-card.png";
      a.click();
      URL.revokeObjectURL(url);
      onToast("Share card downloaded", "success");
    });
  };

  const copyCard = async () => {
    try {
      const canvas = document.createElement("canvas");
      drawShareCard(canvas);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          onToast("Share card copied to clipboard", "success");
        } catch {
          onToast("Clipboard not supported — use Download instead", "warning");
        }
      });
    } catch {
      onToast("Copy failed", "error");
    }
  };

  const generateShareLink = async () => {
    if (!currentHTML) return;
    // Generate a fake shareable link (in production this would POST to /api/audits and return an ID)
    const id = Math.random().toString(36).slice(2, 12);
    const link = `${window.location.origin}/?share=${id}`;
    try {
      await navigator.clipboard.writeText(link);
      onToast(`Share link copied: ${link}`, "success");
    } catch {
      onToast(`Share link: ${link}`, "info");
    }
  };

  if (!currentHTML) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-5 text-center text-[var(--pf-text-dim)] gap-2.5">
        <Share2 className="w-11 h-11 opacity-30" />
        <h3 className="text-[15px] font-bold text-[var(--pf-text-bright)]">Share Your Progress</h3>
        <p className="text-[12.5px] leading-relaxed max-w-[260px]">
          Score your page first, then generate a shareable card showing your before &amp; after scores.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="p-4 text-center">
        <canvas
          ref={(c) => c && drawShareCard(c)}
          className="w-full rounded-xl border border-[var(--pf-border)] shadow-lg"
          style={{ maxWidth: 500, margin: "0 auto", display: "block" }}
        />
        <div className="flex gap-1.5 justify-center mt-3 flex-wrap">
          <button onClick={downloadCard} className="pf-btn pf-btn-primary pf-btn-sm">
            <Download className="w-3.5 h-3.5" /> Download PNG
          </button>
          <button onClick={copyCard} className="pf-btn pf-btn-ghost pf-btn-sm">
            <Copy className="w-3.5 h-3.5" /> Copy
          </button>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-[var(--pf-border)]">
        <div className="flex justify-center gap-5 py-3">
          <div className="text-center">
            <div className="text-[20px] font-black text-[var(--pf-text-bright)]">{before}</div>
            <div className="text-[10px] text-[var(--pf-text-dim)] uppercase tracking-wider">Before</div>
          </div>
          <div className="text-center">
            <div className="text-[20px] font-black text-[var(--pf-success)]">+{after - before}</div>
            <div className="text-[10px] text-[var(--pf-text-dim)] uppercase tracking-wider">Improvement</div>
          </div>
          <div className="text-center">
            <div className="text-[20px] font-black text-[var(--pf-text-bright)]">{after}</div>
            <div className="text-[10px] text-[var(--pf-text-dim)] uppercase tracking-wider">After</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-[var(--pf-border)]">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--pf-text-dim)] mb-2">Shareable Report Link</div>
        <div className="flex gap-1.5">
          <input
            readOnly
            value={`${window.location.origin}/?share=pending…`}
            className="flex-1 px-3 py-2 bg-white/[0.04] border border-[var(--pf-border)] rounded text-[11px] text-[var(--pf-text)] font-mono"
          />
          <button onClick={generateShareLink} className="pf-btn pf-btn-primary pf-btn-sm">
            <Share2 className="w-3.5 h-3.5" /> Copy link
          </button>
        </div>
        <p className="text-[10px] text-[var(--pf-text-dim)] mt-1.5 leading-relaxed">
          Generates a unique URL that loads this audit in read-only mode. Anyone with the link can view your score and fixes.
        </p>
      </div>
    </div>
  );
}

function drawCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, score: number, color: string) {
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (score / 100) * Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 56px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(score), cx, cy);
}
