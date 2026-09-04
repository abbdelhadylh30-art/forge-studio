// ─────────────────────────────────────────────────────────────────────────────
// /api/ai/improve — copy editor (real LLM via z-ai-web-dev-sdk)
//
// POST /api/ai/improve
// body: { config: LandingConfig, instruction?: string }
// → 200 { config: LandingConfig }  (normalized; may have fewer sections if the
//      model trimmed some — acceptable, never throws on weird input)
// → 400 missing config | 500 { error } if the model fails
// ─────────────────────────────────────────────────────────────────────────────
import ZAI from "z-ai-web-dev-sdk"
import { NextRequest, NextResponse } from "next/server"
import { extractJson, normalizeConfig } from "@/lib/landing/yaml"
import { guard, HttpError, readJsonBody, str } from "@/lib/landing/server"
import type { LandingConfig } from "@/lib/landing/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SYSTEM_PROMPT = `You are landing-forge's copy editor. You receive a landing page config JSON. Improve the MARKETING COPY ONLY — make headlines punchier, subs clearer, feature bodies more concrete and benefit-driven, testimonial quotes more specific, FAQ answers crisper. DO NOT change: section types, ids, counts, structure, layout/style values, themeId, hrefs, weights. Keep the same language. Respond with ONLY the improved JSON config, complete and valid, same shape as input.`

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
    if (body.config === null || typeof body.config !== "object" || Array.isArray(body.config)) {
      throw new HttpError(400, "Field 'config' (a landing config object) is required")
    }
    // never trust weird input — normalize before sending to the model
    const current = normalizeConfig(body.config)
    const instruction = str(body.instruction)?.trim()

    const userContent =
      JSON.stringify(current) + (instruction ? `\n\nFocus: ${instruction}` : "")

    let improved: LandingConfig | null = null
    let lastError = "unknown error"
    for (let attempt = 0; attempt < 2; attempt++) {
      const content = await callLLM(
        attempt === 0 ? userContent : `${userContent}\n\nRespond with raw JSON only.`
      )
      try {
        improved = normalizeConfig(extractJson(content))
        break
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e)
      }
    }
    if (!improved) {
      return NextResponse.json(
        { error: `AI improvement failed (${lastError}). Please try again.` },
        { status: 500 }
      )
    }
    return NextResponse.json({ config: improved })
  })
}
