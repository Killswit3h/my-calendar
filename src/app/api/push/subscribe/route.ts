import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/src/lib/db'
import { getServerSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const session = await getServerSession(request)
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const payload = await request.json().catch(() => null)
  const { endpoint, keys } = payload ?? {}
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'invalid_subscription' }, { status: 400 })
  }

  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId },
  })

  await prisma.notificationSubscription.upsert({
    where: { endpoint },
    update: {
      userId,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: request.headers.get('user-agent') ?? undefined,
    },
    create: {
      endpoint,
      userId,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: request.headers.get('user-agent') ?? undefined,
    },
  })

  return NextResponse.json({ ok: true })
}
