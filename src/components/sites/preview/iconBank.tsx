"use client"

/**
 * Icon bank — the single, curated Lucide icon set used across the landing
 * page output and the studio chrome. Every place a landing page needs an
 * icon (feature tiles, pain/solution items, guarantee badges, section meta,
 * template tiles, buttons) resolves a semantic KEY here instead of shipping
 * emoji glyphs.
 *
 * Data compatibility: saved configs (and AI output) may still carry emoji
 * strings in icon fields. `IconGlyph` resolves bank keys to Lucide icons and
 * falls back to rendering unknown values as plain text, so legacy pages keep
 * rendering unchanged.
 */

import type { LucideIcon } from "lucide-react"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Award,
  BadgeCheck,
  BarChart3,
  Bell,
  Blocks,
  Bookmark,
  Boxes,
  Brain,
  Briefcase,
  Calendar,
  Camera,
  Check,
  ChevronRight,
  Clock,
  Cloud,
  Code2,
  Compass,
  CreditCard,
  Crown,
  Database,
  DollarSign,
  Eye,
  Feather,
  FileText,
  Fingerprint,
  Flame,
  Gauge,
  Gift,
  Globe,
  GraduationCap,
  Handshake,
  Headphones,
  Heart,
  Infinity as InfinityIcon,
  Layers,
  Layout,
  LayoutTemplate,
  LifeBuoy,
  Lightbulb,
  Link2,
  Lock,
  Mail,
  Map,
  Megaphone,
  MessageSquare,
  Monitor,
  Moon,
  Package,
  Palette,
  PieChart,
  Play,
  Plug,
  Puzzle,
  Quote,
  Rocket,
  Search,
  Send,
  Settings2,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Star,
  Sun,
  Target,
  Terminal,
  ThumbsUp,
  Timer,
  TrendingUp,
  Truck,
  Unlock,
  Users,
  Video,
  Wand2,
  Workflow,
  Zap,
} from "lucide-react"

import { cn } from "@/lib/utils"

export const ICON_BANK: Record<string, LucideIcon> = {
  activity: Activity,
  alert: AlertTriangle,
  arrow: ArrowRight,
  award: Award,
  "badge-check": BadgeCheck,
  chart: BarChart3,
  bell: Bell,
  blocks: Blocks,
  bookmark: Bookmark,
  boxes: Boxes,
  brain: Brain,
  briefcase: Briefcase,
  calendar: Calendar,
  camera: Camera,
  check: Check,
  "chevron-right": ChevronRight,
  clock: Clock,
  cloud: Cloud,
  code: Code2,
  compass: Compass,
  "credit-card": CreditCard,
  crown: Crown,
  database: Database,
  dollar: DollarSign,
  eye: Eye,
  feather: Feather,
  file: FileText,
  fingerprint: Fingerprint,
  flame: Flame,
  gauge: Gauge,
  gift: Gift,
  globe: Globe,
  graduation: GraduationCap,
  handshake: Handshake,
  headphones: Headphones,
  heart: Heart,
  infinite: InfinityIcon,
  layers: Layers,
  layout: Layout,
  "layout-template": LayoutTemplate,
  "life-buoy": LifeBuoy,
  lightbulb: Lightbulb,
  link: Link2,
  lock: Lock,
  mail: Mail,
  map: Map,
  megaphone: Megaphone,
  message: MessageSquare,
  monitor: Monitor,
  moon: Moon,
  package: Package,
  palette: Palette,
  "pie-chart": PieChart,
  play: Play,
  plug: Plug,
  puzzle: Puzzle,
  quote: Quote,
  rocket: Rocket,
  search: Search,
  send: Send,
  settings: Settings2,
  shield: Shield,
  "shield-check": ShieldCheck,
  "shopping-bag": ShoppingBag,
  smartphone: Smartphone,
  sparkles: Sparkles,
  star: Star,
  sun: Sun,
  target: Target,
  terminal: Terminal,
  thumbsup: ThumbsUp,
  timer: Timer,
  trending: TrendingUp,
  truck: Truck,
  unlock: Unlock,
  users: Users,
  video: Video,
  wand: Wand2,
  workflow: Workflow,
  zap: Zap,
}

/** Ordered option groups for the editor icon picker. */
export const ICON_PICKER_GROUPS: { group: string; keys: string[] }[] = [
  { group: "Core", keys: ["zap", "check", "arrow", "star", "heart", "sparkles", "flame", "rocket"] },
  { group: "Product", keys: ["layout", "blocks", "layers", "puzzle", "plug", "boxes", "package", "workflow", "settings", "gauge"] },
  { group: "Growth", keys: ["chart", "trending", "target", "megaphone", "bell", "gift", "crown", "award", "thumbsup", "badge-check"] },
  { group: "Trust", keys: ["shield", "shield-check", "lock", "unlock", "fingerprint", "handshake", "life-buoy", "headphones"] },
  { group: "Commerce", keys: ["credit-card", "dollar", "shopping-bag", "truck", "briefcase"] },
  { group: "Tech", keys: ["code", "terminal", "database", "cloud", "globe", "monitor", "smartphone"] },
  { group: "Media", keys: ["camera", "video", "play", "palette", "eye", "feather"] },
  { group: "Info", keys: ["lightbulb", "brain", "compass", "map", "calendar", "clock", "timer", "search", "mail", "message", "file", "quote"] },
]

export const ICON_KEYS = Object.keys(ICON_BANK)

/** Does this icon field value resolve to a bank icon? */
export function isBankIcon(value: string | undefined | null): value is string {
  return !!value && Object.prototype.hasOwnProperty.call(ICON_BANK, value)
}

export interface IconGlyphProps {
  /** bank key ("zap") or legacy value (emoji / text) */
  name?: string | null
  className?: string
  strokeWidth?: number
  /** explicit pixel size (defaults to the parent's font size via em) */
  size?: number
  "aria-hidden"?: boolean
}

/**
 * Render an icon by bank key with a graceful text fallback for legacy
 * emoji/string values stored in older configs.
 */
export function IconGlyph({ name, className, strokeWidth = 1.75, size, ...rest }: IconGlyphProps) {
  const key = (name ?? "").trim()
  if (!key) return null
  const Icon = ICON_BANK[key]
  if (Icon) {
    return <Icon className={cn("shrink-0", className)} strokeWidth={strokeWidth} size={size} aria-hidden {...rest} />
  }
  // legacy value (emoji, single character, or AI free-text) — keep it visible
  return (
    <span aria-hidden className={cn("inline-flex items-center justify-center leading-none", className)}>
      {key}
    </span>
  )
}
