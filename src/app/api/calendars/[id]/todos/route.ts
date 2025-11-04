// src/app/api/calendars/[id]/todos/route.ts
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
      p.calendarTodo.findMany({
        where: { calendarId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          calendarId: true,
          title: true,
          notes: true,
          done: true,
          type: true,
          createdAt: true,
        },
      }),
    [] as any[],
  )

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: calendarId } = await ctx.params
  if (!calendarId) return NextResponse.json({ error: 'calendarId required' }, { status: 400 })

  let body: any = null
  try {
    body = await req.json()
  } catch {
    body = null
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const rawTitle = typeof body.title === 'string' ? body.title.trim() : ''
  if (!rawTitle) {
    return NextResponse.json({ error: 'title required' }, { status: 400 })
  }

  const type = typeof body.type === 'string' && body.type.trim() ? body.type.trim() : null
  if (!type) {
    return NextResponse.json({ error: 'type required' }, { status: 400 })
  }

  const created = await tryPrisma(
    p =>
      p.calendarTodo.create({
        data: {
          calendarId,
          title: rawTitle,
          notes: typeof body.notes === 'string' ? body.notes : null,
          type,
        },
        select: {
          id: true,
          calendarId: true,
          title: true,
          notes: true,
          done: true,
          type: true,
          createdAt: true,
        },
      }),
    null as any,
  )

  if (!created) {
    return NextResponse.json({ error: 'database unavailable' }, { status: 503 })
  }

  return NextResponse.json(created, { status: 201 })
}
