// Ensure Todo table exists using direct connection (local helper)
const fs = require('fs')
try {
  const env = fs.readFileSync('.env', 'utf8')
  let db = null, direct = null
  for (const line of env.split(/\r?\n/)) {
    const m1 = line.match(/^DATABASE_URL=(.*)$/)
    const m2 = line.match(/^DIRECT_DATABASE_URL=(.*)$/)
    if (m1) db = m1[1].replace(/^"|"$/g, '')
    if (m2) direct = m2[1].replace(/^"|"$/g, '')
  }
  if (direct) process.env.DATABASE_URL = direct
  else if (db) process.env.DATABASE_URL = db
} catch {}

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  await prisma.$executeRawUnsafe(
    'CREATE TABLE IF NOT EXISTS "Todo" (\n' +
      '  "id" text PRIMARY KEY,\n' +
      '  "calendarId" text NOT NULL,\n' +
      '  "title" text NOT NULL,\n' +
      '  "notes" text NULL,\n' +
      '  "done" boolean NOT NULL DEFAULT FALSE,\n' +
      '  "type" "EventType" NOT NULL,\n' +
      '  "createdAt" timestamptz NOT NULL DEFAULT now(),\n' +
      '  CONSTRAINT "Todo_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "Calendar"("id") ON DELETE CASCADE\n' +
    ')'
  )
  const r = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM "Todo"`
  console.log('Todo table OK, rows:', r[0].count)
}

main().catch((e) => { console.error('ERROR', e?.message || e) }).finally(async () => { await prisma.$disconnect() })

