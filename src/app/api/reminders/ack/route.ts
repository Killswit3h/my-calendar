export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/lib/db'
import { getServerSession } from '@/lib/auth'
import { markEntityLastNotified } from '@/lib/reminders'

type Body = { reminderId?: string }

export async function POST(request: NextRequest) {
  const session = await getServerSession(request)
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as Body | null
  const reminderId = body?.reminderId?.trim?.()
  if (!reminderId) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  const reminder = await prisma.reminder.findFirst({
    where: { id: reminderId, userId },
    select: { id: true, entityType: true, entityId: true },
  })
  if (!reminder) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const now = new Date()
  await prisma.reminder.update({
    where: { id: reminder.id },
    data: { status: 'sent', lastSentAt: now },
  })
  await markEntityLastNotified(reminder.entityType as 'event' | 'todo', reminder.entityId, now)

  return NextResponse.json({ ok: true })
}
