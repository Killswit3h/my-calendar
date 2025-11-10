import { NextResponse } from 'next/server'
import prisma from '@/src/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [pending, failed, lastSent] = await Promise.all([
    prisma.outbox.count({ where: { status: 'pending' } }),
    prisma.outbox.count({ where: { status: 'failed' } }),
    prisma.outbox.findFirst({
      where: { status: 'sent' },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    }),
  ])

  return NextResponse.json({
    ok: true,
    pending,
    failed,
    lastSentAt: lastSent?.updatedAt ?? null,
  })
}
