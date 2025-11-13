type ChangePayload =
  | { type: 'estimate.created'; id: string; projectId?: string | null; customerId?: string | null; number: string }
  | { type: 'estimate.updated'; id: string; projectId?: string | null; customerId?: string | null; number: string }
  | { type: 'estimate.deleted'; id: string; projectId?: string | null; customerId?: string | null; number: string }
  | { type: 'estimate.statusChanged'; id: string; projectId?: string | null; customerId?: string | null; number: string; status: string }
  | { type: 'changeOrder.created'; id: string; projectId: string; number: string }
  | { type: 'changeOrder.updated'; id: string; projectId: string; number: string }
  | { type: 'changeOrder.deleted'; id: string; projectId: string; number: string }
  | { type: 'changeOrder.statusChanged'; id: string; projectId: string; number: string; status: string }

export async function emitChange(payload: ChangePayload) {
  if (process.env.DEBUG_NOTIFICATIONS === '1') {
    console.log('[notifications]', payload)
  }
}
