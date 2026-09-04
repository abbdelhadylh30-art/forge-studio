"use client"

/**
 * Live relay client (socket.io → mini-services/analytics-live, port 3003).
 *
 * Two roles:
 *  • visitor   — the published page joins with its pageview id and streams
 *                heartbeats (duration/engagement) while it is open.
 *  • dashboard — the Analytics view subscribes and receives presence pushes
 *                (visit:new / visit:update / visit:leave) plus event:new for
 *                instant chart refreshes. Falls back silently to REST polling
 *                whenever the relay is unreachable.
 *
 * The connection always goes through the Caddy gateway via the
 * XTransformPort query — never a direct host:port URL.
 */

import * as React from "react"
import { io, type Socket } from "socket.io-client"
import type { LiveVisit } from "@/lib/landing/types"

// DO NOT change the path — Caddy forwards /?XTransformPort=3003 to the relay
const RELAY_URL = "/?XTransformPort=3003"

export interface WireVisit {
  id: string
  projectId: string
  device: string
  browser: string
  country: string
  referrer: string
  variant: string | null
  startedAt: number // epoch ms
  lastActive: number // epoch ms
  durationSec: number
  engaged: boolean
  socketId: string | null
}

function wireToLiveVisit(v: WireVisit): LiveVisit {
  return {
    id: v.id,
    device: v.device,
    browser: v.browser,
    country: v.country,
    referrer: v.referrer,
    variant: v.variant,
    durationSec: v.durationSec,
    startedAt: new Date(v.startedAt).toISOString(),
    lastActive: new Date(v.lastActive).toISOString(),
  }
}

function connect(): Socket {
  return io(RELAY_URL, {
    path: "/",
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    timeout: 8000,
  })
}

// ── visitor side (published page) ────────────────────────────────────────────

export interface VisitorRelay {
  connected: boolean
  /** Piggyback on engagement pings — keeps presence fresh + durations live. */
  heartbeat: (durationSec: number, engaged?: boolean) => void
}

export function useVisitorRelay(params: {
  projectId: string | null
  pageviewId: string | null
  device: string
  browser: string
  variant: string | null
  path: string
  referrer: string
}): VisitorRelay {
  const [connected, setConnected] = React.useState(false)
  const socketRef = React.useRef<Socket | null>(null)
  const joinedRef = React.useRef<string | null>(null)
  const metaRef = React.useRef(params)
  React.useEffect(() => {
    metaRef.current = params
  })

  // connect as soon as the project is known
  React.useEffect(() => {
    if (!params.projectId) return
    const socket = connect()
    socketRef.current = socket
    const onConnect = () => {
      setConnected(true)
      // (re)join if we already know our pageview id (also covers reconnects)
      const { pageviewId } = metaRef.current
      if (pageviewId && joinedRef.current !== pageviewId) {
        joinedRef.current = pageviewId
        const m = metaRef.current
        socket.emit("visit:join", {
          projectId: m.projectId,
          pageviewId,
          device: m.device,
          browser: m.browser,
          country: "US",
          referrer: m.referrer,
          variant: m.variant,
          path: m.path,
        })
      }
    }
    const onDisconnect = () => setConnected(false)
    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)
    return () => {
      socket.off("connect", onConnect)
      socket.off("disconnect", onDisconnect)
      socket.disconnect()
      socketRef.current = null
      joinedRef.current = null
      setConnected(false)
    }
  }, [params.projectId])

  // join once the pageview id exists (the connect effect handles re-join)
  React.useEffect(() => {
    if (!params.projectId || !params.pageviewId || !connected) return
    const socket = socketRef.current
    if (!socket || joinedRef.current === params.pageviewId) return
    joinedRef.current = params.pageviewId
    socket.emit("visit:join", {
      projectId: params.projectId,
      pageviewId: params.pageviewId,
      device: params.device,
      browser: params.browser,
      country: "US",
      referrer: params.referrer,
      variant: params.variant,
      path: params.path,
    })
  }, [params.projectId, params.pageviewId, connected, params.device, params.browser, params.variant, params.path, params.referrer])

  const heartbeat = React.useCallback((durationSec: number, engaged?: boolean) => {
    const socket = socketRef.current
    const id = joinedRef.current
    if (!socket || !socket.connected || !id) return
    socket.emit("visit:heartbeat", { pageviewId: id, durationSec, engaged: engaged === true })
  }, [])

  return { connected, heartbeat }
}

// ── dashboard side (Analytics view) ──────────────────────────────────────────

export interface RelayEvent {
  type: string
  label: string
  variant: string | null
  at: number
}

export interface DashboardRelay {
  connected: boolean
  /** WS presence, normalized to the REST LiveVisit shape (sorted longest-first). */
  visits: LiveVisit[]
  /** Count of relay events seen (any kind) — use as a refresh trigger. */
  signals: number
  /** The most recent event (CTA clicks, form submits, pageviews…). */
  lastEvent: RelayEvent | null
  /** Visits the relay reported as LEFT while connected (last 90s) — REST
   *  fallback rows with these ids are suppressed so departures are instant. */
  leftIds: Set<string>
}

export function useDashboardRelay(projectId: string | null, enabled: boolean): DashboardRelay {
  const [connected, setConnected] = React.useState(false)
  const [visits, setVisits] = React.useState<LiveVisit[]>([])
  const [signals, setSignals] = React.useState(0)
  const [lastEvent, setLastEvent] = React.useState<RelayEvent | null>(null)
  // leave-decisions: timestamps live in a ref (touched only from handlers),
  // the id SET is state so the merge re-derives without reading refs in render
  const leftTimesRef = React.useRef(new Map<string, number>())
  const [leftIds, setLeftIds] = React.useState<Set<string>>(new Set())

  const markLeft = React.useCallback((id: string) => {
    leftTimesRef.current.set(id, Date.now())
    setLeftIds((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  const markPresent = React.useCallback((id: string) => {
    leftTimesRef.current.delete(id)
    setLeftIds((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  // prune stale left-ids every 15s so the set stays bounded & time-scoped
  React.useEffect(() => {
    const t = setInterval(() => {
      const now = Date.now()
      let changed = false
      for (const [id, at] of leftTimesRef.current) {
        if (now - at > 90_000) {
          leftTimesRef.current.delete(id)
          changed = true
        }
      }
      if (changed) setLeftIds(new Set(leftTimesRef.current.keys()))
    }, 15_000)
    return () => clearInterval(t)
  }, [])

  React.useEffect(() => {
    if (!projectId || !enabled) {
      setConnected(false)
      setVisits([])
      return
    }
    const socket = connect()

    const onConnect = () => {
      setConnected(true)
      socket.emit("dash:subscribe", { projectId })
    }
    const onDisconnect = () => {
      setConnected(false)
      setVisits([]) // stop showing possibly-stale presence
    }
    const onSnapshot = (data: { visits: WireVisit[] }) => {
      for (const v of data.visits ?? []) markPresent(v.id)
      setVisits((data.visits ?? []).map(wireToLiveVisit).sort((a, b) => b.durationSec - a.durationSec))
    }
    const onVisitNew = (data: { visit: WireVisit }) => {
      markPresent(data.visit.id)
      setVisits((prev) => {
        const next = prev.filter((v) => v.id !== data.visit.id)
        next.push(wireToLiveVisit(data.visit))
        return next.sort((a, b) => b.durationSec - a.durationSec)
      })
      setSignals((n) => n + 1)
    }
    const onVisitUpdate = (data: { id: string; durationSec: number; engaged: boolean }) => {
      setVisits((prev) => {
        const hit = prev.find((v) => v.id === data.id)
        if (!hit) return prev
        if (hit.durationSec === data.durationSec) return prev
        return prev.map((v) => (v.id === data.id ? { ...v, durationSec: data.durationSec } : v))
      })
    }
    const onVisitLeave = (data: { id: string }) => {
      markLeft(data.id)
      setVisits((prev) => prev.filter((v) => v.id !== data.id))
    }
    const onEventNew = (data: RelayEvent) => {
      setLastEvent(data)
      setSignals((n) => n + 1)
    }

    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)
    socket.on("presence:snapshot", onSnapshot)
    socket.on("visit:new", onVisitNew)
    socket.on("visit:update", onVisitUpdate)
    socket.on("visit:leave", onVisitLeave)
    socket.on("event:new", onEventNew)

    return () => {
      socket.off("connect", onConnect)
      socket.off("disconnect", onDisconnect)
      socket.off("presence:snapshot", onSnapshot)
      socket.off("visit:new", onVisitNew)
      socket.off("visit:update", onVisitUpdate)
      socket.off("visit:leave", onVisitLeave)
      socket.off("event:new", onEventNew)
      socket.disconnect()
      setConnected(false)
      setVisits([])
      leftTimesRef.current.clear()
      setLeftIds(new Set())
    }
  }, [projectId, enabled, markLeft, markPresent])

  return { connected, visits, signals, lastEvent, leftIds }
}

/** Merge REST-poll live visits with WS presence (WS wins on id collisions;
 *  REST rows the relay reported as LEFT are suppressed while fresh). */
export function mergeLiveVisits(rest: LiveVisit[] | undefined, ws: LiveVisit[], leftIds?: Set<string>): LiveVisit[] {
  if (!ws.length) {
    const filtered = (rest ?? []).filter((v) => !leftIds?.has(v.id))
    return filtered
  }
  const wsIds = new Set(ws.map((v) => v.id))
  const merged = [...(rest ?? []).filter((v) => !wsIds.has(v.id) && !leftIds?.has(v.id)), ...ws]
  return merged.sort((a, b) => b.durationSec - a.durationSec)
}
