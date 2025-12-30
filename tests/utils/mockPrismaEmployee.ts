import { Prisma } from "@prisma/client"
import { MockPrisma } from "./mockPrisma"

type EmployeeRow = {
  id: number
  name: string
  wage_rate: Prisma.Decimal
  start_date: Date
  last_updated: Date | null
  phone_number: string | null
  email: string | null
  active: boolean | null
}

/**
 * Extends MockPrisma with employee model support
 */
export function extendMockPrismaWithEmployee(mockPrisma: MockPrisma) {
  const employees = new Map<number, EmployeeRow>()

  const randomId = () => Math.floor(Math.random() * 1000000) + 1

  mockPrisma.employee = {
    findMany: async ({ where, select, orderBy, take, skip }: any = {}) => {
      let rows = Array.from(employees.values())

      if (where?.id) {
        if (where.id.equals !== undefined) {
          rows = rows.filter((row) => row.id === where.id.equals)
        }
        if (where.id.in) {
          const set = new Set(where.id.in)
          rows = rows.filter((row) => set.has(row.id))
        }
      }

      if (where?.email) {
        if (where.email.equals !== undefined) {
          rows = rows.filter((row) => row.email === where.email.equals)
        }
      }

      if (where?.active !== undefined) {
        rows = rows.filter((row) => row.active === where.active)
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

      return rows.map((row) => project(row, select))
    },

    findUnique: async ({ where, select }: any) => {
      const id = where.id
      const row = employees.get(id)
      if (!row) return null
      return project(row, select)
    },

    findFirst: async ({ where, select }: any) => {
      let rows = Array.from(employees.values())

      if (where?.email) {
        rows = rows.filter((row) => row.email === where.email)
      }

      if (where?.active !== undefined) {
        rows = rows.filter((row) => row.active === where.active)
      }

      const row = rows[0] || null
      return row ? project(row, select) : null
    },

    create: async ({ data }: any) => {
      const id = data.id ?? randomId()
      const now = new Date()
      const row: EmployeeRow = {
        id,
        name: data.name,
        wage_rate:
          data.wage_rate instanceof Prisma.Decimal
            ? data.wage_rate
            : new Prisma.Decimal(data.wage_rate),
        start_date:
          data.start_date instanceof Date
            ? data.start_date
            : new Date(data.start_date),
        last_updated: data.last_updated ?? null,
        phone_number: data.phone_number ?? null,
        email: data.email ?? null,
        active: data.active ?? true,
      }
      employees.set(id, row)
      return { ...row }
    },

    update: async ({ where, data }: any) => {
      const id = where.id
      const row = employees.get(id)
      if (!row) {
        const error = new Prisma.PrismaClientKnownRequestError(
          "Record not found",
          { code: "P2025", clientVersion: "test" }
        )
        throw error
      }

      const updated: EmployeeRow = {
        ...row,
        ...(data.name !== undefined && { name: data.name }),
        ...(data.wage_rate !== undefined && {
          wage_rate:
            data.wage_rate instanceof Prisma.Decimal
              ? data.wage_rate
              : new Prisma.Decimal(data.wage_rate),
        }),
        ...(data.start_date !== undefined && {
          start_date:
            data.start_date instanceof Date
              ? data.start_date
              : new Date(data.start_date),
        }),
        ...(data.phone_number !== undefined && {
          phone_number: data.phone_number,
        }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.active !== undefined && { active: data.active }),
        last_updated: new Date(),
      }
      employees.set(id, updated)
      return { ...updated }
    },

    delete: async ({ where }: any) => {
      const id = where.id
      const row = employees.get(id)
      if (!row) {
        const error = new Prisma.PrismaClientKnownRequestError(
          "Record not found",
          { code: "P2025", clientVersion: "test" }
        )
        throw error
      }
      employees.delete(id)
      return { ...row }
    },

    count: async ({ where }: any = {}) => {
      if (!where) return employees.size
      let rows = Array.from(employees.values())
      if (where.active !== undefined) {
        rows = rows.filter((row) => row.active === where.active)
      }
      return rows.length
    },
  }

  // Helper to add test employees
  ;(mockPrisma as any).addEmployee = (data: {
    id?: number
    name: string
    wage_rate: number | string | Prisma.Decimal
    start_date: Date | string
    phone_number?: string | null
    email?: string | null
    active?: boolean | null
  }) => {
    const id = data.id ?? randomId()
    const row: EmployeeRow = {
      id,
      name: data.name,
      wage_rate:
        data.wage_rate instanceof Prisma.Decimal
          ? data.wage_rate
          : new Prisma.Decimal(data.wage_rate),
      start_date:
        data.start_date instanceof Date
          ? data.start_date
          : new Date(data.start_date),
      last_updated: null,
      phone_number: data.phone_number ?? null,
      email: data.email ?? null,
      active: data.active ?? true,
    }
    employees.set(id, row)
    return row
  }

  // Helper to clear employees
  ;(mockPrisma as any).clearEmployees = () => {
    employees.clear()
  }

  // Helper to get all employees
  ;(mockPrisma as any).getEmployees = () => {
    return Array.from(employees.values())
  }
}

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
