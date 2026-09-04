// ─────────────────────────────────────────────────────────────────────────────
// analytics-live — real-time relay for landing-forge studio
//
//   • port 3003 — socket.io (path "/") for BROWSERS via the Caddy gateway
//                 (visitors on published pages + the Analytics dashboard)
//   • port 3004 — plain HTTP, 127.0.0.1 only, for the Next.js app
//                 POST /ingest  { kind: pageview|engagement|event, projectId, … }
//                 GET  /health
//
// Browser protocol:
//   visitor   → visit:join { projectId, pageviewId, device, browser, country,
//                            referrer, variant, durationSec? }
//               visit:heartbeat { pageviewId, durationSec, engaged? }
//   dashboard → dash:subscribe { projectId }
//   ← presence:snapshot { visits } · visit:new { visit } · visit:update
//     visit:leave { id } · event:new { type, label, variant, at }
//
// ALSO HOSTS the dev-server watchdog (bottom of this file): this relay is
// supervisor-started and therefore PERSISTS, while processes spawned from
// agent bash commands are reaped — so the watchdog that keeps the Next.js
// dev server alive + warm lives here.
// ─────────────────────────────────────────────────────────────────────────────
import { createServer, type IncomingMessage, type ServerResponse } from "http"
import { Server, type Socket } from "socket.io"

const WS_PORT = 3003 // browsers — Caddy: /?XTransformPort=3003
const HTTP_PORT = 3004 // server-to-server only (Next.js track API)

interface LiveVisitWire {
  id: string // pageview record id — the join key everywhere
  projectId: string
  device: string
  browser: string
  country: string
  referrer: string
  variant: string | null
  startedAt: number
  lastActive: number
  durationSec: number
  engaged: boolean
  socketId: string | null // null = soft presence (ingest-created), pruned faster
}

const presence = new Map<string, LiveVisitWire>() // pageviewId → visit
let dashCount = 0

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v ? v.slice(0, 120) : fallback
}

function projectRooms(): string[] {
  const set = new Set<string>()
  for (const v of presence.values()) set.add(v.projectId)
  return [...set]
}

function toWire(v: LiveVisitWire): LiveVisitWire {
  const wall = Math.floor((Date.now() - v.startedAt) / 1000)
  return { ...v, durationSec: Math.max(v.durationSec, wall) }
}

// ── internal HTTP (3004) — ingest + health ─────────────────────────────────
const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url ?? "/", `http://127.0.0.1:${HTTP_PORT}`)

  if (url.pathname === "/health") {
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify({ ok: true, visitors: presence.size, dashboards: dashCount, projects: projectRooms() }))
    return
  }

  if (url.pathname === "/ingest" && req.method === "POST") {
    let body = ""
    req.on("data", (chunk: Buffer) => {
      body += chunk.toString()
      if (body.length > 32_000) req.destroy() // guard: never buffer huge payloads
    })
    req.on("end", () => {
      try {
        const data = JSON.parse(body || "{}")
        if (typeof data.projectId === "string" && data.projectId) {
          handleIngest(data)
          res.writeHead(200, { "content-type": "application/json" })
          res.end(JSON.stringify({ ok: true }))
        } else {
          res.writeHead(400, { "content-type": "application/json" })
          res.end(JSON.stringify({ error: "Missing 'projectId'" }))
        }
      } catch {
        res.writeHead(400, { "content-type": "application/json" })
        res.end(JSON.stringify({ error: "Invalid JSON" }))
      }
    })
    return
  }

  res.writeHead(404, { "content-type": "application/json" })
  res.end(JSON.stringify({ error: "Not found" }))
})

function handleIngest(data: Record<string, unknown>) {
  const projectId = data.projectId as string

  // a durable pageview landed — if the visitor holds no socket yet (or can't),
  // still surface them to dashboards via a soft presence entry
  if (data.kind === "pageview" && typeof data.id === "string") {
    const existing = presence.get(data.id)
    if (!existing) {
      const visit: LiveVisitWire = {
        id: data.id,
        projectId,
        device: str(data.device, "desktop"),
        browser: str(data.browser, "Chrome"),
        country: str(data.country, "US"),
        referrer: str(data.referrer, "direct"),
        variant: typeof data.variant === "string" ? data.variant : null,
        startedAt: Date.now(),
        lastActive: Date.now(),
        durationSec: 0,
        engaged: false,
        socketId: null, // soft presence — pruned by the 45s inactivity sweep
      }
      presence.set(visit.id, visit)
      io.to(`dash:${projectId}`).emit("visit:new", { visit: toWire(visit) })
      console.log(`[ingest] soft presence ${visit.id} (${visit.country} · ${visit.browser})`)
    }
  }

  if (data.kind === "engagement" && typeof data.id === "string") {
    const visit = presence.get(data.id)
    if (visit && typeof data.duration === "number" && data.duration > visit.durationSec) {
      visit.durationSec = Math.floor(data.duration)
      visit.lastActive = Date.now()
    }
    io.to(`dash:${projectId}`).emit("visit:update", {
      id: data.id,
      durationSec: typeof data.duration === "number" ? Math.floor(data.duration) : 0,
      engaged: data.engaged === true,
    })
  }

  if (data.kind === "event" && typeof data.type === "string") {
    io.to(`dash:${projectId}`).emit("event:new", {
      type: data.type,
      label: str(data.label, ""),
      variant: typeof data.variant === "string" ? data.variant : null,
      at: Date.now(),
    })
  }
}

// ── socket.io (3003) — browser connections ─────────────────────────────────
// DO NOT change the path — Caddy forwards /?XTransformPort=3003 to this port
const wsServer = createServer()
const io = new Server(wsServer, {
  path: "/",
  cors: { origin: "*", methods: ["GET", "POST"] },
  pingInterval: 25_000,
  pingTimeout: 20_000,
  maxHttpBufferSize: 64_000,
})

io.on("connection", (socket: Socket) => {
  let role: "visitor" | "dashboard" | null = null
  let projectId: string | null = null
  let myVisitId: string | null = null

  socket.on("visit:join", (data: Record<string, unknown>) => {
    const pid = typeof data.projectId === "string" ? data.projectId : ""
    const id = typeof data.pageviewId === "string" ? data.pageviewId : ""
    if (!pid || !id) return
    role = "visitor"
    projectId = pid
    myVisitId = id
    socket.join(`room:${pid}`)

    const prev = presence.get(id)
    const visit: LiveVisitWire = {
      id,
      projectId: pid,
      device: str(data.device, "desktop"),
      browser: str(data.browser, "Chrome"),
      country: str(data.country, "US"),
      referrer: str(data.referrer, "direct"),
      variant: typeof data.variant === "string" ? data.variant : null,
      startedAt: prev?.startedAt ?? Date.now(),
      lastActive: Date.now(),
      durationSec: typeof data.durationSec === "number" ? Math.max(0, Math.floor(data.durationSec)) : (prev?.durationSec ?? 0),
      engaged: data.engaged === true || (prev?.engaged ?? false),
      socketId: socket.id,
    }
    presence.set(id, visit)
    io.to(`dash:${pid}`).emit("visit:new", { visit: toWire(visit) })
    console.log(`[visit] ${id} joined ${pid} (${visit.country} · ${visit.browser}${visit.variant ? " · v" + visit.variant : ""})`)
  })

  socket.on("visit:heartbeat", (data: Record<string, unknown>) => {
    const id = typeof data.pageviewId === "string" ? data.pageviewId : myVisitId
    if (!id) return
    const visit = presence.get(id)
    const durationSec = typeof data.durationSec === "number" ? Math.max(0, Math.floor(data.durationSec)) : 0
    const engaged = data.engaged === true
    if (visit) {
      visit.lastActive = Date.now()
      visit.engaged = visit.engaged || engaged
      if (durationSec > visit.durationSec) visit.durationSec = durationSec
      if (visit.socketId === null) visit.socketId = socket.id // soft→hard upgrade
    }
    if (projectId) {
      io.to(`dash:${projectId}`).emit("visit:update", {
        id,
        durationSec: Math.max(durationSec, visit?.durationSec ?? 0),
        engaged: (visit?.engaged ?? false) || engaged,
      })
    }
  })

  socket.on("dash:subscribe", (data: Record<string, unknown>) => {
    const pid = typeof data.projectId === "string" ? data.projectId : ""
    if (!pid) return
    role = "dashboard"
    projectId = pid
    dashCount += 1
    socket.join(`dash:${pid}`)
    const visits = [...presence.values()].filter((v) => v.projectId === pid).map(toWire)
    socket.emit("presence:snapshot", { visits })
    console.log(`[dash] ${socket.id} subscribed to ${pid} (${visits.length} live)`)
  })

  socket.on("disconnect", () => {
    if (role === "dashboard") dashCount = Math.max(0, dashCount - 1)
    if (role === "visitor" && myVisitId) {
      const visit = presence.get(myVisitId)
      // only act if THIS socket owned it (protects against refresh races)
      if (visit && visit.socketId === socket.id) {
        presence.delete(myVisitId)
        io.to(`dash:${visit.projectId}`).emit("visit:leave", { id: visit.id })
        console.log(`[visit] ${myVisitId} left (${visit.country} · ${visit.browser})`)
      }
    }
  })
})

// ── inactivity sweep + status heartbeat ────────────────────────────────────
function pruneSweep() {
  const now = Date.now()
  for (const [id, v] of presence) {
    // socket-backed presence: any signal (incl. socket-level pings) keeps it alive;
    // soft presence: relies on the 15s REST engagement pings, so 45s grace
    const grace = v.socketId ? 60_000 : 45_000
    if (now - v.lastActive > grace) {
      presence.delete(id)
      io.to(`dash:${v.projectId}`).emit("visit:leave", { id })
      console.log(`[sweep] pruned ${id} (${v.country} · ${v.browser}) — inactive ${Math.round((now - v.lastActive) / 1000)}s`)
    }
  }
}

setInterval(pruneSweep, 15_000)
setInterval(() => {
  console.log(`[status] visitors=${presence.size} dashboards=${dashCount} projects=[${projectRooms().join(", ")}]`)
}, 30_000)

// ── boot ───────────────────────────────────────────────────────────────────
httpServer.listen(HTTP_PORT, "127.0.0.1", () => {
  console.log(`internal ingest on 127.0.0.1:${HTTP_PORT} (/ingest, /health)`)
})

wsServer.listen(WS_PORT, () => {
  console.log(`analytics-live relay listening on :${WS_PORT} (socket.io path "/")`)
})

// ── dev-server watchdog (persistent home) ───────────────────────────────────
// This relay is supervisor-started and therefore PERSISTS, while processes
// spawned from agent bash commands are reaped. So the dev-server watchdog
// is hosted HERE: a one-time, hot-reload-guarded spawn of
// .zscripts/dev-warmup-loop.sh — a self-supervising shell loop that runs
// .zscripts/dev-warmup.ts forever (it polls /api/health, warms the Next.js
// compile cache whenever the dev server (re)appears so the next human page
// load is instant instead of a 10-20s "renders but not clickable" window,
// and restarts `bun run dev` if it stays down > 60s).
//
// No timers live in this module on purpose: bun --hot code swaps have
// timer-lifecycle quirks, and children spawned by THIS process are both
// persistent and immune to them. The globalThis guard prevents double
// spawns across hot reloads.
import { spawn } from "node:child_process"

const wspawn = globalThis as typeof globalThis & { __lfWatchLoopSpawned?: boolean }
if (!wspawn.__lfWatchLoopSpawned) {
  wspawn.__lfWatchLoopSpawned = true
  try {
    const child = spawn(
      "bash",
      ["-c", "nohup sh /home/z/my-project/.zscripts/dev-warmup-loop.sh >/dev/null 2>&1 &"],
      { detached: true, stdio: "ignore" },
    )
    child.unref()
    console.log("[watch] dev-server watchdog loop spawned (via relay)")
  } catch (e) {
    console.log(`[watch] watchdog loop spawn FAILED: ${String(e)}`)
  }
}
