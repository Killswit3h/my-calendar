// src/lib/push.ts
import webPush from 'web-push'
import prisma from '@/src/lib/db'

const CONTACT = process.env.WEB_PUSH_CONTACT_EMAIL || 'mailto:admin@example.com'

let configured = false

export function ensureWebPushConfigured() {
  if (configured) return
  const publicKey = process.env.WEB_PUSH_PUBLIC_VAPID_KEY
  const privateKey = process.env.WEB_PUSH_PRIVATE_VAPID_KEY
  if (!publicKey || !privateKey) {
    throw new Error('WEB_PUSH_PUBLIC_VAPID_KEY and WEB_PUSH_PRIVATE_VAPID_KEY must be configured')
  }
  webPush.setVapidDetails(CONTACT, publicKey, privateKey)
  configured = true
}

type PushPayload = {
  title: string
  body: string
  url: string
  actions?: Array<{ action: string; title: string }>
  data?: Record<string, unknown>
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  ensureWebPushConfigured()
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } })
  if (!subscriptions.length) return

  await Promise.allSettled(
    subscriptions.map(async sub => {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          } as any,
          JSON.stringify(payload),
        )
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } }).catch(() => {})
        } else {
          throw error
        }
      }
    }),
  )
}
