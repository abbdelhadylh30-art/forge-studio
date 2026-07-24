/**
 * Forge Studio — Builder: Section Registry
 * 12 section types with schemas + default configs.
 */

import {
  LayoutTemplate, Sparkles, Image as ImageIcon, Star, Tag, HelpCircle,
  Megaphone, Mail, PanelTop, Trophy, Images, type LucideIcon,
  AlertCircle, Lightbulb, Video, GitCompare, ShieldCheck, MessageSquare,
} from "lucide-react";
import type { SectionKind, SectionType, SectionInstance } from "./types";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export const SECTION_TYPES: SectionType[] = [
  {
    kind: "navbar", label: "Navbar", description: "Sticky top navigation with logo, links, and CTA",
    icon: PanelTop, category: "structure",
    schema: [
      { key: "brand", label: "Brand name", type: "text", placeholder: "Acme Inc." },
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
        { label: "Fullscreen", value: "fullscreen" }, { label: "Gradient", value: "gradient" }, { label: "Card", value: "card" }, { label: "Minimalist", value: "minimalist" },
      ]},
      { key: "eyebrow", label: "Eyebrow / kicker", type: "text", placeholder: "New • v4.0" },
      { key: "headline", label: "Headline", type: "text", placeholder: "Build pages faster" },
      { key: "subhead", label: "Subhead", type: "textarea", placeholder: "One sentence." },
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
      { key: "eyebrow", label: "Eyebrow", type: "text" },
      { key: "title", label: "Title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "columns", label: "Columns", type: "select", options: [
        { label: "2", value: "2" }, { label: "3", value: "3" }, { label: "4", value: "4" },
      ]},
      { key: "items", label: "Feature items", type: "list", itemSchema: [
        { key: "icon", label: "Icon name (lucide)", type: "text", placeholder: "Rocket" },
        { key: "title", label: "Title", type: "text" },
        { key: "description", label: "Description", type: "textarea" },
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
      { key: "title", label: "Title", type: "text" },
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
      { key: "title", label: "Title", type: "text" },
      { key: "items", label: "Testimonials", type: "list", itemSchema: [
        { key: "quote", label: "Quote", type: "textarea" },
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
      { key: "title", label: "Title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
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
      { key: "title", label: "Title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "items", label: "Q&A items", type: "list", itemSchema: [
        { key: "question", label: "Question", type: "text" },
        { key: "answer", label: "Answer", type: "textarea" },
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
      { key: "eyebrow", label: "Eyebrow", type: "text" },
      { key: "title", label: "Title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
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
      { key: "title", label: "Title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
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
      { key: "tagline", label: "Tagline", type: "textarea" },
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
  {
    kind: "announcement", label: "Announcement", description: "Top banner with scrolling text, countdown, or static message",
    icon: Megaphone, category: "structure",
    schema: [
      { key: "variant", label: "Style", type: "select", options: [{ label: "Static", value: "static" }, { label: "Ticker (scrolling)", value: "ticker" }, { label: "Countdown", value: "countdown" }] },
      { key: "message", label: "Message", type: "text", placeholder: "We just launched v2.0!" },
      { key: "linkLabel", label: "Link label", type: "text", placeholder: "Read more" },
      { key: "linkHref", label: "Link URL", type: "text" },
      { key: "countdownDate", label: "Countdown date (for countdown style)", type: "text", placeholder: "2026-12-31" },
      { key: "bgColor", label: "Background color", type: "color" },
      { key: "textColor", label: "Text color", type: "color" },
    ],
    defaultConfig: () => ({ variant: "static", message: "We just launched v2.0!", linkLabel: "Read more", linkHref: "#", countdownDate: "2026-12-31", bgColor: "#0f172a", textColor: "#f8fafc" }),
  },
  {
    kind: "problem", label: "Problem", description: "Pain point section — articulate the user's problem",
    icon: AlertCircle, category: "conversion",
    schema: [
      { key: "eyebrow", label: "Eyebrow", type: "text" },
      { key: "title", label: "Title", type: "text", placeholder: "The problem" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "items", label: "Pain points", type: "list", itemSchema: [{ key: "title", label: "Title", type: "text" }, { key: "description", label: "Description", type: "textarea" }], maxItems: 6 },
    ],
    defaultConfig: () => ({ eyebrow: "The problem", title: "You're losing customers without knowing why", subtitle: "Most teams guess at why their landing page isn't converting.", items: [{ title: "Slow load times", description: "53% of visitors leave if your page takes more than 3 seconds to load." }, { title: "Weak messaging", description: "If visitors can't tell what you do in 5 seconds, they bounce." }, { title: "No clear CTA", description: "Pages without a strong call-to-action above the fold lose 80% of conversions." }] }),
  },
  {
    kind: "solution", label: "Solution", description: "Show how your product solves the problem",
    icon: Lightbulb, category: "conversion",
    schema: [
      { key: "eyebrow", label: "Eyebrow", type: "text" },
      { key: "title", label: "Title", type: "text", placeholder: "The solution" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "items", label: "Solution points", type: "list", itemSchema: [{ key: "title", label: "Title", type: "text" }, { key: "description", label: "Description", type: "textarea" }], maxItems: 6 },
    ],
    defaultConfig: () => ({ eyebrow: "The solution", title: "One tool that fixes all of it", subtitle: "Forge Studio addresses every issue killing your conversion rate.", items: [{ title: "Instant auditing", description: "Score your page across 5 categories in under 500ms." }, { title: "One-click fixes", description: "38 quick-fixes that patch common issues automatically." }, { title: "Clean HTML export", description: "Ship lightweight, dependency-free pages that load fast." }] }),
  },
  {
    kind: "video", label: "Video", description: "Embedded video section with thumbnail",
    icon: Video, category: "media",
    schema: [
      { key: "title", label: "Title (optional)", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "videoUrl", label: "Video URL (YouTube/Vimeo/mp4)", type: "text", placeholder: "https://youtube.com/watch?v=..." },
      { key: "thumbnailUrl", label: "Thumbnail URL (optional)", type: "image" },
      { key: "variant", label: "Layout", type: "select", options: [{ label: "Centered", value: "centered" }, { label: "Split left", value: "split-left" }, { label: "Full width", value: "full" }] },
    ],
    defaultConfig: () => ({ title: "See it in action", subtitle: "Watch a 2-minute demo.", videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", thumbnailUrl: "", variant: "centered" }),
  },
  {
    kind: "comparison", label: "Comparison", description: "Side-by-side feature comparison table",
    icon: GitCompare, category: "conversion",
    schema: [
      { key: "title", label: "Title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "features", label: "Comparison rows", type: "list", itemSchema: [{ key: "label", label: "Feature name", type: "text" }, { key: "you", label: "Your product", type: "text", placeholder: "✓" }, { key: "competitor", label: "Competitor", type: "text", placeholder: "—" }], maxItems: 15 },
      { key: "youName", label: "Your column name", type: "text", placeholder: "Forge Studio" },
      { key: "competitorName", label: "Competitor column name", type: "text", placeholder: "Others" },
    ],
    defaultConfig: () => ({ title: "How we compare", subtitle: "Why teams switch to Forge Studio.", youName: "Forge Studio", competitorName: "Others", features: [{ label: "Visual builder", you: "✓", competitor: "—" }, { label: "Built-in auditor", you: "✓", competitor: "—" }, { label: "One-click fixes", you: "✓", competitor: "—" }, { label: "Clean HTML export", you: "✓", competitor: "Limited" }, { label: "No sign-up required", you: "✓", competitor: "—" }, { label: "Price", you: "Free", competitor: "$20+/mo" }] }),
  },
  {
    kind: "guarantee", label: "Guarantee", description: "Trust block — money-back guarantee or warranty",
    icon: ShieldCheck, category: "social",
    schema: [
      { key: "title", label: "Title", type: "text", placeholder: "30-day money-back guarantee" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "badge", label: "Badge text", type: "text", placeholder: "Guaranteed" },
      { key: "icon", label: "Icon name (lucide)", type: "text", placeholder: "ShieldCheck" },
    ],
    defaultConfig: () => ({ title: "30-day money-back guarantee", description: "Try Forge Studio risk-free. If you're not happy within 30 days, we'll refund every cent.", badge: "Guaranteed", icon: "ShieldCheck" }),
  },
  {
    kind: "contactform", label: "Contact form", description: "Contact form with name, email, message fields",
    icon: MessageSquare, category: "conversion",
    schema: [
      { key: "title", label: "Title", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "textarea" },
      { key: "nameLabel", label: "Name field label", type: "text" },
      { key: "emailLabel", label: "Email field label", type: "text" },
      { key: "messageLabel", label: "Message field label", type: "text" },
      { key: "buttonLabel", label: "Button label", type: "text" },
      { key: "variant", label: "Layout", type: "select", options: [{ label: "Centered", value: "centered" }, { label: "Split left", value: "split-left" }] },
    ],
    defaultConfig: () => ({ title: "Get in touch", subtitle: "Have a question? We'll get back to you within 24 hours.", nameLabel: "Name", emailLabel: "Email", messageLabel: "Message", buttonLabel: "Send message", variant: "centered" }),
  },
  {
    kind: "legal", label: "Legal", description: "Privacy policy, terms, or refund policy with templated content",
    icon: ShieldCheck, category: "structure",
    schema: [
      { key: "title", label: "Title", type: "text", placeholder: "Privacy Policy" },
      { key: "lastUpdated", label: "Last updated date", type: "text", placeholder: "2026-07-24" },
      { key: "variant", label: "Type", type: "select", options: [
        { label: "Privacy Policy", value: "privacy" }, { label: "Terms of Service", value: "terms" }, { label: "Refund Policy", value: "refund" }, { label: "Custom", value: "custom" },
      ]},
      { key: "companyName", label: "Company name (used in placeholders)", type: "text", placeholder: "Acme Inc." },
      { key: "contactEmail", label: "Contact email", type: "text", placeholder: "legal@acme.com" },
      { key: "content", label: "Body content (supports {{company}}, {{email}}, {{date}} placeholders)", type: "textarea" },
    ],
    defaultConfig: () => ({
      title: "Privacy Policy", lastUpdated: "2026-07-24", variant: "privacy",
      companyName: "Acme Inc.", contactEmail: "legal@acme.com",
      content: "This Privacy Policy describes how {{company}} (\"we\", \"us\", or \"our\") collects, uses, and shares your information when you use our website or services.\n\n1. Information We Collect\nWe collect information you provide directly to us, such as your name and email address.\n\n2. How We Use Your Information\nWe use your information to provide, improve, and personalize our services.\n\n3. Sharing Your Information\nWe do not sell your personal information to third parties.\n\n4. Contact Us\nIf you have questions about this policy, email us at {{email}}.",
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
