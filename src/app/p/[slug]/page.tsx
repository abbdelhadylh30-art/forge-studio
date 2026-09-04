import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { db, ensureSchema } from "@/lib/db"
import { toWithConfig } from "@/lib/landing/server"
import { PublishedPage } from "@/components/sites/published/PublishedPage"
import type { LandingConfig } from "@/lib/landing/types"

export const dynamic = "force-dynamic"

/** Absolute base URL for OG/Twitter absolute image links. */
function siteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured) return configured.replace(/\/+$/, "")
  const vercel = process.env.VERCEL_URL
  if (vercel) return `https://${vercel}`
  return "http://localhost:3000"
}

function firstImage(config: LandingConfig): string | null {
  // explicit ogImage override → hero image → gallery images
  if (config.seo?.ogImage && /^https?:/.test(config.seo.ogImage)) return config.seo.ogImage
  const hero = config.sections.find((s) => s.type === "hero")
  if (hero && hero.type === "hero" && hero.image && /^https?:|^\/(api\/)?uploads\//.test(hero.image)) {
    return hero.image.startsWith("http") ? hero.image : `${siteOrigin()}${hero.image}`
  }
  const gallery = config.sections.find((s) => s.type === "gallery")
  if (gallery && gallery.type === "gallery") {
    const img = gallery.items?.find((i) => i.src && /^https?:/.test(i.src))
    if (img?.src) return img.src
  }
  return null
}

/** Server-rendered metadata: title, description, OG + Twitter card, canonical. */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  try {
    await ensureSchema().catch(() => undefined)
    const row = await db.site.findUnique({ where: { slug } })
    if (!row) return { title: "Page not found" }
    const { config } = toWithConfig(row)
    const title = config.seo?.title || `${config.brand.name} — ${config.brand.tagline ?? ""}`.trim()
    const description = config.seo?.description ?? ""
    const image = firstImage(config)
    const url = `${siteOrigin()}/p/${slug}`
    const noIndex = config.seo?.noIndex === true

    return {
      title,
      description,
      alternates: { canonical: url },
      robots: noIndex ? { index: false, follow: false } : undefined,
      openGraph: {
        title,
        description,
        url,
        siteName: config.brand.name,
        type: "website",
        ...(image ? { images: [{ url: image, alt: title }] } : {}),
      },
      twitter: {
        card: image ? "summary_large_image" : "summary",
        title,
        description,
        ...(image ? { images: [image] } : {}),
      },
    }
  } catch {
    return { title: "Forge Studio — Sites" }
  }
}

export default async function PublishedSitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  // Verify the site exists server-side:
  //  • DB reachable + row missing  → real 404 (SEO-correct for unknown slugs)
  //  • DB unreachable (offline)    → fall through to the client shell, which
  //    surfaces its own error state
  let jsonLd: string | null = null
  let rowFound = false
  try {
    await ensureSchema().catch(() => undefined)
    const row = await db.site.findUnique({ where: { slug } })
    rowFound = row !== null
    if (row) {
      const { config } = toWithConfig(row)
      const title = config.seo?.title || config.brand.name
      const url = `${siteOrigin()}/p/${slug}`
      const data = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: title,
        description: config.seo?.description ?? undefined,
        url,
        ...(config.brand.tagline ? { headline: config.brand.tagline } : {}),
        publisher: { "@type": "Organization", name: config.brand.name },
      }
      jsonLd = JSON.stringify(data)
    }
  } catch {
    // DB offline → let the client component surface its own error state
  }
  if (!rowFound) notFound()

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      )}
      <PublishedPage slug={slug} />
    </>
  )
}
