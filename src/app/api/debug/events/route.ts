export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { tryPrisma } from '@/lib/dbSafe'
import { serializeCalendarEvent } from '@/lib/events/serializer'
import type { EventRowLike } from '@/lib/events/serializer'

const DAY_IN_MS = 86_400_000

type DebugEventRow = EventRowLike & {
  id: string
  calendarId: string
  title: string
  description: string | null
  startsAt: Date
  endsAt: Date
  startDate: string | null
  endDate: string | null
  allDay: boolean
  location: string | null
  type: string | null
  shift: string | null
  checklist: unknown | null
}

const ymdUTC = (date: Date): string => {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const toDebugSample = (row: DebugEventRow) => {
  if (row.allDay) {
    const start = new Date(row.startsAt)
    const exclusiveEnd = new Date(row.endsAt)
    const inclusiveEnd = new Date(exclusiveEnd.getTime() - DAY_IN_MS)
    return {
      id: row.id,
      calendarId: row.calendarId,
      title: row.title,
      description: row.description ?? '',
      startsAt: ymdUTC(start),
      endsAt: ymdUTC(inclusiveEnd),
      allDay: true,
    }
  }
  return {
    id: row.id,
    calendarId: row.calendarId,
    title: row.title,
    description: row.description ?? '',
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    allDay: false,
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const calendarId = url.searchParams.get('calendarId')
  const take = Math.min(50, Math.max(1, Number.parseInt(url.searchParams.get('take') ?? '5', 10) || 5))

  const rows = await tryPrisma<DebugEventRow[]>(
    async (p) => {
      const where: Record<string, any> = {}
      if (calendarId) where.calendarId = calendarId
      return (await p.event.findMany({
        where,
        orderBy: { startsAt: 'asc' },
        take,
        select: {
          id: true,
          calendarId: true,
          title: true,
          description: true,
          startsAt: true,
          endsAt: true,
          startDate: true,
          endDate: true,
          allDay: true,
          location: true,
          type: true,
          shift: true,
          checklist: true,
        },
      })) as DebugEventRow[]
    },
    [] as DebugEventRow[],
  )

  return NextResponse.json({
    calendarId: calendarId ?? null,
    count: rows.length,
    events: rows.map(row => serializeCalendarEvent(row)),
    sampleSingle: rows.length ? toDebugSample(rows[0]) : null,
  })
}
