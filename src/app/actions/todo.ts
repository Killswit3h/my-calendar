'use server'

import { getServerSession } from '@/lib/auth'

export async function updateTodoTitle(todoId: string, title: string) {
  const session = await getServerSession()
  const userId = session?.user?.id
  if (!userId) {
    throw new Error('unauthorized')
  }

  throw new Error('Todo functionality is not currently available')
}
