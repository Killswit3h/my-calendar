// src/app/api/events/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { prisma, tryPrisma } from '@/lib/dbSafe'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
} as const

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders as any })
}

export async function GET(req: NextRequest) {
  const calendarId = req.nextUrl.searchParams.get('calendarId')
  if (!calendarId) {
    return NextResponse.json(
      { error: 'calendarId required' },
      { status: 400, headers: corsHeaders as any }
    )
  }

  const rows = await tryPrisma(
    () =>
      prisma.event.findMany({
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
    [] as any[]
  )

  const payload = rows.map((e: any) => ({
    id: e.id,
    calendarId: e.calendarId,
    title: e.title,
    description: e.description ?? '',
    start: e.startsAt, // FullCalendar expects start/end keys
    end: e.endsAt,
    allDay: !!e.allDay,
    location: e.location ?? '',
    type: e.type ?? null,
    shift: e.shift ?? null,
    checklist: e.checklist ?? null,
    attachmentName: e.attachmentName ?? null,
    attachmentType: e.attachmentType ?? null,
  }))

  return NextResponse.json(payload, { status: 200, headers: corsHeaders as any })
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null)
  // Accept start/end or startsAt/endsAt
  const startRaw = b?.start ?? b?.startsAt
  const endRaw = b?.end ?? b?.endsAt
  const calendarId = b?.calendarId
  const title = b?.title

  if (!calendarId || !title || !startRaw || !endRaw) {
    return NextResponse.json(
      { error: 'calendarId, title, start|startsAt, end|endsAt required' },
      { status: 400, headers: corsHeaders as any }
    )
  }

  const startsAt = new Date(startRaw)
  const endsAt = new Date(endRaw)
  if (isNaN(startsAt.getTime()) || isNaN(endsAt.getTime())) {
    return NextResponse.json(
      { error: 'Invalid start or end date' },
      { status: 400, headers: corsHeaders as any }
    )
  }
  if (endsAt <= startsAt) {
    return NextResponse.json(
      { error: 'end must be after start' },
      { status: 400, headers: corsHeaders as any }
    )
  }

  // FullCalendar uses exclusive end for all-day. Store as given.
  const allDay = !!b.allDay

  try {
    // Ensure calendar exists
    await prisma.calendar.upsert({
      where: { id: String(calendarId) },
      update: {},
      create: { id: String(calendarId), name: 'Default' },
    })

    const created = await prisma.event.create({
      data: {
        calendarId: String(calendarId),
        title: String(title),
        description: (b.description ?? '') || '',
        startsAt,
        endsAt, // exclusive if allDay
        allDay,
        location: (b.location ?? '') || '',
        type: b.type ?? null,
        shift: b.shift ?? null,
        checklist: b.checklist ?? null,
        // Note: attachmentData omitted in text-only API
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

    return NextResponse.json(payload, { status: 201, headers: corsHeaders as any })
  } catch (e: any) {
    const msg = String(e?.message ?? '')
    if (msg.includes("Can't reach database server") || msg.includes('P1001')) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503, headers: corsHeaders as any })
    }
    return NextResponse.json(
      { error: 'Failed to create event', details: msg },
      { status: 500, headers: corsHeaders as any }
    )
  }
}
