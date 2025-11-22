export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { sendPushToUser } from '@/lib/push'
import { markEntityLastNotified } from '@/lib/reminders'

const MAX_BATCH = 200

export async function GET(_request: NextRequest) {
  const now = new Date()
  const due = await prisma.reminder.findMany({
    where: { status: 'pending', channel: 'push', fireAt: { lte: now } },
    orderBy: { fireAt: 'asc' },
    take: MAX_BATCH,
  })

  let sent = 0
  for (const reminder of due) {
    const entityType = reminder.entityType as 'event' | 'todo'
    const url = entityType === 'event' ? `/events/${reminder.entityId}` : `/todos/${reminder.entityId}`
    try {
      await sendPushToUser(reminder.userId, {
        title: entityType === 'event' ? 'Event reminder' : 'Todo reminder',
        body: 'Reminder is due now.',
        url,
        actions: [
          { action: 'snooze_10', title: 'Snooze 10m' },
          { action: 'open', title: 'Open' },
        ],
        data: {
          reminderId: reminder.id,
          entityType,
          entityId: reminder.entityId,
          url,
        },
      })
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: 'sent', lastSentAt: now },
      })
      await markEntityLastNotified(entityType, reminder.entityId, now)
      sent += 1
    } catch (error) {
      // if push fails keep reminder pending for retry
      console.error('Failed to send push reminder', { reminderId: reminder.id, error })
    }
  }

  return NextResponse.json({ sent })
}
