const fs = require('fs')
try {
  const envTxt = fs.readFileSync('.env', 'utf8')
  for (const line of envTxt.split(/\r?\n/)) {
    const m = line.match(/^DATABASE_URL=(.*)$/)
    if (m) {
      let v = m[1].trim()
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1)
      process.env.DATABASE_URL = v
      break
    }
  }
} catch {}

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function genId() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}` }

async function main() {
  const calendarId = process.argv[2] || 'codex-cal'
  const title = process.argv[3] || 'Codex Insert Test'
  await prisma.$executeRaw`INSERT INTO "Calendar" ("id","name") VALUES (${calendarId}, ${"Default"}) ON CONFLICT ("id") DO NOTHING`
  const now = new Date()
  const newId = genId()
  const rows = await prisma.$queryRaw`
    INSERT INTO "Event" ("id","calendarId","title","description","startsAt","endsAt","allDay","location","type")
    VALUES (${newId}, ${calendarId}, ${title}, ${""}, ${now}, ${now}, ${true}, ${""}, ${null})
    RETURNING "id","calendarId","title","description","startsAt","endsAt","allDay","location","type"`
  console.log(rows[0])
}

main().catch((e) => { console.error('ERROR', e?.message || e); process.exit(1) }).finally(async () => { await prisma.$disconnect() })

