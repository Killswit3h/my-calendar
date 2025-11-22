export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getServerSession } from '@/lib/auth'

type Body = { reminderId?: string; minutes?: number }

export async function POST(request: NextRequest) {
  const session = await getServerSession(request)
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as Body | null
  const reminderId = body?.reminderId?.trim?.()
  const minutesRaw = typeof body?.minutes === 'number' ? body?.minutes : Number(body?.minutes ?? Number.NaN)
  if (!reminderId || !Number.isFinite(minutesRaw) || minutesRaw <= 0) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  const reminder = await prisma.reminder.findFirst({
    where: { id: reminderId, userId },
    select: { id: true, fireAt: true },
  })
  if (!reminder) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const newFireAt = new Date(reminder.fireAt.getTime() + minutesRaw * 60_000)
  await prisma.reminder.update({
    where: { id: reminder.id },
    data: { fireAt: newFireAt, status: 'pending', lastSentAt: null },
  })

  return NextResponse.json({ ok: true, fireAt: newFireAt.toISOString() })
}
