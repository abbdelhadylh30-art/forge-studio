/**
 * PixelForge v19 — Audit history API (Tier 2)
 *
 * Activates the dormant Prisma Project/Audit models:
 *   GET  /api/audits            → recent audits (newest first, capped)
 *   POST /api/audits            → persist a snapshot (find-or-create Project)
 *
 * Follows the feedback-route pattern: dynamic `@/lib/db` import + graceful
 * degradation when no DATABASE_URL is configured (e.g. serverless/ephemeral
 * FS) — the client keeps working with its localStorage mirror.
 *
 * SWEBOK KA 3 §4.5 (Fault Tolerance) + KA 2 §2.7 (Security):
 *   - zod input validation on POST
 *   - HTML payload capped (2 MB) to bound SQLite growth
 *   - Errors mapped to honest 503s; never crashes the audit flow
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const MAX_HTML_BYTES = 2 * 1024 * 1024; // 2 MB — bound DB growth per snapshot
const LIST_LIMIT = 20;

const entrySchema = z.object({
  id: z.string().min(1).max(64),
  projectId: z.string().nullable().optional(),
  name: z.string().min(1).max(120),
  url: z.string().nullable().optional(),
  clientName: z.string().nullable().optional(),
  score: z.number().int().min(0).max(100),
  desktopScore: z.number().int().min(0).max(100),
  mobileScore: z.number().int().min(0).max(100),
  issueCount: z.number().int().min(0),
  errorCount: z.number().int().min(0),
  warningCount: z.number().int().min(0),
  cats: z.record(z.string(), z.object({ earned: z.number(), total: z.number() })).optional(),
  createdAt: z.number().int().positive(),
});

const postSchema = z.object({
  entry: entrySchema,
  html: z.string().max(MAX_HTML_BYTES).optional(),
});

export async function GET() {
  try {
    const { db } = await import("@/lib/db");
    const audits = await db.audit.findMany({
      orderBy: { createdAt: "desc" },
      take: LIST_LIMIT,
      include: { project: { select: { id: true, name: true, clientName: true } } },
    });
    return NextResponse.json({
      audits: audits.map((a) => ({
        id: a.id,
        name: a.name,
        url: a.url,
        clientName: a.project?.clientName ?? null,
        score: a.score,
        desktopScore: a.desktopScore,
        mobileScore: a.mobileScore,
        createdAt: a.createdAt.getTime(),
        categories: JSON.parse(a.categories),
      })),
    });
  } catch (e) {
    // No DATABASE_URL / ephemeral FS / missing tables → the client falls back
    // to its localStorage mirror. Report honestly but don't 500-crash.
    console.warn("[api/audits] list unavailable:", e);
    return NextResponse.json(
      { audits: [], unavailable: true },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid audit snapshot payload.", details: parsed.error.issues.slice(0, 3) },
      { status: 400 }
    );
  }

  const { entry, html } = parsed.data;

  try {
    const { db } = await import("@/lib/db");

    // Find-or-create the Project by stable identity: client-supplied
    // projectId when it exists, else (name + clientName) pair.
    let project = entry.projectId
      ? await db.project.findUnique({ where: { id: entry.projectId } })
      : null;

    if (!project) {
      project = await db.project.findFirst({
        where: { name: entry.name, clientName: entry.clientName ?? null },
      });
    }
    if (!project) {
      project = await db.project.create({
        data: {
          name: entry.name,
          url: entry.url ?? null,
          clientName: entry.clientName ?? null,
        },
      });
    }

    const audit = await db.audit.create({
      data: {
        projectId: project.id,
        name: entry.name,
        url: entry.url ?? null,
        htmlContent: html ?? "",
        score: entry.score,
        desktopScore: entry.desktopScore,
        mobileScore: entry.mobileScore,
        categories: JSON.stringify(entry.cats ?? {}),
        issues: JSON.stringify({ issueCount: entry.issueCount, errorCount: entry.errorCount, warningCount: entry.warningCount }),
        isInitial: false,
        isSnapshot: true,
      },
    });

    return NextResponse.json({ ok: true, auditId: audit.id, projectId: project.id }, { status: 201 });
  } catch (e) {
    console.warn("[api/audits] persist unavailable:", e);
    // The client already wrote its localStorage mirror — server persistence
    // is a bonus. 503 communicates "not configured here" without alarming.
    return NextResponse.json(
      { ok: false, unavailable: true },
      { status: 503 }
    );
  }
}
