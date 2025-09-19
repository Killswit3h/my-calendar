// src/app/api/events/[id]/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { tryPrisma } from '@/lib/dbSafe'
import { serializeCalendarEvent } from '@/lib/events/serializer'

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
  const b = await req.json().catch(() => null)
  if (!b) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: cors as any })

  const data: any = {}
  if ('title' in b) data.title = b.title
  if ('description' in b) data.description = b.description ?? null
  if ('location' in b) data.location = b.location ?? null
  if ('type' in b) data.type = b.type ?? null
  if ('allDay' in b) data.allDay = !!b.allDay

  // accept start|startsAt and end|endsAt
  if (b.start || b.startsAt) {
    const d = new Date(b.start ?? b.startsAt)
    if (isNaN(d.getTime())) return NextResponse.json({ error: 'Invalid start' }, { status: 400, headers: cors as any })
    data.start = d
  }
  if (b.end || b.endsAt) {
    const d = new Date(b.end ?? b.endsAt)
    if (isNaN(d.getTime())) return NextResponse.json({ error: 'Invalid end' }, { status: 400, headers: cors as any })
    data.end = d
  }
  if (data.start && data.end && data.end <= data.start) {
    return NextResponse.json({ error: 'end must be after start' }, { status: 400, headers: cors as any })
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
            start: true,
            end: true,
            allDay: true,
            location: true,
            type: true,
            shift: true,
            checklist: true,
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
      start: updated.start,
      end: updated.end,
      allDay: updated.allDay,
      location: updated.location ?? '',
      type: updated.type ?? null,
      shift: updated.shift ?? null,
      checklist: updated.checklist ?? null,
    })
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
