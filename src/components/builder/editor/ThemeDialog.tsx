"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useBuilder } from "@/lib/builder/store/builder-store";
import { THEME_PRESETS, FONT_OPTIONS, type ThemeTokens } from "@/lib/builder/sections/types";
import { Palette, Type, Square, RotateCcw } from "lucide-react";

interface ThemeDialogProps {
  open: boolean;
  onOpenChange: (b: boolean) => void;
}

export function ThemeDialog({ open, onOpenChange }: ThemeDialogProps) {
  const { site, setThemeTokens, applyThemePreset } = useBuilder();
  const t = site.themeTokens;

  const update = (patch: Partial<ThemeTokens>) => setThemeTokens(patch);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto builder-scroll">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-violet-500" /> Theme & Styles
          </DialogTitle>
          <DialogDescription>
            Customize colors, fonts, and corner radius. Changes apply instantly to your page.
          </DialogDescription>
        </DialogHeader>

        {/* Presets */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Quick Presets</Label>
          <div className="grid grid-cols-4 gap-2">
            {THEME_PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => applyThemePreset(p.tokens)}
                className={`group flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-all hover:shadow-md ${
                  t.primary === p.tokens.primary ? "border-violet-400 ring-2 ring-violet-200" : "border-slate-200"
                }`}
              >
                <div className="flex gap-1">
                  <span className="h-5 w-5 rounded-full ring-1 ring-black/10" style={{ background: p.tokens.primary }} />
                  <span className="h-5 w-5 rounded-full ring-1 ring-black/10" style={{ background: p.tokens.accent }} />
                  <span className="h-5 w-5 rounded-full ring-1 ring-black/10" style={{ background: p.tokens.background, border: "1px solid #e2e8f0" }} />
                </div>
                <span className="text-[10px] font-medium text-slate-600">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Colors */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Palette className="h-3.5 w-3.5" /> Colors
          </Label>
          <ColorRow label="Primary" value={t.primary} onChange={(v) => update({ primary: v })} />
          <ColorRow label="Accent" value={t.accent} onChange={(v) => update({ accent: v })} />
          <ColorRow label="Background" value={t.background} onChange={(v) => update({ background: v })} />
          <ColorRow label="Text" value={t.foreground} onChange={(v) => update({ foreground: v })} />
          <ColorRow label="Muted background" value={t.muted} onChange={(v) => update({ muted: v })} />
          <ColorRow label="Border" value={t.border} onChange={(v) => update({ border: v })} />
        </div>

        <Separator />

        {/* Fonts */}
        <div className="space-y-3">
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Type className="h-3.5 w-3.5" /> Typography
          </Label>
          <div className="space-y-2">
            <div>
              <Label className="text-[11px] text-slate-600">Body font</Label>
              <Select value={t.font} onValueChange={(v) => update({ font: v })}>
                <SelectTrigger className="h-9 mt-1 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((f) => <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] text-slate-600">Heading font</Label>
              <Select value={t.fontHeading} onValueChange={(v) => update({ fontHeading: v })}>
                <SelectTrigger className="h-9 mt-1 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((f) => <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Radius */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Square className="h-3.5 w-3.5" /> Corner Radius
          </Label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={24}
              value={parseInt(t.radius) || 12}
              onChange={(e) => update({ radius: `${e.target.value}px` })}
              className="flex-1 accent-violet-500"
            />
            <span className="w-12 text-right text-xs font-mono text-slate-600">{t.radius}</span>
          </div>
          <div className="flex gap-2 mt-1">
            {["0px", "4px", "8px", "12px", "16px", "24px"].map((r) => (
              <button
                key={r}
                onClick={() => update({ radius: r })}
                className={`flex-1 py-1.5 text-[10px] font-medium rounded transition-colors ${
                  t.radius === r ? "bg-violet-100 text-violet-700 border border-violet-300" : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
                style={{ borderRadius: r }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Reset */}
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5"
          onClick={() => applyThemePreset(THEME_PRESETS[0].tokens)}
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset to default
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded-lg border border-slate-200 p-1"
        />
      </div>
      <div className="flex-1">
        <Label className="text-[11px] text-slate-600">{label}</Label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-xs font-mono"
        />
      </div>
    </div>
  );
}
