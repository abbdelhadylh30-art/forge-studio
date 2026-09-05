"use client"

import { useState } from "react"

import type { FaqItem, FaqSection } from "@/lib/landing/types"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

import { CONTAINER, SECTION_PAD, SectionHeader } from "../shared"

export interface FaqProps {
  section: FaqSection
}

/** Two-col Q + A block (shared by the twocol style). */
function TwoColItem({ item }: { item: FaqItem }) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold"
          style={{ background: "var(--lf-accent-soft)", color: "var(--lf-accent)" }}
        >
          ?
        </span>
        <h3 className="text-sm font-semibold md:text-base" style={{ color: "var(--lf-text)" }}>
          {item.q}
        </h3>
      </div>
      <p className="mt-2 pl-8 text-sm leading-relaxed" style={{ color: "var(--lf-muted)" }}>
        {item.a}
      </p>
    </div>
  )
}

/** Static Q&A card (cards style). */
function FaqCard({ item }: { item: FaqItem }) {
  return (
    <article className="rounded-xl border p-5" style={{ borderColor: "var(--lf-border)", background: "var(--lf-surface)" }}>
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold"
          style={{ background: "var(--lf-accent-soft)", color: "var(--lf-accent)" }}
        >
          ?
        </span>
        <h3 className="text-sm font-semibold md:text-base" style={{ color: "var(--lf-text)" }}>
          {item.q}
        </h3>
      </div>
      <p className="mt-2.5 pl-8 text-sm leading-relaxed" style={{ color: "var(--lf-muted)" }}>
        {item.a}
      </p>
    </article>
  )
}

/** Grouped category tabs + per-category accordion lists (categorized style).
 *  Uses the shared [data-lf-tabs] contract so the vanilla export script
 *  switches categories in standalone HTML exactly like React does here. */
function CategorizedFaq({ items }: { items: FaqItem[] }) {
  const groups: { name: string; items: FaqItem[] }[] = []
  for (const item of items) {
    const name = item.category?.trim() || "General"
    const existing = groups.find((g) => g.name === name)
    if (existing) existing.items.push(item)
    else groups.push({ name, items: [item] })
  }

  const [active, setActive] = useState(0)
  const activeIdx = Math.min(active, Math.max(groups.length - 1, 0))

  return (
    <div className="mx-auto max-w-3xl" data-lf-tabs>
      {groups.length > 1 ? (
        <div className="mb-6 flex flex-wrap justify-center gap-2" role="tablist">
          {groups.map((g, i) => (
            <button
              key={`${g.name}-tab-${i}`}
              type="button"
              role="tab"
              data-lf-tab
              data-lf-tab-index={i}
              aria-selected={i === activeIdx}
              onClick={() => setActive(i)}
              className="rounded-xl border px-4 py-2 text-sm font-semibold transition-colors"
              style={
                i === activeIdx
                  ? { background: "var(--lf-accent)", color: "var(--lf-accent-contrast)", borderColor: "transparent" }
                  : { background: "var(--lf-surface)", borderColor: "var(--lf-border)", color: "var(--lf-muted)" }
              }
            >
              {g.name}
            </button>
          ))}
        </div>
      ) : null}
      {groups.map((g, i) => (
        <div key={`${g.name}-panel-${i}`} data-lf-tab-panel data-lf-tab-index={i} role="tabpanel" style={{ display: i === activeIdx ? undefined : "none" }}>
          <Accordion type="single" collapsible className="flex flex-col gap-3">
            {g.items.map((item, j) => (
              <AccordionItem
                key={`${item.q}-${j}`}
                value={`faq-${i}-${j}`}
                className="rounded-xl border px-1"
                style={{ background: "var(--lf-surface)", borderColor: "var(--lf-border)" }}
              >
                <AccordionTrigger
                  className="px-4 py-4 text-left text-sm font-semibold hover:no-underline md:text-base [&>svg]:[color:var(--lf-accent)]"
                  style={{ color: "var(--lf-text)" }}
                >
                  {item.q}
                </AccordionTrigger>
                {/* forceMount keeps answers in the DOM (static HTML export + SEO);
                    closed items hide via the ancestor [data-state=closed] selector —
                    the vanilla export script toggles data-state to open them. */}
                <AccordionContent
                  forceMount
                  className="px-4 pb-4 text-sm leading-relaxed [[data-state=closed]_&]:hidden"
                  style={{ color: "var(--lf-muted)" }}
                >
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ))}
    </div>
  )
}

export function Faq({ section }: FaqProps) {
  const items = section.items ?? []

  return (
    <section className={SECTION_PAD}>
      <div className={CONTAINER}>
        <SectionHeader title={section.title} subtitle={section.subtitle} center />

        {section.style === "twocol" ? (
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
            {items.map((item, i) => (
              <TwoColItem key={`${item.q}-${i}`} item={item} />
            ))}
          </div>
        ) : section.style === "cards" ? (
          <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2">
            {items.map((item, i) => (
              <FaqCard key={`${item.q}-${i}`} item={item} />
            ))}
          </div>
        ) : section.style === "categorized" ? (
          <CategorizedFaq items={items} />
        ) : (
          <Accordion type="single" collapsible className="mx-auto flex max-w-3xl flex-col gap-3">
            {items.map((item, i) => (
              <AccordionItem
                key={`${item.q}-${i}`}
                value={`faq-${i}`}
                className="rounded-xl border px-1"
                style={{ background: "var(--lf-surface)", borderColor: "var(--lf-border)" }}
              >
                <AccordionTrigger
                  className="px-4 py-4 text-left text-sm font-semibold hover:no-underline md:text-base [&>svg]:[color:var(--lf-accent)]"
                  style={{ color: "var(--lf-text)" }}
                >
                  {item.q}
                </AccordionTrigger>
                {/* forceMount keeps answers in the DOM (static HTML export + SEO);
                    closed items hide via the ancestor [data-state=closed] selector —
                    the vanilla export script toggles data-state to open them. */}
                <AccordionContent
                  forceMount
                  className="px-4 pb-4 text-sm leading-relaxed [[data-state=closed]_&]:hidden"
                  style={{ color: "var(--lf-muted)" }}
                >
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </section>
  )
}
