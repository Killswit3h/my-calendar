import { Prisma } from '@prisma/client'
import { APP_TZ } from '@/lib/appConfig'
import { formatInTimeZone, zonedEndOfDayUtc, zonedStartOfDayUtc } from '@/lib/timezone'

type PayItemRow = {
  id: string
  number: string
  description: string
  unit: string
  createdAt: Date
  updatedAt: Date
}

type EventRow = {
  id: string
  calendarId: string
  startsAt: Date
  endsAt: Date
  title: string
}

type EventQuantityRow = {
  id: string
  eventId: string
  payItemId: string
  quantity: Prisma.Decimal
  stationFrom: string | null
  stationTo: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

const randomId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`

function project<T extends Record<string, any>>(row: T, select?: Record<string, any>): any {
  if (!select) return { ...row }
  const out: Record<string, any> = {}
  for (const key of Object.keys(select)) {
    const config = select[key]
    if (config === true) {
      out[key] = row[key]
    }
  }
  return out
}

export class MockPrisma {
  // Allow dynamic properties for test utility extensions
  [key: string]: any

  payItems = new Map<string, PayItemRow>()
  events = new Map<string, EventRow>()
  eventQuantities = new Map<string, EventQuantityRow>()
  eventTimestampType: 'timestamp without time zone' | 'timestamp with time zone' = 'timestamp without time zone'

  setPayItems(items: Array<Omit<PayItemRow, 'createdAt' | 'updatedAt'> & Partial<Pick<PayItemRow, 'createdAt' | 'updatedAt'>>>) {
    this.payItems.clear()
    const now = new Date()
    for (const item of items) {
      const created = item.createdAt ?? now
      const updated = item.updatedAt ?? now
      this.payItems.set(item.id, { ...item, createdAt: created, updatedAt: updated })
    }
  }

  addPayItem(data: { id?: string; number: string; description: string; unit: string }) {
    const id = data.id ?? randomId('pi')
    const now = new Date()
    const row: PayItemRow = { id, number: data.number, description: data.description, unit: data.unit, createdAt: now, updatedAt: now }
    this.payItems.set(id, row)
    return row
  }

  addEvent(data: { id?: string; calendarId: string; startsAt: Date; endsAt?: Date; title?: string }) {
    const id = data.id ?? randomId('evt')
    const row: EventRow = {
      id,
      calendarId: data.calendarId,
      startsAt: data.startsAt,
      endsAt: data.endsAt ?? new Date(data.startsAt.getTime() + 86_400_000),
      title: data.title ?? 'Event',
    }
    this.events.set(id, row)
    return row
  }

  setEventTimestampType(type: 'naive' | 'timestamptz') {
    this.eventTimestampType = type === 'timestamptz' ? 'timestamp with time zone' : 'timestamp without time zone'
  }

  private matchesInsensitive(value: string, target: string, mode?: string | null): boolean {
    if (mode?.toLowerCase() === 'insensitive') {
      return value.toLowerCase() === target.toLowerCase()
    }
    return value === target
  }

  payItem: any

  constructor() {
    this.payItem = {}

    this.payItem.findFirst = async ({ where, select }: any = {}) => {
      for (const item of this.payItems.values()) {
        if (where?.number?.equals) {
          if (!this.matchesInsensitive(item.number, where.number.equals, where.number.mode)) continue
        }
        if (where?.id && where.id.not && item.id === where.id.not) continue
        return project(item, select)
      }
      return null
    }

    this.payItem.findMany = async ({ where, select, take }: any = {}) => {
      let items = Array.from(this.payItems.values())
      if (where?.id?.in) {
        const set = new Set(where.id.in)
        items = items.filter(item => set.has(item.id))
      }
      if (where?.number?.contains) {
        const needle = where.number.contains.toLowerCase()
        items = items.filter(item => item.number.toLowerCase().includes(needle))
      }
      if (where?.description?.contains) {
        const needle = where.description.contains.toLowerCase()
        items = items.filter(item => item.description.toLowerCase().includes(needle))
      }
      if (typeof take === 'number') items = items.slice(0, take)
      return items.map(item => project(item, select))
    }

    this.payItem.create = async ({ data }: any) => {
      const id = data.id ?? randomId('pi')
      const now = new Date()
      const row: PayItemRow = { id, number: data.number, description: data.description, unit: data.unit, createdAt: now, updatedAt: now }
      this.payItems.set(id, row)
      return { ...row }
    }

    this.payItem.update = async ({ where, data }: any) => {
      const row = this.payItems.get(where.id)
      if (!row) throw new Error('Pay item not found')
      const next: PayItemRow = { ...row, ...data, updatedAt: new Date() }
      this.payItems.set(where.id, next)
      return { ...next }
    }
  }

  private buildReportRows(query: any): Array<{ id: string; title: string | null; description: string | null; type: string | null; checklist: unknown; shift: string | null; startsAt: Date; endsAt: Date }> {
    const values: any[] = Array.isArray((query as any)?.values) ? (query as any).values : []

    let reportDate: string | null = null
    const dateValues = values.filter(v => v instanceof Date) as Date[]
    for (const value of values) {
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        reportDate = value
      }
    }

    let dayStartUtc: Date | null = null
    let dayEndUtc: Date | null = null
    if (dateValues.length >= 2) {
      dayStartUtc = new Date(dateValues[0])
      dayEndUtc = new Date(dateValues[dateValues.length - 1])
    }

    if (!dayStartUtc || !dayEndUtc) {
      if (!reportDate) {
        throw new Error('MockPrisma: unable to determine report bounds from raw query')
      }
      dayStartUtc = zonedStartOfDayUtc(reportDate, APP_TZ)
      dayEndUtc = zonedEndOfDayUtc(reportDate, APP_TZ)
    }

    const mode = reportDate ? 'CLAMP' : 'INTERSECT'

    let events = Array.from(this.events.values())
    if (mode === 'CLAMP' && reportDate) {
      events = events.filter(ev => formatInTimeZone(ev.startsAt, APP_TZ).date === reportDate)
    } else {
      events = events.filter(ev => ev.endsAt > dayStartUtc! && ev.startsAt < dayEndUtc!)
    }

    events.sort((a, b) => {
      const timeDiff = a.startsAt.getTime() - b.startsAt.getTime()
      if (timeDiff !== 0) return timeDiff
      return (a.title || '').localeCompare(b.title || '')
    })

    return events.map(ev => ({
      id: ev.id,
      title: ev.title ?? null,
      description: null,
      type: null,
      checklist: null,
      shift: null,
      startsAt: new Date(ev.startsAt),
      endsAt: new Date(ev.endsAt),
    }))
  }

  $queryRawUnsafe = async (sql: string) => {
    const normalized = sql.replace(/\s+/g, ' ').trim().toLowerCase()
    if (normalized.startsWith('select data_type from information_schema.columns')) {
      return [{ data_type: this.eventTimestampType }]
    }
    throw new Error(`MockPrisma.$queryRawUnsafe not implemented for query: ${sql}`)
  }

  $queryRaw = async (query: any) => {
    if (query && typeof query === 'object' && typeof query.sql === 'string' && query.sql.includes('FROM "Event"')) {
      return this.buildReportRows(query)
    }
    throw new Error('MockPrisma.$queryRaw not implemented for query: ' + String(query))
  }

  event = {
    findUnique: async ({ where, select }: any) => {
      const row = this.events.get(where.id)
      if (!row) return null
      return project(row, select)
    },
    findMany: async ({ where, select, orderBy }: any = {}) => {
      let rows = Array.from(this.events.values())
      if (where?.endsAt?.gt) {
        const gt = new Date(where.endsAt.gt)
        rows = rows.filter(row => row.endsAt > gt)
      }
      if (where?.startsAt?.lt) {
        const lt = new Date(where.startsAt.lt)
        rows = rows.filter(row => row.startsAt < lt)
      }
      if (orderBy?.length) {
        rows = rows.slice()
        for (const order of orderBy.slice().reverse()) {
          const [[key, direction]] = Object.entries(order) as any
          const dir = String(direction || '').toLowerCase().startsWith('desc') ? -1 : 1
          rows.sort((a, b) => {
            if (key === 'title') return dir * (a.title || '').localeCompare(b.title || '')
            if (key === 'startsAt') return dir * (a.startsAt.getTime() - b.startsAt.getTime())
            return 0
          })
        }
      }
      return rows.map(row => project(row, select))
    },
  }

  eventQuantity = {
    deleteMany: async ({ where }: any) => {
      if (where?.eventId) {
        for (const [id, row] of Array.from(this.eventQuantities.entries())) {
          if (row.eventId === where.eventId) this.eventQuantities.delete(id)
        }
      }
    },
    create: async ({ data }: any) => {
      const id = data.id ?? randomId('eq')
      const now = new Date()
      const row: EventQuantityRow = {
        id,
        eventId: data.eventId,
        payItemId: data.payItemId,
        quantity: data.quantity instanceof Prisma.Decimal ? data.quantity : new Prisma.Decimal(data.quantity ?? 0),
        stationFrom: data.stationFrom ?? null,
        stationTo: data.stationTo ?? null,
        notes: data.notes ?? null,
        createdAt: now,
        updatedAt: now,
      }
      this.eventQuantities.set(id, row)
      return { ...row }
    },
    count: async ({ where }: any) => {
      const payItemId = where?.payItemId
      if (!payItemId) return this.eventQuantities.size
      let count = 0
      for (const row of this.eventQuantities.values()) {
        if (row.payItemId === payItemId) count++
      }
      return count
    },
    findMany: async ({ where, select, orderBy }: any = {}) => {
      let rows = Array.from(this.eventQuantities.values())
      if (where?.eventId) rows = rows.filter(row => row.eventId === where.eventId)
      if (where?.payItemId) rows = rows.filter(row => row.payItemId === where.payItemId)

      if (orderBy?.length) {
        for (const order of orderBy.slice().reverse()) {
          const [key, direction] = Object.entries(order)[0]
          rows.sort((a, b) => {
            if (key === 'event' && direction && typeof direction === 'object' && 'startsAt' in direction) {
              const dir = String((direction as any).startsAt ?? '').toLowerCase()
              const compare = this.events.get(a.eventId)!.startsAt.getTime() - this.events.get(b.eventId)!.startsAt.getTime()
              return dir.startsWith('desc') ? -compare : compare
            }
            if (key === 'payItem' && direction && typeof direction === 'object' && 'number' in direction) {
              const dir = String((direction as any).number ?? '').toLowerCase()
              const aItem = this.payItems.get(a.payItemId)?.number ?? ''
              const bItem = this.payItems.get(b.payItemId)?.number ?? ''
              const compare = aItem.localeCompare(bItem)
              return dir.startsWith('desc') ? -compare : compare
            }
            const dir = String(direction).toLowerCase()
            const keyAny = key as keyof EventQuantityRow
            const va = a[keyAny]
            const vb = b[keyAny]
            const compare = String(va ?? '').localeCompare(String(vb ?? ''))
            return dir.startsWith('desc') ? -compare : compare
          })
        }
      }

      return rows.map(row => this.projectQuantity(row, select))
    },
  }

  private projectQuantity(row: EventQuantityRow, select?: Record<string, any>) {
    if (!select) return { ...row }
    const out: Record<string, any> = {}
    for (const key of Object.keys(select)) {
      const config = select[key]
      if (key === 'payItem' && config?.select) {
        const payItem = this.payItems.get(row.payItemId)
        out.payItem = payItem ? project(payItem, config.select) : null
        continue
      }
      if (key === 'event' && config?.select) {
        const event = this.events.get(row.eventId)
        out.event = event ? project(event, config.select) : null
        continue
      }
      if (config === true) {
        out[key] = (row as any)[key]
      }
    }
    return out
  }

  async $transaction<T>(fn: (tx: MockPrisma) => Promise<T> | T): Promise<T> {
    const result = await fn(this)
    return result
  }
}

export function setMockPrisma(instance: MockPrisma | null) {
  ;(globalThis as any).__mockPrisma = instance
}

export function getMockPrisma(): MockPrisma | null {
  return (globalThis as any).__mockPrisma ?? null
}
