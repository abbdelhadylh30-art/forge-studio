"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Cookie, Download, Eye, EyeOff, FileText, GripVertical, Hash, Images, Languages, Link2, Loader2, Monitor, Moon, Palette, Plus, Scale, Sheet, Sparkles, Sun, Trash2, Upload, Copy, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useForge } from "@/lib/landing/store"
import { ensureAllGoogleFonts } from "@/lib/landing/googleFonts"
import { downloadLegalHtml } from "@/lib/landing/exportHtml"
import { ACCENT_PRESETS, FONT_PAIRS, THEMES, accentVars, getTheme, isValidAccent, themeVars } from "@/lib/landing/themes"
import { SECTION_ANIMATIONS, SECTION_META } from "@/lib/landing/types"
import type { SectionAnimation } from "@/lib/landing/types"
import { localesOf, pageTranslatablePaths, PAGE_TRANSLATION_KEY, readPath, translatablePaths, translatedSectionIds } from "@/lib/landing/i18n"
import type {
  AboutSection,
  Cta,
  LandingConfig,
  FaqSection,
  FeaturesSection,
  FooterSection,
  GallerySection,
  HeroSection,
  LogosSection,
  NavbarSection,
  PricingSection,
  Section,
  StatsSection,
  TestimonialsSection,
  ContactSection,
  CtaFinalSection,
} from "@/lib/landing/types"
import { ImageLibraryDialog } from "./ImageLibraryDialog"
import { AB_VARIANT_B_SUGGESTIONS } from "@/lib/landing/ab"
import type { AbConfig } from "@/lib/landing/types"
import { ICON_PICKER_GROUPS, IconGlyph } from "@/components/sites/preview/iconBank"
import type {
  AnnouncementSection,
  ComparisonSection,
  GuaranteeSection,
  OfferSection,
  PainItem,
  ProblemSection,
  SolutionSection,
  VideoSection,
} from "@/lib/landing/types"

// ─── Field primitives ────────────────────────────────────────────────────────

/** Image URL field with AI generation + optional upload: prompt input, generate button, thumb. */
function AiImageField({
  label,
  value,
  onChange,
  suggestion,
  size,
  allowUpload,
}: {
  label: string
  value?: string
  onChange: (src: string) => void
  suggestion: string
  size?: "1024x1024" | "768x1344" | "864x1152" | "1344x768" | "1152x864" | "1440x768" | "768x1440"
  /** show an upload button (images land in the shared library) */
  allowUpload?: boolean
}) {
  const [prompt, setPrompt] = React.useState(suggestion)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [libraryOpen, setLibraryOpen] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  // keep the prompt in sync when the parent suggestion changes (item switch)
  React.useEffect(() => {
    setPrompt(suggestion)
  }, [suggestion])

  const generate = async () => {
    if (!prompt.trim() || loading) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), size }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error ?? "Image generation failed")
      onChange(data.url)
      toast.success("Image generated", { description: "Applied to the section — undo if you dislike it." })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Image generation failed")
    } finally {
      setLoading(false)
    }
  }

  const upload = async (file: File) => {
    if (uploading) return
    setUploading(true)
    setError("")
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/images", { method: "POST", body: fd })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed")
      onChange(data.url)
      toast.success("Image uploaded", { description: "Saved to the library and applied here — undo if you change your mind." })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <Field label={label} hint={error || undefined}>
      <div className="flex gap-1.5">
        <Input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… (or generate with AI)"
          className="h-8 border-zinc-700/80 bg-zinc-900/60 font-mono text-xs text-zinc-100 focus-visible:ring-violet-500/60"
        />
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0 border-zinc-700 text-zinc-400 hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-violet-200"
          onClick={() => setLibraryOpen(true)}
          title="Pick from the image library — reuse any generated image"
          aria-label="Open image library"
        >
          <Images className="h-3.5 w-3.5" />
        </Button>
        {allowUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void upload(f)
              }}
            />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0 border-zinc-700 text-zinc-400 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-200"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Upload an image file (PNG / JPG / WebP, ≤ 2MB)"
              aria-label="Upload image"
            >
              {uploading ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-400/30 border-t-emerald-300" /> : <Upload className="h-3.5 w-3.5" />}
            </Button>
          </>
        )}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0 border-violet-500/40 text-violet-300 hover:border-violet-500/70 hover:bg-violet-500/10 hover:text-violet-100"
          onClick={() => void generate()}
          disabled={loading || !prompt.trim()}
          title="Generate an image with AI from the prompt below"
          aria-label="Generate image with AI"
        >
          {loading ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-violet-400/30 border-t-violet-300" /> : <Sparkles className="h-3.5 w-3.5" />}
        </Button>
      </div>
      <div className="flex gap-1.5">
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="AI prompt — describe the image…"
          maxLength={600}
          className="h-7 border-zinc-800 bg-zinc-900/40 text-[11px] text-zinc-300 placeholder:text-zinc-600 focus-visible:ring-violet-500/40"
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 px-2 text-[10px] text-violet-300 hover:bg-violet-500/10 hover:text-violet-100"
          onClick={() => setPrompt(suggestion)}
          title="Reset prompt to the suggested default"
        >
          Reset
        </Button>
      </div>
      {value ? (
        <div className="flex items-center gap-2">
          <img src={value} alt="Section image preview" className="h-12 w-20 rounded-md border border-zinc-800 object-cover" />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-[10px] text-zinc-500 hover:text-rose-300"
            onClick={() => onChange("")}
            title="Remove the image (falls back to generated art)"
          >
            <Trash2 className="h-3 w-3" /> Remove
          </Button>
        </div>
      ) : null}
      <ImageLibraryDialog
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        picker={{ onPick: onChange, hint: "Click an image to use it for this field — every generated image is kept here." }}
      />
    </Field>
  )
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  // unique id links the visible <Label> to its control (a11y: accessible names
  // for every studio input — screen readers + getByLabel automation).
  // single control → label htmlFor; control group → role=group + aria-label.
  const id = React.useId()
  const isSingle = React.isValidElement(children) && React.Children.count(children) === 1
  return (
    <div className="space-y-1.5">
      <Label htmlFor={isSingle ? id : undefined} className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </Label>
      {isSingle ? (
        React.cloneElement(children as React.ReactElement<Record<string, unknown>>, { id })
      ) : (
        <div id={id} role="group" aria-label={label}>
          {children}
        </div>
      )}
      {hint && <p className="text-[10px] leading-tight text-zinc-500">{hint}</p>}
    </div>
  )
}

/** Icon bank picker — grouped Lucide icon grid for item icon fields. */
function IconPickerField({ label, value, onChange, hint }: { label: string; value: string; onChange: (icon: string) => void; hint?: string }) {
  const [open, setOpen] = React.useState(false)
  const [q, setQ] = React.useState("")
  const groups = React.useMemo(() => {
    if (!q.trim()) return ICON_PICKER_GROUPS
    const needle = q.trim().toLowerCase()
    return ICON_PICKER_GROUPS.map((g) => ({ ...g, keys: g.keys.filter((k) => k.includes(needle)) })).filter((g) => g.keys.length > 0)
  }, [q])
  return (
    <Field label={label} hint={hint}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-controls="icon-bank-popover"
            aria-haspopup="listbox"
            className="flex h-8 w-full items-center justify-between gap-2 rounded-md border border-zinc-700/80 bg-zinc-900/60 px-2.5 text-left text-[13px] text-zinc-200 transition-colors hover:border-violet-500/50"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded bg-zinc-800 text-violet-300">
                <IconGlyph name={value} className="size-3.5" />
              </span>
              <span className="truncate font-mono text-[11px] text-zinc-300">{value || "pick…"}</span>
            </span>
            <ChevronsUpDown className="h-3 w-3 shrink-0 text-zinc-500" />
          </button>
        </PopoverTrigger>
        <PopoverContent id="icon-bank-popover" align="start" className="lf-scroll w-64 border-zinc-800 bg-zinc-900 p-0 text-zinc-100 shadow-xl">
          <div className="border-b border-zinc-800 p-2">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search icons…"
              className="h-7 border-zinc-700 bg-zinc-950/60 text-[12px] text-zinc-100 placeholder:text-zinc-600"
            />
          </div>
          <div className="lf-scroll max-h-72 overflow-y-auto p-2">
            {groups.map((g) => (
              <div key={g.group} className="mb-2 last:mb-0">
                <p className="mb-1 px-1 text-[9px] font-bold uppercase tracking-wider text-zinc-600">{g.group}</p>
                <div className="grid grid-cols-7 gap-1">
                  {g.keys.map((k) => (
                    <button
                      key={k}
                      type="button"
                      title={k}
                      aria-label={`Icon: ${k}`}
                      onClick={() => {
                        onChange(k)
                        setOpen(false)
                        setQ("")
                      }}
                      className={cn(
                        "flex size-8 items-center justify-center rounded-md border transition-colors",
                        k === value ? "border-violet-500 bg-violet-500/15 text-violet-200" : "border-transparent text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100",
                      )}
                    >
                      <IconGlyph name={k} className="size-4" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {groups.length === 0 ? <p className="p-3 text-center text-[11px] text-zinc-500">No icons match “{q}”.</p> : null}
          </div>
        </PopoverContent>
      </Popover>
    </Field>
  )
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  mono,
  maxLength,
  type,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hint?: string
  mono?: boolean
  maxLength?: number
  /** optional input type (e.g. datetime-local) */
  type?: string
}) {
  return (
    <Field label={label} hint={hint}>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className={cn("h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100 focus-visible:ring-violet-500/60", mono && "font-mono text-xs")}
      />
    </Field>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 3,
  hint,
  maxLength,
  mono,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  rows?: number
  hint?: string
  maxLength?: number
  /** monospace body — code/script inputs */
  mono?: boolean
  placeholder?: string
}) {
  return (
    <Field label={label} hint={hint ?? (maxLength ? `${value.length}/${maxLength}` : undefined)}>
      <Textarea
        value={value}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "resize-none border-zinc-700/80 bg-zinc-900/60 text-[13px] leading-snug text-zinc-100 focus-visible:ring-violet-500/60",
          mono && "font-mono text-[11px]",
        )}
      />
    </Field>
  )
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  hint?: string
}) {
  return (
    <Field label={label} hint={hint}>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-zinc-700/80 bg-zinc-900 text-zinc-100">
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="text-[13px] focus:bg-violet-500/20">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

function SwitchField({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  hint?: string
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2">
      <div>
        <p className="text-[12px] font-medium text-zinc-200">{label}</p>
        {hint && <p className="text-[10px] text-zinc-500">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} className="data-[state=checked]:bg-violet-500" />
    </div>
  )
}

function CtaFields({
  cta,
  onChange,
  onRemove,
  removeLabel,
}: {
  cta: Cta
  onChange: (c: Cta) => void
  onRemove?: () => void
  removeLabel?: string
}) {
  return (
    <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Button</span>
        {onRemove && (
          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-rose-300 hover:bg-rose-500/10" onClick={onRemove}>
            {removeLabel ?? "Remove"}
          </Button>
        )}
      </div>
      <div className="grid grid-cols-[1fr_100px] gap-2">
        <Input
          value={cta.label}
          placeholder="Label"
          onChange={(e) => onChange({ ...cta, label: e.target.value })}
          className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100"
        />
        <Input
          value={cta.href}
          placeholder="#href"
          onChange={(e) => onChange({ ...cta, href: e.target.value })}
          className="h-8 border-zinc-700/80 bg-zinc-900/60 font-mono text-xs text-zinc-100"
        />
      </div>
    </div>
  )
}

/** Generic list editor with collapsible cards + reorder + remove + add */
function ListEditor<T>({
  items,
  onChange,
  createItem,
  renderFields,
  itemTitle,
  max = 12,
  addLabel = "Add item",
  label,
}: {
  items: T[]
  onChange: (items: T[]) => void
  createItem: () => T
  renderFields: (item: T, update: (patch: Partial<T>) => void) => React.ReactNode
  itemTitle: (item: T, i: number) => string
  max?: number
  addLabel?: string
  label?: string
}) {
  const [open, setOpen] = React.useState<number | null>(null)
  const updateAt = (i: number, patch: Partial<T>) => {
    const next = items.slice()
    next[i] = { ...next[i], ...patch }
    onChange(next)
  }
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const next = items.slice()
    const [x] = next.splice(i, 1)
    next.splice(j, 0, x)
    onChange(next)
    setOpen(j)
  }
  return (
    <div className="space-y-2">
      {label && <Label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label} ({items.length})</Label>}
      {items.map((item, i) => (
        <div key={i} className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center gap-1 px-2 py-1.5">
            <button
              type="button"
              className="flex flex-1 items-center gap-2 truncate text-left"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <ChevronsUpDown className={cn("h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform", open === i && "rotate-180")} />
              <span className="truncate text-[12px] text-zinc-200">{itemTitle(item, i)}</span>
            </button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-zinc-200" onClick={() => move(i, -1)} aria-label="Move up" disabled={i === 0}>
              <ArrowUp className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-zinc-200" onClick={() => move(i, 1)} aria-label="Move down" disabled={i === items.length - 1}>
              <ArrowDown className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-zinc-500 hover:text-rose-300"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              aria-label="Remove item"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          {open === i && <div className="space-y-2.5 border-t border-zinc-800 p-2.5">{renderFields(item, (patch) => updateAt(i, patch))}</div>}
        </div>
      ))}
      {items.length < max && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-full border-dashed border-zinc-700 bg-transparent text-[11px] text-zinc-400 hover:border-violet-500/50 hover:text-violet-300"
          onClick={() => {
            onChange([...items, createItem()])
            setOpen(items.length)
          }}
        >
          <Plus className="mr-1 h-3 w-3" /> {addLabel}
        </Button>
      )}
    </div>
  )
}

/** Simple list of editable strings (companies, field labels…) */
function StringListEditor({ label, items, onChange, createValue, addLabel, max = 12, placeholder }: { label?: string; items: string[]; onChange: (items: string[]) => void; createValue: () => string; addLabel?: string; max?: number; placeholder?: string }) {
  const updateAt = (i: number, v: string) => {
    const next = items.slice()
    next[i] = v
    onChange(next)
  }
  return (
    <div className="space-y-2">
      {label && <Label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label} ({items.length})</Label>}
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1">
          <Input
            value={item}
            placeholder={placeholder}
            onChange={(e) => updateAt(i, e.target.value)}
            className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100"
          />
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-zinc-500 hover:text-rose-300" onClick={() => onChange(items.filter((_, idx) => idx !== i))} aria-label="Remove">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      {items.length < max && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-full border-dashed border-zinc-700 bg-transparent text-[11px] text-zinc-400 hover:border-violet-500/50 hover:text-violet-300"
          onClick={() => onChange([...items, createValue()])}
        >
          <Plus className="mr-1 h-3 w-3" /> {addLabel ?? "Add"}
        </Button>
      )}
    </div>
  )
}

// ─── Per-section editors ─────────────────────────────────────────────────────

/**
 * Reusable section-level A/B test editor — variants override the section's
 * headline/title, sub/subtitle and (where the section has one CTA) its label.
 * Used by the hero, pricing, features, testimonials, FAQ, contact and final-CTA editors.
 */
function AbTestFields({
  ab,
  setAb,
  sectionTypeName,
  base,
  labels,
}: {
  ab?: AbConfig
  setAb: (ab: AbConfig) => void
  /** human name used in the header, e.g. "hero" / "pricing section" */
  sectionTypeName: string
  /** base copy the variants fall back to (A starts from here) */
  base: { headline: string; sub: string; ctaLabel: string }
  /** per-section field labels; ctaLabel undefined ⇒ section has no single CTA to override */
  labels: { headline: string; sub: string; ctaLabel?: string }
}) {
  const totalWeight = ab?.variants.reduce((s, v) => s + v.weight, 0) ?? 0
  const bSuggestion = AB_VARIANT_B_SUGGESTIONS[sectionTypeName] ?? "An alternative worth testing"
  const makeVariants = (): AbConfig["variants"] => [
    { id: "va", name: "A", headline: base.headline, sub: "", ctaLabel: "", weight: 50 },
    { id: "vb", name: "B", headline: bSuggestion, sub: "", ctaLabel: "", weight: 50 },
  ]
  return (
    <div className="space-y-3 rounded-lg border border-violet-500/25 bg-violet-500/5 p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[12px] font-semibold text-violet-200">A/B test this {sectionTypeName}</p>
          <p className="text-[10px] text-zinc-500">Weighted variants with auto-winner</p>
        </div>
        <Switch
          checked={ab?.enabled ?? false}
          aria-label={`A/B test this ${sectionTypeName}`}
          onCheckedChange={(enabled) =>
            setAb({
              ...(ab ?? { metric: "cta_click", autoWinner: true, sampleSize: 500, variants: [] }),
              enabled,
              variants: (ab?.variants ?? []).length >= 2 ? ab!.variants : makeVariants(),
            })
          }
          className="data-[state=checked]:bg-violet-500"
        />
      </div>
      {ab?.enabled && (
        <>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Sample size</Label>
              <Input
                type="number"
                min={50}
                step={50}
                value={ab.sampleSize}
                onChange={(e) => setAb({ ...ab, sampleSize: Math.max(50, Number(e.target.value) || 500) })}
                className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100"
              />
            </div>
            <div className="flex-1">
              <Label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Metric</Label>
              <div className="flex h-8 items-center rounded-md border border-zinc-700/80 bg-zinc-900/60 px-2 font-mono text-[11px] text-violet-300">{ab.metric}</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className={cn("font-medium", totalWeight === 100 ? "text-emerald-300" : "text-amber-300")}>
              Total weight: {totalWeight}% {totalWeight !== 100 && "(should be 100)"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1.5 text-[10px] text-violet-300 hover:bg-violet-500/10"
              onClick={() => {
                const w = Math.floor(100 / ab.variants.length)
                setAb({ ...ab, variants: ab.variants.map((v, i) => ({ ...v, weight: i === ab.variants.length - 1 ? 100 - w * (ab.variants.length - 1) : w })) })
              }}
            >
              Distribute evenly
            </Button>
          </div>
          <ListEditor
            items={ab.variants}
            onChange={(variants) => setAb({ ...ab, variants })}
            createItem={() => ({
              id: `v${Math.random().toString(36).slice(2, 6)}`,
              name: String.fromCharCode(65 + ab.variants.length),
              headline: `New variant ${labels.headline.toLowerCase()}`,
              sub: "",
              ctaLabel: "",
              weight: 0,
            })}
            itemTitle={(v) => `Variant ${v.name} · ${v.weight}%`}
            addLabel="Add variant"
            max={4}
            renderFields={(v, u) => (
              <div className="space-y-2">
                <div className="grid grid-cols-[70px_1fr_70px] gap-2">
                  <Input value={v.name} onChange={(e) => u({ name: e.target.value.slice(0, 2) })} className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
                  <Input type="number" value={v.weight} min={0} max={100} onChange={(e) => u({ weight: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })} className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
                  <div className="flex h-8 items-center text-[10px] text-zinc-500">weight %</div>
                </div>
                <Input value={v.headline} onChange={(e) => u({ headline: e.target.value })} className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" placeholder={labels.headline} />
                <Input value={v.sub ?? ""} onChange={(e) => u({ sub: e.target.value })} className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" placeholder={`${labels.sub} override (optional)`} />
                {labels.ctaLabel && (
                  <Input value={v.ctaLabel ?? ""} onChange={(e) => u({ ctaLabel: e.target.value })} className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" placeholder={`${labels.ctaLabel} override (optional)`} />
                )}
              </div>
            )}
          />
          <SwitchField label="Auto-promote winner" checked={ab.autoWinner} onChange={(autoWinner) => setAb({ ...ab, autoWinner })} hint="Auto-promote the winning variant when sample size is reached" />
        </>
      )}
    </div>
  )
}

type EditorProps<S extends Section> = { section: S; update: (patch: Partial<S>) => void }

function NavbarEditor({ section, update }: EditorProps<NavbarSection>) {
  return (
    <div className="space-y-4">
      <TextField label="Brand label override" value={section.brandLabel ?? ""} onChange={(v) => update({ brandLabel: v })} placeholder={useForge.getState().config.brand.name} hint="Empty = use page brand name" />
      <ListEditor
        label="Links"
        items={section.links}
        onChange={(links) => update({ links })}
        createItem={() => ({ label: "New link", href: "#" })}
        itemTitle={(l) => l.label}
        addLabel="Add link"
        renderFields={(l, u) => (
          <div className="grid grid-cols-[1fr_100px] gap-2">
            <Input value={l.label} onChange={(e) => u({ label: e.target.value })} className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
            <Input value={l.href} onChange={(e) => u({ href: e.target.value })} className="h-8 border-zinc-700/80 bg-zinc-900/60 font-mono text-xs text-zinc-100" />
          </div>
        )}
      />
      {section.cta ? (
        <CtaFields cta={section.cta} onChange={(cta) => update({ cta })} onRemove={() => update({ cta: undefined })} removeLabel="Remove CTA" />
      ) : (
        <Button variant="outline" size="sm" className="h-7 w-full border-dashed border-zinc-700 text-[11px] text-zinc-400" onClick={() => update({ cta: { label: "Get started", href: "#cta" } })}>
          <Plus className="mr-1 h-3 w-3" /> Add nav CTA
        </Button>
      )}
    </div>
  )
}

function HeroEditor({ section, update }: EditorProps<HeroSection>) {
  const brand = useForge((s) => s.config.brand)
  const hasSecondary = Boolean(section.secondaryCta?.label)
  return (
    <div className="space-y-4">
      <SelectField
        label="Layout"
        value={section.layout}
        onChange={(v) => update({ layout: v })}
        options={[
          { value: "split-right", label: "Split — visual right" },
          { value: "split-left", label: "Split — visual left" },
          { value: "center", label: "Centered" },
          { value: "full-bleed", label: "Full-bleed — rounded gradient card" },
          { value: "gradient", label: "Gradient — edge-to-edge statement" },
          { value: "video", label: "Video background — cinematic" },
          { value: "card", label: "Card — compact sign-up panel" },
          { value: "minimal", label: "Minimal — quiet, type only" },
        ]}
      />
      <TextField label="Badge" value={section.badge ?? ""} onChange={(v) => update({ badge: v })} placeholder="Now in public beta" />
      <TextAreaField label="Headline" value={section.headline} onChange={(v) => update({ headline: v })} rows={2} maxLength={90} />
      <TextAreaField label="Sub copy" value={section.sub} onChange={(v) => update({ sub: v })} rows={3} maxLength={200} />
      <CtaFields cta={section.cta} onChange={(cta) => update({ cta })} />
      {hasSecondary ? (
        <CtaFields cta={section.secondaryCta!} onChange={(secondaryCta) => update({ secondaryCta })} onRemove={() => update({ secondaryCta: undefined })} removeLabel="Remove secondary" />
      ) : (
        <Button variant="outline" size="sm" className="h-7 w-full border-dashed border-zinc-700 text-[11px] text-zinc-400" onClick={() => update({ secondaryCta: { label: "View demo", href: "#features" } })}>
          <Plus className="mr-1 h-3 w-3" /> Add secondary CTA
        </Button>
      )}
      <AiImageField
        label="Hero image"
        value={section.image ?? ""}
        onChange={(image) => update({ image })}
        suggestion={`Wide hero marketing shot for ${brand.name}: ${section.badge || section.headline || brand.tagline || "product"}. Modern, premium, cinematic lighting, on-theme.`}
        size="1440x768"
      />
      {section.layout === "video" ? (
        <TextField
          label="Background video URL"
          value={section.videoUrl ?? ""}
          onChange={(v) => update({ videoUrl: v })}
          placeholder="https://…/hero.mp4 (mp4/webm)"
          mono
          hint="Autoplaying muted loop behind the headline — falls back to the gradient when empty, uses the hero image as poster."
        />
      ) : null}
      <SwitchField
        label="Sticky mobile CTA"
        checked={section.stickyCta !== false}
        onChange={(v) => update({ stickyCta: v ? undefined : false })}
        hint="Brand-colored quick-action bar on phones — appears once the hero scrolls away, yields at the final CTA"
      />
      <ListEditor
        label="Trust stats"
        items={section.stats ?? []}
        onChange={(stats) => update({ stats })}
        createItem={() => ({ value: "10k+", label: "new stat" })}
        itemTitle={(s) => `${s.value} · ${s.label}`}
        addLabel="Add stat"
        max={4}
        renderFields={(s, u) => (
          <div className="grid grid-cols-[90px_1fr] gap-2">
            <Input value={s.value} onChange={(e) => u({ value: e.target.value })} className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
            <Input value={s.label} onChange={(e) => u({ label: e.target.value })} className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
          </div>
        )}
      />

      {/* A/B testing */}
      <AbTestFields
        ab={section.ab}
        setAb={(ab) => update({ ab })}
        sectionTypeName="hero"
        base={{ headline: section.headline, sub: section.sub, ctaLabel: section.cta.label }}
        labels={{ headline: "Headline", sub: "Sub copy", ctaLabel: "CTA label" }}
      />
    </div>
  )
}

function LogosEditor({ section, update }: EditorProps<LogosSection>) {
  return (
    <div className="space-y-4">
      <TextField label="Title" value={section.title ?? ""} onChange={(v) => update({ title: v })} placeholder="Trusted by teams at" />
      <StringListEditor
        label="Companies"
        items={section.items}
        onChange={(items) => update({ items })}
        createValue={() => "Company"}
        addLabel="Add company"
        placeholder="Company name"
      />
    </div>
  )
}

function FeaturesEditor({ section, update }: EditorProps<FeaturesSection>) {
  return (
    <div className="space-y-4">
      <TextField label="Title" value={section.title ?? ""} onChange={(v) => update({ title: v })} />
      <TextField label="Subtitle" value={section.subtitle ?? ""} onChange={(v) => update({ subtitle: v })} />
      <SelectField
        label="Style"
        value={section.style}
        onChange={(v) => update({ style: v })}
        options={[
          { value: "grid", label: "Grid" },
          { value: "alternating", label: "Alternating rows" },
          { value: "bento", label: "Bento" },
          { value: "tabs", label: "Tabs (interactive)" },
          { value: "carousel", label: "Carousel" },
        ]}
      />
      {section.style === "grid" && (
        <SelectField
          label="Columns"
          value={String(section.columns ?? 3)}
          onChange={(v) => update({ columns: Number(v) })}
          options={[
            { value: "2", label: "2 columns" },
            { value: "3", label: "3 columns" },
            { value: "4", label: "4 columns" },
          ]}
        />
      )}
      <ListEditor
        label="Features"
        items={section.items}
        onChange={(items) => update({ items })}
        createItem={() => ({ icon: "zap", title: "New feature", body: "Describe the benefit." })}
        itemTitle={(f) => f.title}
        addLabel="Add feature"
        renderFields={(f, u) => (
          <div className="space-y-2">
            <IconPickerField label="Icon" value={f.icon} onChange={(icon) => u({ icon })} />
            <Input value={f.title} onChange={(e) => u({ title: e.target.value })} placeholder="Feature title" className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
            <Textarea value={f.body} rows={2} onChange={(e) => u({ body: e.target.value })} className="resize-none border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
          </div>
        )}
      />
      <AbTestFields
        ab={section.ab}
        setAb={(ab) => update({ ab })}
        sectionTypeName="features"
        base={{ headline: section.title ?? "", sub: section.subtitle ?? "", ctaLabel: "" }}
        labels={{ headline: "Title", sub: "Subtitle" }}
      />
    </div>
  )
}

function StatsEditor({ section, update }: EditorProps<StatsSection>) {
  return (
    <div className="space-y-4">
      <TextField label="Title" value={section.title ?? ""} onChange={(v) => update({ title: v })} />
      <ListEditor
        label="Stats"
        items={section.items}
        onChange={(items) => update({ items })}
        createItem={() => ({ value: "100+", label: "new stat", delta: "" })}
        itemTitle={(s) => `${s.value} · ${s.label}`}
        addLabel="Add stat"
        max={6}
        renderFields={(s, u) => (
          <div className="space-y-2">
            <div className="grid grid-cols-[90px_1fr] gap-2">
              <Input value={s.value} onChange={(e) => u({ value: e.target.value })} className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
              <Input value={s.label} onChange={(e) => u({ label: e.target.value })} className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
            </div>
            <Input value={s.delta ?? ""} onChange={(e) => u({ delta: e.target.value })} placeholder="Delta e.g. +12% this quarter" className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
          </div>
        )}
      />
    </div>
  )
}

function TestimonialsEditor({ section, update }: EditorProps<TestimonialsSection>) {
  return (
    <div className="space-y-4">
      <TextField label="Title" value={section.title ?? ""} onChange={(v) => update({ title: v })} />
      <TextField label="Subtitle" value={section.subtitle ?? ""} onChange={(v) => update({ subtitle: v })} />
      <SelectField
        label="Style"
        value={section.style}
        onChange={(v) => update({ style: v })}
        options={[
          { value: "grid", label: "Grid" },
          { value: "marquee", label: "Marquee (scrolling)" },
          { value: "spotlight", label: "Spotlight" },
          { value: "video", label: "Video cards" },
          { value: "logo-wall", label: "Logo wall" },
        ]}
      />
      <ListEditor
        label="Testimonials"
        items={section.items}
        onChange={(items) => update({ items })}
        createItem={() => ({ quote: "Great product!", author: "New Author", role: "Title, Company", initials: "", rating: 5 })}
        itemTitle={(t) => `${t.author} ${"★".repeat(t.rating ?? 5)}`}
        addLabel="Add testimonial"
        renderFields={(t, u) => (
          <div className="space-y-2">
            <Textarea value={t.quote} rows={3} onChange={(e) => u({ quote: e.target.value })} className="resize-none border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
            <div className="grid grid-cols-2 gap-2">
              <Input value={t.author} onChange={(e) => u({ author: e.target.value })} placeholder="Author" className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
              <Input value={t.role} onChange={(e) => u({ role: e.target.value })} placeholder="Role" className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Rating</Label>
                <Slider
                  value={[t.rating ?? 5]}
                  min={1}
                  max={5}
                  step={1}
                  onValueChange={([r]) => u({ rating: r })}
                  className="[&_[data-slot=slider-range]]:bg-violet-500"
                />
              </div>
              <span className="text-[13px] text-amber-300">{"★".repeat(t.rating ?? 5)}</span>
            </div>
          </div>
        )}
      />
      <AbTestFields
        ab={section.ab}
        setAb={(ab) => update({ ab })}
        sectionTypeName="testimonials"
        base={{ headline: section.title ?? "", sub: section.subtitle ?? "", ctaLabel: "" }}
        labels={{ headline: "Title", sub: "Subtitle" }}
      />
    </div>
  )
}

function PricingEditor({ section, update }: EditorProps<PricingSection>) {
  return (
    <div className="space-y-4">
      <TextField label="Title" value={section.title ?? ""} onChange={(v) => update({ title: v })} />
      <TextField label="Subtitle" value={section.subtitle ?? ""} onChange={(v) => update({ subtitle: v })} />
      <SwitchField label="Annual toggle" checked={section.annualToggle ?? false} onChange={(annualToggle) => update({ annualToggle })} hint="Switch with 20% annual discount" />
      {section.annualToggle && <TextField label="Discount label" value={section.annualDiscountLabel ?? ""} onChange={(v) => update({ annualDiscountLabel: v })} placeholder="Save 20% annually" />}
      <ListEditor
        label="Plans"
        items={section.plans}
        onChange={(plans) => update({ plans })}
        createItem={() => ({ name: "New plan", price: "$19", period: "/mo", description: "", features: ["Feature one"], ctaLabel: "Choose plan" })}
        itemTitle={(p) => `${p.name} ${p.highlighted ? "★" : ""}`}
        addLabel="Add plan"
        max={5}
        renderFields={(p, u) => (
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_90px_60px] gap-2">
              <Input value={p.name} onChange={(e) => u({ name: e.target.value })} className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
              <Input value={p.price} onChange={(e) => u({ price: e.target.value })} placeholder="$29" className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
              <Input value={p.period ?? ""} onChange={(e) => u({ period: e.target.value })} placeholder="/mo" className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
            </div>
            <Input value={p.description ?? ""} onChange={(e) => u({ description: e.target.value })} placeholder="Short description" className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
            <Textarea
              value={p.features.join("\n")}
              rows={4}
              placeholder="One feature per line"
              onChange={(e) => u({ features: e.target.value.split("\n").filter((x) => x.trim() !== "") })}
              className="resize-none border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100"
            />
            <div className="grid grid-cols-[1fr_auto] items-center gap-2">
              <Input value={p.ctaLabel ?? ""} onChange={(e) => u({ ctaLabel: e.target.value })} placeholder="CTA label" className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
              <div className="flex h-9 items-center gap-1.5">
                <Switch checked={p.highlighted ?? false} onCheckedChange={(highlighted) => u({ highlighted })} className="data-[state=checked]:bg-violet-500" />
                <span className="text-[10px] text-zinc-400">Highlight</span>
              </div>
            </div>
          </div>
        )}
      />
      <AbTestFields
        ab={section.ab}
        setAb={(ab) => update({ ab })}
        sectionTypeName="pricing"
        base={{ headline: section.title ?? "", sub: section.subtitle ?? "", ctaLabel: "" }}
        labels={{ headline: "Title", sub: "Subtitle" }}
      />
    </div>
  )
}

function FaqEditor({ section, update }: EditorProps<FaqSection>) {
  return (
    <div className="space-y-4">
      <TextField label="Title" value={section.title ?? ""} onChange={(v) => update({ title: v })} />
      <TextField label="Subtitle" value={section.subtitle ?? ""} onChange={(v) => update({ subtitle: v })} />
      <SelectField
        label="Style"
        value={section.style}
        onChange={(v) => update({ style: v })}
        options={[
          { value: "accordion", label: "Accordion" },
          { value: "twocol", label: "Two columns" },
        ]}
      />
      <ListEditor
        label="Questions"
        items={section.items}
        onChange={(items) => update({ items })}
        createItem={() => ({ q: "New question?", a: "The answer." })}
        itemTitle={(f) => f.q}
        addLabel="Add question"
        renderFields={(f, u) => (
          <div className="space-y-2">
            <Input value={f.q} onChange={(e) => u({ q: e.target.value })} className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
            <Textarea value={f.a} rows={3} onChange={(e) => u({ a: e.target.value })} className="resize-none border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
          </div>
        )}
      />
      <AbTestFields
        ab={section.ab}
        setAb={(ab) => update({ ab })}
        sectionTypeName="faq"
        base={{ headline: section.title ?? "", sub: section.subtitle ?? "", ctaLabel: "" }}
        labels={{ headline: "Title", sub: "Subtitle" }}
      />
    </div>
  )
}

function GalleryEditor({ section, update }: EditorProps<GallerySection>) {
  const brandName = useForge((s) => s.config.brand.name)
  return (
    <div className="space-y-4">
      <TextField label="Title" value={section.title ?? ""} onChange={(v) => update({ title: v })} />
      <TextField label="Subtitle" value={section.subtitle ?? ""} onChange={(v) => update({ subtitle: v })} />
      <SelectField
        label="Style"
        value={section.style}
        onChange={(v) => update({ style: v })}
        options={[
          { value: "masonry", label: "Masonry" },
          { value: "carousel", label: "Carousel (swipeable)" },
          { value: "slider", label: "Slider (dots + arrows)" },
          { value: "stories", label: "Stories (tall cards, progress)" },
          { value: "ticker", label: "Ticker (auto-scrolling strip)" },
        ]}
      />
      <ListEditor
        label="Images"
        items={section.items}
        onChange={(items) => update({ items })}
        createItem={() => ({ src: "", alt: "New image", hue: String(Math.floor(Math.random() * 360)), caption: "" })}
        itemTitle={(g) => g.caption || g.alt}
        addLabel="Add image"
        renderFields={(g, u) => (
          <div className="space-y-2">
            <AiImageField
              key={`${g.alt}-${g.caption ?? ""}`}
              label="Image"
              value={g.src ?? ""}
              onChange={(src) => u({ src })}
              suggestion={`Marketing photo of ${g.caption?.trim() || g.alt}: ${brandName} product in a premium real-world setting, rich detail, shallow depth of field.`}
              size="1152x864"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input value={g.alt} onChange={(e) => u({ alt: e.target.value })} placeholder="Alt text" className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
              <Input value={g.caption ?? ""} onChange={(e) => u({ caption: e.target.value })} placeholder="Caption" className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
            </div>
            <div className="flex items-center gap-3">
              <div
                className="h-8 w-12 shrink-0 rounded-md border border-zinc-700"
                style={{ background: `linear-gradient(135deg, hsl(${g.hue ?? 260} 70% 45%), hsl(${Number(g.hue ?? 260) + 40} 80% 62%))` }}
              />
              <Slider
                value={[Number(g.hue ?? 260)]}
                min={0}
                max={360}
                step={1}
                onValueChange={([h]) => u({ hue: String(h) })}
                className="flex-1 [&_[data-slot=slider-range]]:bg-violet-500"
              />
              <span className="w-8 text-right font-mono text-[10px] text-zinc-400">{g.hue}</span>
            </div>
          </div>
        )}
      />
    </div>
  )
}

function ContactEditor({ section, update }: EditorProps<ContactSection>) {
  const [showSetup, setShowSetup] = React.useState(false)
  const delivery = section.delivery ?? "inbox"
  return (
    <div className="space-y-4">
      <TextField label="Title" value={section.title ?? ""} onChange={(v) => update({ title: v })} />
      <TextField label="Subtitle" value={section.subtitle ?? ""} onChange={(v) => update({ subtitle: v })} />
      <TextField label="Email" value={section.email ?? ""} onChange={(v) => update({ email: v })} placeholder="hello@example.com" mono />
      <TextField label="Phone" value={section.phone ?? ""} onChange={(v) => update({ phone: v })} placeholder="+1 …" mono />
      <StringListEditor
        label="Form fields"
        items={section.fields}
        onChange={(fields) => update({ fields })}
        createValue={() => "New field"}
        addLabel="Add field"
        placeholder="Field label"
      />
      <TextField label="Submit label" value={section.submitLabel} onChange={(v) => update({ submitLabel: v })} />

      {/* ── Delivery — where submissions go ─────────────────────────────── */}
      <div className="space-y-3 rounded-xl border border-zinc-800/80 bg-gradient-to-b from-emerald-500/[0.03] to-transparent p-3">
        <div className="flex items-center gap-2">
          <Sheet className="h-3.5 w-3.5 text-emerald-300" aria-hidden />
          <p className="text-[11px] font-semibold text-zinc-200">Delivery</p>
          <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300">
            {delivery === "inbox" ? "leads inbox" : delivery === "sheets" ? "sheet + inbox" : "embedded form"}
          </span>
        </div>
        <SelectField
          label="Submissions go to"
          value={delivery}
          onChange={(v) => {
            const patch: Partial<ContactSection> =
              v === "inbox" ? { delivery: undefined, sheetWebhookUrl: undefined, googleFormUrl: undefined } : { delivery: v }
            update(patch)
          }}
          options={[
            { value: "inbox", label: "Leads inbox — dashboard + CSV" },
            { value: "sheets", label: "Google Sheet webhook — Apps Script" },
            { value: "embed", label: "Embed an existing Google Form" },
          ]}
        />
        {delivery === "sheets" && (
          <>
            <TextField
              label="Sheet webhook URL"
              value={section.sheetWebhookUrl ?? ""}
              onChange={(v) => update({ sheetWebhookUrl: v || undefined })}
              placeholder="https://script.google.com/macros/s/…/exec"
              mono
              hint="Apps Script Web App URL — submissions POST here (no-cors) AND mirror into the leads inbox."
            />
            <button
              type="button"
              onClick={() => setShowSetup((s) => !s)}
              className="flex w-full items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-2.5 py-1.5 text-[11px] font-medium text-zinc-400 transition-colors hover:border-violet-500/50 hover:text-violet-200"
            >
              <ChevronsUpDown className="h-3 w-3" aria-hidden />
              {showSetup ? "Hide" : "Show"} the 6-step Google Sheet setup
            </button>
            {showSetup && <SheetSetupGuide fieldLabels={section.fields} />}
          </>
        )}
        {delivery === "embed" && (
          <TextField
            label="Google Form URL"
            value={section.googleFormUrl ?? ""}
            onChange={(v) => update({ googleFormUrl: v || undefined })}
            placeholder="https://docs.google.com/forms/d/e/…/viewform"
            mono
            hint="Renders as an embedded frame — submissions flow through the Google Form itself."
          />
        )}
        {delivery === "inbox" && (
          <p className="text-[10px] leading-relaxed text-zinc-500">
            Submissions land in the dashboard leads inbox with CSV export and live relay. The standalone HTML export
            falls back to the visitor&apos;s mail app (mailto) since it has no backend.
          </p>
        )}
      </div>

      <AbTestFields
        ab={section.ab}
        setAb={(ab) => update({ ab })}
        sectionTypeName="contact"
        base={{ headline: section.title ?? "", sub: section.subtitle ?? "", ctaLabel: section.submitLabel }}
        labels={{ headline: "Title", sub: "Subtitle", ctaLabel: "Submit label" }}
      />
    </div>
  )
}

/** Copyable Apps Script snippet + setup steps for the Google Sheet webhook. */
function SheetSetupGuide({ fieldLabels }: { fieldLabels: string[] }) {
  const snippet = [
    "function doPost(e) {",
    "  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();",
    "  var data = JSON.parse(e.postData.contents);",
    "  var keys = Object.keys(data);",
    "  if (sheet.getLastRow() === 0) {",
    "    sheet.appendRow(['Submitted'].concat(keys));",
    "  }",
    "  sheet.appendRow([new Date()].concat(keys.map(function (k) { return data[k] || ''; })));",
    "  return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);",
    "}",
  ].join("\n")
  const [copied, setCopied] = React.useState(false)
  return (
    <div className="space-y-2.5 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
      <ol className="list-decimal space-y-1 pl-4 text-[11px] leading-relaxed text-zinc-400">
        <li>Open your Google Sheet</li>
        <li>
          Click <span className="font-semibold text-zinc-300">Extensions → Apps Script</span>
        </li>
        <li>Delete any existing code and paste the snippet below</li>
        <li>
          Click <span className="font-semibold text-zinc-300">Deploy → New deployment</span>
        </li>
        <li>
          Type <span className="font-semibold text-zinc-300">Web app</span> · Execute as{" "}
          <span className="font-semibold text-zinc-300">Me</span> · Access{" "}
          <span className="font-semibold text-zinc-300">Anyone</span>
        </li>
        <li>Copy the Web App URL into the webhook field above</li>
      </ol>
      <p className="text-[10px] text-zinc-500">
        Works with any field labels ({fieldLabels.slice(0, 3).map((f) => `“${f}”`).join(", ") || "none configured"}
        {fieldLabels.length > 3 ? " …" : ""}) — headers are created on the first submit.
      </p>
      <div className="relative">
        <pre className="max-h-44 overflow-auto rounded-md border border-zinc-800 bg-zinc-900/80 p-2.5 font-mono text-[10px] leading-relaxed text-zinc-300 lf-scroll">{snippet}</pre>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard
              .writeText(snippet)
              .then(() => {
                setCopied(true)
                setTimeout(() => setCopied(false), 1600)
              })
              .catch(() => toast.error("Copy failed", { description: "Select the code manually instead." }))
          }}
          className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900/95 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-400 transition-colors hover:text-zinc-100"
          title="Copy the Apps Script snippet"
        >
          {copied ? <Check className="h-2.5 w-2.5 text-emerald-400" /> : <Copy className="h-2.5 w-2.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  )
}

function AboutEditor({ section, update }: EditorProps<AboutSection>) {
  return (
    <div className="space-y-4">
      <TextField label="Title" value={section.title ?? ""} onChange={(v) => update({ title: v })} />
      <TextField label="Subtitle" value={section.subtitle ?? ""} onChange={(v) => update({ subtitle: v })} />
      <SelectField
        label="Style"
        value={section.style}
        onChange={(v) => update({ style: v })}
        options={[
          { value: "mission", label: "Mission & values" },
          { value: "founder", label: "Founder letter" },
          { value: "timeline", label: "Timeline milestones" },
        ]}
      />
      {section.style !== "timeline" ? (
        <TextAreaField
          label={section.style === "founder" ? "The letter" : "Mission statement"}
          hint="Blank lines start a new paragraph."
          value={section.body ?? ""}
          onChange={(v) => update({ body: v })}
          rows={5}
        />
      ) : null}
      {section.style === "founder" ? (
        <div className="grid grid-cols-2 gap-2">
          <TextField
            label="Founder name"
            value={section.founder?.name ?? ""}
            onChange={(v) => update({ founder: { name: v, role: section.founder?.role ?? "Founder" } })}
          />
          <TextField
            label="Role"
            value={section.founder?.role ?? ""}
            onChange={(v) => update({ founder: { name: section.founder?.name ?? "", role: v } })}
          />
        </div>
      ) : null}
      <ListEditor
        label={section.style === "timeline" ? "Milestones" : section.style === "mission" ? "Values" : "Highlights (optional)"}
        items={section.items}
        onChange={(items) => update({ items })}
        createItem={() => ({ title: "New", body: "", year: "" })}
        itemTitle={(it) => (it.year ? `${it.year} · ${it.title}` : it.title)}
        addLabel={section.style === "timeline" ? "Add milestone" : "Add item"}
        renderFields={(it, u) => (
          <div className="space-y-2">
            {section.style === "timeline" ? (
              <Input value={it.year ?? ""} onChange={(e) => u({ year: e.target.value })} placeholder="Year" maxLength={12} className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
            ) : null}
            <Input value={it.title} onChange={(e) => u({ title: e.target.value })} placeholder="Title" maxLength={60} className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
            <TextAreaField label="Body" value={it.body} onChange={(v) => u({ body: v })} rows={2} maxLength={300} />
          </div>
        )}
      />
    </div>
  )
}

// ─── Narrative sections: announcement / problem / solution / video / comparison / guarantee ───

function AnnouncementEditor({ section, update }: EditorProps<AnnouncementSection>) {
  const deadlineValue = section.deadline && !Number.isNaN(Date.parse(section.deadline))
    ? new Date(section.deadline).toISOString().slice(0, 16)
    : ""
  return (
    <div className="space-y-4">
      <SelectField
        label="Style"
        value={section.style}
        onChange={(v) => update({ style: v })}
        options={[
          { value: "static", label: "Static — one line" },
          { value: "ticker", label: "Ticker — infinite scroll" },
          { value: "countdown", label: "Countdown — live timer" },
        ]}
      />
      <TextField label="Message" value={section.message} onChange={(v) => update({ message: v })} placeholder="Now in public beta" maxLength={140} />
      {section.style === "countdown" ? (
        <>
          <TextField
            label="Deadline"
            type="datetime-local"
            value={deadlineValue}
            onChange={(v) => update({ deadline: v ? new Date(v).toISOString() : undefined })}
            hint="Local time — stored as UTC. When it passes, the timer sits at 00:00:00."
          />
          <TextField label="Prefix label" value={section.prefixLabel ?? ""} onChange={(v) => update({ prefixLabel: v })} placeholder="Early access ends in" />
        </>
      ) : null}
      {section.link ? (
        <CtaFields cta={section.link} onChange={(link) => update({ link })} onRemove={() => update({ link: undefined })} removeLabel="Remove link" />
      ) : (
        <Button variant="outline" size="sm" className="h-7 w-full border-dashed border-zinc-700 text-[11px] text-zinc-400" onClick={() => update({ link: { label: "Learn more", href: "#cta" } })}>
          <Plus className="mr-1 h-3 w-3" /> Add link
        </Button>
      )}
    </div>
  )
}

/** Shared item editor for problem/solution/guarantee lists (icon + title + body). */
function PainItemFields({ item, u }: { item: PainItem; u: (patch: Partial<PainItem>) => void }) {
  return (
    <div className="space-y-2">
      <IconPickerField label="Icon" value={item.icon} onChange={(icon) => u({ icon })} />
      <Input value={item.title} onChange={(e) => u({ title: e.target.value })} placeholder="Item title" className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
      <Textarea value={item.body} rows={2} onChange={(e) => u({ body: e.target.value })} placeholder="One sharp sentence." className="resize-none border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
    </div>
  )
}

function ProblemEditor({ section, update }: EditorProps<ProblemSection>) {
  return (
    <div className="space-y-4">
      <TextField label="Title" value={section.title ?? ""} onChange={(v) => update({ title: v })} />
      <TextField label="Subtitle" value={section.subtitle ?? ""} onChange={(v) => update({ subtitle: v })} />
      <SelectField
        label="Style"
        value={section.style}
        onChange={(v) => update({ style: v })}
        options={[
          { value: "grid", label: "Grid — pain cards" },
          { value: "split", label: "Split — sticky intro + rows" },
        ]}
      />
      <ListEditor
        label="Pain points"
        items={section.items}
        onChange={(items) => update({ items })}
        createItem={() => ({ icon: "alert", title: "New pain point", body: "What does it cost them?" })}
        itemTitle={(it) => it.title}
        addLabel="Add pain point"
        renderFields={(it, u) => <PainItemFields item={it} u={u} />}
      />
    </div>
  )
}

function SolutionEditor({ section, update }: EditorProps<SolutionSection>) {
  return (
    <div className="space-y-4">
      <TextField label="Title" value={section.title ?? ""} onChange={(v) => update({ title: v })} />
      <TextField label="Subtitle" value={section.subtitle ?? ""} onChange={(v) => update({ subtitle: v })} />
      <SelectField
        label="Style"
        value={section.style}
        onChange={(v) => update({ style: v })}
        options={[
          { value: "grid", label: "Grid — capped cards" },
          { value: "split", label: "Split — sticky intro + cards" },
          { value: "steps", label: "Steps — numbered timeline" },
        ]}
      />
      <ListEditor
        label="Solution points"
        items={section.items}
        onChange={(items) => update({ items })}
        createItem={() => ({ icon: "check", title: "New solution", body: "How you remove the pain." })}
        itemTitle={(it) => it.title}
        addLabel="Add solution"
        renderFields={(it, u) => <PainItemFields item={it} u={u} />}
      />
    </div>
  )
}

function VideoEditor({ section, update }: EditorProps<VideoSection>) {
  return (
    <div className="space-y-4">
      <TextField label="Title" value={section.title ?? ""} onChange={(v) => update({ title: v })} />
      <TextField label="Subtitle" value={section.subtitle ?? ""} onChange={(v) => update({ subtitle: v })} />
      <SelectField
        label="Style"
        value={section.style}
        onChange={(v) => update({ style: v })}
        options={[
          { value: "cinematic", label: "Cinematic — full-width 21:10" },
          { value: "split", label: "Split — copy + video" },
          { value: "minimal", label: "Minimal — video only, snug" },
        ]}
      />
      <TextField
        label="Video URL"
        value={section.videoUrl}
        onChange={(v) => update({ videoUrl: v })}
        placeholder="YouTube link, Vimeo link, or https://…/clip.mp4"
        mono
        hint="YouTube & Vimeo links are auto-embedded; file URLs play with native controls."
      />
      <TextField label="Caption" value={section.caption ?? ""} onChange={(v) => update({ caption: v })} placeholder="Product tour — 90 seconds" />
      {section.style !== "minimal" ? (
        <AiImageField
          label="Poster image (file videos)"
          value={section.poster ?? ""}
          onChange={(poster) => update({ poster })}
          suggestion={`Poster frame for the ${section.title || "product"} video — decisive moment, rich color, cinematic.`}
          size="1344x768"
        />
      ) : null}
      {section.cta ? (
        <CtaFields cta={section.cta} onChange={(cta) => update({ cta })} onRemove={() => update({ cta: undefined })} removeLabel="Remove CTA" />
      ) : (
        <Button variant="outline" size="sm" className="h-7 w-full border-dashed border-zinc-700 text-[11px] text-zinc-400" onClick={() => update({ cta: { label: "Start building free", href: "#cta" } })}>
          <Plus className="mr-1 h-3 w-3" /> Add CTA
        </Button>
      )}
    </div>
  )
}

/** Cell editor — icon state select + custom text fallback. */
function ComparisonCellFields({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const isIcon = ["yes", "no", "partial"].includes((value ?? "").trim().toLowerCase())
  return (
    <div className="grid grid-cols-[112px_1fr] gap-2">
      <Select
        value={isIcon ? value.trim().toLowerCase() : "text"}
        onValueChange={(v) => onChange(v === "text" ? "Custom text" : v)}
      >
        <SelectTrigger className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[12px] text-zinc-200">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
          <SelectItem value="yes" className="text-[12px]">✓ Yes</SelectItem>
          <SelectItem value="no" className="text-[12px]">✗ No</SelectItem>
          <SelectItem value="partial" className="text-[12px]">– Partial</SelectItem>
          <SelectItem value="text" className="text-[12px]">Text…</SelectItem>
        </SelectContent>
      </Select>
      <Input
        value={isIcon ? "" : value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        disabled={isIcon}
        className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100 disabled:opacity-40"
      />
    </div>
  )
}

function ComparisonEditor({ section, update }: EditorProps<ComparisonSection>) {
  return (
    <div className="space-y-4">
      <TextField label="Title" value={section.title ?? ""} onChange={(v) => update({ title: v })} />
      <TextField label="Subtitle" value={section.subtitle ?? ""} onChange={(v) => update({ subtitle: v })} />
      <div className="grid grid-cols-2 gap-2">
        <TextField label="Us (column)" value={section.usLabel} onChange={(v) => update({ usLabel: v })} placeholder="Your product" />
        <TextField label="Them (column)" value={section.themLabel} onChange={(v) => update({ themLabel: v })} placeholder="Alternative" />
      </div>
      <ListEditor
        label="Rows"
        items={section.rows}
        onChange={(rows) => update({ rows })}
        createItem={() => ({ feature: "New comparison row", us: "yes", them: "no" })}
        itemTitle={(r) => r.feature}
        addLabel="Add row"
        renderFields={(r, u) => (
          <div className="space-y-2">
            <Input value={r.feature} onChange={(e) => u({ feature: e.target.value })} placeholder="Feature name" className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
            <ComparisonCellFields label="Our value" value={r.us} onChange={(v) => u({ us: v })} />
            <ComparisonCellFields label="Their value" value={r.them} onChange={(v) => u({ them: v })} />
          </div>
        )}
      />
      <TextField label="Footnote" value={section.note ?? ""} onChange={(v) => update({ note: v })} placeholder="Source or disclaimer" />
    </div>
  )
}

function GuaranteeEditor({ section, update }: EditorProps<GuaranteeSection>) {
  return (
    <div className="space-y-4">
      <TextField label="Title" value={section.title ?? ""} onChange={(v) => update({ title: v })} />
      <TextField label="Subtitle" value={section.subtitle ?? ""} onChange={(v) => update({ subtitle: v })} placeholder="30-day money-back guarantee" />
      <SelectField
        label="Style"
        value={section.style}
        onChange={(v) => update({ style: v })}
        options={[
          { value: "card", label: "Card — centered promise panel" },
          { value: "split", label: "Split — promise + terms" },
        ]}
      />
      <TextAreaField label="Promise" value={section.body ?? ""} onChange={(v) => update({ body: v })} rows={4} hint="Plain paragraphs — separate with a blank line." />
      <ListEditor
        label="Terms"
        items={section.items}
        onChange={(items) => update({ items })}
        createItem={() => ({ icon: "timer", title: "30 days", body: "Full refund window" })}
        itemTitle={(it) => it.title}
        addLabel="Add term"
        renderFields={(it, u) => <PainItemFields item={it} u={u} />}
      />
    </div>
  )
}

function OfferEditor({ section, update }: EditorProps<OfferSection>) {
  const deadlineValue = section.deadline && !Number.isNaN(Date.parse(section.deadline))
    ? new Date(section.deadline).toISOString().slice(0, 16)
    : ""
  return (
    <div className="space-y-4">
      <TextField label="Title" value={section.title ?? ""} onChange={(v) => update({ title: v })} placeholder="Limited-time offer" />
      <TextField label="Subtitle" value={section.subtitle ?? ""} onChange={(v) => update({ subtitle: v })} placeholder="Everything included, one simple price" />
      <SelectField
        label="Style"
        value={section.style}
        onChange={(v) => update({ style: v })}
        options={[
          { value: "card", label: "Card — centered offer block" },
          { value: "split", label: "Split — copy + countdown + offer card" },
        ]}
      />
      <TextField label="Urgency badge" value={section.badge ?? ""} onChange={(v) => update({ badge: v })} placeholder="Limited spots available" maxLength={60} />
      <div className="grid grid-cols-2 gap-2">
        <TextField label="Price" value={section.price} onChange={(v) => update({ price: v })} placeholder="$497" maxLength={40} />
        <TextField label="Original price" value={section.originalPrice ?? ""} onChange={(v) => update({ originalPrice: v })} placeholder="$997" maxLength={40} />
      </div>
      <TextField label="Period note" value={section.period ?? ""} onChange={(v) => update({ period: v })} placeholder="One-time payment" maxLength={60} />
      <TextField
        label="Savings label"
        value={section.savingsLabel ?? ""}
        onChange={(v) => update({ savingsLabel: v })}
        placeholder="Save 50% (auto-derived from prices when empty)"
        maxLength={60}
      />
      <TextField
        label="Deadline"
        type="datetime-local"
        value={deadlineValue}
        onChange={(v) => update({ deadline: v ? new Date(v).toISOString() : undefined })}
        hint="Local time — stored as UTC. Empty hides the countdown."
      />
      {section.deadline ? <TextField label="Countdown prefix" value={section.countdownPrefix ?? ""} onChange={(v) => update({ countdownPrefix: v })} placeholder="Offer ends in" maxLength={60} /> : null}
      <StringListEditor
        label="What's included"
        items={section.features}
        onChange={(features) => update({ features })}
        createValue={() => "New benefit"}
        addLabel="Add benefit"
        placeholder="Complete access to all features"
      />
      <CtaFields cta={section.cta} onChange={(cta) => update({ cta })} />
      <ListEditor
        label="Trust row"
        items={section.trust ?? []}
        onChange={(trust) => update({ trust: trust.length ? trust : undefined })}
        createItem={() => ({ icon: "lock", label: "Secure checkout" })}
        itemTitle={(it) => it.label}
        addLabel="Add trust item"
        renderFields={(it, u) => (
          <div className="space-y-2">
            <IconPickerField label="Icon" value={it.icon} onChange={(icon) => u({ icon })} />
            <Input value={it.label} onChange={(e) => u({ label: e.target.value })} placeholder="Secure checkout" className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
          </div>
        )}
      />
    </div>
  )
}

function CtaFinalEditor({ section, update }: EditorProps<CtaFinalSection>) {
  return (
    <div className="space-y-4">
      <TextAreaField label="Headline" value={section.headline} onChange={(v) => update({ headline: v })} rows={2} maxLength={70} />
      <TextAreaField label="Sub copy" value={section.sub ?? ""} onChange={(v) => update({ sub: v })} rows={2} maxLength={140} />
      <CtaFields cta={section.cta} onChange={(cta) => update({ cta })} />
      <TextField label="Note" value={section.note ?? ""} onChange={(v) => update({ note: v })} placeholder="No credit card required" />
      <AbTestFields
        ab={section.ab}
        setAb={(ab) => update({ ab })}
        sectionTypeName="cta-final"
        base={{ headline: section.headline, sub: section.sub ?? "", ctaLabel: section.cta.label }}
        labels={{ headline: "Headline", sub: "Sub copy", ctaLabel: "CTA label" }}
      />
    </div>
  )
}

/** Known social platforms (icon-backed) — anything else falls back to a globe glyph. */
const SOCIAL_PLATFORMS = ["X", "Twitter", "Facebook", "Instagram", "TikTok", "WhatsApp", "LinkedIn", "GitHub", "Discord", "YouTube", "Twitch"]

function FooterEditor({ section, update }: EditorProps<FooterSection>) {
  return (
    <div className="space-y-4">
      <SelectField
        label="Style"
        value={section.style}
        onChange={(v) => update({ style: v })}
        options={[
          { value: "minimal", label: "Minimal" },
          { value: "mega", label: "Mega" },
          { value: "newsletter", label: "Newsletter" },
        ]}
      />
      <TextAreaField label="Tagline" value={section.tagline ?? ""} onChange={(v) => update({ tagline: v })} rows={2} />
      <ListEditor
        label="Link groups"
        items={section.linkGroups}
        onChange={(linkGroups) => update({ linkGroups })}
        createItem={() => ({ group: "New group", items: [{ label: "Link", href: "#" }] })}
        itemTitle={(g) => g.group}
        addLabel="Add group"
        max={5}
        renderFields={(g, u) => (
          <div className="space-y-2">
            <Input value={g.group} onChange={(e) => u({ group: e.target.value })} className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
            <ListEditor
              items={g.items}
              onChange={(items) => u({ items })}
              createItem={() => ({ label: "Link", href: "#" })}
              itemTitle={(l) => l.label}
              addLabel="Add link"
              renderFields={(l, uu) => (
                <div className="grid grid-cols-[1fr_90px] gap-2">
                  <Input value={l.label} onChange={(e) => uu({ label: e.target.value })} className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100" />
                  <Input value={l.href} onChange={(e) => uu({ href: e.target.value })} className="h-8 border-zinc-700/80 bg-zinc-900/60 font-mono text-xs text-zinc-100" />
                </div>
              )}
            />
          </div>
        )}
      />
      <ListEditor
        label="Social links"
        items={section.socialLinks ?? []}
        onChange={(socialLinks) => update({ socialLinks })}
        createItem={() => ({ platform: "X", url: "" })}
        itemTitle={(s) => s.platform}
        addLabel="Add platform"
        max={8}
        renderFields={(s, u) => (
          <div className="space-y-2">
            <SelectField
              label="Platform"
              value={SOCIAL_PLATFORMS.includes(s.platform) ? s.platform : "custom"}
              onChange={(v) => u({ platform: v === "custom" ? "" : v })}
              options={[...SOCIAL_PLATFORMS.map((p) => ({ value: p, label: p })), { value: "custom", label: "Custom…" }]}
            />
            {!SOCIAL_PLATFORMS.includes(s.platform) ? (
              <Input
                value={s.platform}
                onChange={(e) => u({ platform: e.target.value })}
                placeholder="Platform name"
                className="h-8 border-zinc-700/80 bg-zinc-900/60 text-[13px] text-zinc-100"
              />
            ) : null}
            <Input
              value={s.url}
              onChange={(e) => u({ url: e.target.value })}
              placeholder="https://x.com/yourbrand — empty keeps the icon non-clickable"
              className="h-8 border-zinc-700/80 bg-zinc-900/60 font-mono text-xs text-zinc-100"
            />
          </div>
        )}
      />
      <TextField label="Copyright" value={section.copyright ?? ""} onChange={(v) => update({ copyright: v })} />
    </div>
  )
}

// ─── Shared per-section fields ────────────────────────────────────────────────

/** Entrance animation picker — shared by every section type. */
function AnimationField({ section }: { section: Section }) {
  const update = useForge((s) => s.updateSection)
  const value = section.animation ?? "none"
  return (
    <SelectField
      label="Entrance animation"
      hint="Plays once, when the section scrolls into view. Respects prefers-reduced-motion; included in the HTML export."
      value={value}
      onChange={(v) => update(section.id, { animation: v === "none" ? undefined : (v as SectionAnimation) } as Partial<Section>)}
      options={SECTION_ANIMATIONS.map((a) => ({ value: a.id, label: a.label }))}
    />
  )
}

/**
 * AI translation for this section into every configured non-default locale.
 * Calls /api/ai/translate with the section's translatable fields and stores
 * the results in config.i18n.translations[locale][sectionId].
 */
function TranslateSectionField({ section }: { section: Section }) {
  const config = useForge((s) => s.config)
  const setConfig = useForge((s) => s.setConfig)
  const [busy, setBusy] = React.useState<string | null>(null)
  const locales = localesOf(config).filter((l) => l.code !== localesOf(config)[0]?.code)


  if (locales.length === 0) return null

  const translate = async (locale: string) => {
    setBusy(locale)
    try {
      const paths = translatablePaths(section)
      const fields: Record<string, string> = {}
      for (const p of paths) {
        const v = readPath(section, p)
        if (v) fields[p] = v
      }
      if (Object.keys(fields).length === 0) {
        toast.error("Nothing to translate", { description: "This section has no editable copy yet." })
        return
      }
      const res = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale, sectionType: section.type, fields }),
      })
      const data = (await res.json()) as { translations?: Record<string, string>; error?: string }
      if (!res.ok || !data.translations) throw new Error(data.error ?? "Translation failed")
      const next = JSON.parse(JSON.stringify(config)) as typeof config
      next.i18n = next.i18n ?? { locales: [{ code: "en", label: "English" }], translations: {} }
      next.i18n.translations[locale] = next.i18n.translations[locale] ?? {}
      next.i18n.translations[locale][section.id] = data.translations
      setConfig(next)
      const count = Object.keys(data.translations).length
      toast.success(`Translated to ${locale.toUpperCase()}`, { description: `${count} field${count === 1 ? "" : "s"} — preview with the language switcher in the toolbar.` })
    } catch (e) {
      toast.error("Translation failed", { description: e instanceof Error ? e.message : undefined })
    } finally {
      setBusy(null)
    }
  }

  const clear = (locale: string) => {
    const next = JSON.parse(JSON.stringify(config)) as typeof config
    if (next.i18n?.translations?.[locale]?.[section.id]) {
      delete next.i18n.translations[locale][section.id]
      setConfig(next)
    }
  }

  return (
    <Field label="Translations" hint="AI-translates this section's copy per locale (config.i18n). Site language switcher lives in Page → Languages.">
      <div className="space-y-1.5">
        {locales.map((l) => {
          const has = translatedSectionIds(config, l.code).has(section.id)
          return (
            <div key={l.code} className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 flex-1 justify-start gap-1.5 border-zinc-800 bg-zinc-900/60 text-[11px] font-medium text-zinc-300 hover:border-violet-500/50 hover:text-violet-200"
                disabled={busy !== null}
                onClick={() => void translate(l.code)}
                title={has ? "Re-translate (overwrites the stored translation)" : "Translate this section"}
              >
                {busy === l.code ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                {l.label} {l.dir === "rtl" ? "· RTL" : ""}
                {has && <Check className="ml-auto h-3 w-3 text-emerald-400" />}
              </Button>
              {has && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[10px] text-zinc-500 hover:text-rose-300"
                  onClick={() => clear(l.code)}
                  title="Remove the stored translation for this locale"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </Field>
  )
}

// ─── Section switch ──────────────────────────────────────────────────────────

function SectionEditor({ section }: { section: Section }) {
  const update = (patch: Partial<Section>) => {
    useForge.getState().updateSection(section.id, patch as Partial<Section>)
  }
  switch (section.type) {
    case "announcement":
      return <AnnouncementEditor section={section} update={update as unknown as (p: Partial<AnnouncementSection>) => void} />
    case "navbar":
      return <NavbarEditor section={section} update={update as unknown as (p: Partial<NavbarSection>) => void} />
    case "hero":
      return <HeroEditor section={section} update={update as unknown as (p: Partial<HeroSection>) => void} />
    case "logos":
      return <LogosEditor section={section} update={update as unknown as (p: Partial<LogosSection>) => void} />
    case "features":
      return <FeaturesEditor section={section} update={update as unknown as (p: Partial<FeaturesSection>) => void} />
    case "stats":
      return <StatsEditor section={section} update={update as unknown as (p: Partial<StatsSection>) => void} />
    case "testimonials":
      return <TestimonialsEditor section={section} update={update as unknown as (p: Partial<TestimonialsSection>) => void} />
    case "pricing":
      return <PricingEditor section={section} update={update as unknown as (p: Partial<PricingSection>) => void} />
    case "faq":
      return <FaqEditor section={section} update={update as unknown as (p: Partial<FaqSection>) => void} />
    case "gallery":
      return <GalleryEditor section={section} update={update as unknown as (p: Partial<GallerySection>) => void} />
    case "about":
      return <AboutEditor section={section} update={update as unknown as (p: Partial<AboutSection>) => void} />
    case "problem":
      return <ProblemEditor section={section} update={update as unknown as (p: Partial<ProblemSection>) => void} />
    case "solution":
      return <SolutionEditor section={section} update={update as unknown as (p: Partial<SolutionSection>) => void} />
    case "video":
      return <VideoEditor section={section} update={update as unknown as (p: Partial<VideoSection>) => void} />
    case "comparison":
      return <ComparisonEditor section={section} update={update as unknown as (p: Partial<ComparisonSection>) => void} />
    case "guarantee":
      return <GuaranteeEditor section={section} update={update as unknown as (p: Partial<GuaranteeSection>) => void} />
    case "offer":
      return <OfferEditor section={section} update={update as unknown as (p: Partial<OfferSection>) => void} />
    case "contact":
      return <ContactEditor section={section} update={update as unknown as (p: Partial<ContactSection>) => void} />
    case "cta-final":
      return <CtaFinalEditor section={section} update={update as unknown as (p: Partial<CtaFinalSection>) => void} />
    case "footer":
      return <FooterEditor section={section} update={update as unknown as (p: Partial<FooterSection>) => void} />
  }
}

// ─── Brand kit (page tab) ─────────────────────────────────────────────────────

/** Brand font-pair picker: curated display/body stacks with live "Ag" previews.
 *  System stacks render instantly offline; ✦ pairs stream brand-true webfonts
 *  from Google Fonts (fallback stacks keep the page readable offline). */
function FontPicker() {
  const font = useForge((s) => s.config.brand.font)
  const updateBrand = useForge((s) => s.updateBrand)
  const dirty = useForge((s) => s.dirty)
  const activePair = FONT_PAIRS.find((p) => p.id === (font ?? "system"))

  // stream every ✦ pair once so the tiles preview true faces
  React.useEffect(() => {
    ensureAllGoogleFonts()
  }, [])

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Brand fonts</Label>
        <span className="ml-auto flex items-center gap-1 text-[9px] font-medium text-zinc-600" aria-hidden>
          <span className="text-zinc-500">system</span> · <span className="text-violet-400">✦ webfont</span>
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {FONT_PAIRS.map((p) => {
          const active = (font ?? "system") === p.id
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={active}
              title={`${p.label} — ${p.hint}`}
              onClick={() => updateBrand({ font: p.id === "system" ? undefined : p.id })}
              className={cn(
                "group relative flex flex-col items-center gap-0.5 rounded-lg border px-1 py-1.5 transition-all hover:border-violet-500/60 hover:bg-violet-500/5",
                active ? "border-violet-500 bg-violet-500/10 ring-1 ring-violet-500/40" : "border-zinc-800 bg-zinc-900/40"
              )}
            >
              {p.google && (
                <span
                  className={cn(
                    "absolute right-1 top-1 text-[8px] leading-none",
                    active ? "text-violet-300" : "text-zinc-600 group-hover:text-violet-400/70"
                  )}
                  aria-hidden
                >
                  ✦
                </span>
              )}
              <span
                className={cn("text-[15px] leading-none", active ? "text-violet-200" : "text-zinc-300")}
                style={{ fontFamily: p.display }}
                aria-hidden
              >
                Ag
              </span>
              <span className={cn("text-[9px] font-medium leading-none", active ? "text-violet-300" : "text-zinc-500")}>{p.label}</span>
            </button>
          )
        })}
      </div>
      <p className="text-[10px] leading-tight text-zinc-500">
        {activePair?.google ? (
          <>
            <span className="text-violet-300">✦ {activePair.label}</span> — webfonts stream from Google Fonts on the
            preview, published page and export; a fallback system stack renders while they load or if the visitor is
            offline.{" "}
            {dirty ? (
              <span className="text-amber-300/80">Draft — unsaved changes not on the published page yet.</span>
            ) : (
              <span className="text-emerald-300/80">Live on the published page ✓</span>
            )}
          </>
        ) : (
          <>
            Display type for headlines, body stays readable. System stacks need no webfont download; ✦ pairs add
            brand-true Google type.
          </>
        )}
      </p>
    </div>
  )
}

/** Brand accent picker: presets, native color input, live CTA preview, reset. */
function AccentPicker() {
  const accent = useForge((s) => s.config.brand.accent)
  const themeId = useForge((s) => s.config.themeId)
  const updateBrand = useForge((s) => s.updateBrand)
  const themeAccent = themeVars(themeId, getTheme(themeId).mode).accent
  const effective = accent || themeAccent
  const preview = accentVars(effective)

  const setAccent = (hex: string) => {
    const v = hex.trim()
    if (!v) {
      updateBrand({ accent: undefined })
      return
    }
    if (!isValidAccent(v)) return // invalid hex — keep current until it parses
    updateBrand({ accent: v.startsWith("#") ? v : `#${v}` })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Brand accent</Label>
        {accent && (
          <button
            type="button"
            className="ml-auto flex items-center gap-1 rounded-md border border-zinc-700 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
            onClick={() => updateBrand({ accent: undefined })}
            title={`Back to the ${getTheme(themeId).name} theme's built-in accent (${themeAccent})`}
          >
            <Trash2 className="h-2.5 w-2.5" /> Reset to theme
          </button>
        )}
      </div>

      {/* presets */}
      <div className="flex flex-wrap items-center gap-1.5">
        {ACCENT_PRESETS.map((p) => (
          <button
            key={p.hex}
            type="button"
            aria-label={`${p.name} accent`}
            title={`${p.name} — ${p.hex}`}
            onClick={() => updateBrand({ accent: p.hex })}
            className={cn(
              "size-6 rounded-full border transition-transform hover:scale-110",
              accent?.toLowerCase() === p.hex.toLowerCase() ? "border-zinc-100 ring-2 ring-violet-500/70" : "border-zinc-700"
            )}
            style={{ background: p.hex }}
          />
        ))}
        {/* native color picker */}
        <label
          className="relative flex h-6 cursor-pointer items-center gap-1 overflow-hidden rounded-md border border-dashed border-zinc-600 px-1.5 text-[9px] font-semibold text-zinc-400 transition-colors hover:border-violet-400 hover:text-violet-200"
          title="Pick any color — contrast-safe text is computed automatically"
        >
          <span
            aria-hidden
            className="size-3.5 rounded-[4px] border border-white/20"
            style={{ background: effective }}
          />
          Custom
          <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(effective) ? effective : "#a78bfa"}
            onChange={(e) => setAccent(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Custom accent color"
          />
        </label>
        {/* hex input */}
        <Input
          value={accent ?? ""}
          onChange={(e) => setAccent(e.target.value)}
          placeholder={`${themeAccent} (theme)`}
          maxLength={7}
          className="h-6 w-24 border-zinc-700/80 bg-zinc-900/60 font-mono text-[11px] text-zinc-200 focus-visible:ring-violet-500/60"
          aria-label="Accent hex value"
        />
      </div>

      {/* live CTA preview — shows buttons/chips exactly as the page will render them */}
      <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 p-2">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">Preview</span>
        <span className="flex items-center gap-2">
          {preview && (
            <>
              <span className="rounded-lg px-2.5 py-1 text-[11px] font-semibold" style={{ background: preview.accent, color: preview.accentText }}>
                Get started
              </span>
              <span className="rounded-md px-1.5 py-0.5 text-[10px]" style={{ background: preview.accentSoft, color: preview.accent }}>
                chip
              </span>
              <span className="h-4 w-1.5 rounded-sm" style={{ background: preview.accent }} aria-hidden />
            </>
          )}
        </span>
        <span className="ml-auto font-mono text-[9px] text-zinc-600">{effective}</span>
      </div>
      <p className="text-[10px] leading-tight text-zinc-500">
        Overrides the theme's accent on buttons, links and highlights. Text contrast is computed automatically.
      </p>
    </div>
  )
}

// ─── Anchor override (section tab) ───────────────────────────────────────────

/** Per-section anchor id override — navbar/footer links like #<anchor> scroll here. */
function AnchorField({ section }: { section: Section }) {
  const update = useForge((s) => s.updateSection)
  const value = section.anchor ?? ""
  const slug = useForge((s) => s.project.slug)
  const onChange = (raw: string) => {
    const slugified = raw.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "")
    update(section.id, ({ anchor: slugified || undefined } as Partial<Section>))
  }
  const typeAnchor = section.type === "hero" ? "top" : section.type === "cta-final" ? "cta" : section.type
  const activeAnchor = value || typeAnchor
  const copyDeepLink = () => {
    const url = `${window.location.origin}/p/${encodeURIComponent(slug)}#${activeAnchor}`
    void navigator.clipboard
      .writeText(url)
      .then(() => toast.success(`Deep link copied 🔗 #${activeAnchor}`, { description: "Opens the published page scrolled to this section." }))
      .catch(() => toast.error("Copy failed", { description: url }))
  }
  return (
    <Field
      label="Anchor link"
      hint={value ? `Navbar links with href="#${value}" scroll to this section.` : `Auto — #${typeAnchor} (from the section type). Type to override.`}
    >
      <div className="flex items-center gap-1.5">
        <span className="flex h-8 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900/60 font-mono text-xs text-zinc-500" aria-hidden>
          <Link2 className="h-3 w-3" />
        </span>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={typeAnchor}
          maxLength={40}
          className="h-8 border-zinc-700/80 bg-zinc-900/60 font-mono text-xs text-zinc-100 focus-visible:ring-violet-500/60"
          aria-label="Custom anchor id for this section"
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 gap-1 px-2 text-[10px] text-zinc-400 hover:text-emerald-300"
          onClick={copyDeepLink}
          title={`Copy ${window.location.origin}/p/${encodeURIComponent(slug || "")}#${activeAnchor} — opens the published page scrolled here`}
        >
          <Copy className="h-3 w-3" /> Link
        </Button>
        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 px-2 text-[10px] text-zinc-500 hover:text-rose-300"
            onClick={() => update(section.id, { anchor: undefined } as Partial<Section>)}
            title="Back to the automatic anchor"
          >
            Auto
          </Button>
        )}
      </div>
    </Field>
  )
}

// ─── Page settings tab ───────────────────────────────────────────────────────

/** Page → Languages: configure site locales (first = default). Translations
 *  themselves are produced per-section via the Translate field. */
function LanguagesManager({ config }: { config: LandingConfig }) {
  const setConfig = useForge((s) => s.setConfig)
  const [draft, setDraft] = React.useState("")
  const [busyPage, setBusyPage] = React.useState<string | null>(null)
  const locales = localesOf(config)
  const pagePaths = pageTranslatablePaths(config)

  const save = (next: { code: string; label?: string; dir?: "ltr" | "rtl" }[]) => {
    const cleaned = next.filter((l) => l.code.trim())
    setConfig({ ...config, i18n: cleaned.length ? { locales: cleaned, translations: config.i18n?.translations ?? {} } : undefined } as typeof config)
  }

  const add = () => {
    const code = draft.trim().toLowerCase().replace(/[^a-z-]/g, "").slice(0, 8)
    if (!code || locales.some((l) => l.code === code)) return
    save([...locales.map((l) => ({ code: l.code, label: l.label, dir: l.dir })), { code, label: code.toUpperCase() }])
    setDraft("")
  }

  const moveFirst = (code: string) => {
    const cur = locales.map((l) => ({ code: l.code, label: l.label, dir: l.dir }))
    const idx = cur.findIndex((l) => l.code === code)
    if (idx > 0) save([cur[idx], ...cur.slice(0, idx), ...cur.slice(idx + 1)])
  }

  /** AI-translate the PAGE-level strings (cookie-consent banner copy) and
   *  store them under the __page pseudo-section so compliance UI speaks the
   *  visitor's language. */
  const translatePage = async (locale: string, label: string) => {
    if (pagePaths.length === 0) return
    setBusyPage(locale)
    try {
      const fields: Record<string, string> = {}
      for (const p of pagePaths) {
        const v = readPath(config, p)
        if (v) fields[p] = v
      }
      const res = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale, sectionType: "page", fields }),
      })
      const data = (await res.json()) as { translations?: Record<string, string>; error?: string }
      if (!res.ok || !data.translations) throw new Error(data.error ?? "Translation failed")
      const next = JSON.parse(JSON.stringify(config)) as typeof config
      next.i18n = next.i18n ?? { locales: [{ code: "en", label: "English" }], translations: {} }
      next.i18n.translations[locale] = next.i18n.translations[locale] ?? {}
      next.i18n.translations[locale][PAGE_TRANSLATION_KEY] = data.translations
      setConfig(next)
      toast.success(`Page strings → ${label}`, {
        description: `${Object.keys(data.translations).length} field${Object.keys(data.translations).length === 1 ? "" : "s"} — consent banner now speaks ${label}.`,
      })
    } catch (e) {
      toast.error("Page translation failed", { description: e instanceof Error ? e.message : undefined })
    } finally {
      setBusyPage(null)
    }
  }

  return (
    <div className="space-y-2 rounded-xl border border-zinc-800/80 bg-gradient-to-b from-violet-500/[0.04] to-transparent p-3">
      <div className="flex items-center gap-2">
        <Languages className="h-3.5 w-3.5 text-violet-300" aria-hidden />
        <p className="text-[11px] font-semibold text-zinc-200">Languages</p>
        <span className="rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-violet-300">multilingual</span>
      </div>
      <p className="text-[10px] leading-relaxed text-zinc-500">
        First locale is the default. Translated sections get a language switcher on the published page (&#8805;2 locales). Arabic, Hebrew, Farsi &amp; Urdu flip the page to RTL automatically.
      </p>
      <div className="space-y-1.5">
        {locales.map((l, i) => (
          <div key={l.code} className="flex items-center gap-1.5">
            <div className="flex h-7 min-w-0 flex-1 items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/60 px-2">
              <span className="font-mono text-[10px] font-semibold text-violet-300">{l.code}</span>
              <span className="truncate text-[11px] text-zinc-300">{l.label}</span>
              {l.dir === "rtl" && <span className="rounded bg-zinc-800 px-1 text-[9px] font-semibold text-amber-300">RTL</span>}
              {i === 0 && <span className="ml-auto rounded bg-emerald-500/10 px-1.5 text-[9px] font-semibold text-emerald-300">default</span>}
            </div>
            {i > 0 && (
              <>
                {pagePaths.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-zinc-500 hover:text-violet-300"
                    title={`Translate page strings (consent banner) to ${l.label}`}
                    disabled={busyPage !== null}
                    onClick={() => void translatePage(l.code, l.label)}
                  >
                    {busyPage === l.code ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-zinc-500" title="Make default" onClick={() => moveFirst(l.code)}>
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-zinc-500 hover:text-rose-300"
                  title={`Remove ${l.label} (translations are kept but unused)`}
                  onClick={() => save(locales.map((x) => ({ code: x.code, label: x.label, dir: x.dir })).filter((x) => x.code !== l.code))}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              add()
            }
          }}
          placeholder="add locale — ar, fr, es…"
          maxLength={8}
          className="h-7 border-zinc-700/80 bg-zinc-900/60 font-mono text-[11px] text-zinc-100 focus-visible:ring-violet-500/60"
          aria-label="New locale code"
        />
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 border-zinc-700 bg-zinc-900/60 text-[10px] text-zinc-300 hover:border-violet-500/50"
          onClick={add}
          disabled={!draft.trim()}
        >
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>
    </div>
  )
}

/** Privacy & tracking — cookie-consent banner + custom third-party scripts.
 *  Scripts stay gated behind the banner whenever it's enabled (GDPR-friendly);
 *  the built-in analytics is cookie-free and always runs. */
function PrivacyTrackingManager() {
  const consent = useForge((s) => s.config.legal?.cookieConsent)
  const tracking = useForge((s) => s.config.tracking)
  const updateLegal = useForge((s) => s.updateLegal)
  const updateTracking = useForge((s) => s.updateTracking)
  const enabled = consent?.enabled === true
  const hasScripts = Boolean(tracking?.headScripts?.trim() || tracking?.bodyScripts?.trim())
  const gated = enabled && hasScripts

  return (
    <div className="space-y-4 rounded-xl border border-zinc-800/80 bg-gradient-to-b from-amber-500/[0.03] to-transparent p-3">
      <div className="flex items-center gap-2">
        <Cookie className="h-3.5 w-3.5 text-amber-300" aria-hidden />
        <p className="text-[11px] font-semibold text-zinc-200">Privacy &amp; tracking</p>
        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${gated ? "bg-emerald-500/10 text-emerald-300" : enabled ? "bg-amber-500/10 text-amber-300" : "bg-zinc-700/30 text-zinc-500"}`}>
          {gated ? "consent-gated" : enabled ? "banner on" : "no banner"}
        </span>
      </div>

      <SwitchField
        label="Cookie-consent banner"
        hint="Fixed banner on the published page + HTML export. Custom scripts below only load after the visitor accepts."
        checked={enabled}
        onChange={(v) => updateLegal({ cookieConsent: { enabled: v } })}
      />

      {enabled && (
        <>
          <TextAreaField
            label="Banner message"
            value={consent?.message ?? ""}
            onChange={(message) => updateLegal({ cookieConsent: { message } })}
            rows={2}
            maxLength={400}
            placeholder="We use cookies to enhance your experience. By continuing you agree to our use of cookies."
            hint="Plain language works best — this string is AI-translatable per locale."
          />
          <div className="grid grid-cols-2 gap-2">
            <TextField
              label="Accept label"
              value={consent?.acceptLabel ?? "Accept"}
              onChange={(acceptLabel) => updateLegal({ cookieConsent: { acceptLabel } })}
              maxLength={40}
            />
            <TextField
              label="Decline label"
              value={consent?.declineLabel ?? "Decline"}
              onChange={(declineLabel) => updateLegal({ cookieConsent: { declineLabel } })}
              maxLength={40}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <SelectField
              label="Position"
              value={consent?.position ?? "bottom"}
              onChange={(position) => updateLegal({ cookieConsent: { position: position as "bottom" | "top" } })}
              options={[
                { value: "bottom", label: "Bottom edge" },
                { value: "top", label: "Top edge" },
              ]}
            />
            <TextField
              label="Learn-more URL"
              value={consent?.learnMoreUrl ?? ""}
              onChange={(learnMoreUrl) => updateLegal({ cookieConsent: { learnMoreUrl: learnMoreUrl || undefined } })}
              maxLength={300}
              placeholder="https://…/privacy"
              hint="Optional link shown beside the buttons."
            />
          </div>
        </>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Custom scripts</Label>
          {gated && (
            <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300">
              load after consent
            </span>
          )}
        </div>
        <TextAreaField
          label="Head scripts"
          value={tracking?.headScripts ?? ""}
          onChange={(headScripts) => updateTracking({ headScripts })}
          rows={3}
          maxLength={8000}
          mono
          placeholder="<script>…GA4 / Meta Pixel / TikTok…</script>"
          hint="Raw markup or bare JS — injected into <head>."
        />
        <TextAreaField
          label="Body scripts"
          value={tracking?.bodyScripts ?? ""}
          onChange={(bodyScripts) => updateTracking({ bodyScripts })}
          rows={3}
          maxLength={8000}
          mono
          placeholder="<!-- chat widgets, conversion scripts -->"
          hint="Injected before </body> — chat widgets etc."
        />
        <p className="text-[10px] leading-relaxed text-zinc-500">
          Built-in pageview/CTA/lead analytics is cookie-free and always runs — these fields are for third-party
          tags only. {enabled ? "With the banner on, they wait for the visitor's Accept." : "With no banner they load immediately (owner's choice)."}
        </p>
      </div>
    </div>
  )
}

// ─── Legal pages — privacy / terms bodies, footer links, HTML export ─────────

/** Solid starter text so the editor never starts from a blank page. */
const PRIVACY_TEMPLATE = `## What we collect
We collect the information you explicitly submit through forms on this site (such as your name and email address) and privacy-friendly, aggregated usage statistics.

- Form submissions are stored in the site's leads inbox
- Analytics records pageviews without cookies or personal identifiers
- No third-party trackers run unless you accept the cookie banner

## How we use it
Submitted information is used solely to respond to your inquiry. We never sell or share your personal data with third parties for marketing purposes.

## Your rights
You can request a copy or deletion of your personal data at any time by contacting us. Requests are honored within 30 days.

## Contact
Questions about this policy can be sent through the contact form on this site.`

const TERMS_TEMPLATE = `## Acceptance
By accessing this site you agree to these terms. If you do not agree, please stop using the site.

## Use of the site
- The content provided is for general information and may change without notice
- You may not reuse site content commercially without written permission
- You agree not to disrupt or attempt to compromise the site's infrastructure

## No warranty
This site and its content are provided "as is" without warranties of any kind, express or implied.

## Limitation of liability
To the maximum extent permitted by law, the site owner is not liable for any damages arising from the use of this site.

## Changes
Updated terms take effect when published on this page. Continued use after changes means acceptance.`

/** Privacy / Terms content + footer links + standalone-page export. */
function LegalPagesManager() {
  const config = useForge((s) => s.config)
  const updateLegal = useForge((s) => s.updateLegal)
  const privacy = config.legal?.privacyPolicy ?? ""
  const terms = config.legal?.termsConditions ?? ""

  const exportOne = (kind: "privacy" | "terms") => {
    const ok = downloadLegalHtml(config, kind)
    if (ok) toast.success(`${kind === "privacy" ? "privacy.html" : "terms.html"} downloaded`)
    else toast.error("Nothing to export", { description: `Add ${kind === "privacy" ? "privacy policy" : "terms & conditions"} content first.` })
  }

  return (
    <div className="space-y-4 rounded-xl border border-zinc-800/80 bg-gradient-to-b from-sky-500/[0.03] to-transparent p-3">
      <div className="flex items-center gap-2">
        <Scale className="h-3.5 w-3.5 text-sky-300" aria-hidden />
        <p className="text-[11px] font-semibold text-zinc-200">Legal pages</p>
        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${privacy || terms ? "bg-sky-500/10 text-sky-300" : "bg-zinc-700/30 text-zinc-500"}`}>
          {privacy && terms ? "2 pages" : privacy || terms ? "1 page" : "empty"}
        </span>
      </div>
      <p className="text-[10px] leading-relaxed text-zinc-500">
        Plain text — blank lines split paragraphs, <code className="rounded bg-zinc-800 px-1 font-mono">## headings</code> and{" "}
        <code className="rounded bg-zinc-800 px-1 font-mono">- bullets</code> render styled. Exported as standalone themed pages
        (privacy.html / terms.html) alongside the landing HTML.
      </p>

      {[
        { key: "privacy" as const, label: "Privacy policy", body: privacy, template: PRIVACY_TEMPLATE, file: "privacy.html" },
        { key: "terms" as const, label: "Terms & conditions", body: terms, template: TERMS_TEMPLATE, file: "terms.html" },
      ].map((page) => (
        <div key={page.key} className="space-y-2 rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              <FileText className="h-3 w-3" />
              {page.label}
            </span>
            <div className="flex items-center gap-1.5">
              {!page.body.trim() ? (
                <Button variant="outline" size="sm" className="h-6 gap-1 border-dashed border-zinc-700 px-2 text-[10px] text-zinc-400 hover:border-sky-500/50 hover:text-sky-300" onClick={() => updateLegal({ [page.key === "privacy" ? "privacyPolicy" : "termsConditions"]: page.template })}>
                  <Sparkles className="h-3 w-3" /> Draft
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="h-6 gap-1 border-zinc-700 px-2 text-[10px] text-zinc-300 hover:border-sky-500/50 hover:text-sky-300" onClick={() => exportOne(page.key)}>
                  <Download className="h-3 w-3" /> {page.file}
                </Button>
              )}
            </div>
          </div>
          <Textarea
            value={page.body}
            rows={6}
            onChange={(e) => updateLegal({ [page.key === "privacy" ? "privacyPolicy" : "termsConditions"]: e.target.value })}
            placeholder={page.key === "privacy" ? "What you collect, how you use it, visitor rights…" : "Acceptance, use rules, warranty, liability…"}
            className="resize-y border-zinc-700/80 bg-zinc-900/60 font-mono text-[12px] leading-relaxed text-zinc-200 placeholder:text-zinc-600"
          />
        </div>
      ))}

      <div className="space-y-2.5 rounded-lg border border-zinc-800/80 bg-zinc-900/40 p-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Footer legal links</span>
        {(
          [
            { key: "docsUrl" as const, label: "Documentation", placeholder: "https://docs.yoursite.com" },
            { key: "privacyUrl" as const, label: "Privacy", placeholder: "privacy.html" },
            { key: "termsUrl" as const, label: "Terms", placeholder: "terms.html" },
          ] as const
        ).map((f) => (
          <div key={f.key} className="grid grid-cols-[92px_1fr] items-center gap-2">
            <Label className="text-[11px] text-zinc-400">{f.label}</Label>
            <Input
              value={config.legal?.[f.key] ?? ""}
              onChange={(e) => updateLegal({ [f.key]: e.target.value.trim() || undefined })}
              placeholder={f.placeholder}
              className="h-7 border-zinc-700/80 bg-zinc-900/60 font-mono text-[11px] text-zinc-200"
            />
          </div>
        ))}
        <p className="text-[10px] leading-relaxed text-zinc-500">
          Links render beside the footer copyright. Use <code className="rounded bg-zinc-800 px-1 font-mono">privacy.html</code> /{" "}
          <code className="rounded bg-zinc-800 px-1 font-mono">terms.html</code> to point at the exported pages when hosting them together.
        </p>
      </div>
    </div>
  )
}

function PageSettings() {
  const config = useForge((s) => s.config)
  const setTheme = useForge((s) => s.setTheme)
  const updateBrand = useForge((s) => s.updateBrand)
  const updateSeo = useForge((s) => s.updateSeo)
  return (
    <div className="space-y-5">
      <TextField label="Brand name" value={config.brand.name} onChange={(name) => updateBrand({ name })} maxLength={40} />
      <TextField label="Tagline" value={config.brand.tagline ?? ""} onChange={(tagline) => updateBrand({ tagline })} />

      {/* Brand kit — logo + accent + font + color scheme */}
      <div className="space-y-4 rounded-xl border border-zinc-800/80 bg-gradient-to-b from-violet-500/[0.04] to-transparent p-3">
        <div className="flex items-center gap-2">
          <Hash className="h-3.5 w-3.5 text-violet-300" aria-hidden />
          <p className="text-[11px] font-semibold text-zinc-200">Brand kit</p>
          <span className="rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-violet-300">applies site-wide</span>
        </div>
        <AiImageField
          label="Logo"
          value={config.brand.logoUrl}
          onChange={(logoUrl) => updateBrand({ logoUrl: logoUrl || undefined })}
          suggestion={`minimal logo mark for "${config.brand.name}", flat vector style, simple geometric shapes, centered, clean background`}
          size="1024x1024"
          allowUpload
        />
        <AccentPicker />
        <FontPicker />
        <ModePicker />
      </div>

      <TextField label="SEO title" value={config.seo.title} onChange={(title) => updateSeo({ title })} maxLength={70} hint={`${config.seo.title.length}/70 — shown in search results & link previews`} />
      <TextAreaField label="SEO description" value={config.seo.description} onChange={(description) => updateSeo({ description })} rows={3} maxLength={160} hint={`${config.seo.description.length}/160`} />
      <SwitchField
        label="Hide from search engines"
        hint="Adds noindex, nofollow to the published page and the HTML export."
        checked={config.seo.noIndex === true}
        onChange={(v) => updateSeo({ noIndex: v || undefined })}
      />
      <TextField
        label="Social share image (og:image)"
        value={config.seo.ogImage ?? ""}
        onChange={(ogImage) => updateSeo({ ogImage: ogImage || undefined })}
        maxLength={300}
        hint="Absolute URL used for link previews (Open Graph + Twitter card). Falls back to the hero image."
      />
      <LanguagesManager config={config} />
      <PrivacyTrackingManager />
      <LegalPagesManager />

      <div className="space-y-2">
        <Label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">One-click theme — every palette ships dark + light</Label>
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map((t) => {
            const active = config.themeId === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={cn(
                  "group rounded-lg border p-2 text-left transition-all hover:border-violet-500/60",
                  active ? "border-violet-500 bg-violet-500/10 ring-1 ring-violet-500/40" : "border-zinc-800 bg-zinc-900/40"
                )}
                aria-pressed={active}
              >
                {/* dual-mode swatch: preferred row + opposite-mode strip below */}
                <div className="mb-1.5 flex flex-col gap-1">
                  <div className="flex gap-1">
                    {t.swatch.map((c) => (
                      <span key={c} className="h-3.5 flex-1 rounded-sm border border-black/20" style={{ background: c }} />
                    ))}
                  </div>
                  <div className="flex gap-1">
                    {t.swatchAlt.map((c) => (
                      <span key={c} className="h-2 flex-1 rounded-sm border border-black/10" style={{ background: c }} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-zinc-200">{t.name}</span>
                  <span
                    className="flex items-center gap-1 text-[8px] font-semibold uppercase tracking-wide text-zinc-500"
                    title={`Theme default: ${t.mode}`}
                  >
                    {t.mode === "light" ? <Sun className="h-2.5 w-2.5" aria-hidden /> : <Moon className="h-2.5 w-2.5" aria-hidden />}
                    {t.mode}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/** Color-scheme control — Theme default / Auto / Dark / Light.
 *  Every theme now carries both palettes; this decides which one visitors see. */
function ModePicker() {
  const themeId = useForge((s) => s.config.themeId)
  const mode = useForge((s) => s.config.brand.mode)
  const updateBrand = useForge((s) => s.updateBrand)
  const theme = getTheme(themeId)

  const OPTIONS: { value: "theme" | "auto" | "dark" | "light"; icon: typeof Sun; label: string; hint: string }[] = [
    {
      value: "theme",
      icon: Palette,
      label: "Theme",
      hint: `Theme default — ${theme.name} ships ${theme.mode}`,
    },
    { value: "auto", icon: Monitor, label: "Auto", hint: "Follows each visitor's system preference, live" },
    { value: "dark", icon: Moon, label: "Dark", hint: "Always the dark palette" },
    { value: "light", icon: Sun, label: "Light", hint: "Always the light palette" },
  ]
  const active = mode ?? "theme"

  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Color scheme</Label>
      <div
        className="grid grid-cols-4 gap-1 rounded-lg border border-zinc-800 bg-zinc-900/60 p-1"
        role="group"
        aria-label="Color scheme"
      >
        {OPTIONS.map((o) => {
          const Icon = o.icon
          const isActive = active === o.value
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => updateBrand({ mode: o.value === "theme" ? undefined : o.value })}
              aria-pressed={isActive}
              title={o.hint}
              className={cn(
                "flex h-7 items-center justify-center gap-1 rounded-md text-[10px] font-semibold transition-colors",
                isActive
                  ? "bg-violet-500/25 text-violet-100"
                  : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
              )}
            >
              <Icon className="h-3 w-3" aria-hidden />
              <span>{o.label}</span>
            </button>
          )
        })}
      </div>
      <p className="text-[10px] leading-relaxed text-zinc-500">
        {OPTIONS.find((o) => o.value === active)?.hint} — visitors get a sun/moon toggle on the published page.
      </p>
    </div>
  )
}

// ─── Main panel ──────────────────────────────────────────────────────────────

export function PropertiesPanel({ className }: { className?: string }) {
  const sections = useForge((s) => s.config.sections)
  const selectedId = useForge((s) => s.selectedSectionId)
  const toggleHidden = useForge((s) => s.toggleHidden)
  const duplicateSection = useForge((s) => s.duplicateSection)
  const removeSection = useForge((s) => s.removeSection)
  const selected = sections.find((s) => s.id === selectedId) ?? null

  return (
    <div className={cn("lf-fade-up flex min-h-0 flex-col bg-zinc-950", className)}>
      <Tabs defaultValue="section" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-3 mt-3 grid h-8 grid-cols-2 bg-zinc-900">
          <TabsTrigger value="section" className="text-[11px] data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-200">Section</TabsTrigger>
          <TabsTrigger value="page" className="text-[11px] data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-200">Page & theme</TabsTrigger>
        </TabsList>
        <TabsContent value="page" className="lf-scroll min-h-0 flex-1 overflow-y-auto p-3">
          <PageSettings />
        </TabsContent>
        <TabsContent value="section" className="lf-scroll min-h-0 flex-1 overflow-y-auto">
          {!selected ? (
            <div className="lf-fade-in flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
              <GripVertical className="h-6 w-6 text-zinc-700" />
              <p className="text-[12px] text-zinc-500">Select a section on the left or click it in the preview to edit its properties.</p>
            </div>
          ) : (
            <div key={selectedId} className="lf-fade-in space-y-4 p-3">
              <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-violet-500/10 text-violet-300">
                  <IconGlyph name={SECTION_META[selected.type].icon} className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-zinc-100">{SECTION_META[selected.type].label}</p>
                  <p className="truncate font-mono text-[10px] text-zinc-500">{selected.id.slice(0, 22)}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-zinc-100" onClick={() => toggleHidden(selected.id)} aria-label={selected.hidden ? "Show section" : "Hide section"} title={selected.hidden ? "Show" : "Hide"}>
                  {selected.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-zinc-100" onClick={() => duplicateSection(selected.id)} aria-label="Duplicate section" title="Duplicate">
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-rose-300" onClick={() => removeSection(selected.id)} aria-label="Delete section" title="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {selected.hidden && (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-300">Hidden — not rendered in the live preview.</div>
              )}
              <SectionEditor section={selected} />
              {/* shared: per-section anchor override (navbar/footer link target) */}
              <div className="space-y-4 border-t border-zinc-800/70 pt-4">
                <AnimationField section={selected} />
                <AnchorField section={selected} />
                <TranslateSectionField section={selected} />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
