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

function chunk(array, size) {
  const out = []
  for (let i = 0; i < array.length; i += size) out.push(array.slice(i, i + size))
  return out
}

async function main() {
  const shiftDays = Number(process.argv[2] ?? 1)
  if (!Number.isFinite(shiftDays) || !shiftDays) {
    console.error('Pass a non-zero number of days to shift, e.g. `node scripts/shift-events-by-day.js -1`')
    process.exit(1)
  }

  const DAY_MS = 86_400_000
  const deltaMs = shiftDays * DAY_MS

  const events = await prisma.event.findMany({
    select: { id: true, startsAt: true, endsAt: true },
  })
  console.log(`Found ${events.length} events. Shifting each by ${shiftDays} day(s).`)
  if (!events.length) return

  for (const batch of chunk(events, 50)) {
    await prisma.$transaction(batch.map((evt) => prisma.event.update({
      where: { id: evt.id },
      data: {
        startsAt: new Date(evt.startsAt.getTime() + deltaMs),
        endsAt: evt.endsAt ? new Date(evt.endsAt.getTime() + deltaMs) : null,
      },
    })))
  }
  console.log('Done.')
}

main()
  .catch((err) => {
    console.error('Failed to shift events:', err?.message ?? err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


