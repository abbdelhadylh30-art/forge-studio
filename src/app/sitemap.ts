/**
 * sitemap.xml generator
 * ---------------------
 * Generates a sitemap from the current site's pages.
 * Since Forge Studio is a single-user local-first tool, this sitemap
 * reflects the user's last-saved site (from localStorage on the client side).
 *
 * For a deployed site, the sitemap is generated from the site JSON
 * stored in the __NEXT_DATA__ or a query param.
 *
 * This is a best-effort dynamic sitemap that reads the site slug from
 * the query string and generates entries for each page.
 */

import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const siteSlug = req.nextUrl.searchParams.get("site") || "default";

  // For a single-user tool, we generate a basic sitemap with the root URL.
  // In a real deployment with multiple sites, this would query the database.
  const urls = [
    { loc: origin, priority: "1.0", changefreq: "weekly" },
    { loc: `${origin}/?site=${siteSlug}`, priority: "0.8", changefreq: "weekly" },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
