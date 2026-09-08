import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { SCHEMA_STATEMENTS } from './db-schema'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  schemaReady: Promise<void> | undefined
}

/**
 * Resolve the database URL.
 *
 * • libsql://…        → Turso (durable hosted SQLite) via the driver adapter
 * • file:…            → local SQLite file (dev / Electron)
 • unset              → file:/tmp/prod.db — serverless fallback so the app
 *                       still boots in ephemeral mode before the Turso env
 *                       vars are configured in the hosting dashboard.
 */
function databaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim()
  return url || 'file:/tmp/prod.db'
}

function isLibsql(url: string): boolean {
  return url.startsWith('libsql://') || url.startsWith('libsql:')
}

function createPrismaClient(): PrismaClient {
  const url = databaseUrl()
  if (isLibsql(url)) {
    // Turso / libSQL: the driver adapter owns the connection — the schema's
    // env("DATABASE_URL") datasource is bypassed entirely in this mode.
    const adapter = new PrismaLibSQL({
      url,
      authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
    })
    return new PrismaClient({
      adapter,
      // Query logs are dev-only noise on serverless (and leak Prisma
      // internals into API error payloads); production keeps errors only.
      log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error'],
    })
  }
  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

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
 * With a durable libsql URL (Turso) this runs once on first request and the
 * schema simply persists afterwards — the DDL is plain SQLite, fully
 * compatible with libSQL. On the ephemeral file fallback each cold start
 * re-provisions an empty schema and the client bootstrap (demo site seeding)
 * kicks in: every button keeps working, but nothing survives recycling.
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
