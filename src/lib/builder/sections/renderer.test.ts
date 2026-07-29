import { describe, it, expect } from "vitest";
import { renderSiteHTML } from "./renderer";
import { blankSite } from "../store/builder-store";
import type { SiteData, PageData } from "./types";

function makeSite(overrides: Partial<SiteData> = {}): SiteData {
  const base = blankSite("Test site");
  return { ...base, ...overrides };
}

function makePage(overrides: Partial<PageData> = {}): PageData {
  const base = blankSite("Test site").pages[0];
  return { ...base, ...overrides };
}

describe("renderSiteHTML", () => {
  it("produces a full HTML document with DOCTYPE", () => {
    const site = makeSite();
    const html = renderSiteHTML(site, site.pages[0]);
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain("<html");
    expect(html).toContain("<head>");
    expect(html).toContain("<body");
  });

  it("escapes the site name in the title (XSS defense)", () => {
    const site = makeSite({ name: 'Acme <script>alert(1)</script>' });
    const page = makePage({ seo: undefined });
    const html = renderSiteHTML(site, page);
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes the description in the meta tag", () => {
    const site = makeSite({ description: 'x" onmouseover="evil()' });
    const page = makePage({ seo: undefined });
    const html = renderSiteHTML(site, page);
    expect(html).not.toContain('onmouseover="evil');
    expect(html).toContain("&quot;");
  });

  it("includes the theme CSS variables in a <style> block", () => {
    const site = makeSite();
    const html = renderSiteHTML(site, site.pages[0]);
    expect(html).toContain("<style>");
    expect(html).toContain("--lf-primary");
    expect(html).toContain("--lf-accent");
  });

  it("renders each section kind without crashing", () => {
    // The blank site has a default page with no sections; build one with all kinds.
    const site = makeSite();
    const page = makePage({
      sections: [
        { id: "s1", kind: "navbar", config: { brand: "Acme", links: [], ctaLabel: "", ctaHref: "", logoUrl: "", sticky: false, transparent: false } },
        { id: "s2", kind: "hero", config: { variant: "centered", align: "center", eyebrow: "", headline: "Hi", subhead: "", primaryCtaLabel: "Start", primaryCtaHref: "#", secondaryCtaLabel: "", secondaryCtaHref: "", imageUrl: "" } },
        { id: "s3", kind: "footer", config: { brand: "Acme", tagline: "", columns: [], copyright: "© 2024" } },
      ] as never,
    });
    const html = renderSiteHTML(site, page);
    expect(html).toContain("<header");
    expect(html).toContain("<h1");
    expect(html).toContain("<footer");
  });

  it("uses page.seo.title when provided, else falls back to site — page", () => {
    const site = makeSite({ name: "SiteName" });
    const page = makePage({ name: "Home", seo: { title: "Custom Title", description: "" } });
    const html = renderSiteHTML(site, page);
    expect(html).toContain("<title>Custom Title</title>");
  });
});
