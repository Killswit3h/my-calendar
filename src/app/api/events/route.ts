// src/app/api/events/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { EventType, WorkShift } from '@prisma/client'
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

type EventInsert = {
  calendarId: string
  title: string
  description: string
  startsAt: Date
  endsAt: Date
  allDay: boolean
  location: string
  type: EventType | null
  shift: WorkShift | null
  checklist: unknown | null
}

type PrismaEventRow = {
  id: string
  calendarId: string
  title: string
  description: string | null
  startsAt: Date
  endsAt: Date
  allDay: boolean
  location: string | null
  type: EventType | null
  shift: WorkShift | null
  checklist: unknown | null
  attachmentName: string | null
  attachmentType: string | null
  hasQuantities?: boolean
}

let legacyColumnsHandled = false

async function ensureLegacyStartColumnsHandled(p: any) {
  if (legacyColumnsHandled) return
  legacyColumnsHandled = true
  const rows = (await p.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Event' AND column_name IN ('start','end')`) as Array<{ column_name: string }>
  if (!rows.length) return
  try {
    await p.$executeRawUnsafe('ALTER TABLE "public"."Event" DROP COLUMN IF EXISTS "start", DROP COLUMN IF EXISTS "end"')
    return
  } catch (_) {
    try {
      await p.$executeRawUnsafe('ALTER TABLE "public"."Event" ALTER COLUMN "start" DROP NOT NULL, ALTER COLUMN "end" DROP NOT NULL')
    } catch (_) {
      // leave legacy columns as-is; fallback insert will handle them
    }
  }
}

async function insertEventCompat(p: any, data: EventInsert): Promise<PrismaEventRow> {
  await ensureLegacyStartColumnsHandled(p)
  try {
    const created = await p.event.create({
      data,
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
    return { ...created, hasQuantities: false }
  } catch (error) {
    const rows = (await p.$queryRawUnsafe(
      'INSERT INTO "public"."Event" ("calendarId","title","description","startsAt","endsAt","allDay","location","type","shift","checklist","start","end") VALUES ($1,$2,$3,$4,$5,$6,$7,CASE WHEN $8 IS NULL THEN NULL ELSE $8::"EventType" END,CASE WHEN $9 IS NULL THEN NULL ELSE $9::"WorkShift" END,CASE WHEN $10 IS NULL THEN NULL ELSE $10::jsonb END,$4,$5) RETURNING "id","calendarId","title","description","startsAt","endsAt","allDay","location","type","shift","checklist","attachmentName","attachmentType"',
      data.calendarId,
      data.title,
      data.description,
      data.startsAt,
      data.endsAt,
      data.allDay,
      data.location,
      data.type,
      data.shift,
      data.checklist === null ? null : JSON.stringify(data.checklist),
    )) as Array<Record<string, any>>
    const row = rows[0]
    return {
      id: row.id,
      calendarId: row.calendarId,
      title: row.title,
      description: row.description,
      startsAt: new Date(row.startsAt),
      endsAt: new Date(row.endsAt),
      allDay: row.allDay,
      location: row.location,
      type: row.type,
      shift: row.shift,
      checklist: typeof row.checklist === 'string' ? JSON.parse(row.checklist) : row.checklist,
      attachmentName: row.attachmentName ?? null,
      attachmentType: row.attachmentType ?? null,
      hasQuantities: false,
    }
  }
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
          _count: { select: { quantities: true } },
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
    hasQuantities: !!(e._count?.quantities ?? 0),
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

      return insertEventCompat(p, {
        calendarId: String(b.calendarId),
        title: String(b.title),
        description: (b.description ?? '') || '',
        startsAt,
        endsAt,
        allDay: !!b.allDay,
        location: (b.location ?? '') || '',
        type: (b.type ?? null) as EventType | null,
        shift: (b.shift ?? null) as WorkShift | null,
        checklist: b.checklist ?? null,
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
      hasQuantities: false,
    }

    return NextResponse.json(payload, { status: 201, headers: cors as any })
  } catch (e: any) {
    const msg = String(e?.message ?? '')
    const status = msg.includes("Can't reach database server") || msg.includes('P1001') ? 503 : 500
    return NextResponse.json({ error: 'Failed to create event', details: msg }, { status, headers: cors as any })
  }
}
