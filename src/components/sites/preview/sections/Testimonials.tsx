"use client"

import { useState } from "react"
import { Pause, Play, Star } from "lucide-react"

import type { TestimonialItem, TestimonialsSection } from "@/lib/landing/types"

import { cn } from "@/lib/utils"

import { CONTAINER, SECTION_PAD, SectionHeader } from "../shared"

export interface TestimonialsProps {
  section: TestimonialsSection
}

function initialsOf(author: string): string {
  const parts = author
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return "•"
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase()
}

function Stars({ rating }: { rating: number }) {
  const r = Math.max(0, Math.min(5, Math.round(rating)))
  return (
    <div className="flex gap-0.5" aria-label={`${r} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          className="size-3.5"
          strokeWidth={1.5}
          fill={i < r ? "currentColor" : "none"}
          style={{ color: i < r ? "var(--lf-accent)" : "var(--lf-border)" }}
        />
      ))}
    </div>
  )
}

interface TestimonialCardProps {
  item: TestimonialItem
  compact?: boolean
  className?: string
}

function TestimonialCard({ item, compact = false, className }: TestimonialCardProps) {
  const initials = item.initials?.trim() || initialsOf(item.author)
  return (
    <figure
      className={cn("flex h-full flex-col rounded-2xl border p-5", className)}
      style={{ background: "var(--lf-surface)", borderColor: "var(--lf-border)" }}
    >
      <Stars rating={item.rating ?? 5} />
      <blockquote className={cn("mt-3 leading-relaxed", compact ? "text-sm" : "text-sm md:text-[15px]")} style={{ color: "var(--lf-text)" }}>
        {item.quote}
      </blockquote>
      <figcaption className="mt-auto flex items-center gap-3 pt-5">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
          style={{ background: "var(--lf-accent-soft)", color: "var(--lf-accent)" }}
        >
          {initials}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold" style={{ color: "var(--lf-text)" }}>
            {item.author}
          </span>
          <span className="block truncate text-xs" style={{ color: "var(--lf-muted)" }}>
            {item.role}
          </span>
        </span>
      </figcaption>
    </figure>
  )
}

/** Deterministic faux-video duration label per index, e.g. "2:14". */
function durationOf(index: number): string {
  const secs = 134 + ((index * 47) % 120)
  return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`
}

/** Stable hue derived from the item index (same trick as the Gallery art). */
function hueOf(index: number): number {
  return (index * 61) % 360
}

interface VideoCardProps {
  item: TestimonialItem
  index: number
}

/** Video testimonial card: 16:9 generated thumb with a faux inline playback state. */
function VideoCard({ item, index }: VideoCardProps) {
  const [playing, setPlaying] = useState(false)
  const initials = item.initials?.trim() || initialsOf(item.author)
  const hue = hueOf(index)
  const gradient = `linear-gradient(135deg, hsl(${hue} 70% 45%), hsl(${(hue + 40) % 360} 90% 62%))`

  return (
    <figure
      className="flex h-full flex-col overflow-hidden rounded-2xl border transition-colors duration-200"
      style={{
        background: "var(--lf-surface)",
        borderColor: playing ? "var(--lf-accent)" : "var(--lf-border)",
      }}
    >
      <button
        type="button"
        onClick={() => setPlaying((p) => !p)}
        aria-pressed={playing}
        aria-label={
          playing ? `Pause video testimonial from ${item.author}` : `Play video testimonial from ${item.author}`
        }
        className="group relative block w-full cursor-pointer overflow-hidden text-left"
        style={{ aspectRatio: "16 / 9" }}
      >
        {/* generated backdrop */}
        <span aria-hidden className="absolute inset-0" style={{ background: gradient }} />
        <span
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.22) 1px, transparent 1.4px)",
            backgroundSize: "16px 16px",
            opacity: 0.45,
          }}
        />
        {playing ? (
          <>
            {/* faux playing panel */}
            <span aria-hidden className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)" }} />
            <span className="absolute inset-0 flex items-center justify-center">
              <span
                className="flex size-12 items-center justify-center rounded-full border backdrop-blur-md transition-transform duration-150 group-hover:scale-105"
                style={{
                  background: "rgba(255,255,255,0.16)",
                  borderColor: "rgba(255,255,255,0.35)",
                  color: "rgba(255,255,255,0.95)",
                }}
              >
                <Pause className="size-5" fill="currentColor" strokeWidth={1.5} />
              </span>
            </span>
            <span
              aria-hidden
              className="absolute inset-x-0 bottom-0 block h-1"
              style={{ background: "rgba(255,255,255,0.18)" }}
            >
              <span className="lf-progress-bar block h-full" style={{ background: "var(--lf-accent)" }} />
            </span>
          </>
        ) : (
          <span className="absolute inset-0 flex items-center justify-center">
            <span
              className="flex size-12 items-center justify-center rounded-full border backdrop-blur-md transition-transform duration-200 group-hover:scale-110"
              style={{
                background: "rgba(255,255,255,0.16)",
                borderColor: "rgba(255,255,255,0.35)",
                color: "rgba(255,255,255,0.95)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
              }}
            >
              <Play className="size-5 translate-x-0.5" fill="currentColor" strokeWidth={1.5} />
            </span>
          </span>
        )}
        <span
          className="absolute bottom-2.5 right-2 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
          style={{ background: "rgba(0,0,0,0.6)", color: "rgba(255,255,255,0.92)" }}
        >
          {durationOf(index)}
        </span>
      </button>
      <div className="flex flex-1 flex-col p-5">
        <blockquote
          className={cn("line-clamp-3 text-sm leading-relaxed md:text-[15px]", playing && "font-medium")}
          style={{ color: playing ? "var(--lf-text)" : "var(--lf-muted)" }}
        >
          {item.quote}
        </blockquote>
        <figcaption className="mt-auto flex items-center gap-3 pt-4">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
            style={{ background: "var(--lf-accent-soft)", color: "var(--lf-accent)" }}
          >
            {initials}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold" style={{ color: "var(--lf-text)" }}>
              {item.author}
            </span>
            <span className="block truncate text-xs" style={{ color: "var(--lf-muted)" }}>
              {item.role}
            </span>
          </span>
        </figcaption>
      </div>
    </figure>
  )
}

/** "video" style: grid of faux video testimonial cards. */
function VideoTestimonials({ items }: { items: TestimonialItem[] }) {
  if (items.length === 0) return null
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-5">
      {items.map((item, i) => (
        <VideoCard key={`${item.author}-${i}`} item={item} index={i} />
      ))}
    </div>
  )
}

/** "logo-wall" style: compact monogram tiles for companies/people. */
function LogoWall({ items }: { items: TestimonialItem[] }) {
  if (items.length === 0) return null
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
      {items.map((item, i) => {
        const initials = item.initials?.trim() || initialsOf(item.author)
        return (
          <div
            key={`${item.author}-${i}`}
            className="flex flex-col items-center rounded-2xl border p-6 text-center transition duration-200 [border-color:var(--lf-border)] hover:-translate-y-1 hover:[border-color:var(--lf-accent)]"
            style={{ background: "var(--lf-surface)" }}
          >
            <span
              className="flex size-14 items-center justify-center rounded-xl border text-lg font-extrabold tracking-wider md:size-16 md:text-xl"
              style={{ background: "var(--lf-accent-soft)", borderColor: "var(--lf-border)", color: "var(--lf-accent)" }}
            >
              {initials}
            </span>
            <span className="mt-4 text-sm font-semibold" style={{ color: "var(--lf-text)" }}>
              {item.author}
            </span>
            <span className="mt-1 text-xs" style={{ color: "var(--lf-muted)" }}>
              {item.role}
            </span>
            {typeof item.rating === "number" ? (
              <span className="mt-3">
                <Stars rating={item.rating} />
              </span>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

/** Infinite horizontal marquee (animation defined in globals.css). */
function Marquee({ items }: { items: TestimonialItem[] }) {
  const doubled = [...items, ...items]
  return (
    <div
      className="relative overflow-hidden py-1"
      style={{
        maskImage: "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
      }}
    >
      <div className="lf-marquee-track flex w-max">
        {doubled.map((t, i) => (
          <TestimonialCard key={i} item={t} className="mr-5 w-[300px] shrink-0 md:w-[340px]" />
        ))}
      </div>
    </div>
  )
}

/** First testimonial huge, the rest in a compact grid. */
function Spotlight({ items }: { items: TestimonialItem[] }) {
  if (items.length === 0) return null
  const [first, ...rest] = items
  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <figure
        className="relative rounded-2xl border p-6 md:p-10"
        style={{ background: "var(--lf-surface)", borderColor: "var(--lf-border)" }}
      >
        <span
          aria-hidden
          className="absolute left-4 top-2 select-none font-serif text-6xl leading-none md:left-6 md:text-7xl"
          style={{ color: "var(--lf-accent)", opacity: 0.5 }}
        >
          &ldquo;
        </span>
        <Stars rating={first.rating ?? 5} />
        <blockquote className="relative mt-3 text-xl font-medium leading-relaxed md:text-2xl" style={{ color: "var(--lf-text)" }}>
          {first.quote}
        </blockquote>
        <figcaption className="mt-6 flex items-center gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            style={{ background: "var(--lf-accent-soft)", color: "var(--lf-accent)" }}
          >
            {first.initials?.trim() || initialsOf(first.author)}
          </span>
          <span>
            <span className="block text-sm font-semibold" style={{ color: "var(--lf-text)" }}>
              {first.author}
            </span>
            <span className="block text-xs" style={{ color: "var(--lf-muted)" }}>
              {first.role}
            </span>
          </span>
        </figcaption>
      </figure>
      {rest.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-5">
          {rest.map((t, i) => (
            <TestimonialCard key={i} item={t} compact />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function Testimonials({ section }: TestimonialsProps) {
  const items = section.items ?? []
  const isMarquee = section.style === "marquee" && items.length > 0

  return (
    <section className={SECTION_PAD}>
      <div className={CONTAINER}>
        <SectionHeader title={section.title} subtitle={section.subtitle} center />
      </div>
      {isMarquee ? (
        <Marquee items={items} />
      ) : (
        <div className={CONTAINER}>
          {section.style === "grid" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-5">
              {items.map((t, i) => (
                <TestimonialCard key={i} item={t} />
              ))}
            </div>
          ) : section.style === "video" ? (
            <VideoTestimonials items={items} />
          ) : section.style === "logo-wall" ? (
            <LogoWall items={items} />
          ) : (
            <Spotlight items={items} />
          )}
        </div>
      )}
    </section>
  )
}
