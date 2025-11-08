export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/lib/db'
import { getServerSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getServerSession(request)
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const rawWindow = Number(request.nextUrl.searchParams.get('windowHours') ?? '24')
  const windowHours = Number.isFinite(rawWindow) ? Math.min(Math.max(rawWindow, 1), 72) : 24
  const now = new Date()
  const until = new Date(now.getTime() + windowHours * 60 * 60 * 1000)

  const reminders = await prisma.reminder.findMany({
    where: {
      userId,
      status: 'pending',
      channel: 'inapp',
      fireAt: { gte: now, lte: until },
    },
    orderBy: { fireAt: 'asc' },
    select: {
      id: true,
      entityType: true,
      entityId: true,
      fireAt: true,
    },
  })

  return NextResponse.json({
    reminders: reminders.map(r => ({
      id: r.id,
      entityType: r.entityType as 'event' | 'todo',
      entityId: r.entityId,
      fireAt: r.fireAt.toISOString(),
    })),
  })
}
