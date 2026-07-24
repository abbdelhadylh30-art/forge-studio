/**
 * Image Upload API
 * ----------------
 * Accepts a multipart/form-data file upload, processes it with sharp
 * (resize to max 2000px, convert to WebP), and saves to /public/uploads.
 */

import { NextRequest, NextResponse } from "next/server";
import { sanitizeFilename } from "@/lib/security/sanitize";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import sharp from "sharp";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit({ key: `upload:${ip}`, limit: 20, windowMs: 3_600_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many uploads." }, { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });
    if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: `Unsupported type: ${file.type}` }, { status: 415 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "File too large (5 MB max)." }, { status: 413 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const processed = await sharp(buffer).rotate().resize(2000, 2000, { fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    const baseName = sanitizeFilename(file.name.replace(/\.[^.]+$/, ""), "upload");
    const fileName = `${baseName}-${Date.now()}.webp`;
    if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(join(UPLOAD_DIR, fileName), processed);
    return NextResponse.json({ url: `/uploads/${fileName}`, size: processed.length });
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error("[upload] Error:", err?.message);
    return NextResponse.json({ error: "Couldn't process that image." }, { status: 500 });
  }
}
