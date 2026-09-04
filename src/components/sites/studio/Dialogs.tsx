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
      toast.success("YAML imported 📦", { description: `${config.sections.length} sections loaded into the studio` })
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
            <Check className="h-3.5 w-3.5 text-emerald-400" /> {visibleSections} visible sections · theme {config.themeId}
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
              toast.success("Standalone HTML downloaded 📦", { description: `${slug || "landing"}.html · ${fmtBytes(result.bytes)} — upload it to any host` })
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
