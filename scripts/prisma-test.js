// Quick Prisma create test to reproduce POST failures
const fs = require('fs')
// Load DATABASE_URL from .env manually to avoid shell quoting hassles
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

const APP_TZ = 'America/New_York'
const formatYmd = (date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: APP_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    date,
  )

async function main() {
  const calendarId = process.argv[2] || 'codex-test-cal'
  const title = process.argv[3] || 'Codex Test'
  await prisma.calendar.upsert({ where: { id: calendarId }, update: {}, create: { id: calendarId, name: 'Default' } })
  const now = new Date()
  now.setUTCHours(0, 0, 0, 0)
  const tomorrow = new Date(now.getTime())
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  const startDateYmd = formatYmd(now)
  const endDateYmd = formatYmd(tomorrow)
  const ev = await prisma.event.create({
    data: {
      calendarId,
      title,
      description: '',
      startsAt: now,
      endsAt: tomorrow,
      allDay: true,
      startDate: startDateYmd,
      endDate: endDateYmd,
      location: '',
      type: null,
    },
    select: { id: true, title: true, startsAt: true, endsAt: true, startDate: true, endDate: true, allDay: true, calendarId: true },
  })
  console.log(JSON.stringify(ev))
}

main().catch((e) => { console.error('ERROR', e); process.exit(1) }).finally(async () => { await prisma.$disconnect() })
