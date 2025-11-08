export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/lib/db'
import { getServerSession } from '@/lib/auth'
import { computeReminderTimes } from '@/lib/timezone'
import { parseReminderOffsets } from '@/lib/reminders'

type Body = {
  entityType?: 'event' | 'todo'
  entityId?: string
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(request)
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as Body | null
  const entityType = body?.entityType
  const entityId = body?.entityId?.trim?.()
  if (!entityType || (entityType !== 'event' && entityType !== 'todo') || !entityId) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  if (entityType === 'event') {
    const event = await prisma.event.findUnique({
      where: { id: entityId },
      select: {
        allDay: true,
        startDate: true,
        startsAt: true,
        reminderEnabled: true,
        reminderOffsets: true,
      },
    })
    if (!event) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 })
    }
    return NextResponse.json(
      await regenerateReminders({
        userId,
        entityType,
        entityId,
        enabled: !!event.reminderEnabled,
        allDay: !!event.allDay,
        startAt: event.startsAt ? event.startsAt.toISOString() : undefined,
        startDate: event.startDate ?? undefined,
        offsets: parseReminderOffsets(event.reminderOffsets ?? []),
      }),
    )
  }

  const todo = await prisma.todo.findUnique({
    where: { id: entityId },
    select: {
      allDay: true,
      dueDate: true,
      dueAt: true,
      reminderEnabled: true,
      reminderOffsets: true,
    },
  })
  if (!todo) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  return NextResponse.json(
    await regenerateReminders({
      userId,
      entityType,
      entityId,
      enabled: !!todo.reminderEnabled,
      allDay: !!todo.allDay,
      startAt: todo.dueAt ? todo.dueAt.toISOString() : undefined,
      startDate: todo.dueDate ?? undefined,
      offsets: parseReminderOffsets(todo.reminderOffsets ?? []),
    }),
  )
}

async function regenerateReminders(args: {
  userId: string
  entityType: 'event' | 'todo'
  entityId: string
  enabled: boolean
  allDay: boolean
  startAt?: string
  startDate?: string
  offsets: number[]
}) {
  const { userId, entityType, entityId, enabled, allDay, startAt, startDate, offsets } = args

  await prisma.reminder.deleteMany({
    where: { userId, entityType, entityId, status: 'pending' },
  })

  if (!enabled) {
    return { created: 0 }
  }

  const times = computeReminderTimes({
    allDay,
    startAtUTC: startAt,
    startDate,
    offsetsMinutes: offsets,
  })
    .map(iso => new Date(iso))
    .filter(date => !Number.isNaN(date.getTime()))

  const now = Date.now()
  const upcoming = times.filter(date => date.getTime() >= now - 60_000)
  if (!upcoming.length) {
    return { created: 0 }
  }

  const data = upcoming.flatMap(date => [
    {
      userId,
      entityType,
      entityId,
      fireAt: date,
      channel: 'inapp',
      status: 'pending' as const,
    },
    {
      userId,
      entityType,
      entityId,
      fireAt: date,
      channel: 'push',
      status: 'pending' as const,
    },
  ])

  await prisma.reminder.createMany({ data })
  return { created: data.length }
}
