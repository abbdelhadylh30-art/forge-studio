"use client"

import type { LogosSection } from "@/lib/landing/types"

import { cn } from "@/lib/utils"

import { CONTAINER } from "../shared"

export interface LogosProps {
  section: LogosSection
}

const SHAPES = ["circle", "square", "triangle", "diamond"] as const

function LogoMark({ index }: { index: number }) {
  const shape = SHAPES[index % SHAPES.length]
  const fill = { background: "var(--lf-accent-soft)" }
  switch (shape) {
    case "circle":
      return <span aria-hidden className="size-3.5 shrink-0 rounded-full" style={fill} />
    case "square":
      return <span aria-hidden className="size-3 shrink-0 rounded-[4px]" style={fill} />
    case "triangle":
      return <span aria-hidden className="size-3.5 shrink-0" style={{ ...fill, clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }} />
    case "diamond":
    default:
      return <span aria-hidden className="size-3 shrink-0 rotate-45 rounded-[2px]" style={fill} />
  }
}

export function Logos({ section }: LogosProps) {
  const items = section.items ?? []
  if (items.length === 0 && !section.title) return null

  return (
    <section className="py-10 md:py-14">
      <div className={CONTAINER}>
        {section.title ? (
          <p className="mb-6 text-center text-xs font-medium uppercase tracking-widest" style={{ color: "var(--lf-muted)" }}>
            {section.title}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 sm:justify-between md:gap-x-12">
          {items.map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="flex items-center gap-2.5 transition-colors [color:var(--lf-muted)] hover:[color:var(--lf-text)]"
            >
              <LogoMark index={i} />
              <span className="text-lg font-bold tracking-tight">{name}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
