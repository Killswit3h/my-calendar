// src/app/api/calendars/[id]/events/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { EventType, WorkShift } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { tryPrisma } from '@/lib/dbSafe'
import { serializeCalendarEvent } from '@/lib/events/serializer'
import type { EventRowLike } from '@/lib/events/serializer'

const DAY_IN_MS = 86_400_000

type PrismaEventRow = EventRowLike & {
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
}

const hasEventTypeEvent = (() => {
  try {
    return Object.prototype.hasOwnProperty.call(EventType, 'EVENT')
  } catch {
    return false
  }
})()

const hasEventTypeTodo = (() => {
  try {
    return Object.prototype.hasOwnProperty.call(EventType, 'TODO')
  } catch {
    return false
  }
})()

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

const toISOParam = (value: string | null | undefined): string | null => {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

const parseDateTime = (value: unknown): Date | null => {
  if (value instanceof Date) return new Date(value.getTime())
  if (typeof value === 'number' && Number.isFinite(value)) {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    const d = new Date(trimmed)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

const parseDateOnlyUTC = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    const iso = trimmed.length === 10 ? `${trimmed}T00:00:00.000Z` : trimmed
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return null
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return null
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  }
  return null
}

const toExclusiveEnd = (startOfDay: Date): Date => new Date(startOfDay.getTime() + DAY_IN_MS)

const serialize = (row: PrismaEventRow) => serializeCalendarEvent(row)

function toBool(v: unknown, def = true): boolean {
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase()
    if (s === 'true') return true
    if (s === 'false') return false
  }
  return def
}

async function readEventInput(req: NextRequest): Promise<Record<string, any> | null> {
  const ct = req.headers.get('content-type')?.toLowerCase() ?? ''
  const raw = await req.text().catch(() => '')
  if (raw) {
    if (ct.includes('application/json')) {
      try {
        return JSON.parse(raw)
      } catch {
        return null
      }
    }
    if (ct.includes('application/x-www-form-urlencoded')) {
      const p = new URLSearchParams(raw)
      return Object.fromEntries(p.entries())
    }
  }
  const sp = req.nextUrl.searchParams
  if (sp.size) return Object.fromEntries(sp.entries())
  return null
}

async function insertEventCompat(
  p: any,
  data: {
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
  },
): Promise<PrismaEventRow> {
  await ensureLegacyStartColumnsHandled(p)
  try {
    const created = (await p.event.create({
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
      },
    })) as PrismaEventRow
    return created
  } catch (error) {
    const rows = (await p.$queryRawUnsafe(
      'INSERT INTO "public"."Event" ("calendarId","title","description","startsAt","endsAt","allDay","location","type","shift","checklist","start","end") VALUES ($1,$2,$3,$4,$5,$6,$7,CASE WHEN $8 IS NULL THEN NULL ELSE $8::"EventType" END,CASE WHEN $9 IS NULL THEN NULL ELSE $9::"WorkShift" END,CASE WHEN $10 IS NULL THEN NULL ELSE $10::jsonb END,$4,$5) RETURNING "id","calendarId","title","description","startsAt","endsAt","allDay","location","type","shift","checklist"',
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
    } as PrismaEventRow
  }
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: calendarId } = await ctx.params
  if (!calendarId) return NextResponse.json({ error: 'Missing calendar id' }, { status: 400 })

  const url = new URL(req.url)
  const params = url.searchParams
  const startISO =
    toISOParam(params.get('start')) ??
    toISOParam(params.get('startStr')) ??
    toISOParam(params.get('rangeStart'))
  const endISO =
    toISOParam(params.get('end')) ??
    toISOParam(params.get('endStr')) ??
    toISOParam(params.get('rangeEnd'))

  const where: Record<string, any> = { calendarId }
  if (hasEventTypeEvent) {
    where.OR = [{ type: 'EVENT' }, { type: null }]
  } else if (hasEventTypeTodo) {
    where.NOT = { type: 'TODO' }
  }

  if (startISO && endISO) {
    where.AND = [{ startsAt: { lt: endISO } }, { endsAt: { gt: startISO } }]
  }

  const rows = await tryPrisma<PrismaEventRow[]>(
    async (p) =>
      (await p.event.findMany({
        where,
        orderBy: [{ title: 'asc' }, { startsAt: 'asc' }],
        take: 1000,
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
        },
      })) as PrismaEventRow[],
    [] as PrismaEventRow[],
  )

  const events = rows.map(serialize)
  return NextResponse.json({ events }, { status: 200 })
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: calendarId } = await ctx.params
  const rawBody = await readEventInput(req)
  if (!rawBody) return NextResponse.json({ error: 'title required' }, { status: 400 })
  const body: Record<string, any> = rawBody

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const allDay = toBool(body.allDay, false)
  const startInput = body.startsAt ?? body.start
  const endInput = body.endsAt ?? body.end

  let startsAt: Date | null = null
  let endsAt: Date | null = null

  if (allDay) {
    const startDay = parseDateOnlyUTC(startInput)
    if (!startDay) {
      return NextResponse.json({ error: 'valid startsAt required for all-day event' }, { status: 400 })
    }
    let endDay = endInput ? parseDateOnlyUTC(endInput) : null
    if (!endDay || endDay < startDay) {
      endDay = startDay
    }
    startsAt = startDay
    endsAt = toExclusiveEnd(endDay)
  } else {
    const startDate = parseDateTime(startInput)
    const endDate = parseDateTime(endInput)
    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'valid startsAt and endsAt required' }, { status: 400 })
    }
    if (endDate <= startDate) {
      return NextResponse.json({ error: 'endsAt must be after startsAt' }, { status: 400 })
    }
    startsAt = startDate
    endsAt = endDate
  }

  const created = await tryPrisma<PrismaEventRow | null>(
    async (p) =>
      insertEventCompat(p, {
        calendarId,
        title,
        description: typeof body.description === 'string' ? body.description : null,
        startsAt: startsAt!,
        endsAt: endsAt!,
        allDay,
        location: typeof body.location === 'string' ? body.location : null,
        type: (body.type ?? null) as EventType | null,
        shift: (body.shift ?? null) as WorkShift | null,
        checklist: body.checklist ?? null,
      }),
    null,
  )

  if (!created) return NextResponse.json({ error: 'database unavailable' }, { status: 503 })

  return NextResponse.json(serialize(created), { status: 201 })
}
