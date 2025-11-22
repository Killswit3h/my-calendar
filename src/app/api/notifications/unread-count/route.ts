import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getServerSession } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await getServerSession(request)
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ count: 0 })

  const count = await prisma.notification.count({
    where: { userId, readAt: null },
  })

  return NextResponse.json({ count })
}
