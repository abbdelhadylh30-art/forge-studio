/**
 * Forge Studio — Builder: Section Registry
 * 12 section types with schemas + default configs.
 */

import {
  LayoutTemplate, Sparkles, Image as ImageIcon, Star, Tag, HelpCircle,
  Megaphone, Mail, PanelTop, Trophy, Images, type LucideIcon,
} from "lucide-react";
import type { SectionKind, SectionType } from "./types";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export const SECTION_TYPES: SectionType[] = [
  {
    kind: "navbar", label: "Navbar", description: "Sticky top navigation with logo, links, and CTA",
    icon: PanelTop, category: "structure",
    schema: [
      { key: "brand", label: "Brand name", type: "text", placeholder: "Acme Inc.", aiSuggest: true },
      { key: "logoUrl", label: "Logo URL (optional)", type: "image" },
      { key: "links", label: "Nav links", type: "list", itemSchema: [
        { key: "label", label: "Label", type: "text" },
        { key: "href", label: "URL", type: "text" },
      ], maxItems: 8 },
      { key: "ctaLabel", label: "CTA button label", type: "text", placeholder: "Get started" },
      { key: "ctaHref", label: "CTA button URL", type: "text", placeholder: "#signup" },
      { key: "sticky", label: "Sticky on scroll", type: "boolean" },
      { key: "transparent", label: "Transparent over hero", type: "boolean" },
    ],
    defaultConfig: () => ({
      brand: "Acme Inc.", logoUrl: "",
      links: [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "About", href: "#about" },
      ],
      ctaLabel: "Get started", ctaHref: "#signup",
      sticky: true, transparent: false,
    }),
  },
  {
    kind: "hero", label: "Hero", description: "Bold headline, subtext, two CTAs, optional image",
    icon: Sparkles, category: "conversion",
    schema: [
      { key: "variant", label: "Layout", type: "select", options: [
        { label: "Centered", value: "centered" }, { label: "Split left", value: "split-left" }, { label: "Split right", value: "split-right" },
      ]},
      { key: "eyebrow", label: "Eyebrow / kicker", type: "text", placeholder: "New • v4.0", aiSuggest: true },
      { key: "headline", label: "Headline", type: "text", placeholder: "Build pages faster", aiSuggest: true },
      { key: "subhead", label: "Subhead", type: "textarea", placeholder: "One sentence.", aiSuggest: true },
      { key: "primaryCtaLabel", label: "Primary CTA label", type: "text", placeholder: "Start free" },
      { key: "primaryCtaHref", label: "Primary CTA URL", type: "text" },
      { key: "secondaryCtaLabel", label: "Secondary CTA label", type: "text", placeholder: "Watch demo" },
      { key: "secondaryCtaHref", label: "Secondary CTA URL", type: "text" },
      { key: "imageUrl", label: "Image URL (optional)", type: "image" },
      { key: "align", label: "Text alignment", type: "select", options: [
        { label: "Left", value: "left" }, { label: "Center", value: "center" },
      ]},
    ],
    defaultConfig: () => ({
      variant: "centered", eyebrow: "NEW • v4.0",
      headline: "Build landing pages that actually convert",
      subhead: "Forge Studio is the no-code page builder for marketers and founders. Drag, drop, ship — without a developer.",
      primaryCtaLabel: "Start free", primaryCtaHref: "#signup",
      secondaryCtaLabel: "Watch demo", secondaryCtaHref: "#demo",
      imageUrl: "", align: "center",
    }),
  },
  {
    kind: "logocloud", label: "Logo cloud", description: "Trust bar of customer logos",
    icon: LayoutTemplate, category: "social",
    schema: [
      { key: "title", label: "Title", type: "text", placeholder: "Trusted by teams at" },
      { key: "logos", label: "Logos", type: "list", itemSchema: [
        { key: "name", label: "Company name", type: "text" },
        { key: "url", label: "Logo URL (optional)", type: "image" },
      ], maxItems: 12 },
    ],
    defaultConfig: () => ({
      title: "Trusted by fast-moving teams",
      logos: [
        { name: "Acme", url: "" }, { name: "Globex", url: "" },
        { name: "Umbrella", url: "" }, { name: "Initech", url: "" },
        { name: "Soylent", url: "" }, { name: "Hooli", url: "" },
      ],
    }),
  },
  {
    kind: "features", label: "Features", description: "Grid of features with icons, titles, descriptions",
    icon: Sparkles, category: "conversion",
    schema: [
      { key: "eyebrow", label: "Eyebrow", type: "text", aiSuggest: true },
      { key: "title", label: "Title", type: "text", aiSuggest: true },
      { key: "subtitle", label: "Subtitle", type: "textarea", aiSuggest: true },
      { key: "columns", label: "Columns", type: "select", options: [
        { label: "2", value: "2" }, { label: "3", value: "3" }, { label: "4", value: "4" },
      ]},
      { key: "items", label: "Feature items", type: "list", itemSchema: [
        { key: "icon", label: "Icon name (lucide)", type: "text", placeholder: "Rocket" },
        { key: "title", label: "Title", type: "text", aiSuggest: true },
        { key: "description", label: "Description", type: "textarea", aiSuggest: true },
      ], maxItems: 12 },
    ],
    defaultConfig: () => ({
      eyebrow: "Features", title: "Everything you need to ship",
      subtitle: "Powerful primitives that compose into any landing page layout you can imagine.",
      columns: "3",
      items: [
        { icon: "Rocket", title: "Drag & drop", description: "Reorder sections visually. Snap to grid." },
        { icon: "Palette", title: "Themes", description: "7 built-in presets + custom tokens." },
        { icon: "Code", title: "HTML export", description: "One-click standalone HTML or ZIP." },
        { icon: "LineChart", title: "Audit", description: "Score your page across 5 categories." },
        { icon: "ShieldCheck", title: "Secure", description: "Sanitized inputs, CSP-friendly output." },
        { icon: "Sparkles", title: "AI copy", description: "Generate headlines & subheads instantly." },
      ],
    }),
  },
  {
    kind: "stats", label: "Stats", description: "Row of large numbers — social proof",
    icon: Trophy, category: "social",
    schema: [
      { key: "title", label: "Title (optional)", type: "text" },
      { key: "stats", label: "Stat items", type: "list", itemSchema: [
        { key: "value", label: "Value", type: "text", placeholder: "10K+" },
        { key: "label", label: "Label", type: "text", placeholder: "Active users" },
      ], maxItems: 6 },
    ],
    defaultConfig: () => ({
      title: "",
      stats: [
        { value: "10K+", label: "Pages published" },
        { value: "98%", label: "Faster ship time" },
        { value: "4.9/5", label: "Average rating" },
        { value: "240+", label: "Templates" },
      ],
    }),
  },
  {
    kind: "gallery", label: "Gallery", description: "Image grid with captions",
    icon: Images, category: "media",
    schema: [
      { key: "title", label: "Title", type: "text", aiSuggest: true },
      { key: "columns", label: "Columns", type: "select", options: [
        { label: "2", value: "2" }, { label: "3", value: "3" }, { label: "4", value: "4" },
      ]},
      { key: "images", label: "Images", type: "list", itemSchema: [
        { key: "url", label: "Image URL", type: "image" },
        { key: "caption", label: "Caption", type: "text" },
      ], maxItems: 12 },
    ],
    defaultConfig: () => ({
      title: "See it in action", columns: "3",
      images: [
        { url: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=600", caption: "Dashboard" },
        { url: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600", caption: "Editor" },
        { url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600", caption: "Analytics" },
      ],
    }),
  },
  {
    kind: "testimonials", label: "Testimonials", description: "Customer quotes with avatar, name, role",
    icon: Star, category: "social",
    schema: [
      { key: "title", label: "Title", type: "text", aiSuggest: true },
      { key: "items", label: "Testimonials", type: "list", itemSchema: [
        { key: "quote", label: "Quote", type: "textarea", aiSuggest: true },
        { key: "name", label: "Name", type: "text" },
        { key: "role", label: "Role / company", type: "text" },
        { key: "avatar", label: "Avatar URL", type: "image" },
      ], maxItems: 9 },
    ],
    defaultConfig: () => ({
      title: "Loved by builders",
      items: [
        { quote: "We replaced our entire landing page workflow with Forge Studio. What took a week now takes an afternoon.", name: "Sarah Chen", role: "Head of Growth, Northwind", avatar: "https://i.pravatar.cc/100?img=47" },
        { quote: "The drag-and-drop is buttery. Our marketing team ships without waiting on engineering.", name: "Marcus Reed", role: "Founder, Tidewave", avatar: "https://i.pravatar.cc/100?img=12" },
        { quote: "Best-in-class export. Clean, dependency-free HTML I can deploy anywhere.", name: "Priya Nair", role: "Eng Lead, Globex", avatar: "https://i.pravatar.cc/100?img=32" },
      ],
    }),
  },
  {
    kind: "pricing", label: "Pricing", description: "Tiered pricing cards with feature lists",
    icon: Tag, category: "conversion",
    schema: [
      { key: "title", label: "Title", type: "text", aiSuggest: true },
      { key: "subtitle", label: "Subtitle", type: "textarea", aiSuggest: true },
      { key: "currency", label: "Currency symbol", type: "text", placeholder: "$" },
      { key: "period", label: "Billing period", type: "text", placeholder: "/mo" },
      { key: "tiers", label: "Pricing tiers", type: "list", itemSchema: [
        { key: "name", label: "Name", type: "text" },
        { key: "price", label: "Price", type: "text" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "ctaLabel", label: "CTA label", type: "text" },
        { key: "ctaHref", label: "CTA URL", type: "text" },
        { key: "highlighted", label: "Highlighted", type: "boolean" },
        { key: "features", label: "Features (one per line)", type: "textarea" },
      ], maxItems: 5 },
    ],
    defaultConfig: () => ({
      title: "Simple, transparent pricing", subtitle: "Start free. Upgrade when you grow.",
      currency: "$", period: "/mo",
      tiers: [
        { name: "Starter", price: "0", description: "For side projects", ctaLabel: "Start free", ctaHref: "#", highlighted: false, features: "1 site\n3 pages\nCommunity support" },
        { name: "Pro", price: "29", description: "For founders & marketers", ctaLabel: "Start 14-day trial", ctaHref: "#", highlighted: true, features: "10 sites\nUnlimited pages\nCustom domain\nAI copy assistant" },
        { name: "Team", price: "99", description: "For agencies & teams", ctaLabel: "Contact sales", ctaHref: "#", highlighted: false, features: "Unlimited sites\nTeam collaboration\nPriority support" },
      ],
    }),
  },
  {
    kind: "faq", label: "FAQ", description: "Collapsible Q&A list",
    icon: HelpCircle, category: "conversion",
    schema: [
      { key: "title", label: "Title", type: "text", aiSuggest: true },
      { key: "subtitle", label: "Subtitle", type: "textarea", aiSuggest: true },
      { key: "items", label: "Q&A items", type: "list", itemSchema: [
        { key: "question", label: "Question", type: "text", aiSuggest: true },
        { key: "answer", label: "Answer", type: "textarea", aiSuggest: true },
      ], maxItems: 20 },
    ],
    defaultConfig: () => ({
      title: "Frequently asked questions", subtitle: "Everything else you might want to know.",
      items: [
        { question: "Do I need to know how to code?", answer: "No. Forge Studio is fully no-code. Drag sections in, edit text inline, hit publish." },
        { question: "Can I export the HTML?", answer: "Yes. One-click export produces a clean, self-contained HTML file or ZIP you can host anywhere." },
        { question: "Does it work on mobile?", answer: "Every section is responsive by default. Preview at desktop, tablet, and mobile widths before publishing." },
      ],
    }),
  },
  {
    kind: "cta", label: "Call to action", description: "Big centered CTA band with two buttons",
    icon: Megaphone, category: "conversion",
    schema: [
      { key: "eyebrow", label: "Eyebrow", type: "text", aiSuggest: true },
      { key: "title", label: "Title", type: "text", aiSuggest: true },
      { key: "subtitle", label: "Subtitle", type: "textarea", aiSuggest: true },
      { key: "primaryCtaLabel", label: "Primary CTA label", type: "text" },
      { key: "primaryCtaHref", label: "Primary CTA URL", type: "text" },
      { key: "secondaryCtaLabel", label: "Secondary CTA label", type: "text" },
      { key: "secondaryCtaHref", label: "Secondary CTA URL", type: "text" },
      { key: "variant", label: "Style", type: "select", options: [
        { label: "Solid", value: "solid" }, { label: "Muted card", value: "muted" }, { label: "Gradient", value: "gradient" },
      ]},
    ],
    defaultConfig: () => ({
      eyebrow: "Get started", title: "Ship your landing page today",
      subtitle: "Join 10,000+ founders and marketers who build with Forge Studio.",
      primaryCtaLabel: "Start free", primaryCtaHref: "#signup",
      secondaryCtaLabel: "Book a demo", secondaryCtaHref: "#demo",
      variant: "gradient",
    }),
  },
  {
    kind: "newsletter", label: "Newsletter", description: "Email capture form with promise",
    icon: Mail, category: "conversion",
    schema: [
      { key: "title", label: "Title", type: "text", aiSuggest: true },
      { key: "subtitle", label: "Subtitle", type: "textarea", aiSuggest: true },
      { key: "placeholder", label: "Input placeholder", type: "text" },
      { key: "buttonLabel", label: "Button label", type: "text" },
      { key: "footnote", label: "Footnote (privacy note)", type: "text" },
    ],
    defaultConfig: () => ({
      title: "Get one actionable growth tip every Tuesday",
      subtitle: "Join 18,000+ founders. No spam. Unsubscribe anytime.",
      placeholder: "you@company.com", buttonLabel: "Subscribe",
      footnote: "We respect your privacy. Read our privacy policy.",
    }),
  },
  {
    kind: "footer", label: "Footer", description: "Multi-column footer with links and copyright",
    icon: LayoutTemplate, category: "structure",
    schema: [
      { key: "brand", label: "Brand name", type: "text" },
      { key: "tagline", label: "Tagline", type: "textarea", aiSuggest: true },
      { key: "columns", label: "Link columns", type: "list", itemSchema: [
        { key: "title", label: "Column title", type: "text" },
        { key: "links", label: "Links", type: "list", itemSchema: [
          { key: "label", label: "Label", type: "text" },
          { key: "href", label: "URL", type: "text" },
        ]},
      ], maxItems: 5 },
      { key: "copyright", label: "Copyright text", type: "text" },
    ],
    defaultConfig: () => ({
      brand: "Acme Inc.",
      tagline: "Build, ship, and iterate on landing pages — without code.",
      columns: [
        { title: "Product", links: [{ label: "Features", href: "#" }, { label: "Pricing", href: "#" }, { label: "Templates", href: "#" }] },
        { title: "Company", links: [{ label: "About", href: "#" }, { label: "Blog", href: "#" }, { label: "Careers", href: "#" }] },
        { title: "Legal", links: [{ label: "Privacy", href: "#" }, { label: "Terms", href: "#" }] },
      ],
      copyright: "© 2026 Acme Inc. All rights reserved.",
    }),
  },
];

export const SECTION_MAP: Record<SectionKind, SectionType> = SECTION_TYPES.reduce((acc, t) => {
  acc[t.kind] = t; return acc;
}, {} as Record<SectionKind, SectionType>);

export function getSectionType(kind: SectionKind): SectionType { return SECTION_MAP[kind]; }

export function createSection(kind: SectionKind): SectionInstance {
  const type = SECTION_MAP[kind];
  if (!type) throw new Error(`Unknown section kind: ${kind}`);
  return { id: uid(), kind, config: type.defaultConfig() };
}

export { uid };
