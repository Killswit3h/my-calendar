// src/lib/push.ts
import prisma from '@/lib/db'
import { getWebpush } from '@/lib/webpush'

type PushPayload = {
  title: string
  body: string
  url: string
  actions?: Array<{ action: string; title: string }>
  data?: Record<string, unknown>
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const push = getWebpush()
  const subscriptions = await prisma.notificationSubscription.findMany({ where: { userId } })
  if (!subscriptions.length) return

  await Promise.allSettled(
    subscriptions.map(async sub => {
      try {
        await push.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          } as any,
          JSON.stringify(payload),
        )
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await prisma.notificationSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {})
        } else {
          throw error
        }
      }
    }),
  )
}
