// ─────────────────────────────────────────────────────────────────────────────
// /api/ai/generate — prompt → landing config (real LLM via z-ai-web-dev-sdk)
//
// POST /api/ai/generate
// body: { prompt: string, templateId?: string }
// → 200 { config: LandingConfig }   (normalized — safe to save straight away)
// → 400 missing prompt | 500 { error } if the model output can't be parsed
//      (one automatic retry with a "raw JSON only" nudge is attempted)
// ─────────────────────────────────────────────────────────────────────────────
import ZAI from "z-ai-web-dev-sdk"
import { NextRequest, NextResponse } from "next/server"
import { extractJson, normalizeConfig } from "@/lib/landing/yaml"
import { guard, HttpError, readJsonBody, str } from "@/lib/landing/server"
import type { LandingConfig } from "@/lib/landing/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SYSTEM_PROMPT = `You are landing-forge, an expert landing-page copywriter & information architect. Given a product description, respond with ONLY a valid JSON object (no markdown fences, no commentary) matching this TypeScript type:

{
  "brand": { "name": string, "tagline": string },
  "themeId": "nebula" | "ember" | "emerald" | "rose" | "mono" | "paper",
  "seo": { "title": string, "description": string },
  "sections": Section[]
}

Section is a tagged union — every section object carries a "type" field with one of these exact values and fields:
- "navbar": { "type": "navbar", "links": [{ "label": string, "href": string }], "cta": { "label": string, "href": string } }
- "hero": { "type": "hero", "layout": "split-right" | "split-left" | "center" | "full-bleed", "badge": string, "headline": string, "sub": string, "cta": { "label": string, "href": string }, "secondaryCta": { "label": string, "href": string }, "image": "", "stats": [{ "value": string, "label": string }] }
- "logos": { "type": "logos", "title": string, "items": string[] }
- "features": { "type": "features", "title": string, "subtitle": string, "style": "grid" | "alternating" | "bento" | "tabs", "columns": number (2-4), "items": [{ "icon": string (a single emoji), "title": string, "body": string }] }
- "stats": { "type": "stats", "title": string, "items": [{ "value": string, "label": string, "delta": string }] }
- "testimonials": { "type": "testimonials", "title": string, "subtitle": string, "style": "grid" | "marquee" | "spotlight", "items": [{ "quote": string, "author": string, "role": string, "rating": number (1-5) }] }
- "pricing": { "type": "pricing", "title": string, "subtitle": string, "annualToggle": boolean, "plans": [{ "name": string, "price": string like "$29", "period": string like "/mo", "description": string, "features": string[], "highlighted": boolean, "ctaLabel": string }] }
- "faq": { "type": "faq", "title": string, "subtitle": string, "style": "accordion" | "twocol", "items": [{ "q": string, "a": string }] }
- "gallery": { "type": "gallery", "title": string, "subtitle": string, "style": "masonry" | "carousel", "items": [{ "alt": string, "caption": string, "hue": string ("0"-"360") }] }
- "contact": { "type": "contact", "title": string, "subtitle": string, "email": string, "phone": string, "fields": string[], "submitLabel": string }
- "cta-final": { "type": "cta-final", "headline": string, "sub": string, "cta": { "label": string, "href": string }, "note": string }
- "footer": { "type": "footer", "style": "minimal" | "mega" | "newsletter", "tagline": string, "linkGroups": [{ "group": string, "items": [{ "label": string, "href": string }] }], "social": string[], "copyright": string }

Rules: always include navbar first, hero second, footer last; 5-10 sections total; 3-6 items per list; copy must be specific, punchy, marketing-grade (short headlines ≤8 words); if the user writes in another language, write ALL copy in that language; pick themeId that matches the vibe; href "#" or "#features" etc.`

async function callLLM(userContent: string): Promise<string> {
  const zai = await ZAI.create()
  const completion = await zai.chat.completions.create({
    messages: [
      { role: "assistant", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    thinking: { type: "disabled" },
  })
  return completion.choices[0]?.message?.content ?? ""
}

export async function POST(req: NextRequest) {
  return guard(async () => {
    const body = await readJsonBody(req)
    const prompt = str(body.prompt)?.trim()
    if (!prompt) throw new HttpError(400, "Field 'prompt' is required (non-empty string)")
    const templateId = str(body.templateId)

    let userContent = prompt
    if (templateId) userContent += `\n(Preferred starting structure: the "${templateId}" template.)`

    let config: LandingConfig | null = null
    let lastError = "unknown error"
    for (let attempt = 0; attempt < 2; attempt++) {
      const content = await callLLM(
        attempt === 0 ? userContent : `${userContent}\n\nRespond with raw JSON only.`
      )
      try {
        config = normalizeConfig(extractJson(content))
        break
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e)
      }
    }
    if (!config) {
      return NextResponse.json(
        { error: `AI response could not be parsed as a landing config (${lastError}). Try rephrasing your prompt.` },
        { status: 500 }
      )
    }
    return NextResponse.json({ config })
  })
}
