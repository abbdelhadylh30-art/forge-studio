// ─────────────────────────────────────────────────────────────────────────────
// db-schema — SQLite DDL statements, AUTO-GENERATED from prisma/schema.prisma.
//
// Mirrors exactly what `prisma db push` creates (tables + indexes, defaults
// and FK constraints included). ensureSchema() in src/lib/db.ts runs these
// idempotently (IF NOT EXISTS) so a fresh / empty SQLite file — e.g. Vercel's
// ephemeral /tmp/prod.db in a cold serverless instance — becomes usable on
// first request, without shipping the Prisma CLI into the lambda.
//
// Regenerate after ANY change to prisma/schema.prisma:
//   rm -f /tmp/schema-probe.db
//   DATABASE_URL="file:/tmp/schema-probe.db" bunx prisma db push --skip-generate
//   python3 ../scripts/gen-db-schema.py
// ─────────────────────────────────────────────────────────────────────────────

/** One DDL statement per entry — executed sequentially by ensureSchema(). */
export const SCHEMA_STATEMENTS: readonly string[] = [
  "CREATE TABLE IF NOT EXISTS \"Project\" ( \"id\" TEXT NOT NULL PRIMARY KEY, \"name\" TEXT NOT NULL, \"url\" TEXT, \"clientName\" TEXT, \"createdAt\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, \"updatedAt\" DATETIME NOT NULL )",
  "CREATE TABLE IF NOT EXISTS \"Audit\" ( \"id\" TEXT NOT NULL PRIMARY KEY, \"projectId\" TEXT NOT NULL, \"name\" TEXT NOT NULL, \"url\" TEXT, \"htmlContent\" TEXT NOT NULL, \"score\" INTEGER NOT NULL, \"desktopScore\" INTEGER NOT NULL, \"mobileScore\" INTEGER NOT NULL, \"categories\" TEXT NOT NULL, \"issues\" TEXT NOT NULL, \"isInitial\" BOOLEAN NOT NULL DEFAULT false, \"isSnapshot\" BOOLEAN NOT NULL DEFAULT false, \"createdAt\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT \"Audit_projectId_fkey\" FOREIGN KEY (\"projectId\") REFERENCES \"Project\" (\"id\") ON DELETE CASCADE ON UPDATE CASCADE )",
  "CREATE TABLE IF NOT EXISTS \"QuickFix\" ( \"id\" TEXT NOT NULL PRIMARY KEY, \"auditId\" TEXT NOT NULL, \"fixId\" TEXT NOT NULL, \"issueId\" TEXT NOT NULL, \"description\" TEXT NOT NULL, \"beforeValue\" TEXT, \"afterValue\" TEXT, \"reverted\" BOOLEAN NOT NULL DEFAULT false, \"createdAt\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT \"QuickFix_auditId_fkey\" FOREIGN KEY (\"auditId\") REFERENCES \"Audit\" (\"id\") ON DELETE CASCADE ON UPDATE CASCADE )",
  "CREATE TABLE IF NOT EXISTS \"CompetitorComparison\" ( \"id\" TEXT NOT NULL PRIMARY KEY, \"auditId\" TEXT NOT NULL, \"competitorUrl\" TEXT NOT NULL, \"competitorHtml\" TEXT NOT NULL, \"competitorScore\" INTEGER NOT NULL, \"yourScore\" INTEGER NOT NULL, \"createdAt\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT \"CompetitorComparison_auditId_fkey\" FOREIGN KEY (\"auditId\") REFERENCES \"Audit\" (\"id\") ON DELETE CASCADE ON UPDATE CASCADE )",
  "CREATE TABLE IF NOT EXISTS \"TeamComment\" ( \"id\" TEXT NOT NULL PRIMARY KEY, \"projectId\" TEXT NOT NULL, \"author\" TEXT NOT NULL DEFAULT 'Anonymous', \"text\" TEXT NOT NULL, \"selector\" TEXT, \"createdAt\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT \"TeamComment_projectId_fkey\" FOREIGN KEY (\"projectId\") REFERENCES \"Project\" (\"id\") ON DELETE CASCADE ON UPDATE CASCADE )",
  "CREATE TABLE IF NOT EXISTS \"ABVariant\" ( \"id\" TEXT NOT NULL PRIMARY KEY, \"projectId\" TEXT NOT NULL, \"variantName\" TEXT NOT NULL DEFAULT 'A', \"htmlContent\" TEXT NOT NULL, \"score\" INTEGER, \"isWinner\" BOOLEAN NOT NULL DEFAULT false, \"createdAt\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT \"ABVariant_projectId_fkey\" FOREIGN KEY (\"projectId\") REFERENCES \"Project\" (\"id\") ON DELETE CASCADE ON UPDATE CASCADE )",
  "CREATE TABLE IF NOT EXISTS \"WhitelabelSetting\" ( \"id\" TEXT NOT NULL PRIMARY KEY, \"brandName\" TEXT NOT NULL DEFAULT 'PixelForge', \"brandColor\" TEXT NOT NULL DEFAULT '#5c8def', \"hideBranding\" BOOLEAN NOT NULL DEFAULT false, \"customLogoUrl\" TEXT, \"updatedAt\" DATETIME NOT NULL )",
  "CREATE TABLE IF NOT EXISTS \"Client\" ( \"id\" TEXT NOT NULL PRIMARY KEY, \"name\" TEXT NOT NULL, \"email\" TEXT, \"company\" TEXT, \"notes\" TEXT, \"createdAt\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP )",
  "CREATE TABLE IF NOT EXISTS \"Feedback\" ( \"id\" TEXT NOT NULL PRIMARY KEY, \"message\" TEXT NOT NULL, \"email\" TEXT, \"url\" TEXT, \"view\" TEXT, \"rating\" INTEGER, \"createdAt\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP )",
  "CREATE TABLE IF NOT EXISTS \"EmailReportRequest\" ( \"id\" TEXT NOT NULL PRIMARY KEY, \"email\" TEXT NOT NULL, \"projectName\" TEXT NOT NULL, \"score\" INTEGER NOT NULL, \"desktopScore\" INTEGER NOT NULL, \"mobileScore\" INTEGER NOT NULL, \"issueCount\" INTEGER NOT NULL, \"fixCount\" INTEGER NOT NULL, \"reportJson\" TEXT NOT NULL, \"sent\" BOOLEAN NOT NULL DEFAULT false, \"createdAt\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP )",
  "CREATE TABLE IF NOT EXISTS \"Site\" ( \"id\" TEXT NOT NULL PRIMARY KEY, \"name\" TEXT NOT NULL, \"slug\" TEXT NOT NULL, \"config\" TEXT NOT NULL, \"createdAt\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, \"updatedAt\" DATETIME NOT NULL )",
  "CREATE TABLE IF NOT EXISTS \"SiteView\" ( \"id\" TEXT NOT NULL PRIMARY KEY, \"projectId\" TEXT NOT NULL, \"visitorId\" TEXT NOT NULL DEFAULT 'anon', \"path\" TEXT NOT NULL DEFAULT '/', \"referrer\" TEXT NOT NULL DEFAULT 'direct', \"country\" TEXT NOT NULL DEFAULT 'US', \"device\" TEXT NOT NULL DEFAULT 'desktop', \"browser\" TEXT NOT NULL DEFAULT 'Chrome', \"variant\" TEXT, \"variantMap\" TEXT, \"duration\" INTEGER NOT NULL DEFAULT 0, \"isBounce\" BOOLEAN NOT NULL DEFAULT false, \"createdAt\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT \"SiteView_projectId_fkey\" FOREIGN KEY (\"projectId\") REFERENCES \"Site\" (\"id\") ON DELETE CASCADE ON UPDATE CASCADE )",
  "CREATE TABLE IF NOT EXISTS \"SiteEvent\" ( \"id\" TEXT NOT NULL PRIMARY KEY, \"projectId\" TEXT NOT NULL, \"type\" TEXT NOT NULL, \"label\" TEXT NOT NULL DEFAULT '', \"variant\" TEXT, \"value\" REAL NOT NULL DEFAULT 0, \"path\" TEXT NOT NULL DEFAULT '/', \"createdAt\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT \"SiteEvent_projectId_fkey\" FOREIGN KEY (\"projectId\") REFERENCES \"Site\" (\"id\") ON DELETE CASCADE ON UPDATE CASCADE )",
  "CREATE TABLE IF NOT EXISTS \"SiteDeploy\" ( \"id\" TEXT NOT NULL PRIMARY KEY, \"projectId\" TEXT NOT NULL, \"status\" TEXT NOT NULL DEFAULT 'queued', \"url\" TEXT, \"logs\" TEXT NOT NULL DEFAULT '[]', \"durationMs\" INTEGER NOT NULL DEFAULT 0, \"createdAt\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT \"SiteDeploy_projectId_fkey\" FOREIGN KEY (\"projectId\") REFERENCES \"Site\" (\"id\") ON DELETE CASCADE ON UPDATE CASCADE )",
  "CREATE TABLE IF NOT EXISTS \"SiteLead\" ( \"id\" TEXT NOT NULL PRIMARY KEY, \"projectId\" TEXT NOT NULL, \"name\" TEXT NOT NULL DEFAULT '', \"email\" TEXT NOT NULL DEFAULT '', \"message\" TEXT NOT NULL DEFAULT '', \"fields\" TEXT NOT NULL DEFAULT '{}', \"createdAt\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT \"SiteLead_projectId_fkey\" FOREIGN KEY (\"projectId\") REFERENCES \"Site\" (\"id\") ON DELETE CASCADE ON UPDATE CASCADE )",
  "CREATE INDEX IF NOT EXISTS \"Project_clientName_idx\" ON \"Project\"(\"clientName\")",
  "CREATE INDEX IF NOT EXISTS \"Audit_projectId_idx\" ON \"Audit\"(\"projectId\")",
  "CREATE INDEX IF NOT EXISTS \"Audit_createdAt_idx\" ON \"Audit\"(\"createdAt\")",
  "CREATE INDEX IF NOT EXISTS \"QuickFix_auditId_idx\" ON \"QuickFix\"(\"auditId\")",
  "CREATE INDEX IF NOT EXISTS \"CompetitorComparison_auditId_idx\" ON \"CompetitorComparison\"(\"auditId\")",
  "CREATE INDEX IF NOT EXISTS \"TeamComment_projectId_idx\" ON \"TeamComment\"(\"projectId\")",
  "CREATE INDEX IF NOT EXISTS \"ABVariant_projectId_idx\" ON \"ABVariant\"(\"projectId\")",
  "CREATE INDEX IF NOT EXISTS \"Client_name_idx\" ON \"Client\"(\"name\")",
  "CREATE INDEX IF NOT EXISTS \"Feedback_createdAt_idx\" ON \"Feedback\"(\"createdAt\")",
  "CREATE INDEX IF NOT EXISTS \"EmailReportRequest_createdAt_idx\" ON \"EmailReportRequest\"(\"createdAt\")",
  "CREATE INDEX IF NOT EXISTS \"EmailReportRequest_sent_idx\" ON \"EmailReportRequest\"(\"sent\")",
  "CREATE UNIQUE INDEX IF NOT EXISTS \"Site_slug_key\" ON \"Site\"(\"slug\")",
  "CREATE INDEX IF NOT EXISTS \"SiteView_projectId_createdAt_idx\" ON \"SiteView\"(\"projectId\", \"createdAt\")",
  "CREATE INDEX IF NOT EXISTS \"SiteEvent_projectId_createdAt_idx\" ON \"SiteEvent\"(\"projectId\", \"createdAt\")",
  "CREATE INDEX IF NOT EXISTS \"SiteLead_projectId_createdAt_idx\" ON \"SiteLead\"(\"projectId\", \"createdAt\")",
]
