"use client"

import { useState } from "react"
import { Check } from "lucide-react"

import type { PricingPlan, PricingSection } from "@/lib/landing/types"

import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"

import { CONTAINER, SECTION_PAD, SectionHeader } from "../shared"

export interface PricingProps {
  section: PricingSection
  onCtaClick?: (label: string, planName: string) => void
}

/** Static Tailwind class strings for plan column counts (required for JIT). */
const PLAN_COLS: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-2 lg:grid-cols-3",
  4: "md:grid-cols-2 xl:grid-cols-4",
}

function priceNumber(price: string): number {
  const match = /\d+(?:\.\d+)?/.exec(price)
  return match ? Number.parseFloat(match[0]) : 0
}

function priceDisplay(plan: PricingPlan, annual: boolean): { price: string; period: string; note: string } {
  if (annual) {
    return {
      price: `$${Math.round(priceNumber(plan.price) * 12 * 0.8)}`,
      period: "/yr",
      note: "billed annually",
    }
  }
  return { price: plan.price, period: plan.period ?? "", note: "" }
}

interface PlanCardProps {
  plan: PricingPlan
  annual: boolean
  onCtaClick?: (label: string, planName: string) => void
}

function PlanCard({ plan, annual, onCtaClick }: PlanCardProps) {
  const highlighted = plan.highlighted === true
  const { price, period, note } = priceDisplay(plan, annual)
  const label = plan.ctaLabel?.trim() || `Choose ${plan.name}`

  return (
    <div
      className={cn("relative flex flex-col rounded-2xl p-6 md:p-7", highlighted && "md:scale-[1.03]")}
      style={
        highlighted
          ? {
              background: "var(--lf-surface)",
              border: "2px solid var(--lf-accent)",
              boxShadow: "0 20px 44px -28px var(--lf-accent)",
            }
          : { background: "var(--lf-surface)", border: "1px solid var(--lf-border)" }
      }
    >
      {highlighted ? (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold"
          style={{ background: "var(--lf-accent)", color: "var(--lf-accent-contrast)" }}
        >
          Most popular
        </span>
      ) : null}

      <h3 className="text-lg font-semibold" style={{ color: "var(--lf-text)" }}>
        {plan.name}
      </h3>
      {plan.description ? (
        <p className="mt-1 text-sm" style={{ color: "var(--lf-muted)" }}>
          {plan.description}
        </p>
      ) : null}

      <div className="mt-5 flex items-baseline gap-1.5">
        <span className="text-4xl font-extrabold tracking-tight" style={{ color: "var(--lf-text)" }}>
          {price}
        </span>
        {period ? (
          <span className="text-sm" style={{ color: "var(--lf-muted)" }}>
            {period}
          </span>
        ) : null}
      </div>
      {/* reserved line so monthly/annual toggling does not shift layout */}
      <p className="h-4 text-xs" style={{ color: "var(--lf-muted)" }}>
        {note}
      </p>

      <ul className="mt-5 flex flex-col gap-2.5">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "var(--lf-muted)" }}>
            <Check className="mt-0.5 size-4 shrink-0" strokeWidth={2.5} style={{ color: "var(--lf-accent)" }} />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-7">
        <a
          href="#cta"
          onClick={(e) => {
            if (onCtaClick) e.preventDefault()
            onCtaClick?.(label, plan.name)
          }}
          className={cn(
            "block w-full rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition-colors",
            !highlighted && "border hover:[border-color:var(--lf-accent)]"
          )}
          style={
            highlighted
              ? { background: "var(--lf-accent)", color: "var(--lf-accent-contrast)" }
              : { background: "transparent", borderColor: "var(--lf-border)", color: "var(--lf-text)" }
          }
        >
          {label}
        </a>
      </div>
    </div>
  )
}

export function Pricing({ section, onCtaClick }: PricingProps) {
  const [annual, setAnnual] = useState(false)
  const plans = section.plans ?? []
  const cols = PLAN_COLS[plans.length] ?? PLAN_COLS[3]

  return (
    <section className={SECTION_PAD}>
      <div className={CONTAINER}>
        <SectionHeader title={section.title} subtitle={section.subtitle} center />

        {section.annualToggle ? (
          <div className="mb-8 flex items-center justify-center gap-3 md:mb-10">
            <span
              className={cn("text-sm", !annual && "font-semibold")}
              style={{ color: annual ? "var(--lf-muted)" : "var(--lf-text)" }}
            >
              Monthly
            </span>
            <Switch checked={annual} onCheckedChange={setAnnual} aria-label="Toggle annual pricing" />
            <span
              className={cn("text-sm", annual && "font-semibold")}
              style={{ color: annual ? "var(--lf-text)" : "var(--lf-muted)" }}
            >
              Annual
            </span>
            {section.annualDiscountLabel ? (
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ background: "var(--lf-accent-soft)", color: "var(--lf-accent)" }}
              >
                {section.annualDiscountLabel}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className={cn("grid grid-cols-1 gap-5 md:gap-6", cols, plans.length === 1 && "mx-auto max-w-md")}>
          {plans.map((plan, i) => (
            <PlanCard key={`${plan.name}-${i}`} plan={plan} annual={annual} onCtaClick={onCtaClick} />
          ))}
        </div>
      </div>
    </section>
  )
}
