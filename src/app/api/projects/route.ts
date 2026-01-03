import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import { ensureUserRecord } from '@/lib/users'

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  await ensureUserRecord(user)

  const body = await req.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const customerId = typeof body?.customerId === 'string' ? body.customerId.trim() : ''
  if (!name || !customerId) {
    return NextResponse.json({ error: 'name_and_customer_required' }, { status: 422 })
  }

  const description =
    typeof body?.description === 'string' ? body.description.trim() || null : null
  const teamId =
    typeof body?.teamId === 'string' && body.teamId.trim() ? body.teamId.trim() : null

  const project = await prisma.project.create({
    data: {
      name,
      customerId,
      teamId: teamId ?? undefined,
      description,
      updatedById: user.id,
    },
  })

  return NextResponse.json(project, { status: 201 })
}
