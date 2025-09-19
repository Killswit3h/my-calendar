// src/app/api/calendars/[id]/events/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { tryPrisma } from '@/lib/dbSafe'
import { serializeCalendarEvent } from '@/lib/events/serializer'
import type { CalendarEventPayload, EventRowLike } from '@/lib/events/serializer'

type EventRow = EventRowLike & {
  start: Date
  end: Date
  allDay: boolean
  description: string | null
  location: string | null
  type: 'GUARDRAIL' | 'FENCE' | 'TEMP_FENCE' | 'HANDRAIL' | 'ATTENUATOR' | null
  shift: 'DAY' | 'NIGHT' | null
  checklist: unknown | null
}

type ApiEvent = CalendarEventPayload

function serializeEvent(row: EventRow): ApiEvent {
  return serializeCalendarEvent(row)
}
function toDate(v: unknown): Date | null {
  if (v instanceof Date) return v
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v as any)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}
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
    if (ct.includes('application/json')) { try { return JSON.parse(raw) } catch {} }
    if (ct.includes('application/x-www-form-urlencoded')) {
      const p = new URLSearchParams(raw); return Object.fromEntries(p.entries())
    }
  }
  const sp = req.nextUrl.searchParams
  if (sp.size) return Object.fromEntries(sp.entries())
  return null
}

/* ---------- GET ---------- */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: calendarId } = await ctx.params
  const url = new URL(req.url)
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')

  const rows = await tryPrisma<EventRow[]>(
    async (p) => {
      const where: any = { calendarId }
      if (from || to) {
        where.start = {}
        if (from) where.start.gte = new Date(from!)
        if (to) where.start.lte = new Date(to!)
      }
      const out = await p.event.findMany({
        where,
        orderBy: { start: 'asc' },
        select: {
          id: true, calendarId: true, title: true, description: true,
          start: true, end: true, allDay: true, location: true,
          type: true, shift: true, checklist: true,
        },
      })
      return out as EventRow[]
    },
    [] as EventRow[],
  )

  const payload = rows.map(serializeEvent)

  return NextResponse.json({ events: payload }, { status: 200 })
}

/* ---------- POST ---------- */
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

  const s0 = toDate(body.start ?? body.startsAt)
  const e0 = toDate(body.end ?? body.endsAt)
  if (!s0) return NextResponse.json({ error: 'valid start required' }, { status: 400 })

  const allDay = toBool(body.allDay, false)

  // Normalize end: all-day exclusive end, timed must be > start
  const DAY = 86_400_000
  let s = s0
  let e = e0
  if (allDay) {
    if (!e) e = new Date(s.getTime() + DAY)
    else if (e.getTime() - s.getTime() < DAY) e = new Date(s.getTime() + DAY)
  } else {
    if (!e || e <= s) return NextResponse.json({ error: 'end must be > start for timed events' }, { status: 400 })
  }

  const created = await tryPrisma<EventRow | null>(
    async (p) => {
      const out = await p.event.create({
        data: {
          calendarId,
          title,
          description: typeof body.description === 'string' ? body.description : null,
          start: s,
          end: e,
          allDay,
          location: typeof body.location === 'string' ? body.location : null,
          type: body.type ?? null,
          shift: body.shift ?? null,
          checklist: body.checklist ?? null,
        },
        select: {
          id: true, calendarId: true, title: true, description: true,
          start: true, end: true, allDay: true, location: true,
          type: true, shift: true, checklist: true,
        },
      })
      return out as EventRow
    },
    null,
  )
  if (!created) return NextResponse.json({ error: 'database unavailable' }, { status: 503 })

  const payload = serializeEvent(created)

  return NextResponse.json(payload, { status: 201 })
}
