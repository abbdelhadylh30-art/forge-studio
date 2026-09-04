import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://forge-studio-green.vercel.app";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  // Published landing sites (/p/<slug>) — included unless the site opts out
  // via seo.noIndex. DB failures degrade to the static entry above.
  try {
    const sites = await db.site.findMany({
      select: { slug: true, updatedAt: true, config: true },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });
    for (const site of sites) {
      try {
        const config = JSON.parse(site.config) as { seo?: { noIndex?: boolean } };
        if (config.seo?.noIndex) continue;
      } catch {
        // unparsable config — still list it (the page renders a notfound state)
      }
      entries.push({
        url: `${SITE_URL}/p/${site.slug}`,
        lastModified: site.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch {
    // SQLite unavailable (e.g. read-only Vercel deploy) — static entries only
  }

  return entries;
}
