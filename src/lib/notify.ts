// Stub file - old schema models no longer exist
// This functionality will be rebuilt for the new schema

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

export async function emitChange(_input: NotifyInput) {
  // Stub - to be rebuilt for new schema
}
