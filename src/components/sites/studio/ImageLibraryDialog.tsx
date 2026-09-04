"use client"

import * as React from "react"
import { Check, Copy, ImagePlus, Images, Loader2, RefreshCw, SearchX, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useUi } from "@/lib/landing/uiStore"

interface ImageAsset {
  name: string
  url: string
  bytes: number
  createdAt: string
  usedBy: string[]
}

function fmtBytes(b: number): string {
  if (b >= 1_000_000) return `${(b / 1_000_000).toFixed(1)} MB`
  if (b >= 1_000) return `${Math.round(b / 1_000)} KB`
  return `${b} B`
}

function fmtAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return "just now"
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86_400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86_400)}d ago`
}

/**
 * Image library — browse / reuse / delete AI-generated images
 * (public/uploads). In `picker` mode, clicking an image applies its URL to the
 * target field and closes; in standalone mode (⌘K "Image library…") it's a
 * manager: copy URL, delete (blocked while a project still uses the image).
 */
export function ImageLibraryDialog({
  open,
  onOpenChange,
  picker,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  picker?: { onPick: (url: string) => void; hint?: string }
}) {
  const closeDialog = useUi((s) => s.closeDialog)
  const [images, setImages] = React.useState<ImageAsset[] | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [deleting, setDeleting] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/images")
      const out = (await res.json()) as { images?: ImageAsset[] }
      setImages(out.images ?? [])
    } catch {
      toast.error("Could not load the image library")
      setImages([])
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (open) void load()
  }, [open, load])

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(url)
      setTimeout(() => setCopied(null), 1500)
      toast.success("Image URL copied")
    } catch {
      toast.error("Copy failed")
    }
  }

  const remove = async (img: ImageAsset) => {
    if (img.usedBy.length > 0 || deleting) return
    setDeleting(img.url)
    try {
      const res = await fetch(`/api/images?url=${encodeURIComponent(img.url)}`, { method: "DELETE" })
      if (res.status === 409) {
        const out = (await res.json()) as { error?: string; usedBy?: string[] }
        toast.error("Image still in use", { description: `${out.error} — remove it from those sections first.`, duration: 5000 })
        void load()
        return
      }
      if (!res.ok) throw new Error("Delete failed")
      toast.success("Image deleted", { description: `${img.name} removed from the library.` })
      setImages((prev) => (prev ? prev.filter((i) => i.url !== img.url) : prev))
    } catch {
      toast.error("Could not delete the image")
    } finally {
      setDeleting(null)
    }
  }

  const pick = (img: ImageAsset) => {
    if (!picker) return
    picker.onPick(img.url)
    onOpenChange(false)
    toast.success("Image applied", { description: `${img.name} — undo if you change your mind.` })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] gap-0 overflow-hidden border-zinc-800 bg-zinc-950 p-0 sm:max-w-2xl">
        <DialogHeader className="space-y-1.5 border-b border-zinc-800/80 px-5 pb-3 pt-4">
          <DialogTitle className="flex items-center gap-2 text-[15px] font-bold text-zinc-50">
            <Images className="h-4 w-4 text-violet-300" /> Image library
            {images && (
              <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-violet-300">
                {images.length}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-7 gap-1 px-2 text-[10px] text-zinc-400 hover:text-zinc-100"
              onClick={() => void load()}
              disabled={loading}
              title="Refresh the library"
            >
              <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} /> Refresh
            </Button>
          </DialogTitle>
          <DialogDescription className="text-[11.5px] leading-relaxed text-zinc-500">
            {picker
              ? picker.hint ?? "Click an image to use it in this field — generated images are kept here for reuse."
              : "Every AI-generated image is kept in public/uploads — reuse URLs anywhere or delete the ones you no longer need."}
          </DialogDescription>
        </DialogHeader>

        <div className="lf-scroll max-h-[calc(85vh-7.5rem)] min-h-0 overflow-y-auto p-4">
          {images === null || loading ? (
            <div className="flex flex-col items-center gap-3 py-14 text-zinc-500">
              <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
              <p className="text-[12px]">Loading library…</p>
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center text-zinc-500">
              <div className="flex size-12 items-center justify-center rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/60">
                <SearchX className="h-5 w-5 text-zinc-600" />
              </div>
              <p className="text-[13px] font-semibold text-zinc-300">No images yet</p>
              <p className="max-w-xs text-[11px] leading-relaxed text-zinc-600">
                Generate one with the ✨ button in a hero or gallery section — it lands here automatically for reuse.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {images.map((img) => {
                const inUse = img.usedBy.length > 0
                const isPicker = Boolean(picker)
                return (
                  <div
                    key={img.url}
                    className={cn(
                      "group relative flex flex-col overflow-hidden rounded-xl border bg-zinc-900/50 transition-all duration-200",
                      isPicker
                        ? "cursor-pointer border-zinc-800 hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-950/30"
                        : "border-zinc-800 hover:border-zinc-700"
                    )}
                    onClick={() => isPicker && pick(img)}
                    role={isPicker ? "button" : undefined}
                    tabIndex={isPicker ? 0 : undefined}
                    aria-label={isPicker ? `Use ${img.name}` : undefined}
                    onKeyDown={(e) => {
                      if (isPicker && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault()
                        pick(img)
                      }
                    }}
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-950">
                      <img
                        src={img.url}
                        alt={`Generated image ${img.name}`}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                      {isPicker && (
                        <span className="absolute inset-0 flex items-center justify-center bg-violet-950/0 opacity-0 transition-all duration-200 group-hover:bg-violet-950/50 group-hover:opacity-100">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500 text-white shadow-lg">
                            <ImagePlus className="h-4 w-4" />
                          </span>
                        </span>
                      )}
                      {inUse && (
                        <span
                          className="absolute left-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300 backdrop-blur"
                          title={`Used by: ${img.usedBy.join(", ")}`}
                        >
                          in use · {img.usedBy.length}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 border-t border-zinc-800/80 px-2 py-1.5">
                      <span className="min-w-0 flex-1 truncate font-mono text-[9.5px] text-zinc-500" title={img.name}>
                        {img.name}
                      </span>
                      <span className="shrink-0 text-[9px] text-zinc-600">{fmtBytes(img.bytes)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-1 border-t border-zinc-800/50 px-2 py-1.5">
                      <span className="text-[9px] text-zinc-600">{fmtAgo(img.createdAt)}</span>
                      {!isPicker && (
                        <span className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              void copyUrl(img.url)
                            }}
                            className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                            title="Copy image URL"
                            aria-label={`Copy URL of ${img.name}`}
                          >
                            {copied === img.url ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              void remove(img)
                            }}
                            disabled={inUse || deleting === img.url}
                            className={cn(
                              "flex h-6 w-6 items-center justify-center rounded-md transition-colors disabled:opacity-30",
                              inUse
                                ? "cursor-not-allowed text-zinc-600"
                                : "text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300"
                            )}
                            title={inUse ? `Still used by ${img.usedBy.join(", ")} — remove it there first` : "Delete from library"}
                            aria-label={`Delete ${img.name}`}
                          >
                            {deleting === img.url ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
