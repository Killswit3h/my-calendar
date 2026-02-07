import { MockPrisma } from "./mockPrisma"
import { Prisma } from "@prisma/client"

type EventQuantityRow = {
  id: number
  event_id: number
  project_pay_item_id: number
  quantity: Prisma.Decimal
  notes: string | null
}

/**
 * Extends MockPrisma with event_quantity model support
 */
export function extendMockPrismaWithEventQuantity(mockPrisma: MockPrisma) {
  const eventQuantities = new Map<number, EventQuantityRow>()
  const events = new Map<number, { id: number }>() // For event validation
  const projectPayItems = new Map<number, { id: number }>() // For project_pay_item validation

  const randomId = () => Math.floor(Math.random() * 1000000) + 1

  // Helper to add an event for validation
  ;(mockPrisma as any).addEvent = (data: { id?: number }) => {
    const id = data.id ?? randomId()
    events.set(id, { id })
    return { id }
  }

  // Helper to add a project_pay_item for validation
  ;(mockPrisma as any).addProjectPayItem = (data: { id?: number }) => {
    const id = data.id ?? randomId()
    projectPayItems.set(id, { id })
    return { id }
  }

  mockPrisma.event_quantity = {
    findMany: async ({ where, select, orderBy, take, skip }: any = {}) => {
      let rows = Array.from(eventQuantities.values())

      if (where?.id) {
        if (where.id.equals !== undefined) {
          rows = rows.filter((row) => row.id === where.id.equals)
        }
        if (where.id.in) {
          const set = new Set(where.id.in)
          rows = rows.filter((row) => set.has(row.id))
        }
        if (where.id.not) {
          rows = rows.filter((row) => row.id !== where.id.not)
        }
      }

      if (where?.event_id !== undefined) {
        rows = rows.filter((row) => row.event_id === where.event_id)
      }

      if (where?.project_pay_item_id !== undefined) {
        rows = rows.filter((row) => row.project_pay_item_id === where.project_pay_item_id)
      }

      if (orderBy) {
        rows = rows.slice()
        const orderKey = Object.keys(orderBy)[0]
        const direction = orderBy[orderKey] === "desc" ? -1 : 1
        rows.sort((a, b) => {
          const aVal = (a as any)[orderKey]
          const bVal = (b as any)[orderKey]
          if (aVal < bVal) return -1 * direction
          if (aVal > bVal) return 1 * direction
          return 0
        })
      }

      if (skip) rows = rows.slice(skip)
      if (take) rows = rows.slice(0, take)

      return rows.map((row) => eventQuantity(row, select))
    },

    findUnique: async ({ where, select }: any) => {
      const id = where.id
      const row = eventQuantities.get(id)
      if (!row) return null
      return eventQuantity(row, select)
    },

    findFirst: async ({ where, select }: any) => {
      let rows = Array.from(eventQuantities.values())

      if (where?.event_id !== undefined) {
        rows = rows.filter((row) => row.event_id === where.event_id)
      }

      if (where?.project_pay_item_id !== undefined) {
        rows = rows.filter((row) => row.project_pay_item_id === where.project_pay_item_id)
      }

      const row = rows[0] || null
      return row ? eventQuantity(row, select) : null
    },

    create: async ({ data }: any) => {
      const id = data.id ?? randomId()

      // Convert Decimal fields
      let quantity: Prisma.Decimal
      if (data.quantity instanceof Prisma.Decimal) {
        quantity = data.quantity
      } else if (typeof data.quantity === "number") {
        quantity = new Prisma.Decimal(data.quantity)
      } else if (typeof data.quantity === "string") {
        quantity = new Prisma.Decimal(data.quantity)
      } else {
        quantity = new Prisma.Decimal(0)
      }

      // Handle relation format (event: { connect: { id: ... } })
      let event_id: number
      if (data.event_id !== undefined) {
        event_id = data.event_id
      } else if (data.event?.connect?.id !== undefined) {
        event_id = data.event.connect.id
      } else {
        throw new Error("event_id is required")
      }

      let project_pay_item_id: number
      if (data.project_pay_item_id !== undefined) {
        project_pay_item_id = data.project_pay_item_id
      } else if (data.project_pay_item?.connect?.id !== undefined) {
        project_pay_item_id = data.project_pay_item.connect.id
      } else {
        throw new Error("project_pay_item_id is required")
      }

      const row: EventQuantityRow = {
        id,
        event_id,
        project_pay_item_id,
        quantity,
        notes: data.notes ?? null,
      }
      eventQuantities.set(id, row)
      return { ...row }
    },

    update: async ({ where, data }: any) => {
      const id = where.id
      const row = eventQuantities.get(id)
      if (!row) {
        const Prisma = await import("@prisma/client")
        throw new Prisma.Prisma.PrismaClientKnownRequestError(
          "Record not found",
          { code: "P2025", clientVersion: "test" }
        )
      }

      // Handle Decimal updates
      let quantity = row.quantity
      if (data.quantity !== undefined) {
        if (data.quantity instanceof Prisma.Decimal) {
          quantity = data.quantity
        } else if (typeof data.quantity === "number") {
          quantity = new Prisma.Decimal(data.quantity)
        } else if (typeof data.quantity === "string") {
          quantity = new Prisma.Decimal(data.quantity)
        }
      }

      // Handle relation format (event: { connect: { id: ... } })
      let event_id = row.event_id
      if (data.event_id !== undefined) {
        event_id = data.event_id
      } else if (data.event?.connect?.id !== undefined) {
        event_id = data.event.connect.id
      }

      let project_pay_item_id = row.project_pay_item_id
      if (data.project_pay_item_id !== undefined) {
        project_pay_item_id = data.project_pay_item_id
      } else if (data.project_pay_item?.connect?.id !== undefined) {
        project_pay_item_id = data.project_pay_item.connect.id
      }

      const updated: EventQuantityRow = {
        ...row,
        event_id,
        project_pay_item_id,
        quantity,
        ...(data.notes !== undefined && { notes: data.notes }),
      }
      eventQuantities.set(id, updated)
      return { ...updated }
    },

    delete: async ({ where }: any) => {
      const id = where.id
      const row = eventQuantities.get(id)
      if (!row) {
        const Prisma = await import("@prisma/client")
        throw new Prisma.Prisma.PrismaClientKnownRequestError(
          "Record not found",
          { code: "P2025", clientVersion: "test" }
        )
      }
      eventQuantities.delete(id)
      return { ...row }
    },

    count: async ({ where }: any = {}) => {
      if (!where) return eventQuantities.size
      let rows = Array.from(eventQuantities.values())
      if (where.event_id !== undefined) {
        rows = rows.filter((row) => row.event_id === where.event_id)
      }
      if (where.project_pay_item_id !== undefined) {
        rows = rows.filter((row) => row.project_pay_item_id === where.project_pay_item_id)
      }
      return rows.length
    },
  }

  // Mock event.findUnique for validation
  mockPrisma.event = {
    findUnique: async ({ where, select }: any) => {
      const id = where.id
      const event = events.get(id)
      if (!event) return null
      return eventQuantity(event, select)
    },
  } as any

  // Mock project_pay_item.findUnique for validation
  mockPrisma.project_pay_item = {
    findUnique: async ({ where, select }: any) => {
      const id = where.id
      const projectPayItem = projectPayItems.get(id)
      if (!projectPayItem) return null
      return eventQuantity(projectPayItem, select)
    },
  } as any

  // Helper to add test event quantity records
  ;(mockPrisma as any).addEventQuantity = (data: {
    id?: number
    event_id: number
    project_pay_item_id: number
    quantity: number | string | Prisma.Decimal
    notes?: string | null
  }) => {
    const id = data.id ?? randomId()

    let quantity: Prisma.Decimal
    if (data.quantity instanceof Prisma.Decimal) {
      quantity = data.quantity
    } else if (typeof data.quantity === "number") {
      quantity = new Prisma.Decimal(data.quantity)
    } else {
      quantity = new Prisma.Decimal(data.quantity)
    }

    const row: EventQuantityRow = {
      id,
      event_id: data.event_id,
      project_pay_item_id: data.project_pay_item_id,
      quantity,
      notes: data.notes ?? null,
    }
    eventQuantities.set(id, row)
    return row
  }

  // Helper to clear event quantities
  ;(mockPrisma as any).clearEventQuantities = () => {
    eventQuantities.clear()
  }

  // Helper to get all event quantities
  ;(mockPrisma as any).getEventQuantities = () => {
    return Array.from(eventQuantities.values())
  }
}

function eventQuantity<T extends Record<string, any>>(
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
