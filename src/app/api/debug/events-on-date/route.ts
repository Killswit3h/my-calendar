export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'

function getTz(): string { return process.env.REPORT_TIMEZONE || 'America/New_York' }

function tzOffsetMs(at: Date, tz: string): number {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
  const parts = fmt.formatToParts(at)
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value || '0')
  const asUTC = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return asUTC - at.getTime()
}

function fromZonedYmdToUtc(y: number, m: number, d: number, tz: string): Date {
  const pretend = new Date(Date.UTC(y, m - 1, d, 0, 0, 0))
  const offset = tzOffsetMs(pretend, tz)
  return new Date(pretend.getTime() - offset)
}

function dayStartEnd(date: string, tz = getTz()): { start: Date; end: Date } {
  const [y, m, d] = date.split('-').map(Number)
  const start = fromZonedYmdToUtc(y, m, d, tz)
  const next = fromZonedYmdToUtc(y, m, d + 1, tz)
  return { start, end: next }
}

function toLocal(utc: Date, tz: string): string {
  return new Date(utc).toLocaleString('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const date = (url.searchParams.get('date') || '').trim()
  const q = (url.searchParams.get('q') || '').trim().toLowerCase()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: 'date_required' }, { status: 400 })
  const { start, end } = dayStartEnd(date)
  const tz = getTz()

  const p = await getPrisma()
  const rows = await p.event.findMany({
    where: { startsAt: { lt: end }, endsAt: { gt: start } },
    orderBy: [{ startsAt: 'asc' }],
    select: { id: true, title: true, startsAt: true, endsAt: true, description: true },
  })

  const items = rows
    .filter(r => !q || (r.title || '').toLowerCase().includes(q))
    .map(r => {
      const startsOnDate = r.startsAt >= start && r.startsAt < end
      const endsOnDate = r.endsAt > start && r.endsAt <= end
      return {
        id: r.id,
        title: r.title,
        startsAtUTC: r.startsAt.toISOString(),
        endsAtUTC: r.endsAt.toISOString(),
        startsAtLocal: toLocal(r.startsAt, tz),
        endsAtLocal: toLocal(r.endsAt, tz),
        startsOnDate,
        endsOnDate,
        overlaps: true,
      }
    })

  return NextResponse.json({ date, tz, startUTC: start.toISOString(), endUTC: end.toISOString(), items })
}

