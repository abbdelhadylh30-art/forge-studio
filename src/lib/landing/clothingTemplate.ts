// ─────────────────────────────────────────────────────────────────────────────
// Apparel template — NORTHFORM heavyweight essentials (concept brand)
//
// A conversion-shaped clothing drop page: countdown announcement → hero
// carousel → problem/solution → fabric stats → feature grid → founder story →
// lookbook gallery → comparison → drop-bundle offer (live countdown) →
// testimonials → repair guarantee → FAQ → waitlist form → final CTA → footer.
//
// Fresh object graph per call; rolling drop deadline stays live. Demo content
// only — NORTHFORM is a fictional label.
// ─────────────────────────────────────────────────────────────────────────────
import type { LandingConfig } from "./types"

/** Drop window target shared by the announcement bar and the offer card:
 *  ~5 days out, pinned to 23:59 UTC. */
function dropDeadline(): string {
  const d = new Date(Date.now() + 5 * 86_400_000)
  d.setUTCHours(23, 59, 0, 0)
  return d.toISOString()
}

const HERO_IMAGE = "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/ad53d2f6247a.jpg"
const HERO_SLIDE_2 = "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/c05860318aed.jpg"
const HERO_SLIDE_3 = "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/5a6d414c6c99.jpg"
const GALLERY_IMAGES = [
  { src: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/ec585391a419.jpg", caption: "Sherpa — 480 gsm" },
  { src: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/f2ec742ddd9e.jpg", caption: "Loopback interior" },
  { src: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/ced9c4052a54.webp", caption: "Garment-dyed fleece" },
  { src: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/cf0beac2ae09.jpg", caption: "The rail, ready to ship" },
  { src: "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/256dfe6a110a.jpg", caption: "Knit program — FW26" },
  { src: HERO_IMAGE, caption: "FW26 campaign, shot on location" },
]

/** Build the full NORTHFORM apparel config — fresh object graph per call. */
export function buildClothingLaunch(): LandingConfig {
  const deadline = dropDeadline()
  return {
    version: 1,
    brand: {
      name: "NORTHFORM",
      tagline: "Wear it out. We'll bring it back.",
      mode: "dark",
      font: "g-grotesk",
    },
    themeId: "mono",
    seo: {
      title: "NORTHFORM — Heavyweight essentials, repaired for life",
      description:
        "FW26 Drop 01: 500 gsm loopback cotton hoodie, garment-dyed and built to outlast trends. Free lifetime repairs, traceable mills, small batches. Reserve the drop bundle before the window closes.",
      keywords:
        "heavyweight hoodie, 500 gsm, loopback cotton, slow fashion, repair for life, sustainable apparel, FW26 drop",
      ogImage: HERO_IMAGE,
    },
    sections: [
      {
        id: "northform-announcement",
        type: "announcement",
        style: "countdown",
        message: "FW26 DROP 01 — the drop bundle closes in",
        deadline,
        link: { label: "Reserve yours", href: "#offer" },
      },
      {
        id: "northform-navbar",
        type: "navbar",
        links: [
          { label: "Lookbook", href: "#gallery" },
          { label: "Fabric", href: "#features" },
          { label: "Repairs", href: "#guarantee" },
          { label: "FAQ", href: "#faq" },
        ],
        cta: { label: "Reserve — $88", href: "#offer" },
      },
      {
        id: "northform-hero",
        type: "hero",
        layout: "split-right",
        badge: "FW26 · DROP 01 · 1,000 UNITS",
        headline: "Built to be worn out.",
        sub: "A 500 gsm loopback hoodie that shrugs off a decade of washes, a garage workshop, and whatever else your week contains. Repaired free, forever. Made in runs of a thousand, never more.",
        cta: { label: "Reserve the bundle — $88", href: "#offer" },
        secondaryCta: { label: "See the fabric", href: "#features" },
        image: HERO_IMAGE,
        images: [HERO_SLIDE_2, HERO_SLIDE_3],
        carousel: "fade",
        carouselInterval: 5,
        stats: [
          { value: "500", label: "gsm loopback cotton" },
          { value: "30+", label: "washes, shape held" },
          { value: "0", label: "repair bills — ever" },
        ],
      },
      {
        id: "northform-logos",
        type: "logos",
        title: "Seen in",
        items: ["Hypebeast", "GQ", "Highsnobiety", "Dazed", "Monocle", "Vogue"],
      },
      {
        id: "northform-problem",
        type: "problem",
        title: "Fast fashion is designed to be replaced.",
        subtitle: "Three ways a $40 hoodie costs you more than it looks.",
        style: "grid",
        items: [
          {
            icon: "alert",
            title: "Fades by wash ten",
            body: "Thin 180 gsm fleece pills, greys, and surrenders its shape long before you've paid it off. The bargain was never one.",
          },
          {
            icon: "clock",
            title: "Chased by drop cycles",
            body: "Six-week trends train you to buy again before the last one wears out. Your closet becomes a subscription you never chose.",
          },
          {
            icon: "cloud",
            title: "Falls apart at the seams",
            body: "Single-stitched hems and plastic drawcords give up within a season — and the brand that sold them already moved on.",
          },
        ],
      },
      {
        id: "northform-solution",
        type: "solution",
        title: "One hoodie. A decade, minimum.",
        subtitle: "Built like outerwear, priced like a favourite.",
        style: "grid",
        items: [
          {
            icon: "layers",
            title: "500 gsm loopback",
            body: "Dense, garment-dyed loopback cotton that softens with wear instead of thinning. The same mill since 2019.",
          },
          {
            icon: "check",
            title: "Triple-stitched everywhere",
            body: "Every stress point — hood, cuffs, hem, pockets — is chain-stitched three times. Rip it and we'll show you where.",
          },
          {
            icon: "settings",
            title: "Repaired free, forever",
            body: "Blown zipper, torn pocket, chewed drawcord — send it back and it returns repaired, pressed, and ready for another year.",
          },
        ],
      },
      {
        id: "northform-stats",
        type: "stats",
        title: "The numbers behind the garment.",
        items: [
          { value: "500", label: "gsm, garment-dyed loopback", delta: "2.7× industry standard" },
          { value: "1,000", label: "units per drop, never restocked", delta: "small batches by design" },
          { value: "30+", label: "wash cycles, shape retained", delta: "lab-tested, twice" },
          { value: "3,214", label: "repairs completed to date", delta: "free, since 2019" },
        ],
      },
      {
        id: "northform-features",
        type: "features",
        title: "Every detail earns its stitching.",
        subtitle: "What 500 gsm actually buys you.",
        style: "grid",
        columns: 3,
        items: [
          {
            icon: "layers",
            title: "Weight that wears in",
            body: "Heavy loopback cotton settles into your shape after two weeks and stays there. No sag, no bobbling, no retreat.",
          },
          {
            icon: "check",
            title: "Garment-dyed colour",
            body: "Dyed after construction, so the colour saturates the seams — and fades evenly instead of patchy.",
          },
          {
            icon: "fingerprint",
            title: "Traceable to the mill",
            body: "Every drop lists its mill, its yarn count, and its water usage on the inside label. Scan it, see it.",
          },
          {
            icon: "settings",
            title: "Reinforced everything",
            body: "Bar-tacked pockets, metal tipped drawcords, a two-way YKK zip. The parts that fail first, built last.",
          },
          {
            icon: "users",
            title: "Size-inclusive cut",
            body: "Graded XS–4XL on a 6'2” and a 5'4” fit model. Both approved it before production signed off.",
          },
          {
            icon: "heart",
            title: "Repaired for life",
            body: "Register your garment once. After that, repairs are free, shipping included, for as long as you own it.",
          },
        ],
      },
      {
        id: "northform-story",
        type: "about",
        anchor: "story",
        title: "We started with a bin of dead hoodies.",
        subtitle: "The story behind the weight.",
        style: "mission",
        body: "In 2019, Jonas Feld collected forty hoodies from friends — every one of them thinner than the year it was bought. He took them apart on a workshop table, measured what survived and what didn't, and found the pattern: the fabric that lasted was heavier, denser, and boring to market. So NORTHFORM was built on the unglamorous side of clothing — grams per square metre, stitch counts, repair benches. We drop a thousand units twice a year, repair everything we've ever sold, and refuse to make it interesting any other way.",
        items: [
          { title: "One mill", body: "Family-run in Portugal, audited yearly, same yarn since drop one." },
          { title: "Two drops", body: "1,000 units each, never restocked. Scarcity is honesty, not marketing." },
          { title: "Forever repairs", body: "3,214 garments mended — the number is on the wall of the workshop." },
        ],
        founder: { name: "Jonas Feld", role: "Founder & head of fabric" },
      },
      {
        id: "northform-gallery",
        type: "gallery",
        title: "The lookbook.",
        subtitle: "FW26, shot on the people who test it.",
        style: "masonry",
        items: GALLERY_IMAGES.map((g) => ({
          src: g.src,
          alt: g.caption,
          caption: g.caption,
        })),
      },
      {
        id: "northform-compare",
        type: "comparison",
        title: "NORTHFORM vs. the $40 hoodie.",
        subtitle: "Cost per wear tells the truth.",
        style: "table",
        usLabel: "NORTHFORM",
        themLabel: "Fast fashion",
        rows: [
          { feature: "Fabric weight", us: "500 gsm loopback", them: "180 gsm fleece" },
          { feature: "Washes to visible aging", us: "30+", them: "8–10" },
          { feature: "Repairs", us: "Free, forever", them: "None — rebuy" },
          { feature: "Batch size", us: "1,000, never restocked", them: "Endless restocks" },
          { feature: "Cost per year of wear", us: "~$29", them: "~$96" },
        ],
        note: "Cost-per-wear based on 3-year ownership, average weekly wear.",
      },
      {
        id: "northform-offer",
        type: "offer",
        title: "The FW26 drop bundle",
        subtitle: "Everything from Drop 01, one price, first production run.",
        badge: "SAVE $24",
        price: "$88",
        originalPrice: "$112",
        period: "one-time",
        savingsLabel: "Drop window only",
        countdownPrefix: "Bundle price ends in",
        deadline,
        features: [
          "500 gsm loopback hoodie, garment-dyed",
          "Heavyweight tee — the same mill, 240 gsm",
          "Spare drawcords + repair patch kit",
          "Lifetime repair registration",
          "Numbered edition card (1–1,000)",
        ],
        cta: { label: "Reserve the bundle", href: "#contact" },
        trust: [
          { icon: "lock", label: "Pay when it ships" },
          { icon: "truck", label: "Free carbon-offset shipping" },
          { icon: "life-buoy", label: "60-day returns, no questions" },
        ],
        style: "card",
      },
      {
        id: "northform-testimonials",
        type: "testimonials",
        title: "Worn hard. Still here.",
        subtitle: "From the repair bench's own records.",
        style: "grid",
        items: [
          {
            quote:
              "Four winters, two house moves, one dog. The repair bench re-hemmed a cuff last spring and it came back looking intentional. Best £/wear object I own.",
            author: "Tomas Lindqvist",
            role: "Carpenter, Gothenburg",
            initials: "TL",
            rating: 5,
          },
          {
            quote:
              "I bought it sceptical of the weight thing — then measured my old hoodie against it. This one is 2.7 times denser and it shows after every wash.",
            author: "Renée Baptiste",
            role: "Illustrator",
            initials: "RB",
            rating: 5,
          },
          {
            quote:
              "Dropped mine in a campfire ring. Melted a hole the size of a coin. Repaired free in nine days. I've stopped buying other hoodies entirely.",
            author: "Owen Whitaker",
            role: "Trail guide",
            initials: "OW",
            rating: 5,
          },
        ],
      },
      {
        id: "northform-guarantee",
        type: "guarantee",
        title: "The repair-for-life promise",
        subtitle: "The receipt is the contract.",
        body: "Every NORTHFORM garment is registered at purchase and repairable for as long as you own it — zips, cuffs, hems, drawcords, lining. If we can't repair it, we replace it from the next drop at no charge. That promise is printed on the care label, because it should outlive the marketing.",
        style: "seals",
        items: [
          { icon: "settings", title: "Free repairs", body: "Forever, shipping included." },
          { icon: "timer", title: "9-day turnaround", body: "Median bench time, door to door." },
          { icon: "life-buoy", title: "Replace-if-unfixable", body: "Next drop, no charge." },
        ],
      },
      {
        id: "northform-faq",
        type: "faq",
        title: "Frequently asked questions",
        subtitle: "Before you reserve.",
        style: "accordion",
        items: [
          {
            q: "How does the sizing run?",
            a: "True to size with a relaxed shoulder. If you're between sizes and want a fitted look, size down once — the loopback has enough structure to hold the line.",
          },
          {
            q: "What happens when the drop sells out?",
            a: "It's gone — 1,000 units per drop, never restocked. Reservations made inside the drop window are honoured even if the run finishes after you order.",
          },
          {
            q: "How do repairs actually work?",
            a: "Register the garment once (the tag has a QR code). Then just mail it in or drop it at a partner tailor — repairs are free, shipping is prepaid, and the median turnaround is nine days.",
          },
          {
            q: "How should I wash it?",
            a: "Cold wash, inside out, hang dry. The colour is garment-dyed and settled — it will fade slowly and evenly for years, which is the intended look.",
          },
          {
            q: "Can I return it?",
            a: "Yes — 60 days, unworn, full refund including shipping. If you've worn it and it hasn't earned its place, tell us within 30 days and we'll still take it back.",
          },
        ],
      },
      {
        id: "northform-contact",
        type: "contact",
        title: "Reserve your drop bundle",
        subtitle: "We confirm your size within one business day, you pay only when it ships.",
        style: "split",
        email: "drop@northform.example",
        fields: ["Your name", "Email address", "Size + delivery country"],
        submitLabel: "Reserve — $88",
      },
      {
        id: "northform-cta",
        type: "cta-final",
        headline: "Wear it out. We'll bring it back.",
        sub: "The FW26 bundle window closes when the timer does. 1,000 units, then it's a year until the next one.",
        cta: { label: "Reserve — $88", href: "#offer" },
        note: "Free repairs for life · 60-day returns · Carbon-offset shipping",
      },
      {
        id: "northform-footer",
        type: "footer",
        style: "mega",
        tagline: "Heavyweight essentials, repaired for life.",
        linkGroups: [
          {
            group: "Shop",
            items: [
              { label: "FW26 Drop 01", href: "#offer" },
              { label: "Lookbook", href: "#gallery" },
              { label: "Compare", href: "#comparison" },
            ],
          },
          {
            group: "Care",
            items: [
              { label: "Repairs", href: "#guarantee" },
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
        copyright: "Concept apparel page built with Forge Studio — NORTHFORM is a fictional demo label.",
      },
    ],
  }
}
