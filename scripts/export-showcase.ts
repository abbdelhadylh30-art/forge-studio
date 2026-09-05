/**
 * QA harness — renders a showcase site exercising every LandingForge v21
 * capability through the real renderer, writes /tmp/fs-export-test.html.
 * Run: bunx bun scripts/export-showcase.ts  (bun run works too)
 */
import { renderSiteHTML } from "../src/lib/builder/sections/renderer";
import { DEFAULT_THEME } from "../src/lib/builder/sections/types";
import { createSection } from "../src/lib/builder/sections/registry";
import type { SiteData } from "../src/lib/builder/sections/types";

const s = (kind: Parameters<typeof createSection>[0], config: Record<string, unknown> = {}) =>
  ({ ...createSection(kind), config: { ...createSection(kind).config, ...config } });

const site: SiteData = {
  id: "qa", name: "QA Showcase", slug: "qa-showcase", description: "v21 engine QA",
  themeTokens: DEFAULT_THEME,
  pages: [{
    id: "p1", name: "Home", slug: "home", path: "/", isHome: true,
    seo: { title: "QA Showcase — v21 Engine", description: "Every new section style", ogImage: "https://picsum.photos/1200/630" },
    sections: [
      s("navbar", { links: [{ label: "Gallery", href: "#work" }, { label: "Pricing", href: "#pricing" }, { label: "FAQ", href: "#faq" }], ctaLabel: "Start free", ctaHref: "#form" }),
      s("announcement", { variant: "countdown", message: "Launch offer ends in:", countdownDate: new Date(Date.now() + 3 * 86400000 + 5 * 3600000).toISOString() }),
      s("hero", {
        variant: "split-left", headline: "The v21 engine, in Forge Studio",
        images: [
          { url: "https://picsum.photos/seed/a/900/560", alt: "One" },
          { url: "https://picsum.photos/seed/b/900/560", alt: "Two" },
          { url: "https://picsum.photos/seed/c/900/560", alt: "Three" },
        ],
        carouselAnim: "zoom", carouselAutoplay: 2,
      }),
      s("gallery", { style: "stories", autoplay: 2, images: [
        { url: "https://picsum.photos/seed/s1/600/750", caption: "Story one" },
        { url: "https://picsum.photos/seed/s2/600/750", caption: "Story two" },
        { url: "https://picsum.photos/seed/s3/600/750", caption: "Story three" },
      ] }),
      s("video", { variant: "cinematic", title: "Cinematic video", subtitle: "Fullscreen with overlay", videoUrl: "https://www.youtube.com/watch?v=M7lc1UVf-VE" }),
      s("problem", { style: "tabs", items: [
        { title: "Renting", description: "You pay $50/mo forever and own nothing." },
        { title: "Lock-in", description: "Export? Paywall. Data? Theirs." },
        { title: "Slow tools", description: "Bloated editors that take forever to load." },
      ] }),
      s("testimonials", { style: "carousel", autoplay: 3, items: [
        { quote: "Incredible speed.", name: "Ada", role: "CTO, Loops" },
        { quote: "Buttery smooth.", name: "Bob", role: "CEO, Waves" },
        { quote: "Export just works.", name: "Cleo", role: "Growth, Pips" },
        { quote: "One-time payment!", name: "Dee", role: "Founder, Orbs" },
      ] }),
      s("pricing", { style: "toggle", saveBadge: "Save 20%", tiers: [
        { name: "Starter", price: "0", yearlyPrice: "0", features: "1 site\n3 pages", ctaLabel: "Start", ctaHref: "#", highlighted: false },
        { name: "Pro", price: "29", yearlyPrice: "279", features: "10 sites\nAI copy", ctaLabel: "Buy", ctaHref: "#", highlighted: true },
      ] }),
      s("faq", { style: "cards", items: [
        { question: "Is it fast?", answer: "Yes — zero dependencies in the export." },
        { question: "Does it work offline?", answer: "The HTML file is fully self-contained." },
      ] }),
      s("comparison", { youName: "Forge", competitorName: "Others", features: [
        { label: "One-time price", you: "yes", competitor: "no" },
        { label: "Export", you: "yes", competitor: "Limited" },
      ] }),
      s("contactform", { formType: "demo", showPhone: true }),
    ],
  }],
};

const html = renderSiteHTML(site, site.pages[0]);
import { writeFileSync } from "node:fs";
writeFileSync("/tmp/fs-export-test.html", html);
console.log("wrote /tmp/fs-export-test.html —", html.length, "bytes");
