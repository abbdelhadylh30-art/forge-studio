import type { LandingConfig, Section, SectionType } from "./types"
import { sectionAnchors } from "./anchors"

let counter = 0
export function sid(prefix: string): string {
  counter += 1
  return `${prefix}-${Date.now().toString(36)}${counter.toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`
}

/** Create a fresh section of any type with sensible default content */
export function createSection(type: SectionType): Section {
  const base = { id: sid(type), hidden: false }
  switch (type) {
    case "navbar":
      return {
        ...base,
        type,
        links: [
          { label: "Features", href: "#features" },
          { label: "Pricing", href: "#pricing" },
          { label: "FAQ", href: "#faq" },
        ],
        cta: { label: "Get started", href: "#cta" },
      }
    case "hero":
      return {
        ...base,
        type,
        layout: "split-right",
        badge: "✨ Now in public beta",
        headline: "Ship faster. Sleep better.",
        sub: "The fastest way to build and deploy your product. One config, production-ready code, zero lock-in.",
        cta: { label: "Get started — it's free", href: "#cta" },
        secondaryCta: { label: "View demo", href: "#features" },
        image: "",
        stats: [
          { value: "30s", label: "from push to prod" },
          { value: "12k+", label: "pages shipped" },
          { value: "99.9%", label: "uptime" },
        ],
        ab: {
          enabled: false,
          metric: "cta_click",
          autoWinner: true,
          sampleSize: 1000,
          variants: [
            { id: sid("ab"), name: "A", headline: "Ship faster. Sleep better.", sub: "", ctaLabel: "", weight: 50 },
            {
              id: sid("ab"),
              name: "B",
              headline: "Deploy your product in 30 seconds",
              sub: "",
              ctaLabel: "",
              weight: 50,
            },
          ],
        },
      }
    case "logos":
      return {
        ...base,
        type,
        title: "Trusted by teams at",
        items: ["Vertex", "Northloop", "Kite", "Fathom", "Arcadia", "Lumen"],
      }
    case "features":
      return {
        ...base,
        type,
        title: "Everything you need",
        subtitle: "Powerful primitives that stay out of your way.",
        style: "grid",
        columns: 3,
        items: [
          { icon: "⚡", title: "Instant deploy", body: "From git push to production in 30 seconds flat." },
          { icon: "🛡️", title: "Secure by default", body: "SSL, auth and rate limits wired from day one." },
          { icon: "📊", title: "Built-in analytics", body: "See what works without third-party tools." },
          { icon: "🌍", title: "Edge-ready", body: "Served from 300+ locations worldwide." },
          { icon: "🧩", title: "Composable", body: "Every block is a plain component you own." },
          { icon: "🎛️", title: "Fine control", body: "Tune layouts, themes and copy visually." },
        ],
      }
    case "stats":
      return {
        ...base,
        type,
        title: "",
        items: [
          { value: "12k+", label: "landing pages shipped", delta: "+18% this quarter" },
          { value: "30s", label: "average build time", delta: "-40% vs last year" },
          { value: "98%", label: "would recommend", delta: "+6 pts" },
          { value: "42", label: "countries served", delta: "+5 new" },
        ],
      }
    case "testimonials":
      return {
        ...base,
        type,
        title: "Loved by builders",
        subtitle: "Real teams, real shipping speed.",
        style: "grid",
        items: [
          {
            quote: "We shipped our launch page in an afternoon. The A/B testing alone paid for itself in a week.",
            author: "Alice Nakamura",
            role: "CTO, Vertex",
            initials: "AN",
            rating: 5,
          },
          {
            quote: "Finally a builder that outputs code I'm not embarrassed to own.",
            author: "Diego Marín",
            role: "Founder, Kite",
            initials: "DM",
            rating: 5,
          },
          {
            quote: "The analytics dashboard replaced two paid tools for us.",
            author: "Priya Sharma",
            role: "Growth, Fathom",
            initials: "PS",
            rating: 4,
          },
        ],
      }
    case "pricing":
      return {
        ...base,
        type,
        title: "Simple pricing",
        subtitle: "Start free, upgrade when you ship.",
        annualToggle: true,
        annualDiscountLabel: "Save 20% annually",
        plans: [
          {
            name: "Free",
            price: "$0",
            period: "/mo",
            description: "For side projects",
            features: ["1 landing page", "Community support", "Basic analytics"],
            ctaLabel: "Start free",
          },
          {
            name: "Pro",
            price: "$29",
            period: "/mo",
            description: "For serious shipping",
            features: ["Unlimited pages", "A/B testing", "Advanced analytics", "Custom domains"],
            highlighted: true,
            ctaLabel: "Go Pro",
          },
          {
            name: "Team",
            price: "$79",
            period: "/mo",
            description: "For teams",
            features: ["Everything in Pro", "5 seats", "Priority deploys", "SSO"],
            ctaLabel: "Contact sales",
          },
        ],
      }
    case "faq":
      return {
        ...base,
        type,
        title: "Frequently asked questions",
        subtitle: "Everything else you might wonder.",
        style: "accordion",
        items: [
          {
            q: "Do I need a credit card to start?",
            a: "No. The free tier doesn't require any payment info.",
          },
          {
            q: "Do I own the generated code?",
            a: "Yes — everything is exported as a clean Next.js project you fully own.",
          },
          {
            q: "Can I self-host?",
            a: "Absolutely. Deploy to Vercel, Netlify, Cloudflare or your own Docker setup.",
          },
          {
            q: "How does A/B testing work?",
            a: "Define weighted variants in your hero. After your sample size is reached, the winner is auto-promoted.",
          },
        ],
      }
    case "gallery":
      return {
        ...base,
        type,
        title: "Built with Forge",
        subtitle: "A few pages shipped by the community.",
        style: "masonry",
        items: [
          { alt: "Dashboard screenshot", hue: "262", caption: "Vertex analytics" },
          { alt: "Mobile app screenshot", hue: "180", caption: "Kite mobile" },
          { alt: "Marketing site", hue: "24", caption: "Ember commerce" },
          { alt: "Portfolio page", hue: "340", caption: "Studio Rosé" },
          { alt: "Docs site", hue: "130", caption: "Lumen docs" },
          { alt: "Launch page", hue: "60", caption: "Arcadia launch" },
        ],
      }
    case "about":
      return {
        ...base,
        type,
        title: "Why we build",
        subtitle: "The story behind the product.",
        style: "mission",
        body: "We believe shipping should be the default, not the exception.",
        items: [
          { title: "Craft over noise", body: "Every default is opinionated, tested, and tuned for conversion." },
          { title: "Own your work", body: "Your pages export to clean HTML you can host anywhere. No lock-in." },
          { title: "Ship fast, sleep well", body: "Analytics, A/B tests and SEO baked in — so you can stop tweaking." },
        ],
        founder: { name: "Alex Rivera", role: "Founder & CEO" },
      }
    case "contact":
      return {
        ...base,
        type,
        title: "Get in touch",
        subtitle: "We reply within one business day.",
        email: "hello@example.com",
        phone: "+1 (555) 010-2030",
        fields: ["Your name", "Email address", "Message"],
        submitLabel: "Send message",
      }
    case "cta-final":
      return {
        ...base,
        type,
        headline: "Ready to ship?",
        sub: "Join thousands of builders shipping beautiful pages in minutes.",
        cta: { label: "Start free trial", href: "#cta" },
        note: "No credit card required",
      }
    case "footer":
      return {
        ...base,
        type,
        style: "mega",
        tagline: "Beautiful landing pages from one config file.",
        linkGroups: [
          {
            group: "Product",
            items: [
              { label: "Features", href: "#features" },
              { label: "Pricing", href: "#pricing" },
              { label: "Changelog", href: "#" },
            ],
          },
          {
            group: "Company",
            items: [
              { label: "About", href: "#" },
              { label: "Blog", href: "#" },
              { label: "Careers", href: "#" },
            ],
          },
          {
            group: "Legal",
            items: [
              { label: "Privacy", href: "#" },
              { label: "Terms", href: "#" },
            ],
          },
        ],
        social: ["X", "GitHub", "Discord"],
        copyright: "© 2025 Forge. All rights reserved.",
      }
  }
}

// ── Starter templates ────────────────────────────────────────────────────────
export interface TemplateDef {
  id: string
  name: string
  description: string
  icon: string
  build: () => LandingConfig
}

/** Re-point in-page #links that resolve to no section anchor toward the
 *  strongest existing conversion target — starter templates must never ship
 *  broken navigation (the readiness audit now enforces exactly this). */
function relinkAnchors(config: LandingConfig): LandingConfig {
  const anchors = new Set(sectionAnchors(config).values())
  if (anchors.size === 0) return config
  const fallback = ["cta", "pricing", "features", "faq", "contact", "top"].find((a) => anchors.has(a)) ?? [...anchors][0]
  const fix = (href: string): string => {
    const trimmed = href.trim()
    if (!trimmed.startsWith("#")) return trimmed // external URL — untouched
    const target = trimmed.slice(1)
    if (!target || anchors.has(target)) return trimmed
    return `#${fallback}`
  }
  for (const s of config.sections) {
    if (s.type === "navbar") {
      s.links.forEach((l) => (l.href = fix(l.href)))
      if (s.cta) s.cta.href = fix(s.cta.href)
    } else if (s.type === "hero") {
      s.cta.href = fix(s.cta.href)
      if (s.secondaryCta) s.secondaryCta.href = fix(s.secondaryCta.href)
    } else if (s.type === "cta-final") {
      s.cta.href = fix(s.cta.href)
    } else if (s.type === "footer") {
      s.linkGroups.forEach((g) => g.items.forEach((l) => (l.href = fix(l.href))))
    }
  }
  return config
}

function assemble(brandName: string, themeId: LandingConfig["themeId"], types: SectionType[]): LandingConfig {
  const sections = types.map((t) => createSection(t))
  return relinkAnchors({
    version: 1,
    brand: { name: brandName, tagline: "Ship beautiful pages in minutes" },
    themeId,
    seo: {
      title: `${brandName} — Ship faster`,
      description: `${brandName} helps you launch production-ready landing pages from one config file.`,
    },
    sections,
  })
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: "saas",
    name: "SaaS",
    description: "Hero, features, pricing, FAQ — the classic B2B SaaS page.",
    icon: "🛰️",
    build: () => assemble("Vertex", "nebula", ["navbar", "hero", "logos", "features", "stats", "testimonials", "pricing", "faq", "cta-final", "footer"]),
  },
  {
    id: "mobile-app",
    name: "Mobile App",
    description: "App showcase with screenshots, reviews and download CTAs.",
    icon: "📱",
    build: () => {
      const c = assemble("Kite", "emerald", ["navbar", "hero", "logos", "features", "gallery", "testimonials", "faq", "cta-final", "footer"])
      c.brand.tagline = "Your study companion, everywhere"
      return c
    },
  },
  {
    id: "agency",
    name: "Agency",
    description: "Bold portfolio-style page for studios and freelancers.",
    icon: "🎨",
    build: () => assemble("Studio Rosé", "rose", ["navbar", "hero", "features", "gallery", "stats", "contact", "footer"]),
  },
  {
    id: "ecommerce",
    name: "Commerce",
    description: "Product launch page with social proof and offers.",
    icon: "🛒",
    build: () => assemble("Ember Goods", "ember", ["navbar", "hero", "logos", "features", "gallery", "testimonials", "pricing", "faq", "cta-final", "footer"]),
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "One hero, one CTA. Nothing else.",
    icon: "⬜",
    build: () => assemble("Mono", "mono", ["navbar", "hero", "cta-final", "footer"]),
  },
  {
    id: "docsish",
    name: "Paper Docs",
    description: "Light, calm, readable — great for developer tools.",
    icon: "📄",
    build: () => assemble("Lumen", "paper", ["navbar", "hero", "logos", "features", "faq", "contact", "footer"]),
  },
]

export const DEFAULT_CONFIG: LandingConfig = TEMPLATES[0].build()

export function blankProjectName(base = "Untitled"): string {
  return `${base} ${Math.random().toString(36).slice(2, 5).toUpperCase()}`
}

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "project"
  )
}
