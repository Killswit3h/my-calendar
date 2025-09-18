// src/app/api/calendars/[id]/events/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { tryPrisma } from '@/lib/dbSafe'

type EventRow = {
  id: string
  calendarId: string
  title: string
  description: string | null
  startsAt: Date
  endsAt: Date
  allDay: boolean
  location: string | null
  type: 'GUARDRAIL' | 'FENCE' | 'TEMP_FENCE' | 'HANDRAIL' | 'ATTENUATOR' | null
  shift: 'DAY' | 'NIGHT' | null
  checklist: unknown | null
}

const TZ = 'America/New_York' // render all-day dates in this tz

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
// YYYY-MM-DD in a specific timezone
function ymdTz(d: Date, tz = TZ): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
  })
  return fmt.format(d) // en-CA gives YYYY-MM-DD
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
        where.startsAt = {}
        if (from) where.startsAt.gte = new Date(from!)
        if (to) where.startsAt.lte = new Date(to!)
      }
      const out = await p.event.findMany({
        where,
        orderBy: { startsAt: 'asc' },
        select: {
          id: true, calendarId: true, title: true, description: true,
          startsAt: true, endsAt: true, allDay: true, location: true,
          type: true, shift: true, checklist: true,
        },
      })
      return out as EventRow[]
    },
    [] as EventRow[],
  )

  const payload = rows.map((r) => r.allDay ? {
    id: r.id,
    calendarId: r.calendarId,
    title: r.title,
    description: r.description ?? '',
    start: ymdTz(r.startsAt),  // date-only in TZ
    end: ymdTz(r.endsAt),      // exclusive date in TZ
    allDay: true,
    location: r.location ?? '',
    type: r.type ?? null,
    shift: r.shift ?? null,
    checklist: r.checklist ?? null,
  } : {
    id: r.id,
    calendarId: r.calendarId,
    title: r.title,
    description: r.description ?? '',
    start: r.startsAt,         // full ISO for timed
    end: r.endsAt,
    allDay: false,
    location: r.location ?? '',
    type: r.type ?? null,
    shift: r.shift ?? null,
    checklist: r.checklist ?? null,
  })

  return NextResponse.json(payload, { status: 200 })
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
          startsAt: s,
          endsAt: e,
          allDay,
          location: typeof body.location === 'string' ? body.location : null,
          type: body.type ?? null,
          shift: body.shift ?? null,
          checklist: body.checklist ?? null,
        },
        select: {
          id: true, calendarId: true, title: true, description: true,
          startsAt: true, endsAt: true, allDay: true, location: true,
          type: true, shift: true, checklist: true,
        },
      })
      return out as EventRow
    },
    null,
  )
  if (!created) return NextResponse.json({ error: 'database unavailable' }, { status: 503 })

  const payload = created.allDay ? {
    id: created.id,
    calendarId: created.calendarId,
    title: created.title,
    description: created.description ?? '',
    start: ymdTz(created.startsAt), // date-only in TZ
    end: ymdTz(created.endsAt),     // exclusive date in TZ
    allDay: true,
    location: created.location ?? '',
    type: created.type ?? null,
    shift: created.shift ?? null,
    checklist: created.checklist ?? null,
  } : {
    id: created.id,
    calendarId: created.calendarId,
    title: created.title,
    description: created.description ?? '',
    start: created.startsAt,
    end: created.endsAt,
    allDay: false,
    location: created.location ?? '',
    type: created.type ?? null,
    shift: created.shift ?? null,
    checklist: created.checklist ?? null,
  }

  return NextResponse.json(payload, { status: 201 })
}

