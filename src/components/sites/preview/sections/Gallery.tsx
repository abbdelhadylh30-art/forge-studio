"use client"

import { useEffect, useRef, useState } from "react"
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
  overlay?: boolean
}

function GalleryTile({ item, index, ratio, className, overlay = false }: GalleryTileProps) {
  const caption = item.caption?.trim() || item.alt
  const Icon = ART_ICONS[index % ART_ICONS.length]
  const src = item.src?.trim()

  return (
    <div
      className={cn("overflow-hidden rounded-xl border", className)}
      style={{ borderColor: "var(--lf-border)", background: "var(--lf-surface)" }}
    >
      <div className="relative">
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
        {overlay && caption ? (
          <div
            className="absolute inset-x-0 bottom-0 p-4"
            style={{ background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.65) 100%)" }}
          >
            <p className="truncate text-sm font-semibold text-white">{caption}</p>
          </div>
        ) : null}
      </div>
      {!overlay ? (
        <p className="truncate px-3 py-2.5 text-xs" style={{ color: "var(--lf-muted)" }}>
          {caption}
        </p>
      ) : null}
    </div>
  )
}

/** Big single-slide slider with dots + arrows. The same markup runs in the
 *  standalone export — the vanilla [data-lf-slider] script drives it there. */
function Slider({ items }: { items: GalleryItem[] }) {
  const [active, setActive] = useState(0)
  const count = items.length
  const go = (i: number) => setActive(((i % count) + count) % count)

  return (
    <div className="relative" data-lf-slider>
      <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--lf-border)" }}>
        <div
          className="flex transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)]"
          style={{ transform: `translateX(-${active * 100}%)` }}
          data-lf-slider-track
        >
          {items.map((item, i) => (
            <GalleryTile key={`${item.alt}-${i}`} item={item} index={i} ratio="16/9" className="w-full shrink-0 rounded-none border-0" overlay />
          ))}
        </div>
      </div>

      {count > 1 ? (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            data-lf-prev
            onClick={() => go(active - 1)}
            className="absolute left-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border shadow-lg transition-colors hover:[border-color:var(--lf-accent)]"
            style={{ background: "var(--lf-bg)", borderColor: "var(--lf-border)", color: "var(--lf-text)" }}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            data-lf-next
            onClick={() => go(active + 1)}
            className="absolute right-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border shadow-lg transition-colors hover:[border-color:var(--lf-accent)]"
            style={{ background: "var(--lf-bg)", borderColor: "var(--lf-border)", color: "var(--lf-text)" }}
          >
            <ChevronRight className="size-4" />
          </button>
          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="flex items-center gap-1.5">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  data-lf-dot
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === active}
                  onClick={() => go(i)}
                  className="h-1.5 rounded-full transition-all duration-200"
                  style={{
                    width: i === active ? 20 : 6,
                    background: i === active ? "var(--lf-accent)" : "var(--lf-border)",
                  }}
                />
              ))}
            </div>
            <span className="text-xs tabular-nums" style={{ color: "var(--lf-muted)" }}>
              {active + 1} / {count}
            </span>
          </div>
        </>
      ) : null}
    </div>
  )
}

/** Stories — tall snap-scrolling cards with a segmented progress rail. */
function Stories({ items }: { items: GalleryItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const step = el.scrollWidth / Math.max(1, el.children.length)
        setActive(Math.round(el.scrollLeft / Math.max(1, step)))
      })
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      el.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div data-lf-stories>
      {/* segmented progress rail */}
      <div className="mb-4 flex gap-1.5" data-lf-story-segs>
        {items.map((_, i) => (
          <span
            key={i}
            data-lf-story-seg
            className="h-1 flex-1 overflow-hidden rounded-full"
            style={{ background: "var(--lf-border)" }}
          >
            <span
              className="block h-full rounded-full transition-[width] duration-300"
              style={{ width: i <= active ? "100%" : "0%", background: "var(--lf-accent)" }}
            />
          </span>
        ))}
      </div>
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => (
          <GalleryTile
            key={`${item.alt}-${i}`}
            item={item}
            index={i}
            ratio="9/16"
            className="w-[44%] shrink-0 snap-start sm:w-[30%] md:w-[23%] lg:w-[18%]"
            overlay
          />
        ))}
      </div>
    </div>
  )
}

/** Infinite ticker strip (CSS animation, pauses on hover). */
function Ticker({ items }: { items: GalleryItem[] }) {
  return (
    <div className="overflow-hidden">
      <div className="lf-ticker-track" aria-hidden>
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 gap-4 pr-4">
            {items.map((item, i) => (
              <GalleryTile key={`${item.alt}-${i}`} item={item} index={i} ratio="1/1" className="w-36 shrink-0 sm:w-44 md:w-52" overlay />
            ))}
          </div>
        ))}
      </div>
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
      ) : section.style === "slider" ? (
        <div className={CONTAINER}>
          <Slider items={items} />
        </div>
      ) : section.style === "stories" ? (
        <div className={CONTAINER}>
          <Stories items={items} />
        </div>
      ) : section.style === "ticker" ? (
        <Ticker items={items} />
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
