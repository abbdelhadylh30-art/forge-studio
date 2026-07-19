/**
 * Forge Studio — Builder: Pre-built site templates
 * 5 templates: SaaS, Portfolio, Agency, E-commerce, Startup
 */

import { v4 as uuid } from "uuid";
import type { PageData, SiteData, ThemeTokens } from "../sections/types";
import { DEFAULT_THEME } from "../sections/types";

interface TemplateBlueprint {
  slug: string;
  name: string;
  category: "saas" | "portfolio" | "agency" | "ecommerce" | "startup";
  description: string;
  theme: ThemeTokens;
  buildPages: () => Omit<PageData, "id">[];
}

function page(name: string, slug: string, path: string, isHome: boolean, sections: any[]): Omit<PageData, "id"> {
  return { name, slug, path, isHome, sections };
}
function sec(kind: string, config: Record<string, unknown>) {
  return { id: uuid(), kind: kind as any, config };
}

export const TEMPLATES: TemplateBlueprint[] = [
  {
    slug: "saas-northwind", name: "Northwind — SaaS", category: "saas",
    description: "Polished SaaS landing page with hero, features, pricing, testimonials, FAQ.",
    theme: { ...DEFAULT_THEME, primary: "#0c4a6e", accent: "#06b6d4", accentFg: "#083344" },
    buildPages: () => [
      page("Home", "home", "/", true, [
        sec("navbar", { brand: "Northwind", logoUrl: "", links: [{ label: "Features", href: "#features" }, { label: "Pricing", href: "#pricing" }, { label: "Customers", href: "#testimonials" }, { label: "FAQ", href: "#faq" }], ctaLabel: "Start free", ctaHref: "#signup", sticky: true, transparent: false }),
        sec("hero", { variant: "split-left", eyebrow: "NEW • Workflow analytics 2.0", headline: "Stop guessing. Start shipping.", subhead: "Northwind shows you exactly where your team's time goes — and gives you the levers to fix it. Set up in 5 minutes.", primaryCtaLabel: "Start free", primaryCtaHref: "#signup", secondaryCtaLabel: "Watch demo", secondaryCtaHref: "#demo", imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=80", align: "left" }),
        sec("logocloud", { title: "Trusted by data teams at", logos: [{ name: "Acme", url: "" }, { name: "Globex", url: "" }, { name: "Umbrella", url: "" }, { name: "Initech", url: "" }, { name: "Soylent", url: "" }] }),
        sec("features", { eyebrow: "Features", title: "Everything you need to find & fix the bottleneck", subtitle: "Northwind instruments your entire workflow automatically — no manual time tracking, no surveys.", columns: "3", items: [
          { icon: "Activity", title: "Auto-capture", description: "Passive tracking across 50+ tools." },
          { icon: "GitBranch", title: "Bottleneck AI", description: "ML finds where work piles up." },
          { icon: "Gauge", title: "Live dashboards", description: "Real-time, shareable, embeddable." },
          { icon: "Bell", title: "Smart alerts", description: "Get pinged before a sprint slips." },
          { icon: "Workflow", title: "Workflows", description: "Automate standups, retro, reports." },
          { icon: "ShieldCheck", title: "SOC 2 + SSO", description: "Enterprise-ready out of the box." },
        ]}),
        sec("stats", { title: "", stats: [
          { value: "10K+", label: "Teams onboarded" },
          { value: "47%", label: "Avg cycle-time cut" },
          { value: "5 min", label: "To first dashboard" },
          { value: "4.9/5", label: "G2 rating" },
        ]}),
        sec("testimonials", { title: "Loved by data teams", items: [
          { quote: "We cut our release cycle from 14 days to 6 in one quarter.", name: "Sarah Chen", role: "VP Eng, Northwind", avatar: "https://i.pravatar.cc/100?img=47" },
          { quote: "Finally, an analytics tool my engineers don't roll their eyes at.", name: "Marcus Reed", role: "CTO, Tidewave", avatar: "https://i.pravatar.cc/100?img=12" },
          { quote: "The bottleneck AI flagged something we'd missed for years.", name: "Priya Nair", role: "Eng Lead, Globex", avatar: "https://i.pravatar.cc/100?img=32" },
        ]}),
        sec("pricing", { title: "Pricing that scales with you", subtitle: "Start free. Upgrade when your team grows.", currency: "$", period: "/mo", tiers: [
          { name: "Starter", price: "0", description: "For small teams", ctaLabel: "Start free", ctaHref: "#", highlighted: false, features: "Up to 5 users\n3 dashboards\n14-day history" },
          { name: "Pro", price: "49", description: "For growing teams", ctaLabel: "Start 14-day trial", ctaHref: "#", highlighted: true, features: "Up to 50 users\nUnlimited dashboards\n1-year history\nSmart alerts\nBottleneck AI" },
          { name: "Enterprise", price: "Custom", description: "For large orgs", ctaLabel: "Contact sales", ctaHref: "#", highlighted: false, features: "SSO + SAML\nSOC 2 Type II\nCustom integrations\nDedicated CSM\nSLA" },
        ]}),
        sec("faq", { title: "Frequently asked questions", subtitle: "Everything else you might want to know.", items: [
          { question: "How does auto-capture work?", answer: "We integrate with your existing tools (Jira, GitHub, Slack, Linear, etc.) and passively instrument workflow events." },
          { question: "Is my data secure?", answer: "Yes. We're SOC 2 Type II certified, encrypt data at rest and in transit, and offer SSO/SAML on Enterprise plans." },
          { question: "Can I cancel anytime?", answer: "Yes. No long-term contracts on Starter or Pro. Cancel with one click." },
        ]}),
        sec("cta", { eyebrow: "Get started", title: "Ship faster this week", subtitle: "Join 10,000+ teams using Northwind to find & fix their bottlenecks.", primaryCtaLabel: "Start free", primaryCtaHref: "#signup", secondaryCtaLabel: "Book a demo", secondaryCtaHref: "#demo", variant: "gradient" }),
        sec("footer", { brand: "Northwind", tagline: "Stop guessing. Start shipping.", columns: [
          { title: "Product", links: [{ label: "Features", href: "#" }, { label: "Pricing", href: "#" }, { label: "Changelog", href: "#" }] },
          { title: "Company", links: [{ label: "About", href: "#" }, { label: "Blog", href: "#" }, { label: "Careers", href: "#" }] },
          { title: "Legal", links: [{ label: "Privacy", href: "#" }, { label: "Terms", href: "#" }] },
        ], copyright: "© 2026 Northwind, Inc." }),
      ]),
    ],
  },
  {
    slug: "portfolio-atelier", name: "Atelier — Portfolio", category: "portfolio",
    description: "Designer/developer portfolio with hero, projects gallery, testimonials, contact.",
    theme: { ...DEFAULT_THEME, primary: "#000000", accent: "#dc2626", accentFg: "#fef2f2", background: "#fafafa", foreground: "#0a0a0a", muted: "#f5f5f5", mutedFg: "#737373", border: "#e5e5e5", radius: "8px" },
    buildPages: () => [
      page("Home", "home", "/", true, [
        sec("navbar", { brand: "Atelier", logoUrl: "", links: [{ label: "Work", href: "#work" }, { label: "About", href: "#about" }, { label: "Contact", href: "#contact" }], ctaLabel: "Get in touch", ctaHref: "#contact", sticky: true, transparent: true }),
        sec("hero", { variant: "centered", eyebrow: "Independent design studio", headline: "Brand & product design for ambitious founders", subhead: "I help startups find their visual voice and ship products people love to use. 12 years, 60+ launches.", primaryCtaLabel: "See work", primaryCtaHref: "#work", secondaryCtaLabel: "Book intro", secondaryCtaHref: "#contact", imageUrl: "", align: "center" }),
        sec("stats", { title: "", stats: [
          { value: "60+", label: "Projects shipped" },
          { value: "12 yrs", label: "Experience" },
          { value: "$340M", label: "Funding raised by clients" },
          { value: "4.9/5", label: "Client rating" },
        ]}),
        sec("gallery", { title: "Selected work", columns: "3", images: [
          { url: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=600", caption: "Northwind — brand & product" },
          { url: "https://images.unsplash.com/photo-1561070791-2526d30994b8?w=600", caption: "Atelier — identity system" },
          { url: "https://images.unsplash.com/photo-1545235617-9465d2a55698?w=600", caption: "Tidewave — mobile app" },
          { url: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600", caption: "Globex — dashboard" },
          { url: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=600", caption: "Hooli — marketing site" },
          { url: "https://images.unsplash.com/photo-1620912189865-1e3a3b3b3b3b?w=600", caption: "Soylent — packaging" },
        ]}),
        sec("testimonials", { title: "Kind words", items: [
          { quote: "Best design partner we've ever had. Period.", name: "Sarah Chen", role: "CEO, Northwind", avatar: "https://i.pravatar.cc/100?img=47" },
          { quote: "Translates fuzzy strategy into pixels better than anyone.", name: "Marcus Reed", role: "Founder, Tidewave", avatar: "https://i.pravatar.cc/100?img=12" },
        ]}),
        sec("cta", { eyebrow: "Let's work together", title: "Have a project in mind?", subtitle: "I take on 4 new projects per quarter. Next opening: Q3 2026.", primaryCtaLabel: "Start a project", primaryCtaHref: "#contact", secondaryCtaLabel: "", secondaryCtaHref: "", variant: "muted" }),
        sec("footer", { brand: "Atelier", tagline: "Independent design studio. Brand, product, motion.", columns: [{ title: "Work", links: [{ label: "Selected", href: "#" }, { label: "Archive", href: "#" }] }, { title: "Connect", links: [{ label: "Email", href: "#" }, { label: "Twitter", href: "#" }, { label: "LinkedIn", href: "#" }] }], copyright: "© 2026 Atelier Studio" }),
      ]),
    ],
  },
  {
    slug: "agency-globex", name: "Globex — Agency", category: "agency",
    description: "Full-service creative agency site: hero, services, work, team, contact.",
    theme: { ...DEFAULT_THEME, primary: "#1e1b4b", accent: "#f59e0b", accentFg: "#1e1b4b", background: "#0b1020", foreground: "#e2e8f0", muted: "#1e293b", mutedFg: "#94a3b8", border: "#1e293b" },
    buildPages: () => [
      page("Home", "home", "/", true, [
        sec("navbar", { brand: "Globex Creative", logoUrl: "", links: [{ label: "Services", href: "#services" }, { label: "Work", href: "#work" }, { label: "Team", href: "#team" }, { label: "Contact", href: "#contact" }], ctaLabel: "Start a project", ctaHref: "#contact", sticky: true, transparent: true }),
        sec("hero", { variant: "centered", eyebrow: "Full-service creative agency", headline: "We make brands impossible to ignore", subhead: "Strategy, design, and motion under one roof. Globex partners with ambitious brands to launch campaigns that move the needle.", primaryCtaLabel: "Start a project", primaryCtaHref: "#contact", secondaryCtaLabel: "See our work", secondaryCtaHref: "#work", imageUrl: "", align: "center" }),
        sec("logocloud", { title: "Brands we've partnered with", logos: [{ name: "Acme", url: "" }, { name: "Northwind", url: "" }, { name: "Tidewave", url: "" }, { name: "Hooli", url: "" }, { name: "Soylent", url: "" }, { name: "Initech", url: "" }] }),
        sec("features", { eyebrow: "Services", title: "What we do", subtitle: "Full-stack creative — from positioning to pixel-perfect launch.", columns: "3", items: [
          { icon: "Compass", title: "Brand strategy", description: "Positioning, naming, messaging architecture." },
          { icon: "PenTool", title: "Visual identity", description: "Logo systems, type, color, motion." },
          { icon: "Layout", title: "Web design", description: "Marketing sites, products, e-commerce." },
          { icon: "Clapperboard", title: "Film & motion", description: "Brand films, product demos, ads." },
          { icon: "Megaphone", title: "Campaigns", description: "Launch strategy + creative in one sprint." },
          { icon: "Package", title: "Packaging", description: "Structural and graphic packaging design." },
        ]}),
        sec("stats", { title: "", stats: [
          { value: "120+", label: "Brands launched" },
          { value: "14", label: "Years in business" },
          { value: "32", label: "Awards won" },
          { value: "98%", label: "Repeat clients" },
        ]}),
        sec("cta", { eyebrow: "Start a project", title: "Got something ambitious?", subtitle: "We take on 6 new clients per year. Tell us about your brand.", primaryCtaLabel: "Get in touch", primaryCtaHref: "#contact", secondaryCtaLabel: "See pricing", secondaryCtaHref: "#pricing", variant: "gradient" }),
        sec("footer", { brand: "Globex Creative", tagline: "Strategy, design, motion. Under one roof.", columns: [
          { title: "Studio", links: [{ label: "About", href: "#" }, { label: "Team", href: "#" }, { label: "Careers", href: "#" }] },
          { title: "Work", links: [{ label: "Case studies", href: "#" }, { label: "Awards", href: "#" }] },
          { title: "Contact", links: [{ label: "Email", href: "#" }, { label: "Phone", href: "#" }] },
        ], copyright: "© 2026 Globex Creative, LLC" }),
      ]),
    ],
  },
  {
    slug: "ecommerce-hooli", name: "Hooli — E-commerce", category: "ecommerce",
    description: "Product launch landing page with hero, product gallery, reviews, FAQ, newsletter.",
    theme: { ...DEFAULT_THEME, primary: "#14532d", accent: "#22c55e", accentFg: "#052e16", background: "#ffffff", foreground: "#14532d", muted: "#f7fee7", mutedFg: "#3f6212", border: "#d9f99d" },
    buildPages: () => [
      page("Home", "home", "/", true, [
        sec("navbar", { brand: "Hooli Goods", logoUrl: "", links: [{ label: "Shop", href: "#shop" }, { label: "Reviews", href: "#reviews" }, { label: "FAQ", href: "#faq" }], ctaLabel: "Buy now", ctaHref: "#buy", sticky: true, transparent: false }),
        sec("hero", { variant: "split-right", eyebrow: "NEW • The everyday carry", headline: "The last backpack you'll ever buy", subhead: "Lifetime warranty. Made from recycled ocean plastic. 14,000+ five-star reviews. Free shipping over $50.", primaryCtaLabel: "Shop now — $129", primaryCtaHref: "#buy", secondaryCtaLabel: "Read reviews", secondaryCtaHref: "#reviews", imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900&q=80", align: "left" }),
        sec("logocloud", { title: "As seen in", logos: [{ name: "Wirecutter", url: "" }, { name: "GQ", url: "" }, { name: "The Verge", url: "" }, { name: "Outside", url: "" }] }),
        sec("gallery", { title: "See it in the wild", columns: "4", images: [
          { url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600", caption: "Charcoal" },
          { url: "https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600", caption: "Olive" },
          { url: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600", caption: "Sand" },
          { url: "https://images.unsplash.com/photo-1577733966973-d680bffd2e80?w=600", caption: "Navy" },
        ]}),
        sec("features", { eyebrow: "Why Hooli", title: "Built to outlast you", subtitle: "Every detail engineered for decades of daily use.", columns: "3", items: [
          { icon: "Recycle", title: "Ocean plastic", description: "Each bag removes 23 plastic bottles from the ocean." },
          { icon: "Shield", title: "Lifetime warranty", description: "If it breaks, we fix it. Forever." },
          { icon: "Zap", title: "USB-C charging", description: "Built-in 10K mAh battery, charges phone 2x." },
          { icon: "Lock", title: "Anti-theft", description: "RFID-blocking pocket + hidden zippers." },
          { icon: "Feather", title: "Under 2 lbs", description: "Featherlight even when fully loaded." },
          { icon: "Droplets", title: "Waterproof", description: "DWR-coated + YKK Aquaguard zippers." },
        ]}),
        sec("stats", { title: "", stats: [
          { value: "14K+", label: "5-star reviews" },
          { value: "23", label: "Bottles recycled per bag" },
          { value: "2 lbs", label: "Total weight" },
          { value: "Lifetime", label: "Warranty" },
        ]}),
        sec("testimonials", { title: "What customers say", items: [
          { quote: "3 years daily use and it looks new. Worth every penny.", name: "Sarah Chen", role: "Verified buyer", avatar: "https://i.pravatar.cc/100?img=47" },
          { quote: "The USB-C charger has saved me at airports so many times.", name: "Marcus Reed", role: "Verified buyer", avatar: "https://i.pravatar.cc/100?img=12" },
        ]}),
        sec("faq", { title: "Questions, answered", subtitle: "", items: [
          { question: "When does it ship?", answer: "In stock — ships within 24 hours, free over $50." },
          { question: "What's the warranty?", answer: "Lifetime. If anything breaks, we repair or replace free." },
          { question: "Can I return it?", answer: "Yes — 60-day no-questions-asked returns." },
        ]}),
        sec("newsletter", { title: "Get 10% off your first order", subtitle: "Join 30,000+ Hooli customers. New product drops, early access, no spam.", placeholder: "you@email.com", buttonLabel: "Get my code", footnote: "By subscribing you agree to our privacy policy." }),
        sec("cta", { eyebrow: "Ready?", title: "Get your forever backpack", subtitle: "$129. Free shipping. Lifetime warranty.", primaryCtaLabel: "Shop now", primaryCtaHref: "#buy", secondaryCtaLabel: "Read reviews", secondaryCtaHref: "#reviews", variant: "solid" }),
        sec("footer", { brand: "Hooli Goods", tagline: "Built to outlast you.", columns: [
          { title: "Shop", links: [{ label: "Backpacks", href: "#" }, { label: "Accessories", href: "#" }, { label: "Gift cards", href: "#" }] },
          { title: "Company", links: [{ label: "About", href: "#" }, { label: "Sustainability", href: "#" }, { label: "Press", href: "#" }] },
          { title: "Help", links: [{ label: "Shipping", href: "#" }, { label: "Returns", href: "#" }, { label: "Warranty", href: "#" }] },
        ], copyright: "© 2026 Hooli Goods, Inc." }),
      ]),
    ],
  },
  {
    slug: "startup-tidewave", name: "Tidewave — Startup launch", category: "startup",
    description: "Pre-launch waitlist page with hero, problem/solution, early access form.",
    theme: { ...DEFAULT_THEME, primary: "#831843", accent: "#ec4899", accentFg: "#500724", background: "#fff1f2", foreground: "#4c0519", muted: "#ffe4e6", mutedFg: "#9f1239", border: "#fecdd3" },
    buildPages: () => [
      page("Home", "home", "/", true, [
        sec("navbar", { brand: "Tidewave", logoUrl: "", links: [{ label: "How it works", href: "#how" }, { label: "About", href: "#about" }], ctaLabel: "Join waitlist", ctaHref: "#waitlist", sticky: true, transparent: true }),
        sec("hero", { variant: "centered", eyebrow: "Coming Q3 2026", headline: "Your money, on autopilot", subhead: "Tidewave is the AI CFO for solo founders. Auto-categorizes, forecasts, and finds deductions — before tax season.", primaryCtaLabel: "Join waitlist", primaryCtaHref: "#waitlist", secondaryCtaLabel: "See how it works", secondaryCtaHref: "#how", imageUrl: "", align: "center" }),
        sec("stats", { title: "", stats: [
          { value: "8,400+", label: "On the waitlist" },
          { value: "12 hrs", label: "Saved per month" },
          { value: "$3.2K", label: "Avg tax savings" },
          { value: "Q3 2026", label: "Launch target" },
        ]}),
        sec("features", { eyebrow: "How it works", title: "Three steps to financial autopilot", subtitle: "", columns: "3", items: [
          { icon: "Link", title: "1. Connect accounts", description: "Bank, credit cards, Stripe, PayPal — read-only, bank-grade security." },
          { icon: "BrainCircuit", title: "2. AI categorizes", description: "Auto-tags every transaction. Learns your business in days." },
          { icon: "FileText", title: "3. Files taxes", description: "Generates Schedule C, 1099s, K-1s. CPAs review for free." },
        ]}),
        sec("newsletter", { title: "Get early access + 50% off year one", subtitle: "Join 8,400+ solo founders on the waitlist. First 1,000 get founder pricing forever.", placeholder: "you@company.com", buttonLabel: "Join waitlist", footnote: "We'll email you when Tidewave is ready. No spam, ever." }),
        sec("footer", { brand: "Tidewave", tagline: "Your money, on autopilot.", columns: [
          { title: "Product", links: [{ label: "How it works", href: "#" }, { label: "Pricing", href: "#" }, { label: "Security", href: "#" }] },
          { title: "Company", links: [{ label: "About", href: "#" }, { label: "Blog", href: "#" }] },
        ], copyright: "© 2026 Tidewave, Inc." }),
      ]),
    ],
  },
];

export function buildSiteFromTemplate(tpl: TemplateBlueprint): SiteData {
  const pages: PageData[] = tpl.buildPages().map((p) => ({ ...p, id: uuid() }));
  return {
    id: uuid(), name: tpl.name, slug: tpl.slug, description: tpl.description,
    themeTokens: clone(tpl.theme), pages,
  };
}

function clone<T>(v: T): T {
  return typeof structuredClone === "function" ? structuredClone(v) : JSON.parse(JSON.stringify(v));
}
