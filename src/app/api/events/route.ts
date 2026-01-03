// src/app/api/events/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { EventType, WorkShift } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { tryPrisma } from '@/lib/dbSafe'
import { parseAppDateOnly, localISOToUTC, nextDateISO, formatInTimeZone } from '@/lib/timezone'
import { ensureProjectForEventTitle } from '@/src/lib/finance/projectLink'
import { APP_TZ } from '@/lib/appConfig'
import { serializeCalendarEvent } from '@/lib/events/serializer'
import { parseReminderOffsets } from '@/lib/reminders'
import { getCurrentUser } from '@/lib/session'

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
  startDate: string | null
  endDate: string | null
  allDay: boolean
  location: string
  type: EventType | null
  shift: WorkShift | null
  checklist: unknown | null
  reminderEnabled: boolean
  reminderOffsets: unknown | null
  projectId: string | null
  customerId: string | null
}

type PrismaEventRow = {
  id: string
  calendarId: string
  title: string
  description: string | null
  projectId: string | null
  customerId: string | null
  startsAt: Date
  endsAt: Date
  startDate: string | null
  endDate: string | null
  allDay: boolean
  location: string | null
  type: EventType | null
  shift: WorkShift | null
  checklist: unknown | null
  attachmentName: string | null
  attachmentType: string | null
  reminderEnabled: boolean
  reminderOffsets: unknown | null
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
        projectId: true,
        customerId: true,
        startsAt: true,
        endsAt: true,
        startDate: true,
        endDate: true,
        allDay: true,
        location: true,
        type: true,
        shift: true,
        checklist: true,
        reminderEnabled: true,
        reminderOffsets: true,
        attachmentName: true,
        attachmentType: true,
      },
    })
    return { ...created, hasQuantities: false }
  } catch (error) {
    const rows = (await p.$queryRawUnsafe(
      'INSERT INTO "public"."Event" ("calendarId","title","description","startsAt","endsAt","startDate","endDate","allDay","location","type","shift","checklist","reminderEnabled","reminderOffsets","projectId","customerId","start","end") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,CASE WHEN $10 IS NULL THEN NULL ELSE $10::"EventType" END,CASE WHEN $11 IS NULL THEN NULL ELSE $11::"WorkShift" END,CASE WHEN $12 IS NULL THEN NULL ELSE $12::jsonb END,$13,CASE WHEN $14 IS NULL THEN NULL ELSE $14::jsonb END,$15,$16,$4,$5) RETURNING "id","calendarId","title","description","projectId","customerId","startsAt","endsAt","startDate","endDate","allDay","location","type","shift","checklist","reminderEnabled","reminderOffsets","attachmentName","attachmentType"',
      data.calendarId,
      data.title,
      data.description,
      data.startsAt,
      data.endsAt,
      data.startDate,
      data.endDate,
      data.allDay,
      data.location,
      data.type,
      data.shift,
      data.checklist === null ? null : JSON.stringify(data.checklist),
      data.reminderEnabled,
      data.reminderOffsets === null ? null : JSON.stringify(data.reminderOffsets),
      data.projectId,
      data.customerId,
    )) as Array<Record<string, any>>
    const row = rows[0]
    return {
      id: row.id,
      calendarId: row.calendarId,
      title: row.title,
      description: row.description,
      projectId: row.projectId ?? null,
      customerId: row.customerId ?? null,
      startsAt: new Date(row.startsAt),
      endsAt: new Date(row.endsAt),
      startDate: row.startDate ?? null,
      endDate: row.endDate ?? null,
      allDay: row.allDay,
      location: row.location,
      type: row.type,
      shift: row.shift,
      checklist: typeof row.checklist === 'string' ? JSON.parse(row.checklist) : row.checklist,
      reminderEnabled: row.reminderEnabled ?? false,
      reminderOffsets:
        typeof row.reminderOffsets === 'string'
          ? JSON.parse(row.reminderOffsets)
          : row.reminderOffsets ?? null,
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
          startDate: true,
          endDate: true,
          allDay: true,
        location: true,
        type: true,
        shift: true,
        checklist: true,
        attachmentName: true,
        attachmentType: true,
        reminderEnabled: true,
        reminderOffsets: true,
        _count: { select: { EventQuantity: true } },
      },
    }),
    [] as any[],
  )

  const payload = rows.map((e: any) => {
    const serialized = serializeCalendarEvent(
      {
        id: e.id,
        calendarId: e.calendarId,
        title: e.title,
        description: e.description ?? '',
        startsAt: e.startsAt,
        endsAt: e.endsAt,
        startDate: e.startDate ?? null,
        endDate: e.endDate ?? null,
        allDay: !!e.allDay,
        location: e.location ?? '',
        type: e.type ?? null,
        shift: e.shift ?? null,
        checklist: e.checklist ?? null,
        hasQuantities: !!(e._count?.EventQuantity ?? 0),
      },
      { timezone: APP_TZ },
    )

    return {
      ...serialized,
      attachmentName: e.attachmentName ?? null,
      attachmentType: e.attachmentType ?? null,
      reminderEnabled: !!e.reminderEnabled,
      reminderOffsets: parseReminderOffsets(e.reminderOffsets ?? []),
    }
  })

  return NextResponse.json(payload, { headers: cors as any })
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers: cors as any })
  }

  const b = await req.json().catch(() => null)
  const startRaw = b?.start ?? b?.startsAt
  const endRaw = b?.end ?? b?.endsAt
  if (!b?.calendarId || !b?.title || !startRaw || !endRaw) {
    return NextResponse.json(
      { error: 'calendarId, title, start|startsAt, end|endsAt required' },
      { status: 400, headers: cors as any },
    )
  }

  const title = String(b.title ?? '').trim()
  if (!title) {
    return NextResponse.json({ error: 'title required' }, { status: 400, headers: cors as any })
  }

  const allDay = !!b.allDay
  let startsAt: Date | null = null
  let endsAt: Date | null = null
  let startDateValue: string | null = null
  let endDateValue: string | null = null

  if (allDay) {
    if (typeof startRaw !== 'string') {
      return NextResponse.json({ error: 'invalid date range' }, { status: 400, headers: cors as any })
    }
    const startCandidate = startRaw.trim().slice(0, 10)
    const startParsed = parseAppDateOnly(startCandidate)
    if (!startParsed) {
      return NextResponse.json({ error: 'invalid date range' }, { status: 400, headers: cors as any })
    }
    const startYmd = formatInTimeZone(startParsed, APP_TZ).date
    let endCandidate =
      typeof endRaw === 'string' && endRaw.trim().length > 0 ? endRaw.trim().slice(0, 10) : null
    if (!endCandidate || endCandidate <= startYmd) {
      endCandidate = nextDateISO(startYmd, APP_TZ)
    }
    const endParsed = parseAppDateOnly(endCandidate)
    if (!endParsed) {
      return NextResponse.json({ error: 'invalid date range' }, { status: 400, headers: cors as any })
    }
    startsAt = startParsed
    endsAt = endParsed
    startDateValue = startYmd
    endDateValue = endCandidate
  } else {
    if (typeof startRaw !== 'string' || typeof endRaw !== 'string') {
      return NextResponse.json({ error: 'invalid date range' }, { status: 400, headers: cors as any })
    }
    const startIso = localISOToUTC(startRaw, APP_TZ)
    const endIso = localISOToUTC(endRaw, APP_TZ)
    startsAt = new Date(startIso)
    endsAt = new Date(endIso)
    if (!startsAt || !endsAt || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      return NextResponse.json({ error: 'invalid date range' }, { status: 400, headers: cors as any })
    }
    startDateValue = null
    endDateValue = null
  }

  if (!startsAt || !endsAt) {
    return NextResponse.json({ error: 'invalid date range' }, { status: 400, headers: cors as any })
  }

  const linkage = await ensureProjectForEventTitle(title)
  const projectId = linkage?.projectId ?? null
  const customerId = linkage?.customerId ?? null
  const reminderEnabled = !!b.reminderEnabled
  const reminderOffsets = parseReminderOffsets(b?.reminderOffsets)

  try {
    const created = await tryPrisma(async p => {
      await p.calendar.upsert({
        where: { id: String(b.calendarId) },
        update: {},
        create: { id: String(b.calendarId), name: 'Default' },
      })

      return insertEventCompat(p, {
        calendarId: String(b.calendarId),
        title,
        description: (b.description ?? '') || '',
        startsAt,
        endsAt,
        startDate: startDateValue,
        endDate: endDateValue,
        allDay,
        location: (b.location ?? '') || '',
        type: (b.type ?? null) as EventType | null,
        shift: (b.shift ?? null) as WorkShift | null,
        checklist: b.checklist ?? null,
        reminderEnabled,
        reminderOffsets: reminderEnabled ? reminderOffsets : [],
        projectId,
        customerId,
      })
    }, null as any)

    const payload = {
      ...serializeCalendarEvent(
        {
          id: created.id,
          calendarId: created.calendarId,
          title: created.title,
          description: created.description ?? '',
          startsAt: created.startsAt,
          endsAt: created.endsAt,
          startDate: created.startDate ?? startDateValue,
          endDate: created.endDate ?? endDateValue,
          allDay: created.allDay,
          location: created.location ?? '',
          type: created.type ?? null,
          shift: created.shift ?? null,
          checklist: created.checklist ?? null,
          hasQuantities: false,
        },
        { timezone: APP_TZ },
      ),
      attachmentName: created.attachmentName ?? null,
      attachmentType: created.attachmentType ?? null,
      reminderEnabled: !!created.reminderEnabled,
      reminderOffsets: parseReminderOffsets(created.reminderOffsets ?? []),
    }

    return NextResponse.json(payload, { status: 201, headers: cors as any })
  } catch (e: any) {
    const msg = String(e?.message ?? '')
    const status = msg.includes("Can't reach database server") || msg.includes('P1001') ? 503 : 500
    return NextResponse.json({ error: 'Failed to create event', details: msg }, { status, headers: cors as any })
  }
}
