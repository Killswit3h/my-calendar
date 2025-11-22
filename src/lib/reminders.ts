// src/lib/reminders.ts
import prisma from '@/lib/db'

export type ReminderEntityType = 'event' | 'todo'

export function parseReminderOffsets(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  const sanitized = value
    .map(item => {
      if (typeof item === 'number') return item
      if (typeof item === 'string' && item.trim().length) return Number(item.trim())
      return Number.NaN
    })
    .filter(m => Number.isFinite(m) && m >= 0)
    .map(m => Math.floor(m))
  return Array.from(new Set(sanitized)).sort((a, b) => a - b)
}

export async function markEntityLastNotified(entityType: ReminderEntityType, entityId: string, timestamp: Date) {
  if (entityType === 'event') {
    await prisma.event.updateMany({ where: { id: entityId }, data: { lastNotifiedAt: timestamp } })
  } else {
    await prisma.todo.updateMany({ where: { id: entityId }, data: { lastNotifiedAt: timestamp } })
  }
}
