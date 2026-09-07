// ─────────────────────────────────────────────────────────────────────────────
// seedDemo — server-side idempotent demo-site seeding.
// ⚠ SERVER ONLY: imports Prisma. Never import from client components.
//
// Vercel runs one ephemeral SQLite per serverless instance, so a fresh cold
// instance has an empty database: the G-SHOCK demo project (and its published
// page /p/g-shock-ga-b2100-noir) would 404 depending on which instance serves
// the request. Seeding right after schema provisioning makes the demo project
// exist on EVERY instance, always — the "website doesn't have it / it
// disappeared" class of per-instance data volatility disappears for the demo.
//
// Contract:
//  - memoized once per process (same pattern as ensureSchema)
//  - idempotent by slug — never duplicates, never overwrites user edits
//    (if a project with the slug exists, the seed is a no-op)
//  - NEVER throws — failure logs a warning and resets so a later request
//    can retry; callers can fire-and-forget or await safely
// ─────────────────────────────────────────────────────────────────────────────
import { db } from "@/lib/db"
import { buildGshockLaunch } from "./gshockTemplate"
import { slugify } from "./defaults"
import { normalizeConfig } from "./yaml"

export const DEMO_SITE_NAME = "G-SHOCK GA-B2100 NOIR"
export const DEMO_SITE_SLUG = slugify(DEMO_SITE_NAME)

const globalForSeed = globalThis as unknown as {
  demoSeedReady: Promise<void> | undefined
}

/** Create the demo project if (and only if) its slug is missing. */
async function seedOnce(): Promise<void> {
  const existing = await db.site.findUnique({ where: { slug: DEMO_SITE_SLUG } })
  if (existing) return
  const config = normalizeConfig(buildGshockLaunch())
  await db.site.create({
    data: {
      name: DEMO_SITE_NAME,
      slug: DEMO_SITE_SLUG,
      config: JSON.stringify(config),
    },
  })
}

/** Seed the demo site once per process; safe to call on every request. */
export function seedDemoSite(): Promise<void> {
  if (!globalForSeed.demoSeedReady) {
    globalForSeed.demoSeedReady = seedOnce().catch((err) => {
      // reset so a later request can retry after a transient failure
      globalForSeed.demoSeedReady = undefined
      console.warn(
        "[seed] demo site seeding skipped:",
        err instanceof Error ? err.message : err
      )
    })
  }
  return globalForSeed.demoSeedReady
}
