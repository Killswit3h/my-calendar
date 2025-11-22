import prisma from '@/lib/db'

type UserShape = {
  id: string
  name: string | null
}

export async function ensureUserRecord(user: UserShape) {
  await prisma.user.upsert({
    where: { id: user.id },
    update: { name: user.name ?? undefined },
    create: { id: user.id, name: user.name ?? undefined },
  })
}
