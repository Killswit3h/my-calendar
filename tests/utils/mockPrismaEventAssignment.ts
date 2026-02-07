import { MockPrisma } from "./mockPrisma"
import { Prisma } from "@prisma/client"

type EventAssignmentRow = {
  id: number
  event_id: number
  employee_id: number
}

/**
 * Extends MockPrisma with event_assignment model support
 */
export function extendMockPrismaWithEventAssignment(mockPrisma: MockPrisma) {
  const eventAssignments = new Map<number, EventAssignmentRow>()
  const eventEmployeeKey = (eid: number, pid: number) => `${eid}:${pid}`
  const uniqueKeys = new Set<string>()
  const events = new Map<number, { id: number }>()
  const employees = new Map<number, { id: number }>()

  const randomId = () => Math.floor(Math.random() * 1000000) + 1

  ;(mockPrisma as any).addEvent = (data: { id?: number }) => {
    const id = data.id ?? randomId()
    events.set(id, { id })
    return { id }
  }

  ;(mockPrisma as any).addEmployee = (data: { id?: number }) => {
    const id = data.id ?? randomId()
    employees.set(id, { id })
    return { id }
  }

  mockPrisma.event_assignment = {
    findMany: async ({ where, select, orderBy, take, skip }: any = {}) => {
      let rows = Array.from(eventAssignments.values())

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
      if (where?.employee_id !== undefined) {
        rows = rows.filter((row) => row.employee_id === where.employee_id)
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

      return rows.map((row) => projectRow(row, select))
    },

    findUnique: async ({ where, select }: any) => {
      const id = where.id
      const row = eventAssignments.get(id)
      if (!row) return null
      return projectRow(row, select)
    },

    findFirst: async ({ where, select }: any) => {
      let rows = Array.from(eventAssignments.values())
      if (where?.event_id !== undefined) {
        rows = rows.filter((row) => row.event_id === where.event_id)
      }
      if (where?.employee_id !== undefined) {
        rows = rows.filter((row) => row.employee_id === where.employee_id)
      }
      const row = rows[0] || null
      return row ? projectRow(row, select) : null
    },

    create: async ({ data }: any) => {
      let event_id: number
      if (data.event_id !== undefined) {
        event_id = data.event_id
      } else if (data.event?.connect?.id !== undefined) {
        event_id = data.event.connect.id
      } else {
        throw new Error("event_id is required")
      }

      let employee_id: number
      if (data.employee_id !== undefined) {
        employee_id = data.employee_id
      } else if (data.employee?.connect?.id !== undefined) {
        employee_id = data.employee.connect.id
      } else {
        throw new Error("employee_id is required")
      }

      const key = eventEmployeeKey(event_id, employee_id)
      if (uniqueKeys.has(key)) {
        throw new Prisma.PrismaClientKnownRequestError(
          "Unique constraint failed on the constraint: `event_assignment_event_id_employee_id_key`",
          { code: "P2002", clientVersion: "test", meta: { target: ["event_id", "employee_id"] } }
        )
      }

      const id = data.id ?? randomId()
      const row: EventAssignmentRow = { id, event_id, employee_id }
      eventAssignments.set(id, row)
      uniqueKeys.add(key)
      return { ...row }
    },

    update: async ({ where, data }: any) => {
      const id = where.id
      const row = eventAssignments.get(id)
      if (!row) {
        throw new Prisma.PrismaClientKnownRequestError(
          "Record not found",
          { code: "P2025", clientVersion: "test" }
        )
      }

      let event_id = row.event_id
      if (data.event_id !== undefined) {
        event_id = data.event_id
      } else if (data.event?.connect?.id !== undefined) {
        event_id = data.event.connect.id
      }

      let employee_id = row.employee_id
      if (data.employee_id !== undefined) {
        employee_id = data.employee_id
      } else if (data.employee?.connect?.id !== undefined) {
        employee_id = data.employee.connect.id
      }

      const key = eventEmployeeKey(event_id, employee_id)
      const existing = Array.from(eventAssignments.values()).find(
        (r) => r.event_id === event_id && r.employee_id === employee_id && r.id !== id
      )
      if (existing) {
        throw new Prisma.PrismaClientKnownRequestError(
          "Unique constraint failed on the constraint: `event_assignment_event_id_employee_id_key`",
          { code: "P2002", clientVersion: "test", meta: { target: ["event_id", "employee_id"] } }
        )
      }

      const oldKey = eventEmployeeKey(row.event_id, row.employee_id)
      uniqueKeys.delete(oldKey)
      uniqueKeys.add(key)

      const updated: EventAssignmentRow = { id, event_id, employee_id }
      eventAssignments.set(id, updated)
      return { ...updated }
    },

    delete: async ({ where }: any) => {
      const id = where.id
      const row = eventAssignments.get(id)
      if (!row) {
        throw new Prisma.PrismaClientKnownRequestError(
          "Record not found",
          { code: "P2025", clientVersion: "test" }
        )
      }
      uniqueKeys.delete(eventEmployeeKey(row.event_id, row.employee_id))
      eventAssignments.delete(id)
      return { ...row }
    },

    count: async ({ where }: any = {}) => {
      if (!where) return eventAssignments.size
      let rows = Array.from(eventAssignments.values())
      if (where.event_id !== undefined) {
        rows = rows.filter((row) => row.event_id === where.event_id)
      }
      if (where.employee_id !== undefined) {
        rows = rows.filter((row) => row.employee_id === where.employee_id)
      }
      return rows.length
    },
  }

  mockPrisma.event = {
    findUnique: async ({ where, select }: any) => {
      const id = where.id
      const event = events.get(id)
      if (!event) return null
      return projectRow(event, select)
    },
  } as any

  mockPrisma.employee = {
    findUnique: async ({ where, select }: any) => {
      const id = where.id
      const employee = employees.get(id)
      if (!employee) return null
      return projectRow(employee, select)
    },
  } as any

  ;(mockPrisma as any).addEventAssignment = (data: {
    id?: number
    event_id: number
    employee_id: number
  }) => {
    const id = data.id ?? randomId()
    const key = eventEmployeeKey(data.event_id, data.employee_id)
    if (uniqueKeys.has(key)) {
      throw new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        { code: "P2002", clientVersion: "test" }
      )
    }
    const row: EventAssignmentRow = {
      id,
      event_id: data.event_id,
      employee_id: data.employee_id,
    }
    eventAssignments.set(id, row)
    uniqueKeys.add(key)
    return row
  }

  ;(mockPrisma as any).clearEventAssignments = () => {
    eventAssignments.clear()
    uniqueKeys.clear()
  }
}

function projectRow<T extends EventAssignmentRow | { id: number }>(
  row: T,
  select?: Record<string, boolean>
): Partial<T> {
  if (!select) return { ...row }
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(select)) {
    const config = select[key]
    if (config === true && key in row) {
      out[key] = (row as Record<string, unknown>)[key]
    }
  }
  return out as Partial<T>
}
