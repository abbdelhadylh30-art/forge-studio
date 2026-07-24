/**
 * OG Image Generator — /api/og?title=...&subtitle=...&primary=...&accent=...
 * Generates a 1200x630 PNG using sharp (SVG → PNG).
 */

import { NextRequest } from "next/server";
import sharp from "sharp";

const W = 1200, H = 630;

function isValidHex(s: string): boolean { return /^#[0-9a-fA-F]{6}$/.test(s); }
function escapeXml(s: string): string { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const title = params.get("title")?.slice(0, 120) || "Untitled";
  const subtitle = params.get("subtitle")?.slice(0, 200) || "";
  const brand = params.get("brand")?.slice(0, 40) || "";
  const primary = isValidHex(params.get("primary") || "") ? params.get("primary")! : "#0f172a";
  const accent = isValidHex(params.get("accent") || "") ? params.get("accent")! : "#6366f1";

  const titleLines = title.match(/.{1,35}(\s|$)|.{1,35}/g)?.slice(0, 3) || [title];
  const titleY = 280 - (titleLines.length - 1) * 40;

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${primary}" /><stop offset="100%" style="stop-color:${accent}" /></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#bg)" />
  ${brand ? `<text x="80" y="100" font-family="Inter, sans-serif" font-size="28" font-weight="600" fill="rgba(255,255,255,0.7)">${escapeXml(brand)}</text>` : ""}
  ${titleLines.map((line, i) => `<text x="80" y="${titleY + i * 80}" font-family="Inter, sans-serif" font-size="64" font-weight="800" fill="white">${escapeXml(line.trim())}</text>`).join("\n  ")}
  ${subtitle ? `<text x="80" y="${titleY + titleLines.length * 80 + 10}" font-family="Inter, sans-serif" font-size="28" fill="rgba(255,255,255,0.8)">${escapeXml(subtitle.slice(0, 80))}</text>` : ""}
  <rect x="0" y="${H - 8}" width="${W}" height="8" fill="${accent}" />
</svg>`;

  try {
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400, immutable" } });
  } catch (e) {
    console.error("[og] Error:", e);
    return new Response("Error generating image", { status: 500 });
  }
}
