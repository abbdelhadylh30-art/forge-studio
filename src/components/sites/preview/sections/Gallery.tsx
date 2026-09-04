"use client"

import { useRef } from "react"
import { ChevronLeft, ChevronRight, Image as ImageIcon, Monitor, Smartphone } from "lucide-react"

import type { GalleryItem, GallerySection } from "@/lib/landing/types"

import { cn } from "@/lib/utils"

import { CONTAINER, SECTION_PAD, SectionHeader } from "../shared"

export interface GalleryProps {
  section: GallerySection
}

/** Cycling aspect ratios for masonry visual rhythm. */
const RATIOS = ["4/5", "1/1", "4/3", "16/10"]
const ART_ICONS = [ImageIcon, Monitor, Smartphone]

function hueOf(item: GalleryItem, index: number): number {
  const parsed = Number.parseFloat(item.hue ?? "")
  if (!Number.isNaN(parsed)) return parsed
  return (index * 61) % 360
}

interface GalleryTileProps {
  item: GalleryItem
  index: number
  ratio: string
  className?: string
}

function GalleryTile({ item, index, ratio, className }: GalleryTileProps) {
  const caption = item.caption?.trim() || item.alt
  const Icon = ART_ICONS[index % ART_ICONS.length]
  const src = item.src?.trim()

  return (
    <div
      className={cn("overflow-hidden rounded-xl border", className)}
      style={{ borderColor: "var(--lf-border)", background: "var(--lf-surface)" }}
    >
      {src ? (
        <img src={src} alt={item.alt} loading="lazy" className="w-full object-cover" style={{ aspectRatio: ratio }} />
      ) : (
        <div
          className="relative flex w-full items-center justify-center"
          style={{
            aspectRatio: ratio,
            background: `linear-gradient(135deg, hsl(${hueOf(item, index)} 70% 45%), hsl(${(hueOf(item, index) + 40) % 360} 90% 62%))`,
          }}
        >
          {/* decorative dot pattern */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.25) 1px, transparent 1.4px)",
              backgroundSize: "15px 15px",
              opacity: 0.55,
            }}
          />
          <Icon aria-hidden className="relative size-9" strokeWidth={1.5} style={{ color: "rgba(255,255,255,0.92)" }} />
        </div>
      )}
      <p className="truncate px-3 py-2.5 text-xs" style={{ color: "var(--lf-muted)" }}>
        {caption}
      </p>
    </div>
  )
}

export function Gallery({ section }: GalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const items = section.items ?? []

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: "smooth" })
  }

  return (
    <section className={SECTION_PAD}>
      <div className={CONTAINER}>
        <SectionHeader title={section.title} subtitle={section.subtitle} center />
      </div>

      {section.style === "carousel" ? (
        <div className={CONTAINER}>
          <div className="relative">
            <div
              ref={scrollRef}
              className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {items.map((item, i) => (
                <GalleryTile
                  key={`${item.alt}-${i}`}
                  item={item}
                  index={i}
                  ratio="16/10"
                  className="w-[70%] shrink-0 snap-center sm:w-[45%]"
                />
              ))}
            </div>
            {items.length > 1 ? (
              <>
                <button
                  type="button"
                  aria-label="Previous slide"
                  onClick={() => scrollBy(-1)}
                  className="absolute left-1 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border shadow-lg transition-colors hover:[border-color:var(--lf-accent)]"
                  style={{ background: "var(--lf-bg)", borderColor: "var(--lf-border)", color: "var(--lf-text)" }}
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next slide"
                  onClick={() => scrollBy(1)}
                  className="absolute right-1 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border shadow-lg transition-colors hover:[border-color:var(--lf-accent)]"
                  style={{ background: "var(--lf-bg)", borderColor: "var(--lf-border)", color: "var(--lf-text)" }}
                >
                  <ChevronRight className="size-4" />
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : (
        <div className={CONTAINER}>
          <div className="columns-2 gap-4 [column-fill:_balance] md:columns-3">
            {items.map((item, i) => (
              <GalleryTile
                key={`${item.alt}-${i}`}
                item={item}
                index={i}
                ratio={RATIOS[i % RATIOS.length]}
                className="mb-4 break-inside-avoid"
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
