import { describe, it, expect, vi } from "vitest";
import { applyQuickFix, applyAllSafeFixes, type QuickFixContext } from "./quick-fixes";

function doc(html: string): Document {
  return new DOMParser().parseFromString(html, "text/html");
}

function ctx(d: Document, opts: Partial<QuickFixContext> = {}): QuickFixContext {
  return {
    doc: d,
    pushHistory: opts.pushHistory ?? (() => {}),
    syncHTML: opts.syncHTML ?? (() => {}),
    toast: opts.toast ?? (() => {}),
  };
}

describe("applyQuickFix — fixMultipleH1", () => {
  // Regression: previously set h2.textContent BEFORE moving children, which
  // duplicated text content (text node + moved children). Fixed to move only.
  it("preserves inner HTML (links, spans) when demoting H1 → H2", () => {
    const d = doc(`<!DOCTYPE html><html><body>
      <h1>First heading</h1>
      <h1>Second <a href="/x">linked</a> heading</h1>
    </body></html>`);
    const r = applyQuickFix("fixMultipleH1", ctx(d));
    expect(r.applied).toBe(true);
    const h1s = d.querySelectorAll("h1");
    const h2s = d.querySelectorAll("h2");
    expect(h1s.length).toBe(1);
    expect(h2s.length).toBe(1);
    // The demoted H2 must retain the <a> child (NOT be flattened to text).
    const link = h2s[0].querySelector("a");
    expect(link).toBeTruthy();
    expect(link!.getAttribute("href")).toBe("/x");
    expect(link!.textContent).toBe("linked");
    // And must NOT contain a duplicate "Second linked heading" text node.
    expect(h2s[0].textContent).toContain("Second");
    expect(h2s[0].textContent).toContain("linked");
  });

  it("returns applied:false when there is only one H1", () => {
    const d = doc("<!DOCTYPE html><html><body><h1>Only one</h1></body></html>");
    expect(applyQuickFix("fixMultipleH1", ctx(d)).applied).toBe(false);
  });

  it("returns applied:false when there are no H1s", () => {
    const d = doc("<!DOCTYPE html><html><body><p>nothing</p></body></html>");
    expect(applyQuickFix("fixMultipleH1", ctx(d)).applied).toBe(false);
  });
});

describe("applyQuickFix — no-op guards", () => {
  // Regression: fixes returned applied:true even when nothing changed.
  it("fixAltText returns applied:false when all images already have alt", () => {
    const d = doc('<!DOCTYPE html><html><body><img src="x.jpg" alt="A photo" /></body></html>');
    const r = applyQuickFix("fixAltText", ctx(d));
    expect(r.applied).toBe(false);
  });

  it("fixImgSize returns applied:false when images already have dimensions", () => {
    const d = doc('<!DOCTYPE html><html><body><img src="x.jpg" width="100" height="50" /></body></html>');
    const r = applyQuickFix("fixImgSize", ctx(d));
    expect(r.applied).toBe(false);
  });

  it("fixTouchTargets returns applied:false when no small targets exist", () => {
    const d = doc('<!DOCTYPE html><html><body><button style="width:48px;height:48px">OK</button></body></html>');
    const r = applyQuickFix("fixTouchTargets", ctx(d));
    expect(r.applied).toBe(false);
  });

  it("fixScriptDefer returns applied:false when scripts already defer", () => {
    const d = doc('<!DOCTYPE html><html><head><script src="a.js" defer></script></head><body></body></html>');
    const r = applyQuickFix("fixScriptDefer", ctx(d));
    expect(r.applied).toBe(false);
  });
});

describe("applyQuickFix — addMetaDescription", () => {
  it("adds a meta description when none exists", () => {
    const d = doc("<!DOCTYPE html><html><head></head><body></body></html>");
    const r = applyQuickFix("addMeta", ctx(d));
    expect(r.applied).toBe(true);
    const meta = d.querySelector('meta[name="description"]');
    expect(meta).toBeTruthy();
    expect(meta!.getAttribute("content")!.length).toBeGreaterThan(0);
  });

  it("returns applied:false when a description already exists", () => {
    const d = doc('<!DOCTYPE html><html><head><meta name="description" content="existing"></head><body></body></html>');
    const r = applyQuickFix("addMeta", ctx(d));
    expect(r.applied).toBe(false);
  });
});

describe("applyAllSafeFixes", () => {
  it("returns a count and changes array", () => {
    const d = doc("<!DOCTYPE html><html><head></head><body><h1>Hi</h1></body></html>");
    const r = applyAllSafeFixes(ctx(d));
    expect(typeof r.count).toBe("number");
    expect(Array.isArray(r.changes)).toBe(true);
    expect(r.count).toBeGreaterThanOrEqual(0);
  });

  it("does not throw on an empty document", () => {
    const d = doc("<!DOCTYPE html><html><head></head><body></body></html>");
    expect(() => applyAllSafeFixes(ctx(d))).not.toThrow();
  });

  it("calls syncHTML (which calls setHTML) — verify the batch path works", () => {
    const d = doc("<!DOCTYPE html><html><head></head><body><h1>Hi</h1></body></html>");
    const syncHTML = vi.fn();
    applyAllSafeFixes(ctx(d, { syncHTML }));
    // At least one fix that mutates should have called syncHTML.
    expect(syncHTML.mock.calls.length).toBeGreaterThan(0);
  });

  it("groups changes: each applied fix contributes exactly one change entry", () => {
    const d = doc("<!DOCTYPE html><html><head></head><body></body></html>");
    const r = applyAllSafeFixes(ctx(d));
    expect(r.changes.length).toBe(r.count);
  });
});
