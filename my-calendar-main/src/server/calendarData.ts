import { prisma } from '@/lib/prisma'
import { fetchHolidays, indexByIsoDate } from '@/lib/holidays'

export type CalendarEvent = {
  id: string
  title: string
  startsAt: Date
  endsAt: Date
  allDay: boolean
  calendarId: string
}

/** UTC helpers */
function startOfMonthUTC(year: number, month0: number) {
  return new Date(Date.UTC(year, month0, 1))
}
function addDaysUTC(d: Date, days: number) {
  return new Date(d.getTime() + days * 86400000)
}

/** Build month grid with non-blocking holiday pills */
export async function getMonthGrid(year: number, month0: number, countryCode: string) {
  const start = startOfMonthUTC(year, month0)
  const end = startOfMonthUTC(year, month0 + 1)

  const [events, holidays] = await Promise.all([
    prisma.event.findMany({
      where: { startsAt: { lt: end }, endsAt: { gte: start } },
      orderBy: { startsAt: 'asc' },
    }),
    fetchHolidays(start, end, { countryCode }),
  ])

  const hmap = indexByIsoDate(holidays)
  const days: Array<{ date: Date; events: CalendarEvent[]; holiday?: { name: string; localName: string } | null }> = []

  for (let d = new Date(start); d < end; d = addDaysUTC(d, 1)) {
    const key = d.toISOString().slice(0, 10)
    const h = hmap.get(key)
    days.push({
      date: new Date(d),
      events: [],
      holiday: h ? { name: h.name, localName: h.localName } : null,
    })
  }

  // place events on each covered day
  for (const ev of events) {
    const cur = new Date(Date.UTC(ev.startsAt.getUTCFullYear(), ev.startsAt.getUTCMonth(), ev.startsAt.getUTCDate()))
    const last = new Date(Date.UTC(ev.endsAt.getUTCFullYear(), ev.endsAt.getUTCMonth(), ev.endsAt.getUTCDate()))
    for (let d = new Date(cur); d <= last; d = addDaysUTC(d, 1)) {
      const idx = Math.floor((d.getTime() - start.getTime()) / 86400000)
      if (idx >= 0 && idx < days.length) days[idx].events.push(ev as CalendarEvent)
    }
  }

  return days
}
