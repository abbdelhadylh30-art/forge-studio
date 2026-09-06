import type { LandingConfig, Section, SectionType } from "./types"
import { buildGshockLaunch } from "./gshockTemplate"
import { buildClothingLaunch } from "./clothingTemplate"
import { buildPortfolioSite } from "./portfolioTemplate"
import { buildRealEstateLaunch } from "./realestateTemplate"
import { buildCoffeeLaunch } from "./coffeeTemplate"

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
    case "announcement":
      return {
        ...base,
        type,
        style: "static",
        message: "Now in public beta — free while it lasts",
        link: { label: "Join the beta", href: "#cta" },
      }
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
        badge: "Now in public beta",
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
          { icon: "zap", title: "Instant deploy", body: "From git push to production in 30 seconds flat." },
          { icon: "shield", title: "Secure by default", body: "SSL, auth and rate limits wired from day one." },
          { icon: "chart", title: "Built-in analytics", body: "See what works without third-party tools." },
          { icon: "globe", title: "Edge-ready", body: "Served from 300+ locations worldwide." },
          { icon: "puzzle", title: "Composable", body: "Every block is a plain component you own." },
          { icon: "settings", title: "Fine control", body: "Tune layouts, themes and copy visually." },
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
    case "problem":
      return {
        ...base,
        type,
        title: "Shipping a page still hurts",
        subtitle: "The old way eats your week before launch day.",
        style: "grid",
        items: [
          { icon: "clock", title: "Weeks of back-and-forth", body: "Design, copy, code, review — every hand-off adds delay and drift." },
          { icon: "alert", title: "Guesswork everywhere", body: "No data on which headline or CTA actually converts, so opinions win." },
          { icon: "lock", title: "Platform lock-in", body: "Your page lives in someone else's template — exporting means starting over." },
        ],
      }
    case "solution":
      return {
        ...base,
        type,
        title: "One config, one afternoon, live",
        subtitle: "Build the whole narrative and let the data pick the winners.",
        style: "grid",
        items: [
          { icon: "zap", title: "Compose, don't code", body: "Drag sections into a story: problem, solution, proof, offer, close." },
          { icon: "target", title: "Experiments built in", body: "Section-level A/B tests with per-variant reads, clicks and engagement." },
          { icon: "unlock", title: "Own the output", body: "Export a self-contained HTML file or deploy — either way, it's yours." },
        ],
      }
    case "video":
      return {
        ...base,
        type,
        title: "See it in motion",
        subtitle: "A 90-second tour of the studio, the auditor and the publisher.",
        videoUrl: "",
        style: "cinematic",
        caption: "Product tour — no narration needed",
      }
    case "comparison":
      return {
        ...base,
        type,
        title: "Forge vs. the old way",
        subtitle: "What changes when your page is a system, not a project.",
        style: "table",
        usLabel: "Forge",
        themLabel: "Old way",
        rows: [
          { feature: "Time to launch", us: "Afternoon", them: "2–6 weeks" },
          { feature: "A/B testing", us: "yes", them: "no" },
          { feature: "First-party analytics", us: "yes", them: "no" },
          { feature: "Leads captured", us: "yes", them: "partial" },
          { feature: "Export anywhere", us: "yes", them: "partial" },
          { feature: "Multilingual + RTL", us: "yes", them: "no" },
        ],
        note: "Typical results reported by beta teams; your mileage may vary.",
      }
    case "guarantee":
      return {
        ...base,
        type,
        title: "The zero-risk launch",
        subtitle: "30-day money-back guarantee",
        body: "Launch with total confidence. If Forge isn't the fastest page you've ever shipped, tell us within 30 days and every cent comes back — no forms, no questions, no hard feelings.",
        style: "card",
        items: [
          { icon: "timer", title: "30 days", body: "Full refund window" },
          { icon: "unlock", title: "No lock-in", body: "Export and leave anytime" },
          { icon: "life-buoy", title: "Human support", body: "Real replies within a day" },
        ],
      }
    case "offer":
      return {
        ...base,
        type,
        title: "Limited-time offer",
        subtitle: "Everything included, one simple price",
        badge: "Limited spots available",
        price: "$497",
        originalPrice: "$997",
        period: "One-time payment",
        savingsLabel: "Save 50%",
        countdownPrefix: "Offer ends in",
        features: [
          "Complete access to all features",
          "Unlimited pages and projects",
          "Priority 24/7 support",
          "Lifetime updates included",
        ],
        cta: { label: "Claim this offer", href: "#cta" },
        trust: [
          { icon: "lock", label: "Secure checkout" },
          { icon: "shield-check", label: "30-day guarantee" },
          { icon: "unlock", label: "No lock-in" },
        ],
        style: "card",
      }
    case "contact":
      return {
        ...base,
        type,
        title: "Get in touch",
        subtitle: "We reply within one business day.",
        style: "split",
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
        socialLinks: [
          { platform: "X", url: "" },
          { platform: "GitHub", url: "" },
          { platform: "Discord", url: "" },
        ],
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
  /** false → keep the template's own brand/content verbatim when a project
   *  is created from it (content-rich showcase templates). Default true:
   *  the project name is stamped over the generic placeholder brand. */
  stampName?: boolean
}

/** Re-point in-page #links that resolve to no section anchor toward the
 *  strongest existing conversion target — starter templates must never ship
 *  broken navigation (the readiness audit now enforces exactly this). */
/**
 * The template gallery — five content-rich showcase pages, one per niche.
 * All are stampName:false: creating a project keeps the demo brand and copy
 * verbatim (the showcase IS the content). Every builder returns a fresh
 * object graph safe to mutate.
 */
export const TEMPLATES: TemplateDef[] = [
  {
    id: "clothing",
    name: "Apparel Drop",
    description: "NORTHFORM heavyweight hoodie launch — countdown bundle, lookbook, repair promise. 18 sections.",
    icon: "shopping-bag",
    stampName: false,
    build: () => buildClothingLaunch(),
  },
  {
    id: "product-launch",
    name: "Product Launch",
    description: "A G-SHOCK watch launch — countdown offer, story, gallery, comparison, guarantee. 18 sections.",
    icon: "gauge",
    stampName: false,
    build: () => buildGshockLaunch(),
  },
  {
    id: "portfolio",
    name: "Portfolio",
    description: "Mara Osei design studio — work carousel, services, engagements, handoff promise. 14 sections.",
    icon: "palette",
    stampName: false,
    build: () => buildPortfolioSite(),
  },
  {
    id: "real-estate",
    name: "Real Estate",
    description: "The Alder House listing — photo tour, comparables, offer review countdown, tour booking. 15 sections.",
    icon: "map",
    stampName: false,
    build: () => buildRealEstateLaunch(),
  },
  {
    id: "coffee",
    name: "Coffee Club",
    description: "Meridian Roasters subscription — roast-to-door story, process gallery, freshness guarantee. 18 sections.",
    icon: "flame",
    stampName: false,
    build: () => buildCoffeeLaunch(),
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
