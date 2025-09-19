export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { tryPrisma } from '@/lib/dbSafe'
import { serializeCalendarEvent, serializeCalendarEvents } from '@/lib/events/serializer'
import type { EventRowLike } from '@/lib/events/serializer'

type DebugEventRow = EventRowLike & {
  start: Date
  end: Date
  allDay: boolean
  description: string | null
  location: string | null
  type: 'GUARDRAIL' | 'FENCE' | 'TEMP_FENCE' | 'HANDRAIL' | 'ATTENUATOR' | null
  shift: 'DAY' | 'NIGHT' | null
  checklist: unknown | null
}

function parseTake(v: string | null): number {
  const n = Number.parseInt(v ?? '', 10)
  if (!Number.isFinite(n) || n <= 0) return 5
  return Math.min(50, n)
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const calendarId = url.searchParams.get('calendarId')
  const take = parseTake(url.searchParams.get('take'))

  const rows = await tryPrisma<DebugEventRow[]>(
    async (p) => {
      const where: Record<string, any> = {}
      if (calendarId) where.calendarId = calendarId
      const out = await p.event.findMany({
        where,
        orderBy: { start: 'asc' },
        take,
        select: {
          id: true,
          calendarId: true,
          title: true,
          description: true,
          start: true,
          end: true,
          allDay: true,
          location: true,
          type: true,
          shift: true,
          checklist: true,
        },
      })
      return out as DebugEventRow[]
    },
    [] as DebugEventRow[],
  )

  return NextResponse.json({
    calendarId: calendarId ?? null,
    count: rows.length,
    events: serializeCalendarEvents(rows),
    sampleSingle: rows.length ? serializeCalendarEvent(rows[0]) : null,
  })
}
