import type { AccessArea } from '@prisma/client'
import prisma from '@/lib/db'
import { getCurrentUser } from '@/lib/session'

export class AccessDeniedError extends Error {
  status: number

  constructor(message = 'Forbidden', status = 403) {
    super(message)
    this.name = 'AccessDeniedError'
    this.status = status
  }
}

async function resolveUserId(userId?: string | null): Promise<string | null> {
  if (userId) return userId
  const user = await getCurrentUser()
  return user?.id ?? null
}

export async function getUserAreas(userId?: string | null): Promise<AccessArea[]> {
  const id = await resolveUserId(userId)
  if (!id) return []
  const rows = await prisma.userAccessArea.findMany({
    where: { userId: id },
    select: { area: true },
    orderBy: { area: 'asc' },
  })
  return rows.map(row => row.area)
}

export async function hasAccess(userId: string, area: AccessArea): Promise<boolean> {
  if (!userId) return false
  const record = await prisma.userAccessArea.findUnique({
    where: { userId_area: { userId, area } },
    select: { userId: true },
  })
  return Boolean(record)
}

export async function setUserArea(userId: string, area: AccessArea, enabled: boolean): Promise<void> {
  if (!userId) throw new Error('userId is required')
  if (enabled) {
    await prisma.userAccessArea.upsert({
      where: { userId_area: { userId, area } },
      update: {},
      create: { userId, area },
    })
    return
  }
  await prisma.userAccessArea.deleteMany({ where: { userId, area } })
}

export async function requireAccess(area: AccessArea, opts?: { userId?: string }) {
  const id = await resolveUserId(opts?.userId)
  if (!id) throw new AccessDeniedError('Authentication required', 401)

  const ok = await hasAccess(id, area)
  if (!ok) throw new AccessDeniedError()
  return { userId: id }
}

