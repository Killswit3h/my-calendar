// src/app/api/events/[id]/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { WorkShift } from '@prisma/client'
import { tryPrisma } from '@/lib/dbSafe'
import { serializeCalendarEvent } from '@/lib/events/serializer'
import { parseAppDateTime, parseAppDateOnly, addDaysUtc } from '@/lib/timezone'
import { ensureProjectForEventTitle } from '@/src/lib/finance/projectLink'

type PatchPayload = {
  title?: string
  description?: string | null
  location?: string | null
  type?: string | null
  allDay?: boolean
  start?: string
  end?: string
  startsAt?: string
  endsAt?: string
  checklist?: unknown | null
  shift?: WorkShift | string | null
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'PATCH,DELETE,OPTIONS',
} as const

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors as any })
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = (await req.json().catch(() => null)) as PatchPayload | null
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: cors as any })
  }

  const data: Record<string, any> = {}
  if ('title' in body) {
    if (typeof body.title !== 'string') {
      return NextResponse.json({ error: 'Invalid title' }, { status: 400, headers: cors as any })
    }
    const title = body.title.trim()
    if (!title) {
      return NextResponse.json({ error: 'Title required' }, { status: 400, headers: cors as any })
    }
    data.title = title
    const linkage = await ensureProjectForEventTitle(title)
    data.projectId = linkage?.projectId ?? null
    data.customerId = linkage?.customerId ?? null
  }
  if ('description' in body) data.description = body.description ?? null
  if ('location' in body) data.location = body.location ?? null
  if ('type' in body) data.type = body.type ?? null
  if ('shift' in body) {
    const raw = body.shift
    if (raw == null || (typeof raw === 'string' && raw.trim() === '')) {
      data.shift = null
    } else if (typeof raw === 'string') {
      const normalized = raw.trim().toUpperCase()
      if (normalized === 'DAY' || normalized === 'NIGHT') {
        data.shift = normalized as WorkShift
      } else {
        return NextResponse.json({ error: 'Invalid shift' }, { status: 400, headers: cors as any })
      }
    } else {
      return NextResponse.json({ error: 'Invalid shift' }, { status: 400, headers: cors as any })
    }
  }
  const hasAllDayFlag = 'allDay' in body
  const allDayFlag = hasAllDayFlag ? !!body.allDay : undefined
  if (hasAllDayFlag) data.allDay = !!body.allDay
  if ('checklist' in body) data.checklist = body.checklist ?? null

  const targetAllDay = allDayFlag ?? undefined
  if (body.start || body.startsAt) {
    const raw = body.start ?? body.startsAt ?? ''
    const parsed = targetAllDay ? (typeof raw === 'string' ? parseAppDateOnly(raw) : null) : (typeof raw === 'string' ? parseAppDateTime(raw) : null)
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid startsAt' }, { status: 400, headers: cors as any })
    }
    data.startsAt = parsed
  }

  if (body.end || body.endsAt) {
    const raw = body.end ?? body.endsAt ?? ''
    const parsed = targetAllDay ? (typeof raw === 'string' ? parseAppDateOnly(raw) : null) : (typeof raw === 'string' ? parseAppDateTime(raw) : null)
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid endsAt' }, { status: 400, headers: cors as any })
    }
    data.endsAt = parsed
  }

  if (targetAllDay && (!body.end && !body.endsAt) && data.startsAt && !data.endsAt) {
    const start = data.startsAt as Date
    data.endsAt = addDaysUtc(start, 1)
  }

  if (data.startsAt && data.endsAt && data.endsAt <= data.startsAt) {
    return NextResponse.json({ error: 'endsAt must be after startsAt' }, { status: 400, headers: cors as any })
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400, headers: cors as any })
  }

  try {
    const updated = await tryPrisma(
      p =>
        p.event.update({
          where: { id },
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
            _count: { select: { EventQuantity: true } },
          },
        }),
      null as any,
    )

    if (!updated) {
      return NextResponse.json({ error: 'database unavailable' }, { status: 503, headers: cors as any })
    }

    const payload = serializeCalendarEvent({
      id: updated.id,
      calendarId: updated.calendarId,
      title: updated.title,
      description: updated.description ?? '',
      startsAt: updated.startsAt,
      endsAt: updated.endsAt,
      allDay: updated.allDay,
      location: updated.location ?? '',
      type: updated.type ?? null,
      shift: updated.shift ?? null,
      checklist: updated.checklist ?? null,
      hasQuantities: !!(updated._count?.EventQuantity ?? 0),
    }, { timezone: 'UTC' })

    return NextResponse.json(payload, { status: 200, headers: cors as any })
  } catch (e: any) {
    const msg = String(e?.message ?? '')
    if (msg.includes("Can't reach database server") || msg.includes('P1001')) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503, headers: cors as any })
    }
    if (msg.includes('P2025') || msg.toLowerCase().includes('not found')) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404, headers: cors as any })
    }
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500, headers: cors as any })
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  try {
    await tryPrisma(p => p.event.delete({ where: { id }, select: { id: true } }), null as any)
    return NextResponse.json({ ok: true }, { status: 200, headers: cors as any })
  } catch (e: any) {
    const msg = String(e?.message ?? '')
    if (msg.includes("Can't reach database server") || msg.includes('P1001')) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503, headers: cors as any })
    }
    if (msg.includes('P2025') || msg.toLowerCase().includes('not found')) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404, headers: cors as any })
    }
    return NextResponse.json({ error: 'Failed to delete event', details: msg }, { status: 500, headers: cors as any })
  }
}
