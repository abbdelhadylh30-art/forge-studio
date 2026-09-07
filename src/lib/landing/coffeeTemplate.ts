// ─────────────────────────────────────────────────────────────────────────────
// Coffee subscription template — Meridian Roasters (concept brand)
//
// A subscription-shaped D2C page: countdown announcement → hero carousel →
// cafe wall → problem/solution → roastery stats → feature grid → founder story
// → process gallery → comparison → subscription offer (live countdown) →
// testimonials → freshness guarantee → FAQ → start form → final CTA → footer.
//
// Fresh object graph per call; rolling launch-roast deadline. Demo content —
// Meridian Roasters is a fictional roastery.
// ─────────────────────────────────────────────────────────────────────────────
import type { LandingConfig } from "./types"

/** Launch-roast window shared by the announcement bar and the offer card:
 *  ~9 days out, pinned to 23:59 UTC. */
function launchRoastDeadline(): string {
  const d = new Date(Date.now() + 9 * 86_400_000)
  d.setUTCHours(23, 59, 0, 0)
  return d.toISOString()
}

const HERO_IMAGE = "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/6a235f957e95.jpg"
const HERO_SLIDE_2 = "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/8190d9f22eed.jpg"
const HERO_SLIDE_3 = "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/41c42776dbc9.jpg"
const PROCESS_IMAGES = [
  { src: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/f57750064cde.jpeg", caption: "The drum, mid-roast" },
  { src: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/2710c0591fd8.jpg", caption: "Single-origin lots" },
  { src: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/0d765aeb70d6.jpg", caption: "Resting, 48 hours" },
  { src: HERO_SLIDE_2, caption: "Cupping table, every batch" },
  { src: HERO_SLIDE_3, caption: "Your brew, the point of it all" },
  { src: HERO_IMAGE, caption: "The 1962 Probat" },
]

/** Build the full coffee config — fresh object graph per call. */
export function buildCoffeeLaunch(): LandingConfig {
  const deadline = launchRoastDeadline()
  return {
    version: 1,
    brand: {
      name: "Meridian Roasters",
      tagline: "Roasted this week. Not this year.",
      font: "editorial",
    },
    themeId: "gold",
    seo: {
      title: "Meridian Roasters — coffee roasted after you order",
      description:
        "A small-batch coffee subscription: single-origin lots roasted after you order, shipped within 48 hours, 12 rotating origins. Compostable whole-bean or ground to your brewer. First three bags discounted this launch week.",
      keywords:
        "coffee subscription, fresh roasted coffee, single origin, whole bean, specialty coffee, small batch roastery, pour over",
      ogImage: HERO_IMAGE,
    },
    sections: [
      {
        id: "meridian-announcement",
        type: "announcement",
        style: "countdown",
        message: "LAUNCH ROAST — 20% off your first three bags ends in",
        deadline,
        link: { label: "Start your subscription", href: "#offer" },
      },
      {
        id: "meridian-navbar",
        type: "navbar",
        links: [
          { label: "The coffee", href: "#features" },
          { label: "Roastery", href: "#story" },
          { label: "Reviews", href: "#testimonials" },
          { label: "FAQ", href: "#faq" },
        ],
        cta: { label: "Start — $17/mo", href: "#offer" },
      },
      {
        id: "meridian-hero",
        type: "hero",
        layout: "split-right",
        badge: "FRESH CROP · ETHIOPIA + COLOMBIA",
        headline: "Roasted this week. Not this year.",
        sub: "Supermarket coffee was roasted before last Christmas. Meridian roasts your bag after you order it, ships it within 48 hours, and stamps the date on the front. Twelve rotating origins, ground to your brewer, in compostable bags. Cancel whenever — the coffee's too good to need a contract.",
        cta: { label: "Start your subscription — $17/mo", href: "#offer" },
        secondaryCta: { label: "See how it works", href: "#features" },
        image: HERO_IMAGE,
        images: [HERO_SLIDE_2, HERO_SLIDE_3],
        carousel: "fade",
        carouselInterval: 5,
        stats: [
          { value: "48h", label: "roast to your door" },
          { value: "12", label: "rotating origins" },
          { value: "0", label: "contracts, ever" },
        ],
      },
      {
        id: "meridian-logos",
        type: "logos",
        title: "Poured in",
        items: ["Kettle & Co", "Brightside", "Fern Kitchen", "Atlas Bakehouse", "Second Sunrise", "The Daily Press"],
      },
      {
        id: "meridian-problem",
        type: "problem",
        title: "Store coffee is already old.",
        subtitle: "The shelf quietly ruins it before you brew it.",
        style: "grid",
        items: [
          {
            icon: "clock",
            title: "Best-by, not roast-date",
            body: "Supermarket bags print a best-by date nine months out. Coffee is at its peak for four weeks after roasting. The math never worked.",
          },
          {
            icon: "cloud",
            title: "Stale before the first scoop",
            body: "Oxidation starts the moment beans leave the drum. A bag that sat in a warehouse tastes like the warehouse — flat, papery, faintly sad.",
          },
          {
            icon: "flame",
            title: "Burnt to hide the boredom",
            body: "Industrial roasters over-roast so every batch tastes identical. The char isn't a flavour profile — it's a mask.",
          },
        ],
      },
      {
        id: "meridian-solution",
        type: "solution",
        title: "Roasted after you order.",
        subtitle: "Small batches, dated honestly, shipped fast.",
        style: "grid",
        items: [
          {
            icon: "flame",
            title: "Batch of one",
            body: "Your bag drops into a 12 kg drum within hours of your order — profile-matched to the origin, never to a blend quota.",
          },
          {
            icon: "truck",
            title: "48 hours to your door",
            body: "Roasted, rested, ground if you ask, and on a truck within two days. The roast date is stamped on the front, not the bottom.",
          },
          {
            icon: "package",
            title: "Compostable, fitted",
            body: "Kraft bags that compost at home, sized 250 g, and ground to your brewer — espresso to French press, fourteen grind settings.",
          },
        ],
      },
      {
        id: "meridian-stats",
        type: "stats",
        title: "The roastery, honestly measured.",
        items: [
          { value: "12", label: "origins rotating through the year", delta: "3 direct-trade" },
          { value: "9", label: "roasts on the drum each week", delta: "never batched larger" },
          { value: "48h", label: "median roast to doorstep", delta: "tracked per order" },
          { value: "100%", label: "compostable packaging", delta: "home-compostable, tested" },
        ],
      },
      {
        id: "meridian-features",
        type: "features",
        title: "Built around the cup you actually brew.",
        subtitle: "The subscription details that matter.",
        style: "grid",
        columns: 3,
        items: [
          {
            icon: "calendar",
            title: "Your cadence",
            body: "Every 1, 2 or 4 weeks. 250 g or 500 g. Change it in two taps — the coffee adapts to your week, not the reverse.",
          },
          {
            icon: "globe",
            title: "Rotating single origins",
            body: "12 origins across the year — three direct-trade relationships, the rest through importers we've bought from for a decade.",
          },
          {
            icon: "settings",
            title: "Ground to your brewer",
            body: "Espresso, pour-over, drip, French press or Aeropress — fourteen settings, matched by the roaster on duty.",
          },
          {
            icon: "eye",
            title: "Roast date, on the front",
            body: "Every bag carries the roast date in 24-point type and a QR code to that week's cupping notes.",
          },
          {
            icon: "check",
            title: "Pause anytime",
            body: "Travelling, overstocked, cutting caffeine? Pause or cancel from the account page. No retention flows, no guilt screens.",
          },
          {
            icon: "gift",
            title: "Tasting-notes card",
            body: "Each shipment includes a card with the lot's producer, altitude, process and three tasting notes — what to expect and why.",
          },
        ],
      },
      {
        id: "meridian-story",
        type: "about",
        anchor: "story",
        title: "From a garage drum to twelve origins.",
        subtitle: "The roastery's story.",
        style: "mission",
        body: "Meridian started in 2021 with a 1962 Probat drum restored in a rented garage, one Ethiopian lot, and a rule Priya still enforces: nothing ships more than seven days off roast. The first year was forty subscribers and a lot of late nights learning thermoprofiles. Today it's twelve origins, nine roasts a week, and cafes across the city serving the same lots subscribers get — but the rule never moved. Coffee is agricultural, perishable and honest. It deserves a supply chain that acts like it.",
        items: [
          { title: "2021", body: "First drum, first lot, forty subscribers." },
          { title: "12 origins", body: "Three direct-trade, all traceable to the station." },
          { title: "7 days", body: "Absolute maximum from roast to courier." },
        ],
        founder: { name: "Priya Anand", role: "Founder & head roaster" },
      },
      {
        id: "meridian-gallery",
        type: "gallery",
        title: "The process, unglamorous and real.",
        subtitle: "Copper, paper and steam — the whole route.",
        style: "masonry",
        items: PROCESS_IMAGES.map((p) => ({ src: p.src, alt: p.caption, caption: p.caption })),
      },
      {
        id: "meridian-compare",
        type: "comparison",
        title: "Meridian vs. the supermarket bag.",
        subtitle: "Where the difference actually comes from.",
        style: "table",
        usLabel: "Meridian",
        themLabel: "Supermarket",
        rows: [
          { feature: "Roast date", us: "This week, printed on front", them: "Hidden or 9 months old" },
          { feature: "Sourcing", us: "Single lots, traceable", them: "Blended commodities" },
          { feature: "Roast profile", us: "Matched to the origin", them: "One char, all beans" },
          { feature: "Grind", us: "To your brewer, on order", them: "One size, pre-ground" },
          { feature: "Price per cup", us: "$0.68", them: "$0.55 — for stale" },
        ],
        note: "Per-cup math: 250 g bag at ~15 g per pour-over brew.",
      },
      {
        id: "meridian-offer",
        type: "offer",
        title: "The subscription, launch week",
        subtitle: "Everything included, one quiet price.",
        badge: "SAVE 20% ON 3 BAGS",
        price: "$17",
        originalPrice: "$21",
        period: "per 250 g bag, monthly",
        savingsLabel: "Launch week only",
        countdownPrefix: "Launch pricing ends in",
        deadline,
        features: [
          "250 g of single-origin coffee, every 1/2/4 weeks",
          "Roasted after your order, dated on the bag",
          "Ground to your brewer — or whole bean",
          "Compostable kraft packaging",
          "Tasting-notes card with every lot",
          "Pause or cancel in two taps, anytime",
        ],
        cta: { label: "Start your subscription", href: "#contact" },
        trust: [
          { icon: "lock", label: "Pay per shipment" },
          { icon: "truck", label: "Free 48h shipping" },
          { icon: "life-buoy", label: "Freshness guarantee" },
        ],
        style: "card",
      },
      {
        id: "meridian-testimonials",
        type: "testimonials",
        title: "The morning shift.",
        subtitle: "From the subscription's own reviews.",
        style: "grid",
        items: [
          {
            quote:
              "I timed it: the bag landed 41 hours after the roast date. My old supermarket bag was nine months deep and I never knew. The difference isn't subtle — it's the difference between coffee and a memory of coffee.",
            author: "Hannah Ostrowski",
            role: "Subscriber, 14 months",
            initials: "HO",
            rating: 5,
          },
          {
            quote:
              "The tasting-notes card ruined other coffee for me — I can taste the peach thing now. Pause button works exactly as promised: used it twice, no guilt screens, no dark patterns.",
            author: "Dev Anand",
            role: "Subscriber, 9 months",
            initials: "DA",
            rating: 5,
          },
          {
            quote:
              "We ran Meridian at the cafe for a year before I subscribed at home. Same lots, same drum, same honest dates. If your customers ask what fresh means, hand them a bag.",
            author: "Louis Ferrand",
            role: "Owner, Kettle & Co",
            initials: "LF",
            rating: 5,
          },
        ],
      },
      {
        id: "meridian-guarantee",
        type: "guarantee",
        title: "The freshness guarantee",
        subtitle: "Stale coffee is our defect, not your problem.",
        body: "If a bag ever arrives past its peak — or just doesn't taste like the card promised — we replace it on the next roast, no photo evidence, no interrogation. Coffee is agricultural and occasionally a lot misses; a roastery that never admits that is hiding its cupping table. Subscriptions are per-shipment with no lock-in: pause it, skip it, or cancel it from the account page in two taps.",
        style: "seals",
        items: [
          { icon: "badge-check", title: "Free replacement", body: "Any bag past its peak." },
          { icon: "unlock", title: "No lock-in", body: "Cancel in two taps." },
          { icon: "truck", title: "48h freshness pledge", body: "Roast to courier, tracked." },
        ],
      },
      {
        id: "meridian-faq",
        type: "faq",
        title: "Frequently asked questions",
        subtitle: "Before the first bag.",
        style: "accordion",
        items: [
          {
            q: "Whole bean or ground?",
            a: "Your choice, changeable per shipment. If you grind at home, whole bean stays fresh longer; if you don't, we match the grind to your brewer — tell us the machine, we know the setting.",
          },
          {
            q: "How do I pick a cadence?",
            a: "Start with one 250 g bag every two weeks — that's a cup a day. Most people move to weekly or 500 g after the first month; your account page changes it in two taps and takes effect immediately.",
          },
          {
            q: "What if I don't like the origin that month?",
            a: "Every lot page lets you swap the month's pick for a standing favourite, and the tasting-notes card arrives before the next cycle so you always know what's coming.",
          },
          {
            q: "Can I pause or cancel?",
            a: "Yes — pause for 1 to 12 weeks or cancel outright, both from the account page, both in two taps. There is no retention flow and no phone call. The coffee's good enough to keep you; nothing else should.",
          },
          {
            q: "How fresh is 'fresh', exactly?",
            a: "Your bag is roasted within hours of the order, rests 24–48 hours to de-gas, and ships the day after that. The roast date is printed on the front in 24-point type — check it against the postmark.",
          },
        ],
      },
      {
        id: "meridian-contact",
        type: "contact",
        title: "Start your subscription",
        subtitle: "Tell us your brewer — the first bag ships on the next roast, within 48 hours.",
        style: "split",
        email: "hello@meridianroasters.example",
        fields: ["Your name", "Email address", "Your brewer (pour-over, espresso, drip…)"],
        submitLabel: "Start — $17/mo",
      },
      {
        id: "meridian-cta",
        type: "cta-final",
        headline: "Coffee this week. Not this year.",
        sub: "Launch pricing ends when the timer does. The next drum fires either way — the only question is whether your name's on it.",
        cta: { label: "Start — $17/mo", href: "#offer" },
        note: "Roasted after you order · 48h shipping · Cancel anytime",
      },
      {
        id: "meridian-footer",
        type: "footer",
        style: "mega",
        tagline: "Small-batch coffee, roasted after you order.",
        linkGroups: [
          {
            group: "Coffee",
            items: [
              { label: "The subscription", href: "#offer" },
              { label: "Features", href: "#features" },
              { label: "Compare", href: "#comparison" },
            ],
          },
          {
            group: "Roastery",
            items: [
              { label: "Our story", href: "#story" },
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
          { platform: "YouTube", url: "https://www.youtube.com/" },
        ],
        copyright: "Concept coffee page built with Forge Studio — Meridian Roasters is a fictional demo brand.",
      },
    ],
  }
}
