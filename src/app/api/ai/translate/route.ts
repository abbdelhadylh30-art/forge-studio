// ─────────────────────────────────────────────────────────────────────────────
// /api/ai/translate — section copy translation (real LLM via z-ai-web-dev-sdk)
//
// POST /api/ai/translate
// body: { locale: "ar", sectionType: "hero", fields: { "headline": "...", "sub": "..." } }
// → 200 { translations: { "headline": "…", "sub": "…" } }
//      — SAME KEYS as the input fields, values translated to the target locale
// → 400 missing/invalid fields | 500 { error } if the model fails
//
// The route is deliberately narrow: it only translates the string values of a
// flat { dotted-path → text } map. Structure validation, storage and RTL
// direction are handled client-side (see src/lib/landing/i18n.ts).
// ─────────────────────────────────────────────────────────────────────────────
import ZAI from "z-ai-web-dev-sdk"
import { NextRequest, NextResponse } from "next/server"
import { guard, HttpError, readJsonBody, str } from "@/lib/landing/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_FIELDS = 40
const MAX_VALUE_CHARS = 600

const SYSTEM_PROMPT = `You are a professional marketing copy translator for landing pages. You receive a JSON object whose VALUES are source-language marketing copy and whose KEYS are opaque field paths. Translate every VALUE into the requested target locale, keeping keys EXACTLY unchanged. Rules: preserve tone, punch and marketing intent; keep numbers, prices, product names and URLs untranslated; keep emoji and placeholders intact; adapt idioms naturally rather than literally. Respond with ONLY a valid JSON object with the exact same keys.`

async function callLLM(locale: string, label: string, fields: Record<string, string>): Promise<Record<string, string> | null> {
  const zai = await ZAI.create()
  const userContent = `Target locale: ${locale} (${label}).\nTranslate the values of this JSON object:\n${JSON.stringify(fields)}`
  for (let attempt = 0; attempt < 2; attempt++) {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: SYSTEM_PROMPT },
        { role: "user", content: attempt === 0 ? userContent : `${userContent}\n\nRespond with raw JSON only — same keys, translated values.` },
      ],
      thinking: { type: "disabled" },
    })
    const content = completion.choices[0]?.message?.content ?? ""
    try {
      const parsed = JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g, "")) as unknown
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const out: Record<string, string> = {}
        for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
          if (typeof v === "string" && k in fields) out[k] = v
        }
        // every requested key came back translated → good enough
        if (Object.keys(out).length >= Object.keys(fields).length) return out
      }
    } catch {
      // retry below
    }
  }
  return null
}

export async function POST(req: NextRequest) {
  return guard(async () => {
    const body = await readJsonBody(req)
    const locale = str(body.locale)?.toLowerCase().replace(/[^a-z-]/g, "").slice(0, 8)
    const sectionType = str(body.sectionType)?.slice(0, 24)
    if (!locale) throw new HttpError(400, "Field 'locale' (e.g. 'ar') is required")
    const rawFields = body.fields
    if (rawFields === null || typeof rawFields !== "object" || Array.isArray(rawFields)) {
      throw new HttpError(400, "Field 'fields' ({ path: text }) is required")
    }

    // sanitize + cap the input map
    const fields: Record<string, string> = {}
    for (const [k, v] of Object.entries(rawFields as Record<string, unknown>)) {
      if (typeof v !== "string" || !v.trim()) continue
      if (!/^[a-zA-Z0-9_.-]{1,40}$/.test(k)) continue
      fields[k] = v.slice(0, MAX_VALUE_CHARS)
      if (Object.keys(fields).length >= MAX_FIELDS) break
    }
    if (Object.keys(fields).length === 0) throw new HttpError(400, "No translatable text fields supplied")

    const translations = await callLLM(locale, `${sectionType ?? "section"} copy`, fields)
    if (!translations) {
      return NextResponse.json(
        { error: `Translation to “${locale}” failed — the model returned no usable JSON. Please retry.` },
        { status: 500 }
      )
    }
    return NextResponse.json({ translations })
  })
}
