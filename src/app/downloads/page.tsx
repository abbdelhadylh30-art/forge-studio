import { readFile } from "node:fs/promises"
import path from "node:path"

// Local-only helper page (untracked): lists project backup zips served from
// public/downloads. The static files themselves are gitignored.
const FILES = [
  {
    name: "forge-studio-v1.6.0-source.zip",
    desc: "Clean source — exactly the GitHub repo state. Run `bun install` and develop.",
    tag: "Source",
  },
  {
    name: "forge-studio-v1.6.0-full-backup.zip",
    desc: "Everything: source + full git history + SQLite database (db/custom.db) + v21 upload + skills assets.",
    tag: "Full backup",
  },
]

async function fileSize(name: string): Promise<number | null> {
  try {
    const st = await readFile(path.join(process.cwd(), "public", "downloads", name))
    return st.byteLength
  } catch {
    return null
  }
}

function fmt(bytes: number): string {
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export default async function DownloadsPage() {
  const files = await Promise.all(
    FILES.map(async (f) => ({ ...f, size: await fileSize(f.name) })),
  )
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-8">
      <div className="w-full max-w-xl space-y-6">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-400">Forge Studio</p>
          <h1 className="text-2xl font-bold">Project downloads</h1>
          <p className="text-sm text-zinc-400">
            Build artifacts served locally. Download while this session is running.
          </p>
        </div>
        <div className="space-y-3">
          {files.map((f) => (
            <a
              key={f.name}
              href={`/downloads/${f.name}`}
              className="block rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 hover:border-violet-500/50 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-sm text-zinc-200">{f.name}</span>
                <span className="shrink-0 rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400">
                  {f.tag}{f.size ? ` · ${fmt(f.size)}` : ""}
                </span>
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-400">{f.desc}</p>
            </a>
          ))}
        </div>
        <p className="text-xs text-zinc-600">
          Verify the full backup: MD5 <code className="font-mono">3c02efc025095c9541ee12a73753386b</code>
        </p>
      </div>
    </main>
  )
}
