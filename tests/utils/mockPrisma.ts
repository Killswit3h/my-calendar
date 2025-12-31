import { Prisma } from "@prisma/client"
import { APP_TZ } from "@/lib/appConfig"
import {
  formatInTimeZone,
  zonedEndOfDayUtc,
  zonedStartOfDayUtc,
} from "@/lib/timezone"

// Updated type definitions to match current Prisma schema
type PayItemRow = {
  id: number
  number: string
  description: string
  unit: string
}

type EventRow = {
  id: number
  project_id: number
  scope_of_work_id: number
  payment_type_id: number
  invoice_id: number | null
  start_time: Date
  end_time: Date
  is_day_shift: boolean | null
  location: string | null
  notes: string | null
  created_at: Date | null
  updated_at: Date | null
}

type EventQuantityRow = {
  id: number
  event_id: number
  project_pay_item_id: number
  quantity: Prisma.Decimal
  notes: string | null
}

const randomId = () => Math.floor(Math.random() * 1000000) + 1

function project<T extends Record<string, any>>(
  row: T,
  select?: Record<string, any>
): any {
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
  payItems = new Map<number, PayItemRow>()
  events = new Map<number, EventRow>()
  eventQuantities = new Map<number, EventQuantityRow>()
  users = new Map<string, { id: string; name: string | null }>()
  eventTimestampType:
    | "timestamp without time zone"
    | "timestamp with time zone" = "timestamp without time zone"

  // Type declarations for Prisma model delegates (can be extended dynamically)
  payItem: any
  user: any
  employee: any
  customer: any
  event: any
  eventQuantity: any
  event_assignment: any
  invoice: any
  payment_type: any
  project: any
  project_pay_item: any
  scope_of_work: any

  constructor() {
    this.payItem = {}

    this.payItem.findFirst = async ({ where, select }: any = {}) => {
      for (const item of this.payItems.values()) {
        if (where?.number?.equals) {
          if (
            !this.matchesInsensitive(
              item.number,
              where.number.equals,
              where.number.mode
            )
          )
            continue
        }
        if (where?.id && where.id.not && item.id === where.id.not) continue
        if (where?.id?.equals && item.id !== where.id.equals) continue
        return project(item, select)
      }
      return null
    }

    this.payItem.findUnique = async ({ where, select }: any) => {
      if (where.id) {
        const item = this.payItems.get(where.id)
        return item ? project(item, select) : null
      }
      if (where.number) {
        for (const item of this.payItems.values()) {
          if (
            this.matchesInsensitive(
              item.number,
              where.number,
              where.mode
            )
          ) {
            return project(item, select)
          }
        }
      }
      return null
    }

    this.payItem.findMany = async ({ where, select, take, skip }: any = {}) => {
      let items = Array.from(this.payItems.values())
      if (where?.id) {
        if (where.id.in) {
          const set = new Set(where.id.in)
          items = items.filter((item) => set.has(item.id))
        }
        if (where.id.equals !== undefined) {
          items = items.filter((item) => item.id === where.id.equals)
        }
      }
      if (where?.number?.contains) {
        const needle = where.number.contains.toLowerCase()
        items = items.filter((item) =>
          item.number.toLowerCase().includes(needle)
        )
      }
      if (where?.description?.contains) {
        const needle = where.description.contains.toLowerCase()
        items = items.filter((item) =>
          item.description.toLowerCase().includes(needle)
        )
      }
      if (typeof skip === "number") items = items.slice(skip)
      if (typeof take === "number") items = items.slice(0, take)
      return items.map((item) => project(item, select))
    }

    this.payItem.create = async ({ data }: any) => {
      const id = data.id ?? randomId()
      const row: PayItemRow = {
        id,
        number: data.number,
        description: data.description,
        unit: data.unit,
      }
      this.payItems.set(id, row)
      return { ...row }
    }

    this.payItem.update = async ({ where, data }: any) => {
      const id = where.id ?? (where.number ? this.findPayItemByNumber(where.number)?.id : null)
      if (!id) {
        const error = new Error("Pay item not found")
        ;(error as any).code = "P2025"
        throw error
      }
      const row = this.payItems.get(id)
      if (!row) {
        const error = new Error("Pay item not found")
        ;(error as any).code = "P2025"
        throw error
      }
      const next: PayItemRow = { ...row, ...data }
      this.payItems.set(id, next)
      return { ...next }
    }

    this.payItem.delete = async ({ where }: any) => {
      const id = where.id ?? (where.number ? this.findPayItemByNumber(where.number)?.id : null)
      if (!id) {
        const error = new Error("Pay item not found")
        ;(error as any).code = "P2025"
        throw error
      }
      const row = this.payItems.get(id)
      if (!row) {
        const error = new Error("Pay item not found")
        ;(error as any).code = "P2025"
        throw error
      }
      this.payItems.delete(id)
      return { ...row }
    }

    this.payItem.count = async ({ where }: any = {}) => {
      if (!where) return this.payItems.size
      let items = Array.from(this.payItems.values())
      if (where.number?.contains) {
        const needle = where.number.contains.toLowerCase()
        items = items.filter((item) =>
          item.number.toLowerCase().includes(needle)
        )
      }
      return items.length
    }

    this.event = {
      findUnique: async ({ where, select }: any) => {
        const id = where.id
        const row = this.events.get(id)
        if (!row) return null
        return project(row, select)
      },
      findMany: async ({ where, select, orderBy }: any = {}) => {
        let rows = Array.from(this.events.values())
        if (where?.end_time?.gt) {
          const gt = new Date(where.end_time.gt)
          rows = rows.filter((row) => row.end_time > gt)
        }
        if (where?.start_time?.lt) {
          const lt = new Date(where.start_time.lt)
          rows = rows.filter((row) => row.start_time < lt)
        }
        if (where?.project_id) {
          rows = rows.filter((row) => row.project_id === where.project_id)
        }
        if (orderBy?.length) {
          rows = rows.slice()
          for (const order of orderBy.slice().reverse()) {
            const [[key, direction]] = Object.entries(order) as any
            const dir = String(direction || "")
              .toLowerCase()
              .startsWith("desc")
              ? -1
              : 1
            rows.sort((a, b) => {
              if (key === "start_time")
                return dir * (a.start_time.getTime() - b.start_time.getTime())
              if (key === "end_time")
                return dir * (a.end_time.getTime() - b.end_time.getTime())
              return 0
            })
          }
        }
        return rows.map((row) => project(row, select))
      },
      create: async ({ data }: any) => {
        const id = data.id ?? randomId()
        const row: EventRow = {
          id,
          project_id: data.project_id,
          scope_of_work_id: data.scope_of_work_id,
          payment_type_id: data.payment_type_id,
          invoice_id: data.invoice_id ?? null,
          start_time:
            data.start_time instanceof Date
              ? data.start_time
              : new Date(data.start_time),
          end_time:
            data.end_time instanceof Date
              ? data.end_time
              : new Date(data.end_time),
          is_day_shift: data.is_day_shift ?? true,
          location: data.location ?? null,
          notes: data.notes ?? null,
          created_at: data.created_at ?? new Date(),
          updated_at: data.updated_at ?? new Date(),
        }
        this.events.set(id, row)
        return { ...row }
      },
      update: async ({ where, data }: any) => {
        const id = where.id
        const row = this.events.get(id)
        if (!row) {
          const error = new Error("Event not found")
          ;(error as any).code = "P2025"
          throw error
        }
        const updated: EventRow = {
          ...row,
          ...(data.project_id !== undefined && { project_id: data.project_id }),
          ...(data.scope_of_work_id !== undefined && {
            scope_of_work_id: data.scope_of_work_id,
          }),
          ...(data.payment_type_id !== undefined && {
            payment_type_id: data.payment_type_id,
          }),
          ...(data.invoice_id !== undefined && { invoice_id: data.invoice_id }),
          ...(data.start_time !== undefined && {
            start_time:
              data.start_time instanceof Date
                ? data.start_time
                : new Date(data.start_time),
          }),
          ...(data.end_time !== undefined && {
            end_time:
              data.end_time instanceof Date
                ? data.end_time
                : new Date(data.end_time),
          }),
          ...(data.is_day_shift !== undefined && {
            is_day_shift: data.is_day_shift,
          }),
          ...(data.location !== undefined && { location: data.location }),
          ...(data.notes !== undefined && { notes: data.notes }),
          updated_at: new Date(),
        }
        this.events.set(id, updated)
        return { ...updated }
      },
      delete: async ({ where }: any) => {
        const id = where.id
        const row = this.events.get(id)
        if (!row) {
          const error = new Error("Event not found")
          ;(error as any).code = "P2025"
          throw error
        }
        this.events.delete(id)
        return { ...row }
      },
    }

    this.eventQuantity = {
      deleteMany: async ({ where }: any) => {
        if (where?.event_id) {
          for (const [id, row] of Array.from(this.eventQuantities.entries())) {
            if (row.event_id === where.event_id) this.eventQuantities.delete(id)
          }
        }
        if (where?.project_pay_item_id) {
          for (const [id, row] of Array.from(this.eventQuantities.entries())) {
            if (row.project_pay_item_id === where.project_pay_item_id)
              this.eventQuantities.delete(id)
          }
        }
      },
      create: async ({ data }: any) => {
        const id = data.id ?? randomId()
        const row: EventQuantityRow = {
          id,
          event_id: data.event_id,
          project_pay_item_id: data.project_pay_item_id,
          quantity:
            data.quantity instanceof Prisma.Decimal
              ? data.quantity
              : new Prisma.Decimal(data.quantity ?? 0),
          notes: data.notes ?? null,
        }
        this.eventQuantities.set(id, row)
        return { ...row }
      },
      count: async ({ where }: any) => {
        if (!where) return this.eventQuantities.size
        let count = 0
        for (const row of this.eventQuantities.values()) {
          if (where.event_id && row.event_id === where.event_id) count++
          if (
            where.project_pay_item_id &&
            row.project_pay_item_id === where.project_pay_item_id
          )
            count++
        }
        return count
      },
      findMany: async ({ where, select, orderBy }: any = {}) => {
        let rows = Array.from(this.eventQuantities.values())
        if (where?.event_id)
          rows = rows.filter((row) => row.event_id === where.event_id)
        if (where?.project_pay_item_id)
          rows = rows.filter(
            (row) => row.project_pay_item_id === where.project_pay_item_id
          )

        if (orderBy?.length) {
          for (const order of orderBy.slice().reverse()) {
            const [key, direction] = Object.entries(order)[0]
            rows.sort((a, b) => {
              const dir = String(direction).toLowerCase()
              const keyAny = key as keyof EventQuantityRow
              const va = a[keyAny]
              const vb = b[keyAny]
              if (va instanceof Prisma.Decimal && vb instanceof Prisma.Decimal) {
                const compare = va.comparedTo(vb)
                return dir.startsWith("desc") ? -compare : compare
              }
              const compare = String(va ?? "").localeCompare(String(vb ?? ""))
              return dir.startsWith("desc") ? -compare : compare
            })
          }
        }

        return rows.map((row) => this.projectQuantity(row, select))
      },
    }

    this.user = {
      upsert: async ({ where, update, create }: any) => {
        const id = where?.id
        if (!id) throw new Error("MockPrisma.user.upsert missing where.id")
        const existing = this.users.get(id)
        if (existing) {
          const next = {
            ...existing,
            ...update,
          }
          this.users.set(id, next)
          return { ...next }
        }
        const next = {
          id,
          name: create?.name ?? null,
        }
        this.users.set(id, next)
        return { ...next }
      },
    }
  }

  private findPayItemByNumber(number: string): PayItemRow | undefined {
    for (const item of this.payItems.values()) {
      if (item.number.toLowerCase() === number.toLowerCase()) {
        return item
      }
    }
    return undefined
  }

  setPayItems(
    items: Array<
      Omit<PayItemRow, "id"> & Partial<Pick<PayItemRow, "id">>
    >
  ) {
    this.payItems.clear()
    for (const item of items) {
      const id = item.id ?? randomId()
      this.payItems.set(id, { ...item, id })
    }
  }

  addPayItem(data: {
    id?: number
    number: string
    description: string
    unit: string
  }) {
    const id = data.id ?? randomId()
    const row: PayItemRow = {
      id,
      number: data.number,
      description: data.description,
      unit: data.unit,
    }
    this.payItems.set(id, row)
    return row
  }

  addEvent(data: {
    id?: number
    project_id: number
    scope_of_work_id: number
    payment_type_id: number
    invoice_id?: number | null
    start_time: Date | string
    end_time?: Date | string
    is_day_shift?: boolean | null
    location?: string | null
    notes?: string | null
  }) {
    const id = data.id ?? randomId()
    const row: EventRow = {
      id,
      project_id: data.project_id,
      scope_of_work_id: data.scope_of_work_id,
      payment_type_id: data.payment_type_id,
      invoice_id: data.invoice_id ?? null,
      start_time:
        data.start_time instanceof Date
          ? data.start_time
          : new Date(data.start_time),
      end_time:
        data.end_time instanceof Date
          ? data.end_time
          : data.start_time instanceof Date
            ? new Date(data.start_time.getTime() + 86_400_000)
            : new Date(new Date(data.start_time).getTime() + 86_400_000),
      is_day_shift: data.is_day_shift ?? true,
      location: data.location ?? null,
      notes: data.notes ?? null,
      created_at: new Date(),
      updated_at: new Date(),
    }
    this.events.set(id, row)
    return row
  }

  setEventTimestampType(type: "naive" | "timestamptz") {
    this.eventTimestampType =
      type === "timestamptz"
        ? "timestamp with time zone"
        : "timestamp without time zone"
  }

  private matchesInsensitive(
    value: string,
    target: string,
    mode?: string | null
  ): boolean {
    if (mode?.toLowerCase() === "insensitive") {
      return value.toLowerCase() === target.toLowerCase()
    }
    return value === target
  }

  private buildReportRows(
    query: any
  ): Array<{
    id: string
    title: string | null
    description: string | null
    type: string | null
    checklist: unknown
    shift: string | null
    startsAt: Date
    endsAt: Date
  }> {
    const values: any[] = Array.isArray((query as any)?.values)
      ? (query as any).values
      : []

    let reportDate: string | null = null
    const dateValues = values.filter((v) => v instanceof Date) as Date[]
    for (const value of values) {
      if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
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
        throw new Error(
          "MockPrisma: unable to determine report bounds from raw query"
        )
      }
      dayStartUtc = zonedStartOfDayUtc(reportDate, APP_TZ)
      dayEndUtc = zonedEndOfDayUtc(reportDate, APP_TZ)
    }

    const mode = reportDate ? "CLAMP" : "INTERSECT"

    let events = Array.from(this.events.values())
    if (mode === "CLAMP" && reportDate) {
      events = events.filter(
        (ev) => formatInTimeZone(ev.start_time, APP_TZ).date === reportDate
      )
    } else {
      events = events.filter(
        (ev) => ev.end_time > dayStartUtc! && ev.start_time < dayEndUtc!
      )
    }

    events.sort((a, b) => {
      const timeDiff = a.start_time.getTime() - b.start_time.getTime()
      if (timeDiff !== 0) return timeDiff
      return String(a.notes || "").localeCompare(String(b.notes || ""))
    })

    return events.map((ev) => ({
      id: String(ev.id),
      title: ev.notes ?? null,
      description: null,
      type: null,
      checklist: null,
      shift: null,
      startsAt: new Date(ev.start_time),
      endsAt: new Date(ev.end_time),
    }))
  }

  $queryRawUnsafe = async (sql: string) => {
    const normalized = sql.replace(/\s+/g, " ").trim().toLowerCase()
    if (
      normalized.startsWith(
        "select data_type from information_schema.columns"
      )
    ) {
      return [{ data_type: this.eventTimestampType }]
    }
    throw new Error(
      `MockPrisma.$queryRawUnsafe not implemented for query: ${sql}`
    )
  }

  $queryRaw = async (query: any) => {
    if (
      query &&
      typeof query === "object" &&
      typeof query.sql === "string" &&
      query.sql.includes('FROM "Event"')
    ) {
      return this.buildReportRows(query)
    }
    throw new Error(
      "MockPrisma.$queryRaw not implemented for query: " + String(query)
    )
  }

  private projectQuantity(
    row: EventQuantityRow,
    select?: Record<string, any>
  ) {
    if (!select) return { ...row }
    const out: Record<string, any> = {}
    for (const key of Object.keys(select)) {
      const config = select[key]
      if (key === "project_pay_item" && config?.select) {
        // Would need project_pay_item map to resolve this
        out.project_pay_item = null
        continue
      }
      if (key === "event" && config?.select) {
        const event = this.events.get(row.event_id)
        out.event = event ? project(event, config.select) : null
        continue
      }
      if (config === true) {
        out[key] = (row as any)[key]
      }
    }
    return out
  }

  async $transaction<T>(
    fn: (tx: MockPrisma) => Promise<T> | T
  ): Promise<T> {
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
