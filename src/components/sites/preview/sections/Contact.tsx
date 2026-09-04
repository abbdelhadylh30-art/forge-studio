"use client"

import { useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"
import { Check, Mail, Phone, Send } from "lucide-react"

import type { ContactSection } from "@/lib/landing/types"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { CONTAINER, SECTION_PAD } from "../shared"

export interface ContactProps {
  section: ContactSection
  onFormSubmit?: (data: Record<string, string>) => void
}

export function Contact({ section, onFormSubmit }: ContactProps) {
  const fields = section.fields ?? []
  const [values, setValues] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [status, setStatus] = useState<"idle" | "success">("idle")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    []
  )

  const setValue = (field: string, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => (prev[field] ? { ...prev, [field]: false } : prev))
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (status === "success") return
    const nextErrors: Record<string, boolean> = {}
    for (const field of fields) {
      nextErrors[field] = !values[field]?.trim()
    }
    setErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) return

    onFormSubmit?.({ ...values })
    setStatus("success")
    timerRef.current = setTimeout(() => {
      setStatus("idle")
      setValues({})
    }, 2500)
  }

  return (
    <section className={SECTION_PAD}>
      <div className={CONTAINER}>
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* left: copy + contact details */}
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl" style={{ color: "var(--lf-text)" }}>
              {section.title ?? "Get in touch"}
            </h2>
            {section.subtitle ? (
              <p className="mt-3 max-w-md text-sm leading-relaxed md:text-base" style={{ color: "var(--lf-muted)" }}>
                {section.subtitle}
              </p>
            ) : null}
            <div className="mt-8 flex flex-col gap-4">
              {section.email ? (
                <div className="flex items-center gap-3.5">
                  <span className="flex size-10 items-center justify-center rounded-xl" style={{ background: "var(--lf-accent-soft)" }}>
                    <Mail className="size-4" style={{ color: "var(--lf-accent)" }} />
                  </span>
                  <a
                    href={`mailto:${section.email}`}
                    className="text-sm font-medium transition-colors [color:var(--lf-text)] hover:[color:var(--lf-accent)]"
                  >
                    {section.email}
                  </a>
                </div>
              ) : null}
              {section.phone ? (
                <div className="flex items-center gap-3.5">
                  <span className="flex size-10 items-center justify-center rounded-xl" style={{ background: "var(--lf-accent-soft)" }}>
                    <Phone className="size-4" style={{ color: "var(--lf-accent)" }} />
                  </span>
                  <a
                    href={`tel:${section.phone.replace(/[^+\d]/g, "")}`}
                    className="text-sm font-medium transition-colors [color:var(--lf-text)] hover:[color:var(--lf-accent)]"
                  >
                    {section.phone}
                  </a>
                </div>
              ) : null}
            </div>
          </div>

          {/* right: form card */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="rounded-2xl border p-6 md:p-7"
            style={{ background: "var(--lf-surface)", borderColor: "var(--lf-border)" }}
          >
            <div className="flex flex-col gap-4">
              {fields.map((field, i) => {
                const isMessage = field.toLowerCase().includes("message")
                const isEmail = field.toLowerCase().includes("email")
                const invalid = errors[field] === true
                const id = `contact-field-${i}`
                return (
                  <div key={`${field}-${i}`} className="flex flex-col gap-1.5">
                    <label htmlFor={id} className="text-sm font-medium" style={{ color: "var(--lf-text)" }}>
                      {field}
                    </label>
                    {isMessage ? (
                      <Textarea
                        id={id}
                        rows={4}
                        value={values[field] ?? ""}
                        onChange={(e) => setValue(field, e.target.value)}
                        aria-invalid={invalid}
                        className={cn(invalid && "border-red-400")}
                        style={
                          invalid
                            ? { background: "var(--lf-surface)", color: "var(--lf-text)" }
                            : { background: "var(--lf-surface)", color: "var(--lf-text)", borderColor: "var(--lf-border)" }
                        }
                      />
                    ) : (
                      <Input
                        id={id}
                        type={isEmail ? "email" : "text"}
                        value={values[field] ?? ""}
                        onChange={(e) => setValue(field, e.target.value)}
                        aria-invalid={invalid}
                        className={cn(invalid && "border-red-400")}
                        style={
                          invalid
                            ? { background: "var(--lf-surface)", color: "var(--lf-text)" }
                            : { background: "var(--lf-surface)", color: "var(--lf-text)", borderColor: "var(--lf-border)" }
                        }
                      />
                    )}
                    {invalid ? <span className="text-xs text-red-400">This field is required</span> : null}
                  </div>
                )
              })}
            </div>

            <button
              type="submit"
              disabled={status === "success"}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-transform duration-150 hover:scale-[1.01]"
              style={
                status === "success"
                  ? { background: "var(--lf-accent-soft)", color: "var(--lf-accent)" }
                  : { background: "var(--lf-accent)", color: "var(--lf-accent-contrast)" }
              }
            >
              {status === "success" ? (
                <>
                  <Check className="size-4" />
                  Message sent — tracked as form submission
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  {section.submitLabel || "Send message"}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
