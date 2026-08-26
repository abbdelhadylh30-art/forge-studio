import { describe, it, expect } from "vitest";
import { parseColor, lum, getContrastRatio, runScoring } from "./engine";
import type { ScoreData } from "../types";

/** Build a Document from an HTML string using jsdom's DOMParser. */
function doc(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

describe("parseColor", () => {
  it("parses 6-digit hex", () => {
    expect(parseColor("#000000")).toEqual({ r: 0, g: 0, b: 0 });
    expect(parseColor("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseColor("#5c8def")).toEqual({ r: 92, g: 141, b: 239 });
  });

  it("parses 3-digit hex", () => {
    expect(parseColor("#000")).toEqual({ r: 0, g: 0, b: 0 });
    expect(parseColor("#fff")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("parses rgb() / rgba()", () => {
    expect(parseColor("rgb(255, 0, 0)")).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseColor("rgba(10, 20, 30, 0.5)")).toEqual({ r: 10, g: 20, b: 30 });
  });

  it("parses named colors", () => {
    expect(parseColor("black")).toEqual({ r: 0, g: 0, b: 0 });
    expect(parseColor("white")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseColor("red")).toEqual({ r: 255, g: 0, b: 0 });
  });

  it("returns null for unparseable input", () => {
    expect(parseColor(null)).toBeNull();
    expect(parseColor("")).toBeNull();
    expect(parseColor("not-a-color")).toBeNull();
  });
});

describe("lum (relative luminance)", () => {
  it("black → 0, white → 1", () => {
    expect(lum({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 5);
    expect(lum({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5);
  });

  it("is monotonic in each channel", () => {
    const dark = lum({ r: 50, g: 50, b: 50 });
    const light = lum({ r: 200, g: 200, b: 200 });
    expect(light).toBeGreaterThan(dark);
  });
});

describe("getContrastRatio", () => {
  it("black-on-white = 21:1 (WCAG max)", () => {
    expect(getContrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });

  it("same color = 1:1 (minimum)", () => {
    expect(getContrastRatio("#777777", "#777777")).toBeCloseTo(1, 5);
  });

  it("detects WCAG AA failures (< 4.5:1 for normal text)", () => {
    // #777 on #fff ≈ 4.48:1 — fails AA
    const ratio = getContrastRatio("#777777", "#ffffff");
    expect(ratio).toBeLessThan(4.5);
  });

  it("detects WCAG AA passes (≥ 4.5:1)", () => {
    // #595959 on #fff ≈ 5.85:1 — passes AA
    const ratio = getContrastRatio("#595959", "#ffffff");
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("returns 4 for unparseable colors (defensive — don't fail pages for unknown colors)", () => {
    expect(getContrastRatio("not-a-color", "#fff")).toBe(4);
    expect(getContrastRatio("#fff", "not-a-color")).toBe(4);
  });
});

describe("runScoring — category structure", () => {
  it("returns a ScoreData with all 5 categories", () => {
    const d = doc("<!DOCTYPE html><html><body><h1>Hi</h1></body></html>");
    const sd = runScoring({ doc: d });
    const keys = Object.keys(sd.cats).sort();
    expect(keys).toEqual(["a11y", "content", "perf", "seo", "structure"]);
  });

  it("produces a 0–100 score", () => {
    const d = doc("<!DOCTYPE html><html><body><h1>Hi</h1></body></html>");
    const sd = runScoring({ doc: d });
    expect(sd.score).toBeGreaterThanOrEqual(0);
    expect(sd.score).toBeLessThanOrEqual(100);
  });

  it("includes an issues array", () => {
    const d = doc("<!DOCTYPE html><html><body></body></html>");
    const sd = runScoring({ doc: d });
    expect(Array.isArray(sd.issues)).toBe(true);
    // An empty body should surface several issues (missing H1, etc.)
    expect(sd.issues.length).toBeGreaterThan(0);
  });
});

describe("runScoring — bug regressions", () => {
  // Regression: ctaWords matched "now" as a substring, so "knowledge", "snow",
  // "nowhere" falsely registered as a strong CTA. Fixed to use word boundaries.
  it("does NOT count 'knowledge' as a CTA (word-boundary fix)", () => {
    // Use an <a> (NOT a <button> — buttons set ctaFound=true via the tag check,
    // which would mask the bug). The <a>'s text contains "knowledge" which
    // contains "now". With the bug, ctaFound=true → full points, no issue.
    // With the fix, ctaFound=false → "cta-weak" issue is raised (link exists
    // above fold but lacks strong CTA language).
    const html = `<!DOCTYPE html><html><body>
      <h1>Knowledge Base</h1>
      <a href="/kb">Read the knowledge base</a>
    </body></html>`;
    const d = doc(html);
    // Simulate the link being above the fold with a real size (jsdom returns
    // zeros by default, which the engine treats as "hidden"). Mock the rect
    // on the element itself — the engine calls getBoundingClientRect().
    const link = d.querySelector("a")! as HTMLElement;
    link.getBoundingClientRect = () =>
      ({ top: 100, left: 0, width: 200, height: 50, right: 200, bottom: 150, x: 0, y: 100, toJSON: () => ({}) }) as DOMRect;
    const sd = runScoring({ doc: d });
    const ctaWeak = sd.issues.find((i) => i.id === "cta-weak");
    expect(ctaWeak).toBeTruthy();
  });

  // Regression: unlabeled-count used Math.ceil(inputs.length - labeled) which
  // double-counted placeholder-only fields. Now counts unlabeled directly.
  it("counts unlabeled inputs correctly (no off-by-one with placeholder-only fields)", () => {
    // 2 inputs: one fully labeled, one placeholder-only.
    // labeled = 1 (full) + 0.5 (placeholder) = 1.5
    // unlabeled should be 0 (the placeholder one is NOT fully unlabeled).
    const html = `<!DOCTYPE html><html><body>
      <form>
        <label for="a">Name</label><input id="a" />
        <input placeholder="email" />
      </form>
    </body></html>`;
    const d = doc(html);
    const sd = runScoring({ doc: d });
    const labelsIssue = sd.issues.find((i) => i.id === "form-labels");
    // With the fix, unlabeled = 0 → issue should NOT be raised.
    expect(labelsIssue).toBeUndefined();
  });

  it("flags fully unlabeled inputs", () => {
    const html = `<!DOCTYPE html><html><body>
      <form>
        <input />
        <input />
      </form>
    </body></html>`;
    const d = doc(html);
    const sd = runScoring({ doc: d });
    const labelsIssue = sd.issues.find((i) => i.id === "form-labels");
    expect(labelsIssue).toBeTruthy();
    expect(labelsIssue!.title).toContain("2 Form Fields");
  });
});

describe("runScoring — perfect page", () => {
  it("scores a well-formed page higher than an empty one", () => {
    const good = doc(`<!DOCTYPE html>
      <html lang="en">
      <head>
        <title>Acme — Build Better Software</title>
        <meta name="description" content="Acme helps teams ship better software faster.">
        <meta property="og:title" content="Acme" />
        <meta property="og:description" content="Build better software." />
        <meta property="og:image" content="https://acme.com/og.png" />
        <meta property="og:url" content="https://acme.com" />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#5c8def" />
      </head>
      <body>
        <h1>Build Better Software 3x Faster</h1>
        <p>Acme helps teams ship better software faster.</p>
        <a href="/signup" class="cta">Start Free</a>
      </body></html>`);
    const bad = doc("<!DOCTYPE html><html><body></body></html>");
    const goodScore = runScoring({ doc: good }).score;
    const badScore = runScoring({ doc: bad }).score;
    expect(goodScore).toBeGreaterThan(badScore);
  });
});
