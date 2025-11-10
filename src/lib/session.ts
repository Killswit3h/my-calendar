import { getServerSession } from '@/lib/auth'

type SessionUser = {
  id: string
  name?: string | null
}

export async function getCurrentUser(): Promise<{ id: string; name: string | null } | null> {
  const session = await getServerSession()
  const user = session?.user as SessionUser | undefined
  if (!user?.id) return null
  return { id: user.id, name: user.name ?? null }
}
