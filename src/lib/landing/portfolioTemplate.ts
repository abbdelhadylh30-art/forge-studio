// ─────────────────────────────────────────────────────────────────────────────
// Portfolio template — Mara Osei, brand & digital designer (concept persona)
//
// A services-shaped portfolio page: navbar → hero with work carousel → client
// wall → services grid → selected work gallery → track record stats → story →
// testimonials → engagement pricing → handoff guarantee → FAQ → inquiry form →
// final CTA → footer. Light, calm, editorial.
//
// Fresh object graph per call. Demo content — Mara Osei is fictional.
// ─────────────────────────────────────────────────────────────────────────────
import type { LandingConfig } from "./types"

const HERO_IMAGE = "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/860e9ae30dc4.png"
const HERO_SLIDE_2 = "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/605312cb7a4e.jpg"
const HERO_SLIDE_3 = "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d7689d07c282.jpg"
const WORK_IMAGES = [
  { src: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/eef3d8877512.jpg", caption: "Fathom — video platform UI" },
  { src: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/8a0a0a261688.jpg", caption: "Loom & Co — commerce app" },
  { src: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d1a4733888fc.png", caption: "Hillside — brand system" },
  { src: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/4e1c0aad9a30.jpg", caption: "Vercara — corporate site" },
  { src: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/1f2b2f86ae54.jpeg", caption: "Studio Halm — art direction" },
  { src: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d8195ad15b72.jpg", caption: "Brightwell — editorial suite" },
]

/** Build the full portfolio config — fresh object graph per call. */
export function buildPortfolioSite(): LandingConfig {
  return {
    version: 1,
    brand: {
      name: "Mara Osei",
      tagline: "Design that earns its keep.",
      font: "editorial",
    },
    themeId: "slate",
    seo: {
      title: "Mara Osei — Brand & digital designer",
      description:
        "Independent brand and digital designer. Nine years, sixty-plus launches: identity systems, websites and product UI for teams who need design that pays for itself. Booking Q4 2026.",
      keywords:
        "brand designer, digital designer, portfolio, identity systems, web design, product UI, design systems, freelance designer",
      ogImage: HERO_IMAGE,
    },
    sections: [
      {
        id: "mara-navbar",
        type: "navbar",
        links: [
          { label: "Work", href: "#gallery" },
          { label: "Services", href: "#features" },
          { label: "About", href: "#story" },
          { label: "FAQ", href: "#faq" },
        ],
        cta: { label: "Start a project", href: "#contact" },
      },
      {
        id: "mara-hero",
        type: "hero",
        layout: "split-left",
        badge: "Booking Q4 2026 · 2 project slots left",
        headline: "Design that earns its keep.",
        sub: "I'm Mara — I build identity systems, websites and product UI for teams who need the work to pay for itself. Sixty-plus launches in nine years, from seed-stage rebrands to platforms at scale. Every engagement ends with files you own and a system your team can actually run.",
        cta: { label: "Start a project", href: "#contact" },
        secondaryCta: { label: "See the work", href: "#gallery" },
        image: HERO_IMAGE,
        images: [HERO_SLIDE_2, HERO_SLIDE_3],
        carousel: "slide",
        carouselInterval: 5,
        stats: [
          { value: "9 yrs", label: "independent practice" },
          { value: "60+", label: "launches shipped" },
          { value: "48%", label: "median lift on redesign" },
        ],
      },
      {
        id: "mara-logos",
        type: "logos",
        title: "Selected clients",
        items: ["Northwind", "Vercara", "Loom & Co", "Fathom", "Studio Halm", "Brightwell"],
      },
      {
        id: "mara-services",
        type: "features",
        title: "How I can help.",
        subtitle: "Three practices, one standard of care.",
        style: "grid",
        columns: 3,
        items: [
          {
            icon: "palette",
            title: "Brand identity",
            body: "Naming support, logo systems, typography, colour and voice — delivered as a living guideline your team can extend without me in the room.",
          },
          {
            icon: "monitor",
            title: "Websites",
            body: "Marketing sites that load fast and convert: design, build and handover in Next.js, with the CMS your marketers will actually use.",
          },
          {
            icon: "smartphone",
            title: "Product UI",
            body: "Interface design for apps and dashboards — from empty artboard to a component library your engineers can ship from day one.",
          },
          {
            icon: "layers",
            title: "Design systems",
            body: "Token architecture, component specs and documentation. Built to make the tenth feature cheaper than the first.",
          },
          {
            icon: "eye",
            title: "Art direction",
            body: "Campaign visuals, photography direction and editorial layouts — for launches that need to look considered, not assembled.",
          },
          {
            icon: "briefcase",
            title: "Embedded support",
            body: "A fixed weekly retainer slot inside your team: reviews, design QA and the unglamorous polish work no one else has time for.",
          },
        ],
      },
      {
        id: "mara-gallery",
        type: "gallery",
        title: "Selected work.",
        subtitle: "Six engagements, six different problems.",
        style: "masonry",
        items: WORK_IMAGES.map((w) => ({ src: w.src, alt: w.caption, caption: w.caption })),
      },
      {
        id: "mara-stats",
        type: "stats",
        title: "The track record.",
        items: [
          { value: "60+", label: "projects delivered since 2017", delta: "zero abandoned" },
          { value: "48%", label: "median conversion lift, redesigns", delta: "12-month window" },
          { value: "9", label: "years fully independent", delta: "no agency markup" },
          { value: "97%", label: "clients who return or refer", delta: "the metric I watch" },
        ],
      },
      {
        id: "mara-story",
        type: "about",
        anchor: "story",
        title: "Design is a business decision.",
        subtitle: "Why the work looks the way it does.",
        style: "mission",
        body: "I started in-house at a fintech that treated design as decoration — and watched a two-week rebrand pay for itself in a quarter. That arithmetic has guided the practice ever since. I work independently, take two projects at a time so each gets real attention, and price against outcomes rather than hours. Every engagement ends with a handover call, a written system, and files your team owns outright. If the work can't be measured, I'll say so before we start.",
        items: [
          { title: "Two projects", body: "My concurrent maximum. Yours gets real attention." },
          { title: "Fixed scope", body: "Priced against outcomes, not hours logged." },
          { title: "Full handover", body: "Files, systems, and a call to make sure it sticks." },
        ],
        founder: { name: "Mara Osei", role: "Designer & art director" },
      },
      {
        id: "mara-testimonials",
        type: "testimonials",
        title: "Client words.",
        subtitle: "The part I can't design myself.",
        style: "grid",
        items: [
          {
            quote:
              "Mara rebuilt our identity and site in six weeks. Signups rose 41% in the first month and we finally stopped apologising for our own brand. The handover doc is still our team bible.",
            author: "Ines Weber",
            role: "Co-founder, Loom & Co",
            initials: "IW",
            rating: 5,
          },
          {
            quote:
              "The rare designer who asks about the funnel before the font. She shipped a design system our engineers actually adopted — feature velocity is up and onboarding new designers takes days, not weeks.",
            author: "Daniel Okafor",
            role: "VP Product, Fathom",
            initials: "DO",
            rating: 5,
          },
          {
            quote:
              "We came for a logo and left with a positioning. The rebrand carried our Series A deck, our conference booth and our hiring page. Worth every fixed fee.",
            author: "Sofia Marchetti",
            role: "CEO, Vercara",
            initials: "SM",
            rating: 5,
          },
        ],
      },
      {
        id: "mara-pricing",
        type: "pricing",
        title: "Engagements.",
        subtitle: "Fixed scope, fixed price, no hour-counting.",
        plans: [
          {
            name: "Sprint",
            price: "$1,800",
            period: "one week",
            description: "A focused, single deliverable",
            features: ["Landing page design", "Logo refresh", "1 round of revisions", "Async updates", "Files handover"],
            ctaLabel: "Book a sprint",
          },
          {
            name: "Project",
            price: "$6,000",
            period: "4–6 weeks",
            description: "The full engagement",
            features: [
              "Identity or site from the ground up",
              "3 rounds of revisions",
              "Weekly working sessions",
              "Design system + guidelines",
              "Launch support included",
            ],
            highlighted: true,
            ctaLabel: "Start a project",
          },
          {
            name: "Retainer",
            price: "$4,500",
            period: "/month",
            description: "Ongoing partnership",
            features: [
              "Fixed weekly capacity",
              "Embedded in your tooling",
              "Design QA on every release",
              "Quarterly strategy review",
              "Pause any month",
            ],
            ctaLabel: "Check availability",
          },
        ],
      },
      {
        id: "mara-guarantee",
        type: "guarantee",
        title: "The handoff promise",
        subtitle: "You own the work. All of it.",
        body: "Every file, font licence, component and guideline is transferred to your accounts at the end of the engagement — not rented, not hosted on my side. Two weeks of post-handover support is included so the system settles. If your team can't run it after that, I'll train them until they can.",
        style: "card",
        items: [
          { icon: "unlock", title: "Full ownership", body: "Files, licences, repos — yours." },
          { icon: "file", title: "Written guidelines", body: "The system, documented in plain language." },
          { icon: "headphones", title: "14-day support", body: "Post-handover help included." },
        ],
      },
      {
        id: "mara-faq",
        type: "faq",
        title: "Frequently asked questions",
        subtitle: "Before you write.",
        style: "accordion",
        items: [
          {
            q: "What does a typical timeline look like?",
            a: "A Project engagement runs 4–6 weeks: discovery in week one, concepts in week two, refinement after each review, build and handover to close. Sprints are one week by definition — we agree the single deliverable first and guard it fiercely.",
          },
          {
            q: "How do you price?",
            a: "Fixed scope, fixed price. After a discovery call I send a proposal with the deliverables, the rounds of revision and the fee — the number doesn't move unless the scope does. No hourly billing, no surprise invoices.",
          },
          {
            q: "Do you work with early-stage teams?",
            a: "Often — about half my work is seed-stage. The Sprint exists precisely for teams that need one strong asset before raising or launching, without committing to a full engagement.",
          },
          {
            q: "Can you build as well as design?",
            a: "Yes. Websites are delivered as working Next.js builds on your hosting, not just Figma files. For product UI I stay in design but work directly in your component library so engineering never translates.",
          },
          {
            q: "What do you need from me to start?",
            a: "A 30-minute call, access to whatever exists today (brand files, analytics, the last attempt), and one decision-maker who can sign off. That's the whole list.",
          },
        ],
      },
      {
        id: "mara-contact",
        type: "contact",
        title: "Start a project",
        subtitle: "Tell me the problem in two sentences — I reply within one business day.",
        style: "split",
        email: "studio@maraosei.example",
        fields: ["Your name", "Email address", "What are we solving?"],
        submitLabel: "Send inquiry",
      },
      {
        id: "mara-cta",
        type: "cta-final",
        headline: "Two slots left for Q4.",
        sub: "The next engagement window opens in October. Bring a problem worth solving.",
        cta: { label: "Start a project", href: "#contact" },
        note: "Reply within 1 business day · Fixed pricing · Full ownership",
      },
      {
        id: "mara-footer",
        type: "footer",
        style: "mega",
        tagline: "Independent brand & digital design since 2017.",
        linkGroups: [
          {
            group: "Work",
            items: [
              { label: "Selected work", href: "#gallery" },
              { label: "Services", href: "#features" },
              { label: "Engagements", href: "#pricing" },
            ],
          },
          {
            group: "Studio",
            items: [
              { label: "About", href: "#story" },
              { label: "FAQ", href: "#faq" },
              { label: "Contact", href: "#contact" },
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
          { platform: "Instagram", url: "https://www.instagram.com/" },
          { platform: "X", url: "https://x.com/" },
          { platform: "GitHub", url: "https://github.com/" },
        ],
        copyright: "Concept portfolio built with Forge Studio — Mara Osei is a fictional demo persona.",
      },
    ],
  }
}
