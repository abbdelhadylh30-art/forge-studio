// ─────────────────────────────────────────────────────────────────────────────
// /api/export/css — serves the pre-compiled Tailwind bundle used by the
// standalone-HTML export (generated artifact: src/lib/landing/export.css).
//
// GET /api/export/css → 200 text/css | 500 if the artifact is missing
// ─────────────────────────────────────────────────────────────────────────────
import { NextResponse } from "next/server"
import { readFile } from "node:fs/promises"
import path from "node:path"

export const runtime = "nodejs"

const CSS_PATH = path.join(process.cwd(), "src", "lib", "landing", "export.css")

export async function GET() {
  try {
    const css = await readFile(CSS_PATH, "utf8")
    return new NextResponse(css, {
      headers: {
        "content-type": "text/css; charset=utf-8",
        "cache-control": "public, max-age=300",
      },
    })
  } catch {
    return NextResponse.json(
      { error: "Export stylesheet not found — run `bun x @tailwindcss/cli -i src/app/globals.css -o src/lib/landing/export.css --minify`" },
      { status: 500 }
    )
  }
}
