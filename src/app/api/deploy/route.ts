// ─────────────────────────────────────────────────────────────────────────────
// /api/deploy — simulated build pipeline
//
// GET /api/deploy?projectId=xxx → 200 { deploy: DeployRecord | null }  (latest)
// GET /api/deploy?id=xxx        → 200 { deploy: DeployRecord | null }  (single)
// POST /api/deploy  body { projectId }
//      → 201 { deploy: DeployRecord }          (new build started)
//      → 200 { deploy, reused: true, message } (a build already in flight)
//      → 404 if project missing
//
// POST responds immediately; a detached in-process pipeline progresses the row
// (queued → building → live) appending DeployLogLine { t, msg, level } entries
// ~700–1100ms apart. Stale in-flight builds (>2min old, e.g. after a server
// restart) are marked "failed" so a fresh deploy can always start.
// ─────────────────────────────────────────────────────────────────────────────
import { NextRequest, NextResponse } from "next/server"
import type { SiteDeploy } from "@prisma/client"
import { db } from "@/lib/db"
import { guard, HttpError, parseStoredConfig, readJsonBody, str } from "@/lib/landing/server"
import type { DeployLogLine, DeployRecord, DeployStatus } from "@/lib/landing/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function toDeployRecord(d: SiteDeploy): DeployRecord {
  let logs: DeployLogLine[] = []
  try {
    const parsed: unknown = JSON.parse(d.logs)
    if (Array.isArray(parsed)) logs = parsed as DeployLogLine[]
  } catch {
    logs = []
  }
  return {
    id: d.id,
    projectId: d.projectId,
    status: d.status as DeployStatus,
    url: d.url,
    logs,
    durationMs: d.durationMs,
    createdAt: d.createdAt.toISOString(),
  }
}

export async function GET(req: NextRequest) {
  return guard(async () => {
    const sp = req.nextUrl.searchParams
    const projectId = sp.get("projectId")
    const id = sp.get("id")
    if (!projectId && !id) throw new HttpError(400, "Provide 'projectId' or 'id' query parameter")

    let row: SiteDeploy | null = null
    if (id) {
      row = await db.siteDeploy.findUnique({ where: { id } })
    } else {
      row = await db.siteDeploy.findFirst({
        where: { projectId: projectId as string },
        orderBy: { createdAt: "desc" },
      })
    }
    return NextResponse.json({ deploy: row ? toDeployRecord(row) : null })
  })
}

async function runPipeline(deployId: string, projectId: string): Promise<void> {
  try {
    const project = await db.site.findUnique({ where: { id: projectId } })
    if (!project) throw new Error("Site no longer exists")
    const config = parseStoredConfig(project.config)

    const logs: DeployLogLine[] = []
    const startedAt = Date.now()
    const log = (msg: string, level: DeployLogLine["level"] = "info"): DeployLogLine => ({
      t: new Date().toISOString(),
      msg,
      level,
    })
    const update = async (
      status: DeployStatus,
      line?: DeployLogLine,
      extra: { url?: string | null; durationMs?: number } = {}
    ) => {
      if (line) logs.push(line)
      await db.siteDeploy.update({
        where: { id: deployId },
        data: {
          status,
          logs: JSON.stringify(logs),
          ...(extra.url !== undefined ? { url: extra.url } : {}),
          ...(extra.durationMs !== undefined ? { durationMs: extra.durationMs } : {}),
        },
      })
    }

    await update("building", log("Cloning landing config…"))
    await sleep(700 + Math.random() * 400)
    await update("building", log(`Resolving ${config.sections.length} sections, theme ${config.themeId}`))
    await sleep(700 + Math.random() * 400)
    await update("building", log("Installing dependencies… bun install"))
    await sleep(700 + Math.random() * 400)
    await update("building", log("Done in 1.2s", "success"))
    await sleep(700 + Math.random() * 400)
    await update("building", log("Building Next.js project… ▲ turbopack"))
    await sleep(700 + Math.random() * 400)
    await update("building", log("Compiled successfully", "success"))
    await sleep(700 + Math.random() * 400)
    await update("building", log("Optimizing images & fonts"))
    await sleep(700 + Math.random() * 400)
    await update("building", log("Uploading to edge network…"))
    await sleep(700 + Math.random() * 400)
    const url = `https://${project.slug}.landing-forge.app`
    await update("live", log(`🚀 Live at ${url}`, "success"), { url, durationMs: Date.now() - startedAt })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    try {
      await db.siteDeploy.update({
        where: { id: deployId },
        data: {
          status: "failed",
          logs: JSON.stringify([
            { t: new Date().toISOString(), msg: `SiteDeploy failed: ${msg}`, level: "warn" },
          ]),
        },
      })
    } catch {
      /* swallow — pipeline already dead */
    }
  }
}

export async function POST(req: NextRequest) {
  return guard(async () => {
    const body = await readJsonBody(req)
    const projectId = str(body.projectId)
    if (!projectId) throw new HttpError(400, "Missing 'projectId'")
    const project = await db.site.findUnique({ where: { id: projectId } })
    if (!project) throw new HttpError(404, "Site not found")

    // safety: refuse double-runs while a fresh build is in flight
    const inFlight = await db.siteDeploy.findFirst({
      where: {
        projectId,
        status: { in: ["queued", "building"] },
        createdAt: { gte: new Date(Date.now() - 120_000) },
      },
      orderBy: { createdAt: "desc" },
    })
    if (inFlight) {
      return NextResponse.json(
        {
          deploy: toDeployRecord(inFlight),
          reused: true,
          message: "A deploy is already in progress for this project",
        },
        { status: 200 }
      )
    }

    // heal stale builds (server restarted mid-deploy) so we can start fresh
    await db.siteDeploy.updateMany({
      where: { projectId, status: { in: ["queued", "building"] } },
      data: {
        status: "failed",
        logs: JSON.stringify([
          { t: new Date().toISOString(), msg: "SiteDeploy interrupted (stale build cleaned up)", level: "warn" },
        ]),
      },
    })

    const deploy = await db.siteDeploy.create({ data: { projectId, status: "queued", logs: "[]" } })
    // detached — the dev server is long-running, so the pipeline keeps updating the row
    void runPipeline(deploy.id, projectId)
    return NextResponse.json({ deploy: toDeployRecord(deploy) }, { status: 201 })
  })
}
