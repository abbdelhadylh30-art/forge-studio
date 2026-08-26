/**
 * PixelForge v19 — Projects API (Tier 2)
 *
 *   GET /api/projects → projects with audit counts + latest score
 *
 * Aggregates the dormant Prisma Project/Audit models into a dashboard-friendly
 * shape. Same graceful-degradation contract as /api/audits: no DATABASE_URL →
 * `{ projects: [], unavailable: true }` (client falls back to localStorage).
 */

import { NextResponse } from "next/server";

const LIST_LIMIT = 50;

export async function GET() {
  try {
    const { db } = await import("@/lib/db");
    const projects = await db.project.findMany({
      orderBy: { updatedAt: "desc" },
      take: LIST_LIMIT,
      include: {
        audits: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { score: true, createdAt: true },
        },
        _count: { select: { audits: true } },
      },
    });

    return NextResponse.json({
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        url: p.url,
        clientName: p.clientName,
        auditCount: p._count.audits,
        latestScore: p.audits[0]?.score ?? null,
        latestAuditAt: p.audits[0]?.createdAt.getTime() ?? null,
        createdAt: p.createdAt.getTime(),
        updatedAt: p.updatedAt.getTime(),
      })),
    });
  } catch (e) {
    console.warn("[api/projects] list unavailable:", e);
    return NextResponse.json({ projects: [], unavailable: true }, { status: 200 });
  }
}
