import { PrismaClient } from '@prisma/client'
import { SCHEMA_STATEMENTS } from './db-schema'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  schemaReady: Promise<void> | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Query logs are dev-only noise on serverless (and leak Prisma internals
    // into API error payloads); production keeps errors only.
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

/**
 * Provision the SQLite schema at runtime.
 *
 * Vercel (and any serverless host) starts with an empty / tmp SQLite file —
 * `prisma db push` never runs there, so every query would fail with
 * "table does not exist in the current database". This runs the exact DDL
 * `prisma db push` produces (see ./db-schema.ts), idempotently, once per
 * process (memoized on globalThis, survives Next.js module reloads in dev).
 *
 * Consequences: on serverless the database is per-instance and ephemeral —
 * each cold start re-provisions an empty schema and the client bootstrap
 * (demo site seeding) kicks in. That keeps every button working; durable
 * persistence still requires a real DB (Turso/Postgres) in DATABASE_URL.
 *
 * Failure is NOT swallowed here — callers decide (route guard() warns and
 * continues; pages fall back to their client shells).
 */
export function ensureSchema(): Promise<void> {
  if (!globalForPrisma.schemaReady) {
    globalForPrisma.schemaReady = (async () => {
      for (const stmt of SCHEMA_STATEMENTS) {
        await db.$executeRawUnsafe(stmt)
      }
    })().catch((err) => {
      // reset so a later request can retry after a transient failure
      globalForPrisma.schemaReady = undefined
      throw err
    })
  }
  return globalForPrisma.schemaReady
}
