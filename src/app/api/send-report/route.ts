/**
 * Forge Studio — Email Report Request endpoint
 *
 * When a user opts in to "email me my report" on the auditor export dialog,
 * we store the email + audit summary to the database. The owner can then
 * manually send the report (or set up an automated email worker later).
 *
 * This is NOT an email gate — the user already got their HTML/JSON download.
 * This is an optional upsell that captures real emails from happy users.
 *
 * SWEBOK KA 2 §2.7 (Security):
 *   - zod-validated request body
 *   - rate-limited (3 requests per hour per IP)
 *   - email validated + capped at 200 chars
 *   - report JSON capped at 100KB (prevents DB bloat)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

const MAX_REPORT_BYTES = 100 * 1024; // 100 KB cap on the stored report JSON

const RequestSchema = z.object({
  email: z.string().email("Invalid email address.").max(200),
  projectName: z.string().max(200).default("Untitled"),
  score: z.number().int().min(0).max(100),
  desktopScore: z.number().int().min(0).max(100),
  mobileScore: z.number().int().min(0).max(100),
  issueCount: z.number().int().min(0).max(9999),
  fixCount: z.number().int().min(0).max(9999),
  report: z.string().max(MAX_REPORT_BYTES, "Report too large."),
});

export async function POST(req: NextRequest) {
  // Rate limit: 3 requests per hour per IP
  const ip = getClientIp(req);
  const rl = checkRateLimit({ key: `send-report:${ip}`, limit: 3, windowMs: 3_600_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
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

  const { email, projectName, score, desktopScore, mobileScore, issueCount, fixCount, report } = parsed.data;

  try {
    const { db } = await import("@/lib/db");
    await db.emailReportRequest.create({
      data: {
        email: email.trim().toLowerCase(),
        projectName: projectName.slice(0, 200),
        score,
        desktopScore,
        mobileScore,
        issueCount,
        fixCount,
        reportJson: report.slice(0, MAX_REPORT_BYTES),
      },
    });
  } catch (e) {
    // DB not available — log to console as fallback
    console.warn("[send-report] DB unavailable, logging to console:", {
      email: email.trim().toLowerCase(),
      projectName,
      score,
      desktopScore,
      mobileScore,
      issueCount,
      fixCount,
      ip,
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json({ ok: true });
}
