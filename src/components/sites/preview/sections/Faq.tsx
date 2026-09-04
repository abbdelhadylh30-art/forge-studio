"use client"

import type { FaqSection } from "@/lib/landing/types"

import { cn } from "@/lib/utils"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

import { CONTAINER, SECTION_PAD, SectionHeader } from "../shared"

export interface FaqProps {
  section: FaqSection
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
              <div key={`${item.q}-${i}`}>
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
            ))}
          </div>
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
