// ─────────────────────────────────────────────────────────────────────────────
// check-turso-state — final-state audit of the hosted production DB.
//
// After the E2E suite, the database must contain exactly the intended
// production baseline: the G-SHOCK showcase demo site, and ZERO leftover
// rows from any test (views / events / leads all cascade-deleted).
//
// Env: DATABASE_URL (libsql://…), DATABASE_AUTH_TOKEN
// Run: DATABASE_URL=… DATABASE_AUTH_TOKEN=… bun scripts/check-turso-state.ts
// ─────────────────────────────────────────────────────────────────────────────
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { PrismaClient } from '@prisma/client'

async function main() {
  const url = process.env.DATABASE_URL?.trim()
  const authToken = process.env.DATABASE_AUTH_TOKEN?.trim()
  if (!url || !authToken) throw new Error('DATABASE_URL + DATABASE_AUTH_TOKEN required')

  const db = new PrismaClient({ adapter: new PrismaLibSQL({ url, authToken }), log: ['error'] })
  const [sites, views, events, leads] = await Promise.all([
    db.site.count(),
    db.siteView.count(),
    db.siteEvent.count(),
    db.siteLead.count(),
  ])
  const gshock = await db.site.findUnique({ where: { slug: 'g-shock-ga-b2100-noir' }, select: { name: true, slug: true } })

  console.log(`sites=${sites}  views=${views}  events=${events}  leads=${leads}`)
  console.log(`showcase: ${gshock ? `${gshock.name} (${gshock.slug})` : 'MISSING'}`)

  const problems: string[] = []
  if (sites !== 1) problems.push(`expected exactly 1 site (the demo), got ${sites}`)
  if (views !== 0 || events !== 0 || leads !== 0) problems.push('leftover test rows detected')
  if (!gshock) problems.push('G-SHOCK demo site missing')

  await db.$disconnect()
  if (problems.length) {
    console.error('STATE PROBLEMS:', problems.join('; '))
    process.exit(1)
  }
  console.log('\nHOSTED DB STATE OK — production baseline in place')
}

main().catch((e) => {
  console.error('CHECK FAILED:', e?.message ?? e)
  process.exit(1)
})
