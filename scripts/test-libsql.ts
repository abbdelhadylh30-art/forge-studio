// ─────────────────────────────────────────────────────────────────────────────
// test-libsql — smoke test for the Prisma↔libSQL driver adapter path.
//
// Exercises the EXACT code path production will use for Turso (libsql:// URL
// → PrismaLibSQL adapter → PrismaClient) against a local file database, so
// the adapter wiring is validated before any hosted URL exists.
//
// Run: bun scripts/test-libsql.ts
// ─────────────────────────────────────────────────────────────────────────────
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { PrismaClient } from '@prisma/client'
import { SCHEMA_STATEMENTS } from '../src/lib/db-schema'

async function main() {
  const url = 'file:/tmp/forge-libsql-smoke.db'

  const adapter = new PrismaLibSQL({ url })
  const db = new PrismaClient({ adapter, log: ['error'] })

  // 1. ensureSchema(): full DDL bootstrap through the adapter
  for (const stmt of SCHEMA_STATEMENTS) {
    await db.$executeRawUnsafe(stmt)
  }
  console.log('✓ schema bootstrap (DDL × raw execute)')

  // 2. create + read back (cuid ids, JSON config column)
  const site = await db.site.create({
    data: { name: 'Turso Smoke', slug: 'turso-smoke', config: '{"brand":{"name":"smoke"}}' },
  })
  const found = await db.site.findUnique({ where: { id: site.id } })
  if (!found || found.name !== 'Turso Smoke') throw new Error('read-back failed')
  console.log('✓ create / findUnique', { id: site.id })

  // 3. update with @updatedAt (client-side managed timestamp through adapter)
  const upd = await db.site.update({ where: { id: site.id }, data: { name: 'Turso Smoke 2' } })
  if (upd.name !== 'Turso Smoke 2') throw new Error('update failed')
  console.log('✓ update (@updatedAt)')

  // 4. relations + cascade delete
  await db.siteView.create({
    data: { projectId: site.id, duration: 12, device: 'mobile', isBounce: false },
  })
  await db.siteEvent.create({ data: { projectId: site.id, type: 'cta_click', label: 'hero' } })
  const events = await db.siteEvent.findMany({ where: { projectId: site.id } })
  if (events.length !== 1) throw new Error('relation rows missing')
  await db.site.delete({ where: { id: site.id } })
  const orphanViews = await db.siteView.count({ where: { projectId: site.id } })
  if (orphanViews !== 0) throw new Error('cascade delete failed')
  console.log('✓ relations + cascade delete')

  // 5. count / findMany
  const count = await db.site.count()
  console.log('✓ count — remaining sites:', count)

  await db.$disconnect()
  console.log('\nLIBSQL ADAPTER SMOKE OK')
}

main().catch((e) => {
  console.error('SMOKE FAILED:', e)
  process.exit(1)
})
