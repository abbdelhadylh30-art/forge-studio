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

describe("renderSiteHTML — LandingForge v21 engine", () => {
  function renderOne(kind: string, config: Record<string, unknown>): string {
    const site = makeSite();
    const page = makePage({ sections: [{ id: "x", kind, config } as never] });
    return renderSiteHTML(site, page);
  }

  it("includes OG + Twitter meta and theme-color in the head", () => {
    const html = renderOne("navbar", { brand: "A", links: [] });
    expect(html).toContain('property="og:title"');
    expect(html).toContain('name="twitter:card"');
    expect(html).toContain('name="theme-color"');
  });

  it("includes the dark-mode toggle button and its JS engine", () => {
    const html = renderOne("navbar", { brand: "A", links: [] });
    expect(html).toContain("lf-theme-toggle");
    expect(html).toContain("lf-theme') === 'dark'");
  });

  it("renders a hero carousel with animations + autoplay data attr", () => {
    const html = renderOne("hero", {
      variant: "split-left", headline: "Hi",
      images: [{ url: "https://a/1.jpg", alt: "one" }, { url: "https://a/2.jpg", alt: "two" }, { url: "https://a/3.jpg", alt: "three" }],
      carouselAnim: "zoom", carouselAutoplay: 4,
    });
    expect(html).toContain("lf-hcarousel lf-anim-zoom");
    expect(html).toContain('data-autoplay="4"');
    expect(html).toContain("lf-hcarousel-slide");
    expect(html.match(/class="lf-hcarousel-slide/g)?.length).toBe(3);
  });

  it("renders all 7 hero variants without crashing", () => {
    for (const variant of ["centered", "split-left", "split-right", "fullscreen", "gradient", "card", "minimalist"]) {
      const html = renderOne("hero", { variant, headline: "Hi" });
      expect(html).toContain("<h1");
    }
  });

  it("renders gallery styles: accordion, ticker, stories, horizontal, vertical", () => {
    const images = [{ url: "https://a/1.jpg" }, { url: "https://a/2.jpg" }, { url: "https://a/3.jpg" }];
    for (const style of ["accordion", "ticker", "stories", "horizontal", "vertical"]) {
      const html = renderOne("gallery", { style, images, autoplay: 3 });
      expect(html).toContain(`data-lf-gallery="${style}"`);
    }
    const acc = renderOne("gallery", { style: "accordion", images });
    expect(acc).toContain("lf-gallery-acc-item lf-expanded");
    const stories = renderOne("gallery", { style: "stories", images, autoplay: 3 });
    expect(stories).toContain("lf-stories-progress");
    expect(stories).toContain("lf-stories-bar");
  });

  it("renders cinematic + split video variants", () => {
    const cin = renderOne("video", { variant: "cinematic", title: "Big", videoUrl: "https://www.youtube.com/watch?v=abc" });
    expect(cin).toContain("lf-video-cinematic");
    expect(cin).toContain("lf-video-veil");
    const split = renderOne("video", { variant: "split-right", title: "Side", videoUrl: "" });
    expect(split).toContain("md:grid-cols-2");
  });

  it("renders single-offer pricing card with urgency + original price", () => {
    const html = renderOne("pricing", {
      style: "single", currency: "$", period: "once",
      originalPrice: "199", urgencyBadge: "Ends Sunday", guaranteeNote: "30-day guarantee",
      tiers: [{ name: "Pro", price: "49", features: "A\nB", ctaLabel: "Buy", ctaHref: "#" }],
    });
    expect(html).toContain("lf-offer-card");
    expect(html).toContain("lf-offer-urgency");
    expect(html).toContain("lf-offer-original");
    expect(html).toContain("Ends Sunday");
  });

  it("renders toggle pricing with monthly/yearly data attrs + save badge", () => {
    const html = renderOne("pricing", {
      style: "toggle", currency: "$", saveBadge: "Save 20%",
      tiers: [
        { name: "Starter", price: "10", yearlyPrice: "100", features: "A" },
        { name: "Pro", price: "29", yearlyPrice: "279", features: "B", highlighted: true },
      ],
    });
    expect(html).toContain("lf-billing-toggle");
    expect(html).toContain('data-period="monthly"');
    expect(html).toContain('data-period="yearly"');
    expect(html).toContain('data-monthly="$10"');
    expect(html).toContain('data-yearly="$279"');
    expect(html).toContain("lf-save-badge");
  });

  it("renders announcement countdown with live timer markup", () => {
    const html = renderOne("announcement", { variant: "countdown", message: "Offer ends", countdownDate: "2027-12-31" });
    expect(html).toContain("lf-countdown");
    expect(html).toContain('data-target="2027-12-31"');
    expect(html).toContain('data-cd="s"');
  });

  it("renders testimonial carousel + FAQ cards + problem tabs", () => {
    const t = renderOne("testimonials", { style: "carousel", autoplay: 4, items: [{ quote: "q", name: "n" }, { quote: "r", name: "m" }] });
    expect(t).toContain("lf-tcarousel");
    expect(t).toContain('data-autoplay="4"');
    const f = renderOne("faq", { style: "cards", items: [{ question: "Q", answer: "A" }] });
    expect(f).toContain("lf-faq-card");
    const p = renderOne("problem", { style: "tabs", items: [{ title: "T1", description: "D1" }, { title: "T2", description: "D2" }] });
    expect(p).toContain("lf-tab-btn lf-active");
    expect(p).toContain("lf-tab-panel");
  });

  it("renders contact form with real submission handlers + honeypot", () => {
    const html = renderOne("contactform", {
      formType: "sheet", webappUrl: "https://script.google.com/macros/s/xyz/exec",
      successMsg: "Got it!", showPhone: true, phoneLabel: "Cell",
    });
    expect(html).toContain('data-lf-form="sheet"');
    expect(html).toContain('data-webapp-url="https://script.google.com/macros/s/xyz/exec"');
    expect(html).toContain('data-success-msg="Got it!"');
    expect(html).toContain('name="_honey"');
    expect(html).toContain('name="phone"');
    expect(html).toContain("formsubmit.co"); // email-mode handler present in JS engine
  });

  it("renders comparison yes/no values as check/cross icons", () => {
    const html = renderOne("comparison", {
      youName: "Us", competitorName: "Them",
      features: [{ label: "A", you: "yes", competitor: "no" }, { label: "B", you: "Free", competitor: "$20/mo" }],
    });
    expect(html).toContain("lf-cmp-yes");
    expect(html).toContain("lf-cmp-no");
    expect(html).toContain("$20/mo");
  });

  it("renders navbar mobile menu (burger + panel) when links exist", () => {
    const html = renderOne("navbar", {
      brand: "Acme", ctaLabel: "Go", ctaHref: "#",
      links: [{ label: "A", href: "#a" }, { label: "B", href: "#b" }],
    });
    expect(html).toContain("lf-burger");
    expect(html).toContain("lf-mobile-panel");
    expect(html).toContain('href="#a"');
  });

  it("ships all interactive engines in the exported JS", () => {
    const html = renderOne("navbar", { brand: "A", links: [] });
    for (const engine of [
      "lf-hcarousel",      // hero carousel
      "data-lf-gallery",   // gallery engines
      "lf-tcarousel",      // testimonial carousel
      "lf-billing-toggle", // pricing toggle
      "lf-tab-btn",        // tabs
      "lf-countdown",      // countdown
      "lf-burger",         // mobile menu
      "data-lf-form",      // form handler
      "lfToast",           // toast
    ]) {
      expect(html).toContain(engine);
    }
  });
});
