import prisma from '@/src/lib/db'

type ResourceType = 'Todo' | 'Project' | 'CalendarEvent'

export type NotifyInput = {
  actorId: string | null
  resourceType: ResourceType
  resourceId: string
  kind: string
  title: string
  body: string
  url: string
}

function channelEnabled(pref: { inAppEnabled: boolean; pushEnabled: boolean }, channel: 'inapp' | 'push') {
  if (channel === 'inapp') return pref.inAppEnabled
  return pref.pushEnabled
}

function resourceEnabled(
  pref: { todoEvents: boolean; calendarEvents: boolean; projectEvents: boolean },
  resourceType: ResourceType,
) {
  if (resourceType === 'Todo') return pref.todoEvents
  if (resourceType === 'Project') return pref.projectEvents
  return pref.calendarEvents
}

export async function emitChange(input: NotifyInput) {
  const { actorId, resourceId, resourceType, kind, title, body, url } = input

  if (actorId) {
    await prisma.user.upsert({
      where: { id: actorId },
      update: {},
      create: { id: actorId },
    })
  }

  await prisma.auditLog.create({
    data: {
      actorId: actorId ?? undefined,
      action: kind,
      resourceType,
      resourceId,
    },
  })

  const subscriptions = await prisma.resourceSubscription.findMany({
    where: { resourceType, resourceId },
    select: { userId: true },
  })
  const subscriberIds = subscriptions.map(s => s.userId).filter(id => id !== actorId)
  if (!subscriberIds.length) return

  const preferences = await prisma.notificationPreference.findMany({
    where: { userId: { in: subscriberIds } },
  })
  const prefMap = new Map(
    preferences.map(pref => [
      pref.userId,
      {
        inAppEnabled: pref.inAppEnabled,
        pushEnabled: pref.pushEnabled,
        todoEvents: pref.todoEvents,
        projectEvents: pref.projectEvents,
        calendarEvents: pref.calendarEvents,
      },
    ]),
  )

  const defaultPref = {
    inAppEnabled: true,
    pushEnabled: true,
    todoEvents: true,
    projectEvents: true,
    calendarEvents: true,
  }

  const inAppRecipients = subscriberIds.filter(userId =>
    resourceEnabled(prefMap.get(userId) ?? defaultPref, resourceType) &&
    channelEnabled(prefMap.get(userId) ?? defaultPref, 'inapp'),
  )

  if (inAppRecipients.length) {
    await prisma.notification.createMany({
      data: inAppRecipients.map(userId => ({
        userId,
        kind,
        title,
        body,
        resourceType,
        resourceId,
        actorId: actorId ?? undefined,
      })),
    })
  }

  const pushEligible = subscriberIds.filter(userId =>
    resourceEnabled(prefMap.get(userId) ?? defaultPref, resourceType) &&
    channelEnabled(prefMap.get(userId) ?? defaultPref, 'push'),
  )

  if (!pushEligible.length) return

  const pushTargets = await prisma.notificationSubscription.findMany({
    where: { userId: { in: pushEligible } },
    select: { endpoint: true, p256dh: true, auth: true, userId: true },
  })

  if (!pushTargets.length) return

  await prisma.outbox.createMany({
    data: pushTargets.map(target => ({
      type: 'push',
      payload: {
        endpoint: target.endpoint,
        keys: { p256dh: target.p256dh, auth: target.auth },
        notification: { title, body, url },
      },
    })),
  })
}
