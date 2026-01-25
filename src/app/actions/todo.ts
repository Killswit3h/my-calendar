'use server'

import prisma from '@/src/lib/db'
import { getServerSession } from '@/lib/auth'
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

  return updated
}
