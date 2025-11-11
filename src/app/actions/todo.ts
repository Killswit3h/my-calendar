'use server'

import prisma from '@/src/lib/db'
import { getServerSession } from '@/lib/auth'
import { emitChange } from '@/lib/notify'
import { subscribeUserToResource } from '@/lib/subscribe'
import { ensureUserRecord } from '@/lib/users'

export async function updateTodoTitle(todoId: string, title: string) {
  const session = await getServerSession()
  const userId = session?.user?.id
  if (!userId) {
    throw new Error('unauthorized')
  }

  await ensureUserRecord({ id: userId, name: (session.user as any)?.name ?? null })

  const updated = await prisma.todo.update({
    where: { id: todoId },
    data: { title, updatedById: userId },
    select: { id: true, title: true, projectId: true },
  })

  await subscribeUserToResource(userId, 'Todo', updated.id)
  if (updated.projectId) {
    await subscribeUserToResource(userId, 'Project', updated.projectId)
  }

  await emitChange({
    actorId: userId,
    resourceType: 'Todo',
    resourceId: updated.id,
    kind: 'todo.updated',
    title: 'Todo updated',
    body: `${updated.title} was updated`,
    url: `/planner/todos?todo=${updated.id}`,
  })

  return updated
}
