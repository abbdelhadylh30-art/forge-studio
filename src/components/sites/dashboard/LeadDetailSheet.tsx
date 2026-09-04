"use client"

import * as React from "react"
import { AtSign, CalendarDays, Check, Copy, Mail, MessageSquareText, Phone } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { LeadRecord } from "@/lib/landing/types"

function initialsFor(lead: LeadRecord): string {
  return (lead.name || lead.email || "?")
    .split(/[\s.@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("")
}

function hueFor(id: string): number {
  return (id.charCodeAt(0) * 13) % 360
}

/**
 * Lead detail drawer — full contact-form submission: extracted identity, the
 * complete field map, and quick reply actions.
 */
export function LeadDetailSheet({ lead, open, onOpenChange }: { lead: LeadRecord | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!open) setCopied(false)
  }, [open])

  const copyEmail = async () => {
    if (!lead?.email) return
    try {
      await navigator.clipboard.writeText(lead.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
      toast.success("Email copied")
    } catch {
      toast.error("Copy failed")
    }
  }

  const entries = lead ? Object.entries(lead.fields).filter(([k]) => k.toLowerCase() !== "message" || lead.fields[k] !== lead.message) : []
  const created = lead ? new Date(lead.createdAt) : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 border-zinc-800 bg-zinc-950 p-0 sm:max-w-md">
        {lead && (
          <>
            <SheetHeader className="space-y-3 border-b border-zinc-800/80 px-5 pb-4 pt-5">
              <div className="flex items-center gap-3.5">
                <span
                  className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-zinc-700 text-[15px] font-bold text-zinc-100"
                  style={{ background: `hsl(${hueFor(lead.id)} 45% 22%)` }}
                  aria-hidden
                >
                  {initialsFor(lead)}
                </span>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="truncate text-[15px] font-bold text-zinc-50">{lead.name || "Anonymous submission"}</SheetTitle>
                  <SheetDescription className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-500">
                    <CalendarDays className="h-3 w-3 shrink-0" />
                    {created?.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) ?? ""}
                  </SheetDescription>
                </div>
              </div>

              {/* quick actions */}
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" className="h-8 gap-1.5 bg-violet-500 text-[11px] text-white hover:bg-violet-600 disabled:opacity-40" disabled={!lead.email}>
                  <a href={lead.email ? `mailto:${lead.email}?subject=${encodeURIComponent("Re: your message")}` : undefined} aria-disabled={!lead.email}>
                    <Mail className="h-3 w-3" /> Reply by email
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 border-zinc-800 bg-zinc-900 text-[11px] text-zinc-200 hover:border-violet-500/50 disabled:opacity-40"
                  onClick={() => void copyEmail()}
                  disabled={!lead.email}
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />} Copy email
                </Button>
              </div>
            </SheetHeader>

            <div className="lf-scroll min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
              {/* message */}
              {lead.message && (
                <section aria-labelledby="lead-message">
                  <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    <MessageSquareText className="h-3 w-3" /> Message
                  </p>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5">
                    <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-zinc-200">{lead.message}</p>
                  </div>
                </section>
              )}

              {/* identity */}
              <section aria-labelledby="lead-identity">
                <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  <AtSign className="h-3 w-3" /> Identity
                </p>
                <dl className="space-y-1.5">
                  {lead.email && (
                    <div className="flex items-center gap-2.5 rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-3 py-2">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-violet-300" />
                      <dt className="w-16 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Email</dt>
                      <dd className="min-w-0 flex-1 truncate text-[12px] text-zinc-200">{lead.email}</dd>
                    </div>
                  )}
                  {lead.name && (
                    <div className="flex items-center gap-2.5 rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-3 py-2">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                      <dt className="w-16 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Name</dt>
                      <dd className="min-w-0 flex-1 truncate text-[12px] text-zinc-200">{lead.name}</dd>
                    </div>
                  )}
                  {!lead.email && !lead.name && (
                    <p className="rounded-lg border border-dashed border-zinc-800 px-3 py-2.5 text-[11px] text-zinc-600">
                      No name or email could be extracted from the submitted fields.
                    </p>
                  )}
                </dl>
              </section>

              {/* full field map */}
              {entries.length > 0 && (
                <section aria-labelledby="lead-fields">
                  <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    <Check className="h-3 w-3" /> All submitted fields ({entries.length})
                  </p>
                  <dl className="divide-y divide-zinc-800/70 overflow-hidden rounded-xl border border-zinc-800">
                    {entries.map(([k, v], i) => (
                      <div key={k} className={cn("flex items-start gap-3 px-3 py-2", i % 2 === 1 && "bg-zinc-900/40")}>
                        <dt className="w-1/3 shrink-0 text-[11px] font-medium text-zinc-500">{k}</dt>
                        <dd className="min-w-0 flex-1 break-words text-[12px] text-zinc-200">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}
            </div>

            <footer className="border-t border-zinc-800/80 bg-zinc-900/30 px-5 py-3">
              <p className="text-[10px] leading-relaxed text-zinc-600">
                Lead id <code className="font-mono text-zinc-500">{lead.id}</code> — captured from a contact-form submission. Privacy-friendly: no
                cookies were involved.
              </p>
            </footer>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

/** Build a CSV from leads (columns = fixed meta + union of all field keys). */
export function leadsToCsv(leads: LeadRecord[]): string {
  const fieldKeys = Array.from(new Set(leads.flatMap((l) => Object.keys(l.fields))))
  const headers = ["id", "created_at", "name", "email", "message", ...fieldKeys]
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  const rows = leads.map((l) =>
    [
      l.id,
      new Date(l.createdAt).toISOString(),
      l.name ?? "",
      l.email ?? "",
      l.message ?? "",
      ...fieldKeys.map((k) => l.fields[k] ?? ""),
    ]
      .map(esc)
      .join(",")
  )
  return [headers.join(","), ...rows].join("\n")
}

/** Trigger a client-side CSV download for the given leads. */
export function downloadLeadsCsv(leads: LeadRecord[], projectName: string): void {
  const csv = leadsToCsv(leads)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `leads-${projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) || "project"}-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
