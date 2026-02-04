// Stub file - old schema models no longer exist
// This functionality will be rebuilt for the new schema

type PushPayload = {
  title: string
  body: string
  url: string
  actions?: Array<{ action: string; title: string }>
  data?: Record<string, unknown>
}

export async function sendPushToUser(_userId: string, _payload: PushPayload) {
  // Stub - to be rebuilt for new schema
}
