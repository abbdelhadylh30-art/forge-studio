// ─────────────────────────────────────────────────────────────────────────────
// test-turso — hosted smoke test for the Turso (libsql://) production path.
//
// Runs the EXACT production sequence against the REAL hosted database:
//   1. ensureSchema() DDL bootstrap (idempotent — pre-provisions prod schema)
//   2. create / read / update (@updatedAt) / relations / cascade delete
//   3. cleans up every row it created, so the hosted DB is left pristine
//      (only the schema itself remains — exactly what first boot needs).
//
// Env:
//   DATABASE_URL=libsql://<db>-<org>.turso.io
//   DATABASE_AUTH_TOKEN=<turso token>
//
// Run: DATABASE_URL=… DATABASE_AUTH_TOKEN=… bun scripts/test-turso.ts
// ─────────────────────────────────────────────────────────────────────────────
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { PrismaClient } from '@prisma/client'
import { SCHEMA_STATEMENTS } from '../src/lib/db-schema'

async function main() {
  const url = process.env.DATABASE_URL?.trim()
  const authToken = process.env.DATABASE_AUTH_TOKEN?.trim()
  if (!url || !/^libsql:\/\//.test(url)) {
    throw new Error('DATABASE_URL must be a libsql://… URL')
  }
  if (!authToken) throw new Error('DATABASE_AUTH_TOKEN is required')
  console.log(`→ target: ${url}`)

  const t0 = Date.now()
  const adapter = new PrismaLibSQL({ url, authToken })
  const db = new PrismaClient({ adapter, log: ['error'] })

  // 1. ensureSchema(): full DDL bootstrap through the adapter (network path)
  for (const stmt of SCHEMA_STATEMENTS) {
    await db.$executeRawUnsafe(stmt)
  }
  console.log(`✓ schema bootstrap — ${SCHEMA_STATEMENTS.length} idempotent DDL statements (${Date.now() - t0}ms)`)

  // 2. create + read back (cuid ids, JSON config column)
  const site = await db.site.create({
    data: { name: 'Turso Hosted Smoke', slug: 'turso-hosted-smoke', config: '{"brand":{"name":"smoke"}}' },
  })
  const found = await db.site.findUnique({ where: { id: site.id } })
  if (!found || found.name !== 'Turso Hosted Smoke') throw new Error('read-back failed')
  console.log('✓ create / findUnique', { id: site.id })

  // 3. update with @updatedAt (client-side managed timestamp through adapter)
  const upd = await db.site.update({ where: { id: site.id }, data: { name: 'Turso Hosted Smoke 2' } })
  if (upd.name !== 'Turso Hosted Smoke 2') throw new Error('update failed')
  console.log('✓ update (@updatedAt)')

  // 4. relations + cascade delete
  await db.siteView.create({
    data: { projectId: site.id, duration: 12, device: 'mobile', isBounce: false },
  })
  await db.siteEvent.create({ data: { projectId: site.id, type: 'cta_click', label: 'hero' } })
  await db.siteLead.create({ data: { projectId: site.id, name: 'Smoke Lead', email: 'smoke@test' } })
  const events = await db.siteEvent.findMany({ where: { projectId: site.id } })
  if (events.length !== 1) throw new Error('relation rows missing')
  await db.site.delete({ where: { id: site.id } })
  const orphans =
    (await db.siteView.count({ where: { projectId: site.id } })) +
    (await db.siteEvent.count({ where: { projectId: site.id } })) +
    (await db.siteLead.count({ where: { projectId: site.id } }))
  if (orphans !== 0) throw new Error('cascade delete failed')
  console.log('✓ relations (view/event/lead) + cascade delete')

  // 5. list query shape used by every dashboard fetch
  const list = await db.site.findMany({ orderBy: { updatedAt: 'desc' }, take: 5 })
  console.log(`✓ findMany (dashboard list shape) — ${list.length} site(s) currently in the hosted DB`)

  await db.$disconnect()
  console.log(`\nTURSO HOSTED SMOKE OK (${Date.now() - t0}ms total) — DB left clean, schema provisioned for production`)
}

main().catch((e) => {
  console.error('SMOKE FAILED:', e?.message ?? e)
  process.exit(1)
})
