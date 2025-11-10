export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/lib/db'
import { getServerSession } from '@/lib/auth'

type SubscriptionPayload = {
  endpoint?: string
  keys?: { p256dh?: string; auth?: string }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(request)
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as SubscriptionPayload | null
  const endpoint = body?.endpoint?.trim?.() ?? ''
  const p256dh = body?.keys?.p256dh ?? ''
  const auth = body?.keys?.auth ?? ''

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: 'invalid_subscription' }, { status: 400 })
  }

  const userAgent = request.headers.get('user-agent') ?? undefined

  await prisma.notificationSubscription.upsert({
    where: { endpoint },
    update: { userId, p256dh, auth, userAgent },
    create: { userId, endpoint, p256dh, auth, userAgent },
  })

  return NextResponse.json({ ok: true })
}
