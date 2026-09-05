/**
 * PixelForge v19 — Real PageSpeed Insights (Google Lighthouse + CrUX)
 *
 * Tier 2 upgrade: the auditor previously shipped a simulated load-time
 * estimate (calculatePageSpeed heuristics). This endpoint proxies Google's
 * PageSpeed Insights v5 API so audits of imported URLs get REAL lab data
 * (Lighthouse) and field data (Chrome UX Report) when available.
 *
 * SWEBOK KA 2 §2.7 (Security) + KA 3 §4.5 (Fault Tolerance):
 *   - Target URL passes through the same SSRF guard as fetch-url
 *   - Rate limited (PSI quota is shared; 8 req / 5 min / IP)
 *   - 60s timeout — Lighthouse runs can take 20-40s
 *   - Works keyless (shared quota); set PSI_API_KEY for dedicated quota
 */

import { NextRequest, NextResponse } from "next/server";
import { assertPublicUrl, UrlGuardError } from "@/lib/security/url-guard";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

const PSI_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

/** Display-value audits we surface as core metrics. */
const METRIC_AUDITS = [
  "first-contentful-paint",
  "speed-index",
  "largest-contentful-paint",
  "total-blocking-time",
  "cumulative-layout-shift",
  "interactive",
] as const;

interface PsiOpportunity {
  id: string;
  title: string;
  savingsMs: number;
}

interface PsiResponse {
  url: string;
  strategy: string;
  source: "psi";
  score: number | null;
  metrics: { id: string; label: string; value: string; score: number | null }[];
  opportunities: PsiOpportunity[];
  fieldData: {
    category: string;
    fcp: string;
    lcp: string;
    cls: string;
  } | null;
  scoreBreakdown: { fcp: number; si: number; lcp: number; tbt: number; cls: number; tti: number } | null;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const strategy = req.nextUrl.searchParams.get("strategy") === "desktop" ? "desktop" : "mobile";

  if (!url) {
    return NextResponse.json({ error: "Please provide a URL to test." }, { status: 400 });
  }

  // Rate limit before spending quota on the Google side.
  const rl = checkRateLimit({ key: `psi:${getClientIp(req)}`, limit: 8, windowMs: 5 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `PageSpeed quota cooled down — try again in ${Math.ceil(rl.retryAfterMs / 1000)}s.` },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  // Validate + SSRF-guard the target (also rejects URLs PSI can't reach anyway,
  // saving a slow round-trip).
  let parsed: URL;
  try {
    parsed = await assertPublicUrl(url);
  } catch (e) {
    if (e instanceof UrlGuardError) {
      return NextResponse.json(
        { error: "That URL can't be tested. Use a public website address." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "That doesn't look like a valid URL." }, { status: 400 });
  }

  // Build the PSI request. Keyless mode works at low volume; PSI_API_KEY
  // (Vercel env / desktop env) unlocks dedicated quota.
  const psiUrl = new URL(PSI_ENDPOINT);
  psiUrl.searchParams.set("url", parsed.toString());
  psiUrl.searchParams.set("strategy", strategy);
  const apiKey = process.env.PSI_API_KEY;
  if (apiKey) psiUrl.searchParams.set("key", apiKey);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);
    const res = await fetch(psiUrl.toString(), { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      if (res.status === 429) {
        return NextResponse.json(
          { error: apiKey
              ? "Your PSI_API_KEY quota is exhausted for today. Try again tomorrow or raise the quota in Google Cloud."
              : "Google's shared keyless PageSpeed quota is exhausted right now (it resets daily). Set PSI_API_KEY for dedicated quota, or try again later." },
          { status: 429 }
        );
      }
      if (res.status === 400 || res.status === 404) {
        return NextResponse.json(
          { error: "Google couldn't test that page. Check the URL and try again." },
          { status: 502 }
        );
      }
      return NextResponse.json(
        { error: `PageSpeed test failed (Google returned ${res.status}).` },
        { status: 502 }
      );
    }

    const data = (await res.json()) as {
      lighthouseResult?: {
        categories?: { performance?: { score?: number | null } };
        audits?: Record<string, { displayValue?: string; score?: number | null; numericValue?: number; title?: string; details?: { type?: string; overallSavingsMs?: number } }>;
      };
      loadingExperience?: {
        overall_category?: string;
        metrics?: Record<string, { percentile?: number; category?: string }>;
      };
      error?: { message?: string };
    };

    // PSI sometimes returns 200 with an embedded error payload.
    if (data.error?.message) {
      return NextResponse.json({ error: `PageSpeed test failed: ${data.error.message}` }, { status: 502 });
    }

    const lh = data.lighthouseResult;
    if (!lh?.audits) {
      return NextResponse.json({ error: "PageSpeed returned no results for that URL." }, { status: 502 });
    }

    const scoreRaw = lh.categories?.performance?.score;
    const score = typeof scoreRaw === "number" ? Math.round(scoreRaw * 100) : null;

    const metrics = METRIC_AUDITS.flatMap((id) => {
      const a = lh.audits![id];
      if (!a) return [];
      return [{
        id,
        label: id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        value: a.displayValue ?? "—",
        score: typeof a.score === "number" ? a.score : null,
      }];
    });

    // Top saving opportunities (Lighthouse "opportunities" audit detail type),
    // sorted by estimated ms saved, capped at 5.
    const opportunities: PsiOpportunity[] = Object.entries(lh.audits)
      .filter(([, a]) => a.details?.type === "opportunity" && (a.details.overallSavingsMs ?? 0) > 0)
      .map(([id, a]) => ({ id, title: a.title ?? id, savingsMs: Math.round(a.details!.overallSavingsMs ?? 0) }))
      .sort((a, b) => b.savingsMs - a.savingsMs)
      .slice(0, 5);

    // Field data (Chrome UX Report) — real-user metrics, present only when
    // the site has enough traffic to be in the CrUX dataset.
    const le = data.loadingExperience;
    let fieldData: PsiResponse["fieldData"] = null;
    if (le?.metrics) {
      const pct = (k: string) => le.metrics?.[k]?.percentile;
      const fcp = pct("FIRST_CONTENTFUL_PAINT_MS");
      const lcp = pct("LARGEST_CONTENTFUL_PAINT_MS");
      const cls = pct("CUMULATIVE_LAYOUT_SHIFT_SCORE");
      if (fcp || lcp || cls) {
        fieldData = {
          category: le.overall_category ?? "UNKNOWN",
          fcp: fcp != null ? `${(fcp / 1000).toFixed(1)} s` : "—",
          lcp: lcp != null ? `${(lcp / 1000).toFixed(1)} s` : "—",
          cls: cls != null ? (cls / 100).toFixed(2) : "—",
        };
      }
    }

    // Per-metric Lighthouse scores for the ring breakdown.
    const s = (id: string) => (typeof lh.audits?.[id]?.score === "number" ? lh.audits[id].score! : 0);
    const scoreBreakdown = {
      fcp: s("first-contentful-paint"),
      si: s("speed-index"),
      lcp: s("largest-contentful-paint"),
      tbt: s("total-blocking-time"),
      cls: s("cumulative-layout-shift"),
      tti: s("interactive"),
    };

    const body: PsiResponse = {
      url: parsed.toString(),
      strategy,
      source: "psi",
      score,
      metrics,
      opportunities,
      fieldData,
      scoreBreakdown,
    };
    return NextResponse.json(body);
  } catch (e: unknown) {
    const err = e as { name?: string; message?: string };
    if (err?.name === "AbortError") {
      return NextResponse.json(
        { error: "The PageSpeed test timed out (>60s). Google may be busy — try again shortly." },
        { status: 504 }
      );
    }
    return NextResponse.json({ error: "Couldn't run the PageSpeed test. Try again in a moment." }, { status: 502 });
  }
}
