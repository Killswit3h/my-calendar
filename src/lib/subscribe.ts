import prisma from '@/src/lib/db'

type ResourceType = 'Todo' | 'Project' | 'CalendarEvent'

export async function subscribeUserToResource(userId: string, resourceType: ResourceType, resourceId: string) {
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId },
  })

  await prisma.resourceSubscription.upsert({
    where: {
      userId_resourceType_resourceId: { userId, resourceType, resourceId },
    },
    update: {},
    create: { userId, resourceType, resourceId },
  })
}
