// src/app/api/calendars/[id]/events/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { tryPrisma } from '@/lib/dbSafe'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: calendarId } = await ctx.params
  if (!calendarId) return NextResponse.json({ error: 'calendarId required' }, { status: 400 })

  const rows = await tryPrisma(
    p =>
      p.event.findMany({
        where: { calendarId },
        orderBy: { startsAt: 'asc' },
        select: {
          id: true,
          calendarId: true,
          title: true,
          description: true,
          startsAt: true,
          endsAt: true,
          allDay: true,
          location: true,
          type: true,
        },
      }),
    [] as any[],
  )

  const payload = rows.map((e: any) => ({
    id: e.id,
    calendarId: e.calendarId,
    title: e.title,
    description: e.description ?? '',
    start: e.startsAt, // FullCalendar expects start/end
    end: e.endsAt,
    allDay: !!e.allDay,
    location: e.location ?? '',
    type: e.type ?? null,
  }))

  return NextResponse.json(payload)
}
