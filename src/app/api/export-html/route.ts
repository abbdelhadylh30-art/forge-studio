/**
 * PixelForge v19 — Download Improved Page
 * Returns the current iframe HTML as a downloadable .html file.
 *
 * SWEBOK KA 2 §2.7 (Security): the filename from the request body is
 * sanitized before being placed in the Content-Disposition header to
 * prevent header-injection / response-splitting.
 */

import { NextRequest, NextResponse } from "next/server";
import { sanitizeFilename } from "@/lib/security/sanitize";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.html || typeof body.html !== "string") {
    return NextResponse.json({ error: "Missing or invalid html" }, { status: 400 });
  }
  const html: string = body.html;
  const filename = sanitizeFilename(body.filename, "forge-studio-improved.html");
  if (!filename.endsWith(".html")) {
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.html"`,
        "Cache-Control": "no-store",
      },
    });
  }
  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
