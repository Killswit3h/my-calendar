// src/app/api/events/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { tryPrisma } from '@/lib/dbSafe'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
} as const

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors as any })
}

export async function GET(req: NextRequest) {
  const calendarId = req.nextUrl.searchParams.get('calendarId')
  if (!calendarId) {
    return NextResponse.json({ error: 'calendarId required' }, { status: 400, headers: cors as any })
  }

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
          shift: true,
          checklist: true,
          attachmentName: true,
          attachmentType: true,
        },
      }),
    [] as any[],
  )

  const payload = rows.map((e: any) => ({
    id: e.id,
    calendarId: e.calendarId,
    title: e.title,
    description: e.description ?? '',
    start: e.startsAt,
    end: e.endsAt,
    allDay: !!e.allDay,
    location: e.location ?? '',
    type: e.type ?? null,
    shift: e.shift ?? null,
    checklist: e.checklist ?? null,
    attachmentName: e.attachmentName ?? null,
    attachmentType: e.attachmentType ?? null,
  }))

  return NextResponse.json(payload, { headers: cors as any })
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null)
  const startRaw = b?.start ?? b?.startsAt
  const endRaw = b?.end ?? b?.endsAt
  if (!b?.calendarId || !b?.title || !startRaw || !endRaw) {
    return NextResponse.json(
      { error: 'calendarId, title, start|startsAt, end|endsAt required' },
      { status: 400, headers: cors as any },
    )
  }

  const startsAt = new Date(startRaw)
  const endsAt = new Date(endRaw)
  if (isNaN(startsAt.getTime()) || isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    return NextResponse.json({ error: 'invalid date range' }, { status: 400, headers: cors as any })
  }

  try {
    const created = await tryPrisma(async p => {
      await p.calendar.upsert({
        where: { id: String(b.calendarId) },
        update: {},
        create: { id: String(b.calendarId), name: 'Default' },
      })

      return p.event.create({
        data: {
          calendarId: String(b.calendarId),
          title: String(b.title),
          description: (b.description ?? '') || '',
          startsAt,
          endsAt,
          allDay: !!b.allDay,
          location: (b.location ?? '') || '',
          type: b.type ?? null,
          shift: b.shift ?? null,
          checklist: b.checklist ?? null,
        },
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
          shift: true,
          checklist: true,
          attachmentName: true,
          attachmentType: true,
        },
      })
    }, null as any)

    const payload = {
      id: created.id,
      calendarId: created.calendarId,
      title: created.title,
      description: created.description ?? '',
      start: created.startsAt,
      end: created.endsAt,
      allDay: created.allDay,
      location: created.location ?? '',
      type: created.type ?? null,
      shift: created.shift ?? null,
      checklist: created.checklist ?? null,
      attachmentName: created.attachmentName ?? null,
      attachmentType: created.attachmentType ?? null,
    }

    return NextResponse.json(payload, { status: 201, headers: cors as any })
  } catch (e: any) {
    const msg = String(e?.message ?? '')
    const status = msg.includes("Can't reach database server") || msg.includes('P1001') ? 503 : 500
    return NextResponse.json({ error: 'Failed to create event', details: msg }, { status, headers: cors as any })
  }
}
