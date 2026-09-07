// ─────────────────────────────────────────────────────────────────────────────
// Real estate template — The Alder House property launch (concept listing)
//
// A listing-shaped property page: countdown announcement → hero carousel →
// property stats → features → the numbers → neighborhood story → photo tour →
// comparison → offer-review card (live countdown) → buyer testimonials →
// agency promise → FAQ → private-tour booking → final CTA → footer.
//
// Fresh object graph per call; rolling offer-review deadline. Demo content —
// the property and brokerage are fictional.
// ─────────────────────────────────────────────────────────────────────────────
import type { LandingConfig } from "./types"

/** Offer-review window shared by the announcement bar and the offer card:
 *  ~6 days out, pinned to 17:00 UTC (a sensible mid-afternoon review time). */
function reviewDeadline(): string {
  const d = new Date(Date.now() + 6 * 86_400_000)
  d.setUTCHours(17, 0, 0, 0)
  return d.toISOString()
}

const HERO_IMAGE = "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/be23ed9b7ee3.jpg"
const HERO_SLIDE_2 = "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/a9e19619c8b1.jpg"
const HERO_SLIDE_3 = "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/073117dc75f0.jpg"
const TOUR_IMAGES = [
  { src: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/dcedff8c9d17.jpg", caption: "Great room — west light" },
  { src: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/7ab5b5e64dbe.jpg", caption: "Beamed sitting room" },
  { src: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/239d8ac117fa.jpg", caption: "Vaulted reading nook" },
  { src: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/5d643b9643bc.jpg", caption: "Family room" },
  { src: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/f71bcebdb533.jpg", caption: "Primary lounge" },
  { src: HERO_SLIDE_2, caption: "Pool & terrace, south-facing" },
]

/** Build the full property config — fresh object graph per call. */
export function buildRealEstateLaunch(): LandingConfig {
  const deadline = reviewDeadline()
  return {
    version: 1,
    brand: {
      name: "The Alder House",
      tagline: "Cedar Ridge's quiet modern.",
      font: "g-playfair",
    },
    themeId: "ocean",
    seo: {
      title: "The Alder House — 4-bed modern on 0.6 acres, Cedar Ridge · $1.295M",
      description:
        "New to market: a 2019-built four-bedroom modern with pool, solar and a detached studio, twelve minutes from downtown Cedar Ridge. Pre-inspected, flexible closing, offer review begins soon — book a private tour.",
      keywords:
        "houses for sale, Cedar Ridge real estate, modern house, 4 bedroom, property listing, real estate, open house",
      ogImage: HERO_IMAGE,
    },
    sections: [
      {
        id: "alder-announcement",
        type: "announcement",
        style: "countdown",
        message: "NEW TO MARKET — offer review begins in",
        deadline,
        link: { label: "Book a private tour", href: "#contact" },
      },
      {
        id: "alder-navbar",
        type: "navbar",
        links: [
          { label: "The House", href: "#features" },
          { label: "Photo tour", href: "#gallery" },
          { label: "Neighborhood", href: "#story" },
          { label: "FAQ", href: "#faq" },
        ],
        cta: { label: "Book a tour", href: "#contact" },
      },
      {
        id: "alder-hero",
        type: "hero",
        layout: "split-right",
        badge: "NEW TO MARKET · $1,295,000",
        headline: "The Alder House.",
        sub: "A 2019-built four-bedroom modern on 0.6 quiet acres in Cedar Ridge: pool, solar, a detached studio, and twelve minutes to downtown. Pre-inspected, flexible closing, and the kind of natural light listing photos undersell.",
        cta: { label: "Book a private tour", href: "#contact" },
        secondaryCta: { label: "Take the photo tour", href: "#gallery" },
        image: HERO_IMAGE,
        images: [HERO_SLIDE_2, HERO_SLIDE_3],
        carousel: "slide",
        carouselInterval: 5,
        stats: [
          { value: "4 bd", label: "plus detached studio" },
          { value: "3.5 ba", label: "two en-suite" },
          { value: "3,840", label: "sq ft finished" },
        ],
      },
      {
        id: "alder-features",
        type: "features",
        title: "The house, room by room.",
        subtitle: "What $1.295M buys on Alder Lane.",
        style: "grid",
        columns: 3,
        items: [
          {
            icon: "flame",
            title: "Chef's kitchen",
            body: "36-inch range, double oven, quartz island seating six — and a walk-in pantry the floor plan doesn't advertise.",
          },
          {
            icon: "sun",
            title: "Solar + battery",
            body: "9.6 kW array with whole-home backup. Last year's net electricity bill: $118. Total.",
          },
          {
            icon: "sparkles",
            title: "Primary suite",
            body: "West-facing, walk-in wardrobe, double vanity and a wet room with a soaker tub built for two.",
          },
          {
            icon: "briefcase",
            title: "Detached studio",
            body: "220 sq ft, heated, fiber-connected. Currently a writing room; previously rented as a design studio.",
          },
          {
            icon: "gauge",
            title: "Pool & terrace",
            body: "Saltwater, south-facing, auto-cover. Lined with mature hornbeam for privacy without shade.",
          },
          {
            icon: "lightbulb",
            title: "Smart throughout",
            body: "Lutron lighting, zoned climate, security with cameras — all on a local hub, no cloud dependency.",
          },
        ],
      },
      {
        id: "alder-stats",
        type: "stats",
        title: "By the numbers.",
        items: [
          { value: "2019", label: "year built, permits on file", delta: "one owner since" },
          { value: "0.6", label: "acres, fully fenced", delta: "mature planting" },
          { value: "$336", label: "price per finished sq ft", delta: "below area median" },
          { value: "12 min", label: "to downtown Cedar Ridge", delta: "off-peak, measured" },
        ],
      },
      {
        id: "alder-story",
        type: "about",
        anchor: "story",
        title: "Cedar Ridge, the neighborhood.",
        subtitle: "Why the street matters as much as the house.",
        style: "mission",
        body: "Alder Lane sits in the older, quieter pocket of Cedar Ridge — the side with tree canopy, 40 km/h streets, and a morning bakery you can walk to. The schools are the district's most consistent performers, the trail network opens two blocks north, and the express bus reaches downtown in fourteen minutes. The current owners chose the street for the same reason most neighbours do: it stays quiet while staying close.",
        items: [
          { title: "9/10", body: "Cedar Ridge Elementary, walkable rating" },
          { title: "2 blocks", body: "to the Ridge trail network (23 km)" },
          { title: "14 min", body: "express bus to the downtown core" },
        ],
        founder: { name: "Elena Marsh", role: "Listing agent, Harbor & Vine Realty" },
      },
      {
        id: "alder-gallery",
        type: "gallery",
        title: "The photo tour.",
        subtitle: "Shot last week, nothing staged.",
        style: "masonry",
        items: TOUR_IMAGES.map((t) => ({ src: t.src, alt: t.caption, caption: t.caption })),
      },
      {
        id: "alder-compare",
        type: "comparison",
        title: "The Alder House vs. the area median.",
        subtitle: "Same price band, twelve current comparables.",
        style: "table",
        usLabel: "The Alder House",
        themLabel: "Area median",
        rows: [
          { feature: "Price per finished sq ft", us: "$336", them: "$381" },
          { feature: "Lot size", us: "0.6 acres", them: "0.31 acres" },
          { feature: "Year built", us: "2019", them: "1988" },
          { feature: "Solar + battery", us: "Included, owned", them: "Rare in band" },
          { feature: "Pre-inspection", us: "Complete, on file", them: "Not provided" },
        ],
        note: "Comparables: 12 active listings within 0.5 mi and 5% of list price, Sept 2026.",
      },
      {
        id: "alder-offer",
        type: "offer",
        title: "Offer review — the process",
        subtitle: "Transparent, structured, and unhurried.",
        badge: "PRE-INSPECTED",
        price: "$1,295,000",
        originalPrice: "$1,349,000",
        period: "list price · below comparables",
        savingsLabel: "Priced under band",
        countdownPrefix: "Review window opens in",
        deadline,
        features: [
          "Full pre-inspection report, structural + mechanical",
          "Flexible closing: 14 to 90 days",
          "Detached studio included in lot plan",
          "Solar system transfers owned, not leased",
          "Survey, permits and title package ready",
        ],
        cta: { label: "Book a private tour", href: "#contact" },
        trust: [
          { icon: "lock", label: "Secure document room" },
          { icon: "map", label: "Neighborhood guide PDF" },
          { icon: "timer", label: "All offers answered in 48h" },
        ],
        style: "card",
      },
      {
        id: "alder-testimonials",
        type: "testimonials",
        title: "Buyers who went before you.",
        subtitle: "Two years of Harbor & Vine in Cedar Ridge.",
        style: "grid",
        items: [
          {
            quote:
              "Elena found us the house we lost twice before — off-market, fairly priced, pre-inspected. The document room meant no surprises at closing. Nine days from tour to accepted offer.",
            author: "Priya & Sam Nolan",
            role: "Bought on Alder Lane, 2024",
            initials: "PN",
            rating: 5,
          },
          {
            quote:
              "We were first-time buyers drowning in comparables. The structured review process told us exactly what to offer and why. We never once felt rushed or out-levered.",
            author: "Marcus Chettiar",
            role: "Bought in Cedar Ridge, 2025",
            initials: "MC",
            rating: 5,
          },
          {
            quote:
              "Sold with Harbor & Vine, then bought with them a year later. Same transparency both directions: every offer timestamped, every counter explained, nothing theatrical.",
            author: "Josephine Arel",
            role: "Two transactions, 2024–25",
            initials: "JA",
            rating: 5,
          },
        ],
      },
      {
        id: "alder-guarantee",
        type: "guarantee",
        title: "The Harbor & Vine promise",
        subtitle: "How this listing is run.",
        body: "Every offer is answered within 48 hours of the review window opening — accepted, countered, or declined with a written reason. The document room holds the inspection, survey, permits and title package from day one, so your diligence starts before your offer. And the listing price is the price the sellers will close at: no auction theatre, no repricing after interest.",
        style: "card",
        items: [
          { icon: "handshake", title: "48-hour answers", body: "Every offer, every time." },
          { icon: "file", title: "Open document room", body: "Inspection to title, day one." },
          { icon: "badge-check", title: "One honest price", body: "The list is the close." },
        ],
      },
      {
        id: "alder-faq",
        type: "faq",
        title: "Frequently asked questions",
        subtitle: "The practical ones, answered.",
        style: "accordion",
        items: [
          {
            q: "Are there HOA fees?",
            a: "No formal HOA. Alder Lane shares a voluntary road-maintenance agreement of about $600 per household per year — the only recurring obligation, and it covers snow clearing too.",
          },
          {
            q: "What are the annual taxes?",
            a: "Last year's property tax was $11,240 on the improved assessment. The studio is already included in that figure, so there's no reassessment surprise pending.",
          },
          {
            q: "How does the offer review work?",
            a: "Offers are accepted until the review window opens, then every offer is answered within 48 hours — accepted, countered, or declined with a written reason. The pre-inspection and title package are available before you offer, so your diligence is done up front.",
          },
          {
            q: "Financing — anything to know?",
            a: "The property qualifies for conventional and jumbo products as-is. A local lender's underwriter has already reviewed the inspection report, and a commitment letter from a prior offer is available for reference.",
          },
          {
            q: "Can the studio be rented out?",
            a: "Yes — Cedar Ridge's zoning permits accessory dwelling use with a simple registration. The previous owner rented it as a design studio for two years without issue.",
          },
        ],
      },
      {
        id: "alder-contact",
        type: "contact",
        title: "Book your private tour",
        subtitle: "Tours run mornings and late afternoons — bring the people who get a vote.",
        style: "split",
        email: "elena@harborvine.example",
        phone: "+1 (555) 010-8842",
        fields: ["Your name", "Email address", "Preferred tour window (day + time)"],
        submitLabel: "Request a tour",
      },
      {
        id: "alder-cta",
        type: "cta-final",
        headline: "The light changes everything.",
        sub: "Photos undersell it — the west-facing great room at 6 p.m. is the reason people write offers here. Book a tour before the review window opens.",
        cta: { label: "Book a private tour", href: "#contact" },
        note: "Pre-inspected · 48-hour offer answers · Flexible closing",
      },
      {
        id: "alder-footer",
        type: "footer",
        style: "mega",
        tagline: "Listed by Harbor & Vine Realty — Cedar Ridge's quiet brokerage.",
        linkGroups: [
          {
            group: "The House",
            items: [
              { label: "Features", href: "#features" },
              { label: "Photo tour", href: "#gallery" },
              { label: "Comparables", href: "#comparison" },
            ],
          },
          {
            group: "The Process",
            items: [
              { label: "Offer review", href: "#offer" },
              { label: "FAQ", href: "#faq" },
              { label: "Book a tour", href: "#contact" },
            ],
          },
          {
            group: "Legal",
            items: [
              { label: "Privacy", href: "#" },
              { label: "Terms", href: "#" },
              { label: "Fair Housing", href: "#" },
            ],
          },
        ],
        socialLinks: [
          { platform: "Instagram", url: "https://www.instagram.com/" },
          { platform: "X", url: "https://x.com/" },
        ],
        copyright: "Concept listing built with Forge Studio — The Alder House and Harbor & Vine Realty are fictional.",
      },
    ],
  }
}
