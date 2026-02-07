import { MockPrisma } from "./mockPrisma"
import { Prisma } from "@prisma/client"

type EventAssignmentRow = {
  id: number
  event_id: number
  employee_id: number
}

/** Typed extension for mock Prisma with event_assignment helpers */
export type MockPrismaEventAssignment = MockPrisma & {
  addEvent?: (data: { id?: number }) => { id: number }
  addEmployee?: (data: { id?: number }) => { id: number }
  addEventAssignment?: (data: {
    id?: number
    event_id: number
    employee_id: number
  }) => EventAssignmentRow
  clearEventAssignments?: () => void
}

/**
 * Extends MockPrisma with event_assignment model support
 */
export function extendMockPrismaWithEventAssignment(mockPrisma: MockPrisma) {
  const ext = mockPrisma as MockPrismaEventAssignment
  const eventAssignments = new Map<number, EventAssignmentRow>()
  const eventEmployeeKey = (eid: number, pid: number) => `${eid}:${pid}`
  const uniqueKeys = new Set<string>()
  const events = new Map<number, { id: number }>()
  const employees = new Map<number, { id: number }>()

  const randomId = () => Math.floor(Math.random() * 1000000) + 1

  ext.addEvent = (data: { id?: number }) => {
    const id = data.id ?? randomId()
    events.set(id, { id })
    return { id }
  }

  ext.addEmployee = (data: { id?: number }) => {
    const id = data.id ?? randomId()
    employees.set(id, { id })
    return { id }
  }

  mockPrisma.event_assignment = {
    findMany: async (
      args: Partial<Prisma.event_assignmentFindManyArgs> = {}
    ) => {
      const { where, select, orderBy, take, skip } = args
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
        const orderKey = Object.keys(orderBy)[0] as keyof EventAssignmentRow
        const direction = orderBy[orderKey] === "desc" ? -1 : 1
        rows.sort((a, b) => {
          const aVal = a[orderKey]
          const bVal = b[orderKey]
          if (aVal < bVal) return -1 * direction
          if (aVal > bVal) return 1 * direction
          return 0
        })
      }

      if (skip) rows = rows.slice(skip)
      if (take) rows = rows.slice(0, take)

      return rows.map((row) => projectRow(row, select))
    },

    findUnique: async (
      args: Prisma.event_assignmentFindUniqueArgs
    ) => {
      const { where, select } = args
      const id = where.id
      const row = eventAssignments.get(id)
      if (!row) return null
      return projectRow(row, select)
    },

    findFirst: async (
      args: Partial<Prisma.event_assignmentFindFirstArgs> = {}
    ) => {
      const { where, select } = args
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

    create: async (args: Prisma.event_assignmentCreateArgs) => {
      const { data } = args
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

    update: async (args: Prisma.event_assignmentUpdateArgs) => {
      const { where, data } = args
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

    delete: async (args: Prisma.event_assignmentDeleteArgs) => {
      const { where } = args
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

    count: async (
      args: Partial<Prisma.event_assignmentCountArgs> = {}
    ) => {
      const { where } = args
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
    findUnique: async (
      args: Prisma.eventFindUniqueArgs
    ) => {
      const { where, select } = args
      const id = where.id
      const event = events.get(id)
      if (!event) return null
      return projectRow(event, select)
    },
  } as MockPrisma["event"]

  mockPrisma.employee = {
    findUnique: async (
      args: Prisma.employeeFindUniqueArgs
    ) => {
      const { where, select } = args
      const id = where.id
      const employee = employees.get(id)
      if (!employee) return null
      return projectRow(employee, select)
    },
  } as MockPrisma["employee"]

  ext.addEventAssignment = (data: {
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

  ext.clearEventAssignments = () => {
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
