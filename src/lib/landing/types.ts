// ─────────────────────────────────────────────────────────────────────────────
// Landing Forge — shared landing page config types (single source of truth)
// ─────────────────────────────────────────────────────────────────────────────

export type DeviceType = "desktop" | "tablet" | "mobile"
export type ThemeId =
  | "nebula"
  | "ember"
  | "emerald"
  | "rose"
  | "mono"
  | "paper"
  | "slate"
  | "ocean"
  | "gold"
  | "midnight"

/** Color-scheme behavior for a published page.
 *  unset → the theme's built-in preferred mode (legacy behavior, keeps every
 *  existing site pixel-identical)
 *  "auto" → follow the visitor's system preference, live
 *  "dark" / "light" → forced */
export type ThemeMode = "auto" | "dark" | "light"

export interface Cta {
  label: string
  href: string
}

// ── A/B testing ──────────────────────────────────────────────────────────────
export interface AbVariant {
  id: string
  name: string // "A" | "B" | "C"...
  headline: string
  sub?: string
  ctaLabel?: string
  weight: number // percent, should total 100
}

export interface AbConfig {
  enabled: boolean
  metric: string // e.g. "cta_click"
  autoWinner: boolean
  sampleSize: number
  variants: AbVariant[]
}

/** Section types that support their own A/B test (variants override title/headline + sub + CTA label). */
export const AB_SECTION_TYPES = ["hero", "features", "testimonials", "pricing", "faq", "contact", "cta-final"] as const
export type AbSectionType = (typeof AB_SECTION_TYPES)[number]

// ── Per-section entrance animation ───────────────────────────────────────────
export type SectionAnimation = "none" | "fade-up" | "fade-in" | "slide-left" | "zoom-in"

export const SECTION_ANIMATIONS: { id: SectionAnimation; label: string }[] = [
  { id: "none", label: "None" },
  { id: "fade-up", label: "Fade up" },
  { id: "fade-in", label: "Fade in" },
  { id: "slide-left", label: "Slide in" },
  { id: "zoom-in", label: "Zoom in" },
]

/** Applied to every section via intersection — `Section` members all gain it. */
export interface SectionAnimationFields {
  /** entrance animation, played once when the section scrolls into view */
  animation?: SectionAnimation
}

// ── Sections ─────────────────────────────────────────────────────────────────
export interface AnnouncementSection {
  id: string
  type: "announcement"
  hidden?: boolean
  anchor?: string // custom anchor id override (defaults to the section type)
  style: "static" | "ticker" | "countdown"
  message: string
  /** optional inline action rendered at the end of the bar */
  link?: Cta
  /** countdown target — ISO datetime (countdown style) */
  deadline?: string
  /** label before the countdown digits, e.g. "Early access ends in" */
  prefixLabel?: string
}

export interface NavbarSection {
  id: string
  type: "navbar"
  hidden?: boolean
  anchor?: string // custom anchor id override (defaults to the section type)
  brandLabel?: string // override brand name
  links: { label: string; href: string }[]
  cta?: Cta
}

export interface HeroSection {
  id: string
  type: "hero"
  hidden?: boolean
  anchor?: string // custom anchor id override (defaults to the section type)
  layout: "split-right" | "split-left" | "center" | "full-bleed" | "minimal" | "gradient" | "video" | "card"
  badge?: string
  headline: string
  sub: string
  cta: Cta
  secondaryCta?: Cta
  image?: string // url or empty
  /** background video for the "video" layout (mp4/webm URL or empty) */
  videoUrl?: string
  stats?: { value: string; label: string }[]
  /** sticky mobile CTA bar on the published page (default ON when undefined) */
  stickyCta?: boolean
  ab?: AbConfig
}

export interface LogosSection {
  id: string
  type: "logos"
  hidden?: boolean
  anchor?: string // custom anchor id override (defaults to the section type)
  title?: string
  items: string[] // company names rendered as wordmark-styled text
}

export interface FeatureItem {
  icon: string // icon bank key ("zap") — legacy emoji values still render
  title: string
  body: string
}

export interface FeaturesSection {
  id: string
  type: "features"
  hidden?: boolean
  anchor?: string // custom anchor id override (defaults to the section type)
  title?: string
  subtitle?: string
  style: "grid" | "alternating" | "bento" | "tabs" | "carousel"
  columns?: number // 2 | 3 | 4 for grid
  items: FeatureItem[]
  ab?: AbConfig
}

export interface StatsItem {
  value: string
  label: string
  delta?: string // "+12% this quarter"
}

export interface StatsSection {
  id: string
  type: "stats"
  hidden?: boolean
  anchor?: string // custom anchor id override (defaults to the section type)
  title?: string
  items: StatsItem[]
}

export interface TestimonialItem {
  quote: string
  author: string
  role: string
  initials?: string
  rating?: number // 1-5
}

export interface TestimonialsSection {
  id: string
  type: "testimonials"
  hidden?: boolean
  anchor?: string // custom anchor id override (defaults to the section type)
  title?: string
  subtitle?: string
  style: "grid" | "marquee" | "spotlight" | "video" | "logo-wall"
  items: TestimonialItem[]
  ab?: AbConfig
}

export interface PricingPlan {
  name: string
  price: string
  period?: string
  description?: string
  features: string[]
  highlighted?: boolean
  ctaLabel?: string
}

export interface PricingSection {
  id: string
  type: "pricing"
  hidden?: boolean
  anchor?: string // custom anchor id override (defaults to the section type)
  title?: string
  subtitle?: string
  annualToggle?: boolean
  annualDiscountLabel?: string
  plans: PricingPlan[]
  ab?: AbConfig
}

export interface FaqItem {
  q: string
  a: string
}

export interface FaqSection {
  id: string
  type: "faq"
  hidden?: boolean
  anchor?: string // custom anchor id override (defaults to the section type)
  title?: string
  subtitle?: string
  style: "accordion" | "twocol"
  items: FaqItem[]
  ab?: AbConfig
}

export interface GalleryItem {
  src?: string // url
  alt: string
  hue?: string // css hue used for generated placeholder art
  caption?: string
}

export interface GallerySection {
  id: string
  type: "gallery"
  hidden?: boolean
  anchor?: string // custom anchor id override (defaults to the section type)
  title?: string
  subtitle?: string
  style: "masonry" | "carousel" | "slider" | "stories" | "ticker"
  items: GalleryItem[]
}

export interface ContactSection {
  id: string
  type: "contact"
  hidden?: boolean
  anchor?: string // custom anchor id override (defaults to the section type)
  title?: string
  subtitle?: string
  email?: string
  phone?: string
  fields: string[] // labels of inputs to render
  submitLabel: string
  ab?: AbConfig
}

export interface CtaFinalSection {
  id: string
  type: "cta-final"
  hidden?: boolean
  anchor?: string // custom anchor id override (defaults to the section type)
  headline: string
  sub?: string
  cta: Cta
  note?: string
  ab?: AbConfig
}

export interface FooterLinkGroup {
  group: string
  items: { label: string; href: string }[]
}

export interface FooterSection {
  id: string
  type: "footer"
  hidden?: boolean
  anchor?: string // custom anchor id override (defaults to the section type)
  style: "minimal" | "mega" | "newsletter"
  tagline?: string
  linkGroups: FooterLinkGroup[]
  social?: string[] // labels e.g. ["X", "GitHub", "Discord"]
  copyright?: string
}

export interface AboutItem {
  year?: string // timeline milestone year / value
  title: string
  body: string
}

export interface AboutSection {
  id: string
  type: "about"
  hidden?: boolean
  anchor?: string // custom anchor id override (defaults to the section type)
  title?: string
  subtitle?: string
  style: "founder" | "timeline" | "mission"
  /** founder letter / mission statement body (multi-paragraph, \n\n separated) */
  body?: string
  founder?: { name: string; role: string }
  /** timeline milestones or mission values, depending on style */
  items: AboutItem[]
}

// ── Narrative sections (problem → solution arc) ─────────────────────────────
export interface PainItem {
  icon: string // icon bank key
  title: string
  body: string
}

export interface ProblemSection {
  id: string
  type: "problem"
  hidden?: boolean
  anchor?: string
  title?: string
  subtitle?: string
  style: "grid" | "split"
  items: PainItem[]
}

export interface SolutionSection {
  id: string
  type: "solution"
  hidden?: boolean
  anchor?: string
  title?: string
  subtitle?: string
  style: "grid" | "split" | "steps"
  items: PainItem[]
}

export interface VideoSection {
  id: string
  type: "video"
  hidden?: boolean
  anchor?: string
  title?: string
  subtitle?: string
  /** mp4/webm file URL or YouTube/Vimeo link (auto-embedded) */
  videoUrl: string
  /** poster image for file videos (YouTube provides its own) */
  poster?: string
  style: "cinematic" | "split" | "minimal"
  caption?: string
  cta?: Cta
}

export interface ComparisonRow {
  feature: string
  /** "yes" | "no" | "partial" render as icons; any other string renders as text */
  us: string
  them: string
}

export interface ComparisonSection {
  id: string
  type: "comparison"
  hidden?: boolean
  anchor?: string
  title?: string
  subtitle?: string
  usLabel: string
  themLabel: string
  rows: ComparisonRow[]
  note?: string
}

export interface GuaranteeSection {
  id: string
  type: "guarantee"
  hidden?: boolean
  anchor?: string
  title?: string
  subtitle?: string
  /** the promise itself (multi-paragraph, \n\n separated) */
  body?: string
  style: "card" | "split"
  items: PainItem[]
}

export type Section = (
  | AnnouncementSection
  | NavbarSection
  | HeroSection
  | LogosSection
  | FeaturesSection
  | StatsSection
  | TestimonialsSection
  | PricingSection
  | FaqSection
  | GallerySection
  | AboutSection
  | ProblemSection
  | SolutionSection
  | VideoSection
  | ComparisonSection
  | GuaranteeSection
  | ContactSection
  | CtaFinalSection
  | FooterSection
) &
  SectionAnimationFields

export type SectionType = Section["type"]

export const SECTION_TYPES: SectionType[] = [
  "announcement",
  "navbar",
  "hero",
  "logos",
  "features",
  "stats",
  "testimonials",
  "pricing",
  "faq",
  "gallery",
  "about",
  "problem",
  "solution",
  "video",
  "comparison",
  "guarantee",
  "contact",
  "cta-final",
  "footer",
]

export const SECTION_META: Record<SectionType, { label: string; icon: string; description: string }> = {
  announcement: { label: "Announcement", icon: "megaphone", description: "Slim top bar — static, ticker or live countdown" },
  navbar: { label: "Navbar", icon: "compass", description: "Sticky top navigation with brand + CTA" },
  hero: { label: "Hero", icon: "sparkles", description: "Big headline, sub copy, CTAs, image — 8 layouts" },
  logos: { label: "Logo Wall", icon: "briefcase", description: "Trusted-by company strip" },
  features: { label: "Features", icon: "zap", description: "Icon grid / bento / alternating / carousel" },
  stats: { label: "Stats", icon: "chart", description: "Big numbers with labels" },
  testimonials: { label: "Testimonials", icon: "quote", description: "Quotes — grid, marquee, spotlight, video, logo-wall" },
  pricing: { label: "Pricing", icon: "credit-card", description: "Plans with annual toggle" },
  faq: { label: "FAQ", icon: "message", description: "Accordion or two-column Q&A" },
  gallery: { label: "Gallery", icon: "camera", description: "Masonry, carousel, slider, stories, ticker" },
  about: { label: "About", icon: "users", description: "Founder letter, timeline, or mission" },
  problem: { label: "Problem", icon: "alert", description: "Pain points that set up your story" },
  solution: { label: "Solution", icon: "lightbulb", description: "The turn — how you fix it" },
  video: { label: "Video", icon: "play", description: "Cinematic, split or minimal video block" },
  comparison: { label: "Comparison", icon: "layout", description: "You vs. them feature table" },
  guarantee: { label: "Guarantee", icon: "shield-check", description: "Risk reversal — promise, terms, badge" },
  contact: { label: "Contact", icon: "mail", description: "Contact form + details" },
  "cta-final": { label: "Final CTA", icon: "rocket", description: "Closing call-to-action banner" },
  footer: { label: "Footer", icon: "layers", description: "Links, social, newsletter" },
}

// ── Multilingual (i18n) ─────────────────────────────────────────────────────────
export interface LocaleConfig {
  /** BCP-47-ish code: "en", "ar", "fr"… */
  code: string
  /** Display label — "English", "العربية" */
  label?: string
  /** "rtl" for Arabic/Hebrew/Farsi/Urdu — derived from code when absent */
  dir?: "ltr" | "rtl"
}

export interface I18nConfig {
  /** every locale the site ships. The FIRST entry is the default. */
  locales: LocaleConfig[]
  /** locale → sectionId → dotted field path → translated string */
  translations: Record<string, Record<string, Record<string, string>>>
}

const RTL_LANGS = new Set(["ar", "he", "fa", "ur", "ps", "sd", "yi", "dv", "ku"])

/** Direction for a locale — explicit config wins, else well-known RTL codes. */
export function localeDir(code: string): "ltr" | "rtl" {
  return RTL_LANGS.has(code.toLowerCase().split("-")[0]) ? "rtl" : "ltr"
}

// ── Privacy & tracking (published page + export) ─────────────────────────────

export interface CookieConsentConfig {
  enabled: boolean
  /** banner body copy (translatable — see i18n page-level paths) */
  message: string
  acceptLabel: string
  declineLabel: string
  /** optional "learn more" link shown next to the buttons */
  learnMoreUrl?: string
  learnMoreLabel?: string
  position: "bottom" | "top"
}

export interface LegalConfig {
  cookieConsent: CookieConsentConfig
}

export interface TrackingConfig {
  /** raw script markup for <head> (GA4, Meta Pixel, TikTok…) — accepts full
   *  <script>…</script> tags or bare JS */
  headScripts: string
  /** raw script markup injected before </body> (chat widgets, conversion scripts) */
  bodyScripts: string
}

// ── Root config ──────────────────────────────────────────────────────────────
export interface LandingConfig {
  version: 1
  brand: {
    name: string
    tagline?: string
    /** brand logo shown in the navbar / footer (URL — upload, library or AI) */
    logoUrl?: string
    /** custom accent hex — overrides the theme's accent (and derived tints) */
    accent?: string
    /** curated display/body font pair id (see FONT_PAIRS) */
    font?: string
    /** color-scheme override — unset = the theme's preferred mode */
    mode?: ThemeMode
  }
  themeId: ThemeId
  /** multilingual publishing — AI-translated copy per locale, RTL-aware */
  i18n?: I18nConfig
  /** privacy / compliance — cookie-consent banner shown to visitors */
  legal?: LegalConfig
  /** custom third-party scripts (GA4, Meta Pixel, chat widgets…) — injected
   *  on the published page + standalone export; gated behind cookie consent
   *  whenever the banner is enabled */
  tracking?: TrackingConfig
  seo: {
    title: string
    description: string
    /** opt out of search indexing for this site (published page + HTML export) */
    noIndex?: boolean
    /** explicit social-share image URL — falls back to hero/gallery imagery */
    ogImage?: string
  }
  sections: Section[]
}

export interface ProjectSummary {
  id: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
  sectionCount: number
  themeId: ThemeId
}

export interface ProjectWithConfig extends ProjectSummary {
  config: LandingConfig
}

export type DeployStatus = "queued" | "building" | "live" | "failed"

export interface DeployLogLine {
  t: string
  msg: string
  level: "info" | "success" | "warn"
}

export interface DeployRecord {
  id: string
  projectId: string
  status: DeployStatus
  url: string | null
  logs: DeployLogLine[]
  durationMs: number
  createdAt: string
}

// ── Analytics ────────────────────────────────────────────────────────────────
export interface LeadRecord {
  id: string
  name: string
  email: string
  message: string
  fields: Record<string, string> // full submitted field label → value map
  createdAt: string
}

export interface AnalyticsStats {
  pageviews: number
  uniqueVisitors: number
  bounceRate: number // 0-1
  avgDuration: number // seconds
  ctaClicks: number
  conversionRate: number // cta_clicks / pageviews, 0-1
}

export interface TimeseriesPoint {
  date: string // YYYY-MM-DD
  views: number
  clicks: number
}

export interface NamedCount {
  name: string
  count: number
}

export interface FunnelStep {
  label: string
  count: number
}

export interface AbVariantResult {
  name: string
  headline: string
  weight: number
  exposures: number
  clicks: number
  ctr: number // 0-1
  avgDuration: number // seconds — mean time-on-page for visits exposed to this variant
  engagedPct: number // 0-1 — share of exposed visits that engaged (≥15s or interacted)
  /** Variant-tagged section_view events for this test's section (0 when the
   *  section has no read tracking yet — e.g. the hero, where the pageview IS
   *  the read). reach = sectionReads / exposures. */
  sectionReads: number
}

/** One section-scoped A/B test in the analytics payload (hero, pricing, final CTA…). */
export interface AbTestResult {
  key: string // exposure event label key (section id; hero additionally matches legacy "hero")
  sectionId: string
  sectionType: string
  sectionLabel: string // human label, e.g. "Hero" / "Pricing"
  metric: string
  autoWinner: boolean
  sampleSize: number
  variants: AbVariantResult[]
  winner: string | null
  totalExposures: number
  hasData: boolean
  /** Per-variant duration/engagement data exists for this test (PageView.variantMap). */
  hasEngagement: boolean
  /** True for the page-level (primary) test — historically the only one with per-variant engagement; now every test with variantMap data has it. */
  primary: boolean
}

/** An active visit on the published page ("who's here right now"). */
export interface LiveVisit {
  id: string
  device: string
  browser: string
  country: string
  referrer: string
  variant: string | null
  durationSec: number // live seconds-on-page (max of synced duration and elapsed)
  startedAt: string // ISO
  lastActive: string // ISO — last engagement signal (ping or arrival)
}

export interface AnalyticsPayload {
  stats: AnalyticsStats
  timeseries: TimeseriesPoint[]
  devices: NamedCount[]
  countries: NamedCount[]
  referrers: NamedCount[]
  topSections: NamedCount[]
  funnel: FunnelStep[]
  /** Visits on the published page within the last few minutes (always computed, not windowed by `days`). */
  live: {
    active: LiveVisit[] // still on the page (recent engagement signal)
    last5m: number // total visits in the last 5 minutes
    activeCount: number
  }
  ab: {
    enabled: boolean
    metric: string
    autoWinner: boolean
    sampleSize: number
    variants: AbVariantResult[]
    winner: string | null
    totalExposures: number
    hasData: boolean
  } | null
  /** Every enabled section-level A/B test (hero first, then section order). `ab` is the primary/first entry. */
  abTests: AbTestResult[]
  recentEvents: {
    id: string
    type: string
    label: string
    variant: string | null
    createdAt: string
  }[]
}
