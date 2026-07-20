/**
 * Server-side scoring entry point.
 *
 * SWEBOK KA 3 §8 (Construction Technologies — middleware/distributed): the
 * scoring engine is Document-coupled by design — it reads `getBoundingClientRect`
 * (layout) and `getComputedStyle` (cascaded styles), which require a DOM
 * implementation. In the browser we use the live iframe Document; server-side
 * we use jsdom.
 *
 * IMPORTANT CAVEAT: jsdom does NOT implement a real layout engine.
 * `getBoundingClientRect()` returns zeros and `getComputedStyle()` returns
 * only the cascaded (not used) values. This means above-fold, touch-target,
 * and color-contrast checks will score as if everything is at position (0,0)
 * with no layout. For accurate server-side scores (e.g. the Monitor feature's
 * scheduled re-audits), use a headless browser (Playwright/Puppeteer) to
 * render the page, then pass its `Document` to `runScoring`.
 *
 * This entry point is still useful for: SEO/meta/structure checks (which don't
 * need layout), smoke-testing the engine in CI, and the Monitor feature's
 * quick "did anything change?" signal (compare scores over time, not absolute
 * accuracy).
 *
 * This file is in a SEPARATE module from engine.ts so that the jsdom import
 * is never pulled into the client bundle (engine.ts is imported by client
 * components like Preview.tsx; this file is only imported by server routes).
 *
 * @param html  The HTML document to score.
 * @param opts  Optional viewport width (default 1280).
 */

import { runScoring } from "./engine";
import type { ScoreData } from "../types";

export async function runScoringFromHTML(
  html: string,
  opts: { viewportWidth?: number } = {}
): Promise<ScoreData> {
  const { JSDOM } = await import("jsdom");
  const dom = new JSDOM(html, { pretendToBeVisual: true });
  return runScoring({ doc: dom.window.document, viewportWidth: opts.viewportWidth });
}
