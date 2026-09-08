"use client"

// ─────────────────────────────────────────────────────────────────────────────
// /unlock — studio passcode page. Shown by the proxy when STUDIO_PASSCODE is
// set and the visitor has no valid cookie. Reads ?from= for a post-unlock
// redirect; falls back to "/".
// ─────────────────────────────────────────────────────────────────────────────
import { useState, type FormEvent } from "react"

export default function UnlockPage() {
  const [passcode, setPasscode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      })
      if (res.ok) {
        const from = new URLSearchParams(window.location.search).get("from")
        const dest = from && from.startsWith("/") && !from.startsWith("//") ? from : "/"
        window.location.replace(dest)
        return
      }
      const data = (await res.json().catch(() => null)) as { error?: string } | null
      setError(data?.error ?? "Unlock failed.")
    } catch {
      setError("Network error — try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl"
      >
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-400">
            Forge Studio
          </p>
          <h1 className="text-xl font-bold">This studio is locked</h1>
          <p className="text-sm text-zinc-400">
            Enter the studio passcode to continue. Published pages stay public.
          </p>
        </div>

        <input
          type="password"
          name="passcode"
          autoFocus
          autoComplete="current-password"
          placeholder="Passcode"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm outline-none placeholder:text-zinc-600 focus:border-violet-500"
        />

        {error ? (
          <p className="text-[13px] text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy || passcode.length === 0}
          className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Unlocking…" : "Unlock studio"}
        </button>
      </form>
    </main>
  )
}
