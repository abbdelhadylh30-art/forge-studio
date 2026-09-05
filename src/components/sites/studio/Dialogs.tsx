"use client"

import * as React from "react"
import { Check, Code2, Copy, Download, ExternalLink, FileCode2, Sparkles, Upload, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useForge } from "@/lib/landing/store"
import { useUi, type DialogId } from "@/lib/landing/uiStore"
import { configToYaml, yamlToConfig } from "@/lib/landing/yaml"
import { buildStandaloneHtml, downloadStandaloneHtml } from "@/lib/landing/exportHtml"
import { getTheme } from "@/lib/landing/themes"

const EXAMPLE_PROMPTS = [
  "Landing page for a Flutter app that helps Iraqi students study. Modern dark theme, features, pricing. Arabic copy.",
  "Dark SaaS page for an AI agent deployment platform. Split hero, bento features, 3-tier pricing, FAQ.",
  "Launch page for an indie smart-water-bottle. Playful, emerald theme, gallery, testimonials, waitlist CTA.",
]

/** Derive dialog open state + close callback from the shared UI store. */
function useUiDialog(id: Exclude<DialogId, null>) {
  const open = useUi((s) => s.dialog === id)
  const closeDialog = useUi((s) => s.closeDialog)
  return {
    open,
    onOpenChange: React.useCallback((v: boolean) => { if (!v) closeDialog() }, [closeDialog]),
  }
}

export function ExportYamlDialog() {
  const { open, onOpenChange } = useUiDialog("export-yaml")
  const config = useForge((s) => s.config)
  const brand = useForge((s) => s.project.name)
  const [copied, setCopied] = React.useState(false)
  const yaml = React.useMemo(() => configToYaml(config), [config])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(yaml)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
      toast.success("YAML copied to clipboard")
    } catch {
      toast.error("Clipboard unavailable — select the text manually")
    }
  }

  const download = () => {
    const blob = new Blob([yaml], { type: "text/yaml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "landing.yaml"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("landing.yaml downloaded")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl border-zinc-800 bg-zinc-950">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <FileCode2 className="h-4 w-4 text-violet-300" /> Export YAML
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            The entire {brand} page — brand, theme, sections — as one version-controllable <code className="rounded bg-zinc-800 px-1 font-mono text-[11px]">landing.yaml</code>.
          </DialogDescription>
        </DialogHeader>
        <Textarea readOnly value={yaml} rows={14} className="resize-none border-zinc-800 bg-zinc-900 font-mono text-[11px] leading-relaxed text-zinc-300" />
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 border-zinc-700 bg-transparent text-zinc-200 hover:border-violet-500/50" onClick={copy}>
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />} Copy
          </Button>
          <Button size="sm" className="gap-1.5 bg-violet-500 text-white hover:bg-violet-600" onClick={download}>
            <Download className="h-3.5 w-3.5" /> Download landing.yaml
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ImportYamlDialog() {
  const { open, onOpenChange } = useUiDialog("import-yaml")
  const setConfig = useForge((s) => s.setConfig)
  const [text, setText] = React.useState("")
  const [fileError, setFileError] = React.useState("")

  const apply = () => {
    try {
      const config = yamlToConfig(text)
      setConfig(config)
      toast.success("YAML imported", { description: `${config.sections.length} sections loaded into the studio` })
      onOpenChange(false)
      setText("")
    } catch (e) {
      toast.error("Invalid YAML", { description: e instanceof Error ? e.message : "Parse error" })
    }
  }

  const onFile = (f: File | null) => {
    setFileError("")
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => setText(String(reader.result ?? ""))
    reader.onerror = () => setFileError("Could not read file")
    reader.readAsText(f)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl border-zinc-800 bg-zinc-950">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <Upload className="h-4 w-4 text-violet-300" /> Import YAML
          </DialogTitle>
          <DialogDescription className="text-zinc-400">Paste a landing.yaml (or load a file) — it becomes the live page, fully editable.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="yaml-file" className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Load file
            </Label>
            <Input id="yaml-file" type="file" accept=".yaml,.yml,text/yaml" onChange={(e) => onFile(e.target.files?.[0] ?? null)} className="h-8 border-zinc-700 bg-zinc-900/60 text-[12px] text-zinc-300 file:mr-2 file:rounded-md file:border-0 file:bg-zinc-800 file:px-2 file:py-0.5 file:text-[11px] file:text-zinc-300" />
            {fileError && <p className="text-[10px] text-rose-400">{fileError}</p>}
          </div>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={12} placeholder={"brand:\n  name: MyProduct\nsections:\n  - type: hero\n    headline: Ship faster. Sleep better.\n    …"} className="resize-none border-zinc-800 bg-zinc-900 font-mono text-[11px] leading-relaxed text-zinc-200 placeholder:text-zinc-600" />
        </div>
        <DialogFooter>
          <Button size="sm" className="gap-1.5 bg-violet-500 text-white hover:bg-violet-600" onClick={apply} disabled={!text.trim()}>
            <Wand2 className="h-3.5 w-3.5" /> Import into studio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ExportHtmlDialog() {
  const { open, onOpenChange } = useUiDialog("export-html")
  const config = useForge((s) => s.config)
  const slug = useForge((s) => s.project.slug)
  const previewLocale = useUi((s) => s.previewLocale)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState("")
  const [result, setResult] = React.useState<{ html: string; bytes: number; url: string } | null>(null)

  const visibleSections = config.sections.filter((s) => !s.hidden).length

  const build = async () => {
    setBusy(true)
    setError("")
    try {
      const { html, bytes } = await buildStandaloneHtml(config, previewLocale ?? undefined)
      const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }))
      setResult({ html, bytes, url })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed")
    } finally {
      setBusy(false)
    }
  }

  // Pre-build on open so the dialog instantly shows size + preview link
  React.useEffect(() => {
    if (open && !result) void build()
    if (!open && result) {
      URL.revokeObjectURL(result.url)
      setResult(null)
    }
  }, [open])

  const fmtBytes = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-zinc-800 bg-zinc-950">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <Code2 className="h-4 w-4 text-violet-300" /> Export standalone HTML
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            One self-contained <code className="rounded bg-zinc-800 px-1 font-mono text-[11px]">{slug || "landing"}.html</code> — inlined CSS, SEO meta, no build step, no dependencies. Host it anywhere.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-[12px] text-zinc-300">
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-400" /> {visibleSections} visible sections · theme {getTheme(config.themeId).name}
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-400" /> Dark + light palettes ship together
            {config.brand.mode === "auto"
              ? " — auto-follows the visitor's system, with a toggle"
              : config.brand.mode
                ? ` — pinned ${config.brand.mode}`
                : ` — ${getTheme(config.themeId).mode} by theme default`}
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-400" /> SEO meta + Open Graph + Twitter card + JSON-LD
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-400" /> Entrance animations + locale-aware lang/dir{previewLocale ? ` (exporting ${previewLocale.toUpperCase()})` : ""}
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-400" /> FAQ accordion stays interactive (tiny vanilla script)
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-emerald-400" /> {result ? fmtBytes(result.bytes) : "…"} single file
          </li>
        </ul>

        {error && <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-300">{error}</p>}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-zinc-700 bg-transparent text-zinc-200 hover:border-violet-500/50"
            disabled={!result}
            onClick={() => result && window.open(result.url, "_blank")}
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open preview
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-violet-500 text-white hover:bg-violet-600"
            disabled={busy || !result}
            onClick={() => {
              if (!result) return
              downloadStandaloneHtml(result.html, slug)
              toast.success("Standalone HTML downloaded", { description: `${slug || "landing"}.html · ${fmtBytes(result.bytes)} — upload it to any host` })
            }}
          >
            {busy ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Rendering…
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" /> Download .html
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AiGenerateDialog() {
  const { open, onOpenChange } = useUiDialog("ai-generate")
  const setConfig = useForge((s) => s.setConfig)
  const [prompt, setPrompt] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [phase, setPhase] = React.useState("")

  React.useEffect(() => {
    if (loading) {
      const phases = ["Reading your brief…", "Choosing theme & layouts…", "Writing marketing copy…", "Assembling sections…", "Fine-tuning SEO…"]
      let i = 0
      setPhase(phases[0])
      const t = setInterval(() => {
        i = (i + 1) % phases.length
        setPhase(phases[i])
      }, 2200)
      return () => clearInterval(t)
    }
  }, [loading])

  const generate = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
      const data = (await res.json()) as { config?: unknown; error?: string }
      if (!res.ok || !data.config) throw new Error(data.error ?? "Generation failed")
      const generated = data.config as { brand?: { name?: string } }
      setConfig(data.config as never)
      // sync project name to the new brand so saves stay coherent
      const newBrand = (generated.brand?.name ?? "").trim()
      if (newBrand) {
        const { setProjectMeta, project } = useForge.getState()
        setProjectMeta(newBrand.slice(0, 60), project.slug)
      }
      toast.success("Page forged with AI ✨", { description: "Review and tweak anything in the studio" })
      onOpenChange(false)
      setPrompt("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl border-zinc-800 bg-zinc-950">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <Sparkles className="h-4 w-4 text-violet-300" /> Generate from AI prompt
          </DialogTitle>
          <DialogDescription className="text-zinc-400">Describe the product & vibe — landing-forge writes the copy, picks layouts, a theme and SEO. 30 seconds.</DialogDescription>
        </DialogHeader>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          disabled={loading}
          placeholder="Landing page for a Flutter app that helps Iraqi students study. Modern dark theme. Features, screenshots, pricing. Arabic + English."
          className="resize-none border-zinc-800 bg-zinc-900 text-[13px] text-zinc-100 placeholder:text-zinc-600"
        />
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              disabled={loading}
              onClick={() => setPrompt(p)}
              className="max-w-full truncate rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-[10px] text-zinc-400 transition-colors hover:border-violet-500/50 hover:text-violet-200"
            >
              {p.slice(0, 60)}…
            </button>
          ))}
        </div>
        {error && <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-300">{error}</p>}
        <DialogFooter className="items-center gap-2">
          {loading && <span className="mr-auto text-[11px] text-violet-300">{phase}</span>}
          <Button size="sm" className="gap-1.5 bg-violet-500 text-white hover:bg-violet-600" onClick={generate} disabled={loading || !prompt.trim()}>
            {loading ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Forging…
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" /> Generate page
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AiImproveDialog() {
  const { open, onOpenChange } = useUiDialog("ai-improve")
  const config = useForge((s) => s.config)
  const setConfig = useForge((s) => s.setConfig)
  const [instruction, setInstruction] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  const improve = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/ai/improve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ config, instruction: instruction.trim() || undefined }),
      })
      const data = (await res.json()) as { config?: unknown; error?: string }
      if (!res.ok || !data.config) throw new Error(data.error ?? "Improve failed")
      setConfig(data.config as never)
      toast.success("Copy improved ✨", { description: "Headlines, features & testimonials got a marketing pass. Undo if you dislike it." })
      onOpenChange(false)
      setInstruction("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Improve failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-zinc-800 bg-zinc-950">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <Wand2 className="h-4 w-4 text-violet-300" /> AI improve copy
          </DialogTitle>
          <DialogDescription className="text-zinc-400">A marketing-editor pass over all copy — structure, layouts & links stay untouched.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Focus (optional)</Label>
          <Input
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            disabled={loading}
            placeholder="e.g. Make it bolder and more specific"
            className="h-9 border-zinc-700 bg-zinc-900/60 text-[13px] text-zinc-100"
          />
        </div>
        {error && <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-300">{error}</p>}
        <DialogFooter>
          <Button size="sm" className="gap-1.5 bg-violet-500 text-white hover:bg-violet-600" onClick={improve} disabled={loading}>
            {loading ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Editing…
              </>
            ) : (
              <>
                <Wand2 className="h-3.5 w-3.5" /> Improve all copy
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Theme fine-tuning (P5) ─────────────────────────────────────────────────────

import { Slider } from "@/components/ui/slider"
import { Camera, History, RotateCcw, SlidersHorizontal, Trash2 } from "lucide-react"
import { deleteSnapshot, describeAge, listSnapshots, MAX_SNAPSHOT_SLOTS, saveSnapshot, type SiteSnapshot } from "@/lib/landing/snapshots"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ThemeTweaks } from "@/lib/landing/types"

/** knob → slider bounds + identity (identity = "unset" → preset untouched) */
const KNOBS: {
  key: Exclude<keyof ThemeTweaks, "secondary" | "buttonRadius">
  label: string
  min: number
  max: number
  step: number
  identity: number
  /** display formatter */
  fmt: (v: number) => string
  group: "type" | "layout" | "depth"
}[] = [
  { key: "headingScale", label: "Heading scale", min: 0.8, max: 1.3, step: 0.01, identity: 1, fmt: (v) => `${Math.round(v * 100)}%`, group: "type" },
  { key: "bodyScale", label: "Body scale", min: 0.9, max: 1.15, step: 0.01, identity: 1, fmt: (v) => `${Math.round(v * 100)}%`, group: "type" },
  { key: "lineHeight", label: "Line height", min: 1.2, max: 2, step: 0.05, identity: 1.625, fmt: (v) => v.toFixed(2), group: "type" },
  { key: "letterSpacing", label: "Letter spacing", min: -0.05, max: 0.1, step: 0.005, identity: 0, fmt: (v) => `${v > 0 ? "+" : ""}${v.toFixed(3)}em`, group: "type" },
  { key: "paragraphSpacing", label: "Paragraph spacing", min: 0.5, max: 3, step: 0.25, identity: 1, fmt: (v) => `${v}rem`, group: "type" },
  { key: "sectionPadding", label: "Section padding", min: 0.5, max: 1.6, step: 0.05, identity: 1, fmt: (v) => `${Math.round(v * 100)}%`, group: "layout" },
  { key: "contentMaxWidth", label: "Content width", min: 800, max: 1600, step: 20, identity: 1152, fmt: (v) => `${v}px`, group: "layout" },
  { key: "cardRadius", label: "Card radius", min: 0, max: 2, step: 0.05, identity: 0.75, fmt: (v) => `${v.toFixed(2)}rem`, group: "layout" },
  { key: "shadowIntensity", label: "Shadow strength", min: 0, max: 2, step: 0.05, identity: 1, fmt: (v) => `${Math.round(v * 100)}%`, group: "depth" },
]

const GROUP_LABELS: Record<"type" | "layout" | "depth", string> = {
  type: "Typography",
  layout: "Layout & shape",
  depth: "Depth",
}

export function ThemeTweaksDialog() {
  const { open, onOpenChange } = useUiDialog("theme-tweaks")
  const tweaks = useForge((s) => s.config.themeTweaks)
  const themeId = useForge((s) => s.config.themeId)
  const updateTweaks = useForge((s) => s.updateThemeTweaks)
  const themeName = getTheme(themeId).name

  const activeCount = tweaks ? Object.keys(tweaks).length : 0

  const setKnob = (key: string, value: number | undefined) => {
    updateTweaks({ [key]: value } as Partial<ThemeTweaks>)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-zinc-800 bg-zinc-950">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <SlidersHorizontal className="h-4 w-4 text-violet-300" /> Fine-tune theme
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Layered on <span className="font-semibold text-zinc-200">{themeName}</span> — drag and watch the live preview. Knobs left at their
            default keep the preset untouched, and everything survives the YAML + HTML export.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[62vh] space-y-5 overflow-y-auto pr-1">
          {/* secondary color — duotone gradient end */}
          <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
            <input
              type="color"
              aria-label="Secondary color"
              value={tweaks?.secondary ?? "#f5f3ff"}
              onChange={(e) => updateTweaks({ secondary: e.target.value })}
              className="h-9 w-11 shrink-0 cursor-pointer rounded-lg border border-zinc-700 bg-zinc-900 p-0.5"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-zinc-200">Secondary color</p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-zinc-500">Duotone gradients — the light end of every accent gradient.</p>
            </div>
            <Input
              value={tweaks?.secondary ?? ""}
              onChange={(e) => updateTweaks({ secondary: e.target.value || undefined })}
              placeholder="#f5f3ff"
              className="h-8 w-24 shrink-0 border-zinc-700/80 bg-zinc-900/60 font-mono text-[11px] text-zinc-100"
            />
          </div>

          {(["type", "layout", "depth"] as const).map((group) => (
            <div key={group} className="space-y-3.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">{GROUP_LABELS[group]}</p>
              {KNOBS.filter((k) => k.group === group).map((k) => {
                const raw = tweaks?.[k.key]
                const value = typeof raw === "number" ? raw : k.identity
                return (
                  <div key={k.key} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[12px] font-medium text-zinc-300">{k.label}</label>
                      <span className="font-mono text-[11px] tabular-nums text-zinc-400">{k.fmt(value)}</span>
                    </div>
                    <Slider
                      value={[value]}
                      min={k.min}
                      max={k.max}
                      step={k.step}
                      onValueChange={([v]) => setKnob(k.key, Math.abs(v - k.identity) < 1e-6 ? undefined : v)}
                      className="[&_[data-slot=slider-range]]:bg-violet-500"
                    />
                  </div>
                )
              })}
              {group === "layout" ? (
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-zinc-300">Button radius</label>
                  <Select value={tweaks?.buttonRadius ?? "default"} onValueChange={(v) => updateTweaks({ buttonRadius: v === "default" ? undefined : (v as ThemeTweaks["buttonRadius"]) })}>
                    <SelectTrigger className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[12px] text-zinc-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
                      <SelectItem value="default" className="text-[12px]">Default — follows the theme</SelectItem>
                      <SelectItem value="pill" className="text-[12px]">Pill — fully rounded</SelectItem>
                      <SelectItem value="rounded" className="text-[12px]">Rounded — 1rem</SelectItem>
                      <SelectItem value="soft" className="text-[12px]">Soft — 0.5rem</SelectItem>
                      <SelectItem value="square" className="text-[12px]">Square — sharp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <DialogFooter className="items-center !justify-between sm:!justify-between">
          <p className="text-[11px] text-zinc-500">
            {activeCount === 0 ? "Preset untouched" : `${activeCount} knob${activeCount === 1 ? "" : "s"} layered on ${themeName}`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 border-zinc-800 bg-zinc-950 text-[11px] text-zinc-400 hover:border-rose-500/50 hover:text-rose-200"
              disabled={activeCount === 0}
              onClick={() =>
                updateTweaks({
                  secondary: undefined,
                  headingScale: undefined,
                  bodyScale: undefined,
                  lineHeight: undefined,
                  letterSpacing: undefined,
                  paragraphSpacing: undefined,
                  sectionPadding: undefined,
                  contentMaxWidth: undefined,
                  cardRadius: undefined,
                  buttonRadius: undefined,
                  shadowIntensity: undefined,
                })
              }
            >
              <RotateCcw className="h-3 w-3" /> Reset all
            </Button>
            <Button size="sm" className="h-7 bg-violet-500 text-[11px] text-white hover:bg-violet-600" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Version snapshots — named save-points (5 slots) on top of undo/redo.
 *  Restore flows through setConfig so ⌘Z still brings the working state back. */
export function SnapshotsDialog() {
  const { open, onOpenChange } = useUiDialog("snapshots")
  const project = useForge((s) => s.project)
  const config = useForge((s) => s.config)
  const setConfig = useForge((s) => s.setConfig)
  const [snapshots, setSnapshots] = React.useState<SiteSnapshot[]>([])
  const [name, setName] = React.useState("")
  const nameInput = React.useRef<HTMLInputElement | null>(null)

  // refresh the slot list whenever the dialog (re)opens
  React.useEffect(() => {
    if (open) setSnapshots(project.id ? listSnapshots(project.id) : [])
  }, [open, project.id])

  const save = () => {
    if (!project.id) return
    const snap = saveSnapshot(project.id, name, config)
    if (!snap) {
      toast.error("Name the snapshot first", { description: "A short label like “Before pricing rework” works best." })
      nameInput.current?.focus()
      return
    }
    setName("")
    setSnapshots(listSnapshots(project.id))
    toast.success(`Snapshot “${snap.name}” saved`, {
      description: `${snap.config.sections.length} sections captured — restore any time from this dialog.`,
    })
  }

  const restore = (snap: SiteSnapshot) => {
    setConfig(snap.config)
    toast.success(`Restored “${snap.name}”`, { description: "Undo (⌘Z) brings back the state you just left." })
  }

  const remove = (snap: SiteSnapshot) => {
    if (!project.id) return
    deleteSnapshot(project.id, snap.id)
    setSnapshots(listSnapshots(project.id))
    toast.info(`Snapshot “${snap.name}” deleted`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-zinc-800 bg-zinc-950">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <History className="h-4 w-4 text-violet-300" /> Version snapshots
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Named save-points alongside the 60-step undo history. {MAX_SNAPSHOT_SLOTS} slots per project — re-saving a
            name overwrites it, a full roster retires the oldest.
          </DialogDescription>
        </DialogHeader>

        {/* save row */}
        <div className="flex items-center gap-2">
          <Input
            ref={nameInput}
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 60))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                save()
              }
            }}
            placeholder="Snapshot name — e.g. Before hero rework"
            aria-label="Snapshot name"
            className="h-8 border-zinc-800 bg-zinc-900 text-[12px] text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-violet-500/60"
          />
          <Button
            size="sm"
            className="h-8 shrink-0 gap-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-[11px] text-white hover:from-violet-600 hover:to-fuchsia-600"
            onClick={save}
            disabled={!project.id}
          >
            <Camera className="h-3 w-3" /> Save
          </Button>
        </div>

        {/* slots */}
        <div className="max-h-[46vh] space-y-2 overflow-y-auto pr-1">
          {snapshots.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 p-6 text-center">
              <Camera className="h-5 w-5 text-zinc-600" aria-hidden />
              <p className="text-[12px] font-semibold text-zinc-300">No snapshots yet</p>
              <p className="max-w-[260px] text-[10px] leading-relaxed text-zinc-500">
                Name the current state above — useful before a big theme switch, copy rewrite, or restructuring.
              </p>
            </div>
          ) : (
            snapshots.map((snap) => (
              <div
                key={snap.id}
                className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 transition-colors hover:border-violet-500/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-zinc-100">{snap.name}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-zinc-500">
                    <span>{describeAge(snap.savedAt)}</span>
                    <span aria-hidden>·</span>
                    <span>
                      {snap.config.sections.length} section{snap.config.sections.length === 1 ? "" : "s"}
                    </span>
                    <span aria-hidden>·</span>
                    <span className="truncate">{getTheme(snap.config.themeId).name}</span>
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 shrink-0 gap-1.5 border-zinc-700 bg-zinc-950 text-[11px] text-zinc-300 hover:border-violet-500/60 hover:text-violet-200"
                  onClick={() => restore(snap)}
                >
                  <RotateCcw className="h-3 w-3" /> Restore
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-zinc-500 hover:text-rose-300"
                  aria-label={`Delete snapshot ${snap.name}`}
                  onClick={() => remove(snap)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>

        <DialogFooter className="items-center !justify-between sm:!justify-between">
          <p className="text-[11px] text-zinc-500">
            {snapshots.length}/{MAX_SNAPSHOT_SLOTS} slots used — stored locally per project
          </p>
          <Button size="sm" className="h-7 bg-violet-500 text-[11px] text-white hover:bg-violet-600" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
