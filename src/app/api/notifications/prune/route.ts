import { NextResponse } from 'next/server'
import prisma from '@/src/lib/db'

export const dynamic = 'force-dynamic'

export async function POST() {
  const now = Date.now()
  const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)

  const [notificationsDeleted, outboxDeleted, auditDeleted] = await Promise.all([
    prisma.notification.deleteMany({ where: { createdAt: { lt: ninetyDaysAgo } } }),
    prisma.outbox.deleteMany({ where: { updatedAt: { lt: thirtyDaysAgo } } }),
    prisma.auditLog.deleteMany({ where: { createdAt: { lt: ninetyDaysAgo } } }),
  ])

  return NextResponse.json({
    notificationsDeleted: notificationsDeleted.count,
    outboxDeleted: outboxDeleted.count,
    auditDeleted: auditDeleted.count,
  })
}
