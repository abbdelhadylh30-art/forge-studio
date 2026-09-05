import type { SectionType } from "./types"

/**
 * Content packs — per-section-type content presets chosen when adding a
 * section. Every pack shallow-merges its `patch` over `createSection(type)`,
 * exactly like the properties panel does (Partial<Section>), so any field the
 * pack omits falls back to the default content.
 */
export interface ContentPack {
  id: string
  name: string
  description: string
  /** Small chips rendered on the card, e.g. "grid · 6 items". */
  meta: string
  /** Recommended insert position hint (unused by the store, informative only). */
  patch: Record<string, unknown>
}

export const CONTENT_PACKS: Record<SectionType, ContentPack[]> = {
  announcement: [
    {
      id: "announce-static",
      name: "Classic bar",
      description: "One line, one link — the safe default for any page.",
      meta: "static · link",
      patch: {},
    },
    {
      id: "announce-ticker",
      name: "Scrolling ticker",
      description: "Infinite marquee for launches, press mentions, milestones.",
      meta: "ticker · infinite",
      patch: {
        style: "ticker",
        message: "Featured in TechCrunch · 12,000 pages shipped · 99.9% uptime · new: section-level A/B tests",
        link: undefined,
      },
    },
    {
      id: "announce-countdown",
      name: "Live countdown",
      description: "Real ticking timer to a deadline — urgency on autopilot.",
      meta: "countdown · live",
      patch: {
        style: "countdown",
        message: "Early-access pricing ends in",
        prefixLabel: "",
        deadline: (() => {
          const d = new Date(Date.now() + 3 * 86_400_000)
          return d.toISOString().slice(0, 10) + "T12:00:00"
        })(),
        link: { label: "Lock the price", href: "#cta" },
      },
    },
  ],
  navbar: [
    {
      id: "nav-classic",
      name: "Classic nav",
      description: "Brand + 3 anchor links + CTA. The safe default for most pages.",
      meta: "3 links · CTA",
      patch: {},
    },
    {
      id: "nav-minimal",
      name: "Minimal nav",
      description: "Brand and a single CTA. Keeps attention on the hero.",
      meta: "1 link · CTA",
      patch: {
        links: [{ label: "Pricing", href: "#pricing" }],
        cta: { label: "Start free", href: "#cta" },
      },
    },
    {
      id: "nav-app",
      name: "App nav",
      description: "Product tour links with a Log in secondary action.",
      meta: "4 links · login",
      patch: {
        links: [
          { label: "Product", href: "#features" },
          { label: "Reviews", href: "#testimonials" },
          { label: "Pricing", href: "#pricing" },
          { label: "FAQ", href: "#faq" },
        ],
        cta: { label: "Log in", href: "#cta" },
      },
    },
  ],
  hero: [
    {
      id: "hero-saas",
      name: "SaaS launch",
      description: "Beta badge, benefit headline, dual CTAs, stat row. Ships the classic.",
      meta: "split-right · stats · A/B ready",
      patch: {},
    },
    {
      id: "hero-product",
      name: "Product drop",
      description: "New-arrival badge with urgency copy and a single strong CTA.",
      meta: "split-left · image slot",
      patch: {
        layout: "split-left",
        badge: "Just dropped — v2.0",
        headline: "The upgrade everyone was waiting for.",
        sub: "Rebuilt from scratch: 2× faster, beautifully dark, and finally available to everyone. First 500 orders get the launch price.",
        cta: { label: "Get the launch price", href: "#cta" },
        secondaryCta: { label: "See what changed", href: "#features" },
        stats: [
          { value: "2×", label: "faster than v1" },
          { value: "500", label: "launch-price spots" },
          { value: "4.9★", label: "beta rating" },
        ],
      },
    },
    {
      id: "hero-event",
      name: "Event / webinar",
      description: "Date badge, countdown-flavored stats, register CTA.",
      meta: "center · date badge",
      patch: {
        layout: "center",
        badge: "Live Thursday, Dec 12 · 10:00 ET",
        headline: "Ship your first landing page before lunch.",
        sub: "A free 45-minute live session — build, theme and deploy a real page with us. Recording sent to everyone registered.",
        cta: { label: "Save my seat", href: "#cta" },
        secondaryCta: { label: "Add to calendar", href: "#contact" },
        stats: [
          { value: "45m", label: "hands-on session" },
          { value: "1k+", label: "builders registered" },
          { value: "100%", label: "free, no pitch" },
        ],
      },
    },
    {
      id: "hero-portfolio",
      name: "Portfolio intro",
      description: "Quiet, personal headline for studios and freelancers.",
      meta: "minimal · no stats",
      patch: {
        layout: "minimal",
        badge: "",
        headline: "I design calm interfaces for loud ideas.",
        sub: "Independent designer for SaaS & dev-tools — currently booking projects for next quarter.",
        cta: { label: "See selected work", href: "#gallery" },
        secondaryCta: { label: "About me", href: "#contact" },
        stats: [],
      },
    },
  ],
  logos: [
    {
      id: "logos-trusted",
      name: "Trusted by",
      description: "The classic “trusted by teams at” social-proof strip.",
      meta: "6 wordmarks",
      patch: {},
    },
    {
      id: "logos-press",
      name: "As seen on",
      description: "Press coverage strip with tech-publication names.",
      meta: "5 wordmarks",
      patch: {
        title: "As seen on",
        items: ["TechCrunch", "WIRED", "The Verge", "Hacker News", "Product Hunt"],
      },
    },
  ],
  features: [
    {
      id: "feat-grid",
      name: "Feature grid",
      description: "Six punchy benefits in a 3-column grid. The workhorse.",
      meta: "grid · 6 items",
      patch: {},
    },
    {
      id: "feat-bento",
      name: "Bento board",
      description: "Mixed-size cards — hero feature gets a mini chart.",
      meta: "bento · 6 items",
      patch: {
        style: "bento",
        columns: 3,
        title: "One platform, every job",
        subtitle: "Small cards for small jobs, big cards for the ones that matter.",
        items: [
          { icon: "🚀", title: "Deploy from git", body: "Preview every branch automatically, promote with one click." },
          { icon: "📈", title: "Live metrics", body: "Watch launches in real time." },
          { icon: "🔐", title: "SSO & SCIM", body: "Okta, Entra, Google — wired in five minutes." },
          { icon: "🌍", title: "Global edge", body: "Served from 300+ PoPs, cached smartly." },
          { icon: "🧪", title: "Preview DB", body: "Every branch gets a disposable database." },
          { icon: "🛡️", title: "SOC 2 Type II", body: "Audited annually, reports on demand." },
        ],
      },
    },
    {
      id: "feat-pillars",
      name: "Platform pillars",
      description: "Three deep-dive pillars with alternating rows and dividers.",
      meta: "alternating · 3 items",
      patch: {
        style: "alternating",
        columns: 1,
        title: "Built on three pillars",
        subtitle: "Everything else is details.",
        items: [
          { icon: "🏗️", title: "Own your stack", body: "No black boxes: export a clean Next.js project whenever you outgrow the studio. Your config, your repo, your rules." },
          { icon: "⚡", title: "Fast by default", body: "Every page ships as static HTML with zero runtime. Lighthouse scores in the high 90s are the norm, not the goal." },
          { icon: "🔍", title: "Measure what matters", body: "Privacy-friendly analytics built in — pageviews, CTA clicks, A/B winners — without a single third-party script." },
        ],
      },
    },
    {
      id: "feat-tabs",
      name: "Feature tabs",
      description: "Interactive tab bar — each tab is a mini feature page.",
      meta: "tabs · 4 items",
      patch: {
        style: "tabs",
        columns: 4,
        title: "Take the tour",
        subtitle: "Four stops, no scrolling required.",
        items: [
          { icon: "✍️", title: "Visual editor", body: "Drag, drop, reorder. Every section is inline-editable and the preview never lags behind." },
          { icon: "🎨", title: "Themes", body: "Six curated palettes that re-skin the whole page in one click — colors, gradients, contrast included." },
          { icon: "🧪", title: "A/B testing", body: "Weighted hero variants with automatic winner promotion once your sample size is reached." },
          { icon: "📦", title: "Export anywhere", body: "YAML config or one self-contained HTML file. Zero lock-in, by design." },
        ],
      },
    },
  ],
  stats: [
    {
      id: "stats-growth",
      name: "Growth metrics",
      description: "Adoption and reach numbers with quarter-over-quarter deltas.",
      meta: "4 metrics · deltas",
      patch: {},
    },
    {
      id: "stats-product",
      name: "Product metrics",
      description: "Speed, reliability and quality deltas — great under the hero.",
      meta: "4 metrics · deltas",
      patch: {
        items: [
          { value: "38ms", label: "median API response", delta: "-62% p95" },
          { value: "99.99%", label: "uptime this year", delta: "+2 nines" },
          { value: "0", label: "incidents this quarter", delta: "streak: 94 days" },
          { value: "A+", label: "Lighthouse performance", delta: "across 40 pages" },
        ],
      },
    },
  ],
  testimonials: [
    {
      id: "testi-quotes",
      name: "Classic quotes",
      description: "Three-cards grid with star ratings. Always believable.",
      meta: "grid · 3 quotes",
      patch: {},
    },
    {
      id: "testi-marquee",
      name: "Wall of love",
      description: "Endless scrolling marquee of short praise. Great for volume.",
      meta: "marquee · 8 quotes",
      patch: {
        style: "marquee",
        title: "What people are saying",
        subtitle: "",
        items: [
          { quote: "Set up in ten minutes. I keep checking that it's actually free.", author: "Marc O.", role: "Indie hacker", initials: "MO", rating: 5 },
          { quote: "The YAML export alone sold our whole team.", author: "Sana K.", role: "Staff Engineer, Lumen", initials: "SK", rating: 5 },
          { quote: "Replaced two analytics tools on day one.", author: "Tomas R.", role: "Growth, Arcadia", initials: "TR", rating: 4 },
          { quote: "My landing page out-converts the agency one. Awkward.", author: "Elena F.", role: "Founder, Kite", initials: "EF", rating: 5 },
          { quote: "A/B testing with auto-promotion feels like cheating.", author: "Jay P.", role: "PM, Northloop", initials: "JP", rating: 5 },
          { quote: "Dark mode default. Finally someone gets it.", author: "Noor A.", role: "Designer", initials: "NA", rating: 4 },
          { quote: "Support answered in four minutes. On a Sunday.", author: "Ben W.", role: "CTO, Fathom", initials: "BW", rating: 5 },
          { quote: "We ship pages the same day we think of them.", author: "Iris L.", role: "Marketing lead", initials: "IL", rating: 5 },
        ],
      },
    },
    {
      id: "testi-spotlight",
      name: "Spotlight quote",
      description: "One huge case-study quote plus compact supporting quotes.",
      meta: "spotlight · 1 + 4",
      patch: {
        style: "spotlight",
        title: "Don't take our word for it",
        subtitle: "",
        items: [
          { quote: "We replaced a $4k/month agency retainer with landing-forge and conversion went up 23%. The A/B auto-winner feature paid for our entire year in the first month.", author: "Amara Chen", role: "VP Marketing, Vertex", initials: "AC", rating: 5 },
          { quote: "Fastest edit-deploy loop I've used.", author: "Diego M.", role: "Founder, Kite", initials: "DM", rating: 5 },
          { quote: "Our designer left; nobody noticed.", author: "Priya S.", role: "Growth, Fathom", initials: "PS", rating: 4 },
          { quote: "Onboarded 40 people in a day.", author: "Jonas W.", role: "Ops, Northloop", initials: "JW", rating: 5 },
          { quote: "The YAML round-trip is chef's kiss.", author: "Ruth T.", role: "Eng lead, Arcadia", initials: "RT", rating: 5 },
        ],
      },
    },
    {
      id: "testi-video",
      name: "Video praise",
      description: "16:9 video-style thumbs with play affordances.",
      meta: "video · 3 clips",
      patch: {
        style: "video",
        title: "Hear it from them",
        subtitle: "2-minute clips from real customers.",
        items: [
          { quote: "How we cut launch time by 80%", author: "Amara Chen", role: "VP Marketing, Vertex", initials: "AC", rating: 5 },
          { quote: "From brief to live in one afternoon", author: "Diego Marín", role: "Founder, Kite", initials: "DM", rating: 5 },
          { quote: "The analytics we always wanted", author: "Priya Sharma", role: "Growth, Fathom", initials: "PS", rating: 4 },
        ],
      },
    },
  ],
  pricing: [
    {
      id: "pricing-3tier",
      name: "3-tier SaaS",
      description: "Free / Pro / Team with an annual toggle and a highlighted plan.",
      meta: "3 plans · annual toggle",
      patch: {},
    },
    {
      id: "pricing-2tier",
      name: "Simple 2-tier",
      description: "Just Free and Pro — decision friction removed.",
      meta: "2 plans · annual toggle",
      patch: {
        title: "Two plans. Pick one.",
        subtitle: "No enterprise maze, no sales call.",
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
            price: "$19",
            period: "/mo",
            description: "For everything you ship",
            features: ["Unlimited pages", "A/B testing", "Advanced analytics", "Custom domains", "Priority deploys"],
            highlighted: true,
            ctaLabel: "Go Pro",
          },
        ],
      },
    },
    {
      id: "pricing-contact",
      name: "Usage + contact",
      description: "Transparent usage tiers with a custom Enterprise card.",
      meta: "3 plans · usage tiers",
      patch: {
        title: "Usage-based, no surprises",
        subtitle: "Pay for what you publish, not for seats.",
        plans: [
          {
            name: "Hobby",
            price: "$0",
            period: "",
            description: "Free forever",
            features: ["3 published pages", "10k visits/mo", "Community support"],
            ctaLabel: "Start free",
          },
          {
            name: "Growing",
            price: "$12",
            period: "/mo",
            description: "per project",
            features: ["Unlimited pages", "100k visits/mo", "A/B testing", "Email support"],
            highlighted: true,
            ctaLabel: "Start growing",
          },
          {
            name: "Enterprise",
            price: "Custom",
            period: "",
            description: "Volume & compliance",
            features: ["SSO / SCIM", "Dedicated infra", "99.99% SLA", "Audit logs"],
            ctaLabel: "Talk to us",
          },
        ],
      },
    },
  ],
  faq: [
    {
      id: "faq-product",
      name: "Product FAQ",
      description: "How-it-works questions in an accordion. Covers the basics.",
      meta: "accordion · 4 Q&As",
      patch: {},
    },
    {
      id: "faq-pricing",
      name: "Pricing FAQ",
      description: "Money questions that stall checkouts — answered up front.",
      meta: "accordion · 5 Q&As",
      patch: {
        title: "Pricing questions",
        subtitle: "The things people ask before the checkout button.",
        items: [
          { q: "Can I really use it for free?", a: "Yes — the free tier includes 1 page with full analytics, forever. No credit card required, no trial countdown." },
          { q: "What happens when I hit the visit limit?", a: "Your page stays online; we just pause analytics collection and email you. You'll never get a surprise bill or a taken-down page." },
          { q: "Do you offer discounts?", a: "Students, non-profits and open-source projects get 50% off Pro. Annual billing saves 20% for everyone." },
          { q: "Can I cancel anytime?", a: "One click, in settings. You keep access until the end of the period, and you can export everything before you go." },
          { q: "Which payment methods?", a: "All major cards, Apple Pay, Google Pay, and SEPA/ACH for annual plans. Invoicing available on Enterprise." },
        ],
      },
    },
    {
      id: "faq-twocol",
      name: "Two-column Q&A",
      description: "Denser reference-style answers, always visible.",
      meta: "twocol · 6 Q&As",
      patch: {
        style: "twocol",
        title: "Everything, answered",
        subtitle: "If it's not here, our team replies within a day.",
        items: [
          { q: "Is there a template for my industry?", a: "Six starter templates cover SaaS, apps, agencies, commerce and more — then every section is editable." },
          { q: "Can I use my own domain?", a: "Yes, on Pro. Point a CNAME at us and TLS is provisioned automatically within minutes." },
          { q: "How private are the analytics?", a: "No cookies, no fingerprinting, no third-party scripts. Anonymous IDs only — GDPR-safe by default." },
          { q: "Do you support RTL languages?", a: "The editor and preview are LTR-first; exported HTML respects dir attributes you add yourself." },
          { q: "What's in the HTML export?", a: "One self-contained .html file — compiled CSS, inline content, working FAQ accordion, SEO meta. Host it anywhere." },
          { q: "Can two people edit at once?", a: "Realtime collaboration is on the roadmap; for now, edits autosave per browser." },
        ],
      },
    },
  ],
  gallery: [
    {
      id: "gallery-masonry",
      name: "Masonry shots",
      description: "Mixed-ratio generated art tiles in flowing columns.",
      meta: "masonry · 6 tiles",
      patch: {},
    },
    {
      id: "gallery-carousel",
      name: "Screenshot carousel",
      description: "Swipeable scroll-snap carousel with arrow controls.",
      meta: "carousel · 5 slides",
      patch: {
        style: "carousel",
        title: "Take it for a spin",
        subtitle: "Swipe through real pages shipped with Forge.",
        items: [
          { alt: "Dashboard screenshot", hue: "262", caption: "Vertex analytics" },
          { alt: "Mobile app screenshot", hue: "180", caption: "Kite mobile" },
          { alt: "Marketing site", hue: "24", caption: "Ember commerce" },
          { alt: "Portfolio page", hue: "340", caption: "Studio Rosé" },
          { alt: "Launch page", hue: "60", caption: "Arcadia launch" },
        ],
      },
    },
  ],
  about: [
    {
      id: "about-mission",
      name: "Mission & values",
      description: "A one-line mission statement plus three value cards.",
      meta: "statement · 3 values",
      patch: {},
    },
    {
      id: "about-founder",
      name: "Founder letter",
      description: "A personal letter from the founder — great for about pages that build trust.",
      meta: "letter · signature",
      patch: {
        title: "A letter from our founder",
        style: "founder",
        body:
          "When we started, every launch took weeks of copy-pasting templates and hand-rolling analytics.\n\nWe built this so the next maker can skip that part — describe the page once, publish it, and get back to the actual product.\n\nIf that sounds like how software should work, you are exactly who we build for.",
        founder: { name: "Alex Rivera", role: "Founder & CEO" },
        items: [],
      },
    },
    {
      id: "about-timeline",
      name: "Company timeline",
      description: "Milestones on a vertical rail — ideal for origin stories and roadmaps.",
      meta: "milestones · vertical rail",
      patch: {
        title: "How we got here",
        style: "timeline",
        items: [
          { year: "2023", title: "The idea", body: "A weekend project to stop rebuilding the same landing page." },
          { year: "2024", title: "First 1,000 pages", body: "The community adopted the YAML format and never looked back." },
          { year: "2025", title: "Forge Studio", body: "Builder, auditor and analytics unified in one studio." },
          { year: "2026", title: "Today", body: "Pages shipped from 40+ countries — and counting." },
        ],
      },
    },
  ],
  problem: [
    {
      id: "problem-grid",
      name: "Pain grid",
      description: "Three sharp pains in a card grid — the setup of your story.",
      meta: "grid · 3 pains",
      patch: {},
    },
    {
      id: "problem-split",
      name: "Split deep-dive",
      description: "Sticky intro left, hairline pain rows right — for longer arcs.",
      meta: "split · editorial",
      patch: {
        style: "split",
        title: "The hidden tax of every launch",
        subtitle: "It never shows up on the invoice — but you pay it every time.",
        items: [
          { icon: "clock", title: "The coordination tax", body: "Five people, three tools, one page — every change ripples through all of them." },
          { icon: "eye", title: "The blind-spot tax", body: "You can't see which section loses readers, so you redesign everything." },
          { icon: "calendar", title: "The waiting tax", body: "Launch dates slip while copy approvals bounce between inboxes." },
        ],
      },
    },
  ],
  solution: [
    {
      id: "solution-grid",
      name: "Turn grid",
      description: "Gradient-capped cards — the moment the story turns.",
      meta: "grid · 3 wins",
      patch: {},
    },
    {
      id: "solution-steps",
      name: "Numbered steps",
      description: "A 01/02/03 timeline — great for how-it-works flows.",
      meta: "steps · timeline",
      patch: {
        style: "steps",
        title: "From blank page to live in three moves",
        subtitle: "No hand-offs, no tickets, no waiting.",
        items: [
          { icon: "blocks", title: "Pick your story", body: "Start from a template or let AI draft the whole narrative for you." },
          { icon: "wand", title: "Make it yours", body: "Swap copy, themes, layouts and images inline — the page is the editor." },
          { icon: "rocket", title: "Ship and learn", body: "Publish with tracking, A/B tests and SEO wired from the first view." },
        ],
      },
    },
  ],
  video: [
    {
      id: "video-cinematic",
      name: "Cinematic",
      description: "Full-width 21:10 statement block with an optional CTA.",
      meta: "cinematic · CTA",
      patch: {},
    },
    {
      id: "video-split",
      name: "Split pitch",
      description: "Copy left, video right — for demos that need explaining.",
      meta: "split · 4:3",
      patch: {
        style: "split",
        title: "Watch the 90-second tour",
        subtitle: "The whole flow: draft, edit, publish, measure.",
        cta: { label: "Start building free", href: "#cta" },
      },
    },
    {
      id: "video-minimal",
      name: "Quiet embed",
      description: "Just the video and a caption — no chrome, snug spacing.",
      meta: "minimal · snug",
      patch: {
        style: "minimal",
        title: "",
        subtitle: "",
        videoUrl: "",
        caption: "Product tour",
      },
    },
  ],
  comparison: [
    {
      id: "compare-table",
      name: "Classic table",
      description: "You vs. them, icons and values — the honest scoreboard.",
      meta: "table · 6 rows",
      patch: {},
    },
    {
      id: "compare-migration",
      name: "Switching pitch",
      description: "Frame the old tool by name for migrators.",
      meta: "table · migration",
      patch: {
        title: "Why teams switch to Forge",
        subtitle: "Same page, different system.",
        usLabel: "Forge",
        themLabel: "Page builders",
        rows: [
          { feature: "First-party analytics", us: "yes", them: "no" },
          { feature: "Section-level A/B tests", us: "yes", them: "no" },
          { feature: "Leads inbox", us: "yes", them: "partial" },
          { feature: "Multilingual + RTL", us: "yes", them: "no" },
          { feature: "Export clean HTML", us: "yes", them: "partial" },
          { feature: "Monthly cost", us: "$0 to start", them: "$25–99" },
        ],
        note: "Comparison based on publicly listed features at the time of writing.",
      },
    },
  ],
  guarantee: [
    {
      id: "guarantee-card",
      name: "Promise card",
      description: "Centered shield panel with terms — risk reversal in one glance.",
      meta: "card · 3 terms",
      patch: {},
    },
    {
      id: "guarantee-split",
      name: "Split promise",
      description: "Longer promise copy left, term chips right.",
      meta: "split · editorial",
      patch: {
        style: "split",
        title: "Try it for 30 days. On us.",
        subtitle: "The Forge guarantee",
        body: "Every plan carries the same promise: if Forge doesn't make launching faster for you, email us within 30 days and we refund the full amount — no exit interview, no fine print, no hard feelings.",
        items: [
          { icon: "timer", title: "30-day window", body: "Counted from your first launch" },
          { icon: "headphones", title: "Human replies", body: "Support answers within a day" },
          { icon: "unlock", title: "Leave anytime", body: "Export your pages on the way out" },
        ],
      },
    },
  ],
  offer: [
    {
      id: "offer-card",
      name: "Classic offer card",
      description: "Centered price card — urgency badge, strikethrough anchor price, checklist.",
      meta: "card · checklist",
      patch: {},
    },
    {
      id: "offer-flash",
      name: "Flash sale",
      description: "48-hour countdown, half-price anchor and a hard CTA — peak urgency.",
      meta: "card · countdown",
      patch: {
        title: "48-hour flash sale",
        subtitle: "Everything in the toolbox, half the price",
        badge: "Ends tonight",
        price: "$49",
        originalPrice: "$99",
        period: "One-time payment",
        savingsLabel: "Save 50%",
        countdownPrefix: "Price doubles in",
        features: [
          "All 20 section types unlocked",
          "Standalone HTML export",
          "A/B testing with auto-winner",
          "12 months of updates",
        ],
        cta: { label: "Get the flash deal", href: "#cta" },
        deadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        trust: [
          { icon: "lock", label: "Secure checkout" },
          { icon: "timer", label: "Instant delivery" },
          { icon: "shield-check", label: "14-day refund" },
        ],
      },
    },
    {
      id: "offer-split",
      name: "Split offer",
      description: "Copy and countdown left, compact price card right — for longer pitches.",
      meta: "split · editorial",
      patch: {
        style: "split",
        title: "Founding member deal",
        subtitle: "Lock the launch price before the public release",
        badge: "First 100 seats",
        price: "$29",
        originalPrice: "$79",
        period: "/mo — locked forever",
        savingsLabel: "Save 63%",
        countdownPrefix: "Founding price expires in",
        features: [
          "Everything in Pro, forever",
          "Quarterly strategy call",
          "Private community access",
          "Vote on the roadmap",
        ],
        cta: { label: "Become a founding member", href: "#cta" },
        trust: [
          { icon: "unlock", label: "Cancel anytime" },
          { icon: "life-buoy", label: "Human support" },
        ],
      },
    },
  ],
  contact: [
    {
      id: "contact-general",
      name: "General inquiry",
      description: "Name, email, message — replies within a business day.",
      meta: "3 fields",
      patch: {},
    },
    {
      id: "contact-demo",
      name: "Book a demo",
      description: "Company and team-size fields for sales qualification.",
      meta: "5 fields · sales-ready",
      patch: {
        title: "Book a live demo",
        subtitle: "30 minutes, tailored to your stack. No slides, promise.",
        email: "sales@example.com",
        phone: "+1 (555) 010-2030",
        fields: ["Your name", "Work email", "Company", "Team size", "What do you want to see?"],
        submitLabel: "Request demo",
      },
    },
  ],
  "cta-final": [
    {
      id: "cta-free",
      name: "Start free",
      description: "Reassurance note + trial CTA. The gentle closer.",
      meta: "trial CTA",
      patch: {},
    },
    {
      id: "cta-demo",
      name: "Book a demo",
      description: "Consultative close for higher-ticket offers.",
      meta: "demo CTA",
      patch: {
        headline: "See it on your own pages.",
        sub: "A 30-minute walkthrough with your team's real content — or keep exploring on your own.",
        cta: { label: "Book a demo", href: "#contact" },
        note: "No slides. No pressure. Bring questions.",
      },
    },
    {
      id: "cta-launch",
      name: "Launch urgency",
      description: "Countdown-flavored close for launches and drops.",
      meta: "urgency CTA",
      patch: {
        headline: "Launch pricing ends Friday.",
        sub: "Founding-user pricing is locked for the first 500 teams. After that, it's public list price.",
        cta: { label: "Claim founding price", href: "#pricing" },
        note: "30-day money-back guarantee, no questions asked",
      },
    },
  ],
  footer: [
    {
      id: "footer-mega",
      name: "Mega footer",
      description: "Three link groups, socials, copyright — the full closer.",
      meta: "mega · 3 groups",
      patch: {},
    },
    {
      id: "footer-minimal",
      name: "Minimal footer",
      description: "One line: brand, copyright, a couple of links.",
      meta: "minimal · 1 row",
      patch: {
        style: "minimal",
        tagline: "",
        linkGroups: [
          {
            group: "",
            items: [
              { label: "Privacy", href: "#" },
              { label: "Terms", href: "#" },
              { label: "Contact", href: "#contact" },
            ],
          },
        ],
        socialLinks: [{ platform: "X", url: "" }],
        copyright: "© 2025 — all rights reserved",
      },
    },
    {
      id: "footer-newsletter",
      name: "Newsletter footer",
      description: "Email capture built into the footer — quiet growth loop.",
      meta: "newsletter · signup form",
      patch: {
        style: "newsletter",
        tagline: "One email a month. Landing-page teardowns, no fluff.",
        socialLinks: [
          { platform: "X", url: "" },
          { platform: "GitHub", url: "" },
        ],
        copyright: "© 2025 — all rights reserved",
      },
    },
  ],
}

/** Total pack count (for the "30+ templates" story). */
export const CONTENT_PACK_COUNT = Object.values(CONTENT_PACKS).reduce((n, packs) => n + packs.length, 0)
