/**
 * Forge Studio — Feedback submission endpoint
 *
 * Stores user feedback (message + optional email + optional rating) to the
 * local SQLite database via Prisma. If the database isn't available (e.g.,
 * on Vercel serverless where the SQLite file is ephemeral), the feedback
 * is logged to the server console so it's at least visible in Vercel logs.
 *
 * SWEBOK KA 2 §2.7 (Security):
 *   - zod-validated request body
 *   - rate-limited (5 submissions per hour per IP — prevents spam)
 *   - message capped at 5000 chars, email at 200 chars
 *   - no HTML in response (prevents reflected XSS)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

const RequestSchema = z.object({
  message: z.string().min(5, "Please write at least a few words.").max(5000, "Message is too long (5000 char max)."),
  email: z.string().email("Invalid email address.").max(200).optional().or(z.literal("")),
  rating: z.number().int().min(1).max(5).optional(),
  url: z.string().max(500).optional(),
  view: z.string().max(50).optional(),
});

export async function POST(req: NextRequest) {
  // Rate limit: 5 submissions per hour per IP
  const ip = getClientIp(req);
  const rl = checkRateLimit({ key: `feedback:${ip}`, limit: 5, windowMs: 3_600_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }

  const { message, email, rating, url, view } = parsed.data;
  const cleanEmail = email?.trim() || null;

  // Try to persist to the database. If it fails (e.g., Vercel serverless
  // with ephemeral filesystem), log to console so the feedback isn't lost.
  try {
    // Dynamic import so the route doesn't crash if @prisma/client isn't
    // generated yet (e.g., during local dev before `prisma generate`).
    const { db, ensureSchema } = await import("@/lib/db");
    await ensureSchema();
    await db.feedback.create({
      data: {
        message: message.trim(),
        email: cleanEmail,
        rating: rating ?? null,
        url: url ?? null,
        view: view ?? null,
      },
    });
  } catch (e) {
    // DB not available — log to server console as a fallback.
    // On Vercel, this shows up in the function logs.
    console.warn("[feedback] DB unavailable, logging to console:", {
      message: message.trim().slice(0, 500),
      email: cleanEmail,
      rating: rating ?? null,
      url: url ?? null,
      view: view ?? null,
      ip,
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json({ ok: true });
}
