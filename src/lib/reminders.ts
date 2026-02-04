// Stub file - old schema models no longer exist
// This functionality will be rebuilt for the new schema

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

export async function markEntityLastNotified(_entityType: ReminderEntityType, _entityId: string, _timestamp: Date) {
  // Stub - to be rebuilt for new schema
}
