import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getServerSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getServerSession(request)
  const userId = session?.user?.id
  if (!userId) return NextResponse.json([], { status: 401 })

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(notifications)
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(request)
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ ok: false }, { status: 401 })

  const body = await request.json().catch(() => null)
  const ids: string[] = Array.isArray(body?.ids) ? body.ids : []
  if (!ids.length) {
    return NextResponse.json({ ok: true })
  }

  await prisma.notification.updateMany({
    where: { id: { in: ids }, userId },
    data: { readAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
