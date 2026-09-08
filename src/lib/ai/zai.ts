// ─────────────────────────────────────────────────────────────────────────────
// getZAI — resolve the z-ai SDK client from env vars, with local-file fallback.
//
// Production (Vercel) has no ~/.z-ai-config file and the SDK's ZAI.create()
// only reads its config from disk (cwd / homedir / /etc). When
// ZAI_BASE_URL + ZAI_API_KEY are set (hosting dashboard env vars) we
// construct the client directly — the runtime constructor accepts a config
// object even though the .d.ts marks it private, hence the scoped cast.
// Falls back to ZAI.create() (dev sandbox config file), then null.
// ─────────────────────────────────────────────────────────────────────────────
import ZAI from "z-ai-web-dev-sdk"

interface ZaiEnvConfig {
  baseUrl: string
  apiKey: string
}

/** ZAI re-typed with its (runtime-public) config constructor. */
const ZaiCtor = ZAI as unknown as new (config: ZaiEnvConfig) => ZAI

/** baseUrl must end with /v1 — the SDK appends /chat/completions etc. directly. */
function normalizeBaseUrl(raw: string): string {
  const url = raw.replace(/\/+$/, "")
  return /\/v1$/.test(url) ? url : `${url}/v1`
}

export async function getZAI(): Promise<ZAI | null> {
  const baseUrl = process.env.ZAI_BASE_URL?.trim()
  const apiKey = process.env.ZAI_API_KEY?.trim()
  if (baseUrl && apiKey) {
    return new ZaiCtor({ baseUrl: normalizeBaseUrl(baseUrl), apiKey })
  }
  try {
    // local dev sandbox: reads .z-ai-config from cwd / homedir / /etc
    return await ZAI.create()
  } catch {
    return null
  }
}
