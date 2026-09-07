"use client"

import * as React from "react"
import Link from "next/link"
import { AlertTriangle, Home, RotateCcw } from "lucide-react"

/**
 * Root App Router error boundary — the last-resort net.
 *
 * Before this file existed, any uncaught render error in a client view (e.g. a
 * malformed site config reaching the studio) unmounted the entire app with no
 * recovery UI. Now the user gets a friendly card with a one-click retry and a
 * path back to the dashboard instead of a dead page.
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error("[forge-studio] unhandled render error:", error)
  }, [error])

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-6 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/80 p-8 text-center shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-lg font-bold text-slate-900 dark:text-zinc-100">
          Something broke while rendering
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
          The app hit an unexpected error. Your saved projects are safe — this
          only interrupted the current screen. Try again, or head back to the
          dashboard and reopen your project.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-[10px] text-slate-400 dark:text-zinc-600">
            ref: {error.digest}
          </p>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 px-5 text-sm font-semibold text-white shadow-md shadow-violet-500/25 transition-colors hover:from-violet-700 hover:to-fuchsia-600"
          >
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
          <Link
            href="/"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:border-violet-300 hover:text-violet-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-violet-500/40 dark:hover:text-violet-200"
          >
            <Home className="h-4 w-4" /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
