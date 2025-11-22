export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { tryGetWebpush } from '@/lib/webpush'

const MAX_ATTEMPTS = 5

export async function POST() {
  const webpush = tryGetWebpush()
  if (!webpush) {
    return NextResponse.json({ processed: 0, skipped: 'webpush_not_configured' })
  }
  const batch = await prisma.outbox.findMany({
    where: { status: 'pending', type: 'push' },
    orderBy: { createdAt: 'asc' },
    take: 50,
  })

  for (const item of batch) {
    try {
      const payload = item.payload as {
        endpoint: string
        keys: { p256dh: string; auth: string }
        notification: { title: string; body: string; url?: string }
      }
      await webpush.sendNotification(
        {
          endpoint: payload.endpoint,
          keys: payload.keys,
        },
        JSON.stringify(payload.notification),
      )
      await prisma.outbox.update({
        where: { id: item.id },
        data: { status: 'sent', attemptCount: { increment: 1 } },
      })
    } catch (error: any) {
      const attempts = item.attemptCount + 1
      await prisma.outbox.update({
        where: { id: item.id },
        data: {
          status: attempts >= MAX_ATTEMPTS ? 'failed' : 'pending',
          attemptCount: attempts,
          lastError: error?.message ?? String(error),
        },
      })
    }
  }

  return NextResponse.json({ processed: batch.length })
}
