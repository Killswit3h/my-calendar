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
      p.todo.findMany({
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
