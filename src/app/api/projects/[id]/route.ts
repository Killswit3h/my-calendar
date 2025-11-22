import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import { subscribeUserToResource } from '@/lib/subscribe'
import { emitChange } from '@/lib/notify'
import { ensureUserRecord } from '@/lib/users'

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  await ensureUserRecord(user)

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  const { id } = await ctx.params
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const data: Record<string, unknown> = { updatedById: user.id }
  if ('name' in body) {
    const v = typeof body.name === 'string' ? body.name.trim() : ''
    if (!v) return NextResponse.json({ error: 'name_required' }, { status: 422 })
    data.name = v
  }
  if ('description' in body) {
    data.description = typeof body.description === 'string' ? body.description.trim() || null : null
  }
  if ('teamId' in body) {
    data.teamId =
      typeof body.teamId === 'string' && body.teamId.trim() ? body.teamId.trim() : null
  }
  if ('customerId' in body) {
    const v = typeof body.customerId === 'string' ? body.customerId.trim() : ''
    if (!v) return NextResponse.json({ error: 'customer_required' }, { status: 422 })
    data.customerId = v
  }

  if (Object.keys(data).length === 1) {
    return NextResponse.json({ error: 'no_changes' }, { status: 400 })
  }

  const updated = await prisma.project.update({
    where: { id },
    data,
  })

  await subscribeUserToResource(user.id, 'Project', updated.id)
  await emitChange({
    actorId: user.id,
    resourceType: 'Project',
    resourceId: updated.id,
    kind: 'project.updated',
    title: 'Project updated',
    body: `${user.name ?? 'Someone'} updated project: ${updated.name}`,
    url: `/projects/${updated.id}`,
  })

  return NextResponse.json(updated)
}
