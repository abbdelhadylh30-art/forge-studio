import Link from "next/link"

export default function NotFound() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-400">
          Forge Studio
        </p>
        <h1 className="text-5xl font-bold tracking-tight">404</h1>
        <p className="text-sm text-zinc-400">
          This page doesn&apos;t exist — the link may be outdated or the page was unpublished.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
        >
          Back to the studio
        </Link>
      </div>
    </main>
  )
}
