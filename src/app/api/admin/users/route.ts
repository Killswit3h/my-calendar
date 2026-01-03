import { AccessArea } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import prisma from '@/lib/db'
import { setUserArea } from '@/lib/access'
import { getCurrentUser } from '@/lib/session'

export const runtime = 'nodejs'
export const revalidate = 0

const userSelect = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
  updatedAt: true,
  memberships: {
    select: {
      id: true,
      role: true,
      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  accessAreas: {
    select: { area: true },
  },
} as const

type UserPayload = Awaited<ReturnType<typeof fetchUsers>>[number]

async function fetchUsers() {
  const rows = await prisma.user.findMany({
    orderBy: [{ name: 'asc' }, { createdAt: 'asc' }],
    select: userSelect,
  })
  return rows.map(row => ({
    ...row,
    accessAreas: row.accessAreas.map(entry => entry.area),
    memberships: row.memberships.map(entry => ({
      id: entry.id,
      role: entry.role,
      team: entry.team ? { id: entry.team.id, name: entry.team.name } : null,
    })),
  }))
}

export async function GET() {
  const current = await getCurrentUser()
  if (!current) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const users = await fetchUsers()
  return NextResponse.json({ users })
}

export async function PATCH(req: NextRequest) {
  const current = await getCurrentUser()
  if (!current) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let payload: { userId?: string; area?: AccessArea; enabled?: boolean }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  if (!payload.userId || typeof payload.userId !== 'string') {
    return NextResponse.json({ error: 'missing_user' }, { status: 400 })
  }
  if (!payload.area || !Object.values(AccessArea).includes(payload.area)) {
    return NextResponse.json({ error: 'invalid_area' }, { status: 400 })
  }

  const enabled = typeof payload.enabled === 'boolean' ? payload.enabled : true
  await setUserArea(payload.userId, payload.area, enabled)

  const updated = await prisma.user.findUnique({ where: { id: payload.userId }, select: userSelect })
  if (!updated) return NextResponse.json({ error: 'user_not_found' }, { status: 404 })

  const formatted: UserPayload = {
    ...updated,
    accessAreas: updated.accessAreas.map(entry => entry.area),
    memberships: updated.memberships.map(entry => ({
      id: entry.id,
      role: entry.role,
      team: entry.team ? { id: entry.team.id, name: entry.team.name } : null,
    })),
  }

  return NextResponse.json({ user: formatted })
}










