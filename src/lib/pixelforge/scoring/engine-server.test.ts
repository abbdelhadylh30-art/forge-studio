import { describe, it, expect } from "vitest";
import { runScoringFromHTML } from "./server";
import { runScoring } from "./engine";

describe("runScoringFromHTML — server-side entry point (KA 3 §8)", () => {
  it("scores an HTML string without a browser (via jsdom)", async () => {
    const html = `<!DOCTYPE html>
      <html lang="en">
      <head>
        <title>Test Page</title>
        <meta name="description" content="A test page.">
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <h1>Hello World</h1>
        <a href="/signup" class="cta">Start Free</a>
      </body>
      </html>`;
    const sd = await runScoringFromHTML(html);
    expect(sd.score).toBeGreaterThanOrEqual(0);
    expect(sd.score).toBeLessThanOrEqual(100);
    expect(sd.issues).toBeInstanceOf(Array);
    // SEO checks should work (they don't need layout).
    expect(sd.cats.seo.total).toBeGreaterThan(0);
  });

  it("returns the same structure as runScoring", async () => {
    const html = "<!DOCTYPE html><html><body><h1>Hi</h1></body></html>";
    const fromHtml = await runScoringFromHTML(html);
    // Compare against a direct runScoring call with a DOMParser doc (browser-like).
    const doc = new DOMParser().parseFromString(html, "text/html");
    const direct = runScoring({ doc });
    // Same shape.
    expect(Object.keys(fromHtml.cats).sort()).toEqual(Object.keys(direct.cats).sort());
    expect(fromHtml.score).toBeGreaterThanOrEqual(0);
    expect(direct.score).toBeGreaterThanOrEqual(0);
  });

  it("handles malformed HTML without throwing", async () => {
    const html = "<html><body><h1>unclosed";
    await expect(runScoringFromHTML(html)).resolves.toBeDefined();
  });

  it("scores an empty document", async () => {
    const sd = await runScoringFromHTML("<!DOCTYPE html><html><body></body></html>");
    expect(sd.score).toBeGreaterThanOrEqual(0);
    // An empty body should surface SEO/structure issues.
    expect(sd.issues.length).toBeGreaterThan(0);
  });

  it("accepts a viewportWidth option", async () => {
    const sd = await runScoringFromHTML("<!DOCTYPE html><html><body><h1>Hi</h1></body></html>", {
      viewportWidth: 390,
    });
    expect(sd.score).toBeGreaterThanOrEqual(0);
  });
});
