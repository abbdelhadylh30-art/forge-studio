"use client"

import type { VideoSection } from "@/lib/landing/types"

import { CONTAINER, SECTION_PAD, SECTION_PAD_SNUG, SectionHeader } from "../shared"
import { cn } from "@/lib/utils"

export interface VideoProps {
  section: VideoSection
  onCtaClick?: (label: string) => void
}

interface EmbedInfo {
  kind: "youtube" | "vimeo" | "file" | "none"
  src: string
}

/** Resolve a video URL to an embeddable source. */
export function resolveVideo(url: string | undefined | null): EmbedInfo {
  const raw = (url ?? "").trim()
  if (!raw) return { kind: "none", src: "" }

  // YouTube: watch?v= / youtu.be / shorts / embed
  const yt =
    /^https?:\/\/(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|shorts\/|embed\/)([\w-]{6,})/i.exec(raw) ||
    /^https?:\/\/youtu\.be\/([\w-]{6,})/i.exec(raw)
  if (yt) return { kind: "youtube", src: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0` }

  // Vimeo: vimeo.com/ID or player.vimeo.com/video/ID
  const vm =
    /^https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/i.exec(raw) ||
    /^https?:\/\/player\.vimeo\.com\/video\/(\d+)/i.exec(raw)
  if (vm) return { kind: "vimeo", src: `https://player.vimeo.com/video/${vm[1]}` }

  // direct file (mp4 / webm / etc.) — any http(s) URL or data URI
  if (/^(https?:)?\/\//i.test(raw) || raw.startsWith("data:video")) return { kind: "file", src: raw }
  return { kind: "none", src: "" }
}

function VideoFrame({ info, poster, aspect, caption }: { info: EmbedInfo; poster?: string; aspect: string; caption?: string }) {
  if (info.kind === "none") {
    // placeholder — quiet hint tile
    return (
      <div
        className="flex w-full items-center justify-center rounded-2xl border"
        style={{ aspectRatio: aspect, background: "var(--lf-surface)", borderColor: "var(--lf-border)" }}
      >
        <p className="px-6 text-center text-sm" style={{ color: "var(--lf-muted)" }}>
          Add a video URL — YouTube, Vimeo or an mp4 link.
        </p>
      </div>
    )
  }

  const shell = (children: React.ReactNode) => (
    <figure className="m-0">
      <div
        className="overflow-hidden rounded-2xl border"
        style={{ borderColor: "var(--lf-border)", boxShadow: "0 36px 70px -40px rgba(0,0,0,0.45)" }}
      >
        {children}
      </div>
      {caption ? (
        <figcaption className="mt-3 text-center text-xs" style={{ color: "var(--lf-muted)" }}>
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )

  if (info.kind === "file") {
    return shell(
      <video controls preload="metadata" poster={poster} className="w-full" style={{ aspectRatio: aspect, background: "#000" }}>
        <source src={info.src} />
      </video>,
    )
  }

  return shell(
    <iframe
      src={info.src}
      title={caption || "Embedded video"}
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      className="w-full border-0"
      style={{ aspectRatio: aspect, background: "#000" }}
    />,
  )
}

export function Video({ section, onCtaClick }: VideoProps) {
  const info = resolveVideo(section.videoUrl)

  if (section.style === "split") {
    return (
      <section className={SECTION_PAD}>
        <div className={cn(CONTAINER, "grid items-center gap-10 md:grid-cols-2 md:gap-16")}>
          <div>
            <SectionHeader title={section.title} subtitle={section.subtitle} className="mb-6 md:mb-8" />
            {section.cta?.label ? (
              <a
                href={section.cta.href || "#cta"}
                onClick={(e) => {
                  if (onCtaClick) e.preventDefault()
                  onCtaClick?.(section.cta!.label)
                }}
                className="inline-flex h-11 items-center rounded-xl px-6 text-sm font-semibold transition-transform duration-150 hover:scale-[1.02] active:scale-100"
                style={{ background: "var(--lf-accent)", color: "var(--lf-accent-contrast)", boxShadow: "0 18px 40px -22px var(--lf-accent)" }}
              >
                {section.cta.label}
              </a>
            ) : null}
          </div>
          <VideoFrame info={info} poster={section.poster} aspect="4/3" caption={section.caption} />
        </div>
      </section>
    )
  }

  if (section.style === "minimal") {
    return (
      <section className={SECTION_PAD_SNUG}>
        <div className={CONTAINER}>
          <VideoFrame info={info} poster={section.poster} aspect="16/9" caption={section.caption ?? section.title} />
        </div>
      </section>
    )
  }

  // cinematic — full-width statement
  return (
    <section className={SECTION_PAD}>
      <div className={CONTAINER}>
        <SectionHeader title={section.title} subtitle={section.subtitle} center />
        <div className="mx-auto max-w-4xl">
          <VideoFrame info={info} poster={section.poster} aspect="21/10" caption={section.caption} />
          {section.cta?.label ? (
            <div className="mt-8 text-center">
              <a
                href={section.cta.href || "#cta"}
                onClick={(e) => {
                  if (onCtaClick) e.preventDefault()
                  onCtaClick?.(section.cta!.label)
                }}
                className="inline-flex h-11 items-center rounded-xl px-6 text-sm font-semibold transition-transform duration-150 hover:scale-[1.02] active:scale-100"
                style={{ background: "var(--lf-accent)", color: "var(--lf-accent-contrast)", boxShadow: "0 18px 40px -22px var(--lf-accent)" }}
              >
                {section.cta.label}
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
