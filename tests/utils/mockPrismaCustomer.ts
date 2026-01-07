import { Prisma } from "@prisma/client"
import { MockPrisma } from "./mockPrisma"

type CustomerRow = {
  id: number
  name: string
  address: string
  phone_number: string
  email: string
  notes: string | null
  created_at: Date | null
}

/**
 * Extends MockPrisma with customer model support
 */
export function extendMockPrismaWithCustomer(mockPrisma: MockPrisma) {
  const customers = new Map<number, CustomerRow>()

  const randomId = () => Math.floor(Math.random() * 1000000) + 1

  mockPrisma.customer = {
    findMany: async ({ where, select, orderBy, take, skip }: any = {}) => {
      let rows = Array.from(customers.values())

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

      if (where?.name) {
        if (where.name.contains) {
          const needle = where.name.contains.toLowerCase()
          const mode = where.name.mode
          rows = rows.filter((row) => {
            const nameLower = row.name.toLowerCase()
            if (mode === "insensitive") {
              return nameLower.includes(needle)
            }
            return row.name.includes(where.name.contains)
          })
        }
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
      if (where.id) {
        const row = customers.get(where.id)
        if (!row) return null
        return project(row, select)
      }
      if (where.name) {
        for (const row of customers.values()) {
          if (row.name === where.name) {
            return project(row, select)
          }
        }
        return null
      }
      if (where.email) {
        for (const row of customers.values()) {
          if (row.email === where.email) {
            return project(row, select)
          }
        }
        return null
      }
      return null
    },

    findFirst: async ({ where, select }: any) => {
      let rows = Array.from(customers.values())

      if (where?.email) {
        rows = rows.filter((row) => row.email === where.email)
      }

      if (where?.name) {
        if (where.name.contains) {
          const needle = where.name.contains.toLowerCase()
          const mode = where.name.mode
          rows = rows.filter((row) => {
            const nameLower = row.name.toLowerCase()
            if (mode === "insensitive") {
              return nameLower.includes(needle)
            }
            return row.name.includes(where.name.contains)
          })
        }
      }

      const row = rows[0] || null
      return row ? project(row, select) : null
    },

    create: async ({ data }: any) => {
      const id = data.id ?? randomId()
      const now = new Date()
      const row: CustomerRow = {
        id,
        name: data.name,
        address: data.address,
        phone_number: data.phone_number,
        email: data.email,
        notes: data.notes ?? null,
        created_at: data.created_at ?? now,
      }
      customers.set(id, row)
      return { ...row }
    },

    update: async ({ where, data }: any) => {
      const id =
        where.id ??
        (where.name ? findCustomerByName(where.name)?.id : null) ??
        (where.email ? findCustomerByEmail(where.email)?.id : null)
      const row = customers.get(id!)
      if (!row) {
        const error = new Prisma.PrismaClientKnownRequestError(
          "Record not found",
          { code: "P2025", clientVersion: "test" }
        )
        throw error
      }

      const updated: CustomerRow = {
        ...row,
        ...(data.name !== undefined && { name: data.name }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.phone_number !== undefined && {
          phone_number: data.phone_number,
        }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.notes !== undefined && { notes: data.notes }),
      }
      customers.set(id!, updated)
      return { ...updated }
    },

    delete: async ({ where }: any) => {
      const id =
        where.id ??
        (where.name ? findCustomerByName(where.name)?.id : null) ??
        (where.email ? findCustomerByEmail(where.email)?.id : null)
      const row = customers.get(id!)
      if (!row) {
        const error = new Prisma.PrismaClientKnownRequestError(
          "Record not found",
          { code: "P2025", clientVersion: "test" }
        )
        throw error
      }
      customers.delete(id!)
      return { ...row }
    },

    count: async ({ where }: any = {}) => {
      if (!where) return customers.size
      let rows = Array.from(customers.values())
      if (where.name?.contains) {
        const needle = where.name.contains.toLowerCase()
        rows = rows.filter((row) => row.name.toLowerCase().includes(needle))
      }
      return rows.length
    },
  }

  // Helper to add test customers
  ;(mockPrisma as any).addCustomer = (data: {
    id?: number
    name: string
    address: string
    phone_number: string
    email: string
    notes?: string | null
    created_at?: Date | null
  }) => {
    const id = data.id ?? randomId()
    const row: CustomerRow = {
      id,
      name: data.name,
      address: data.address,
      phone_number: data.phone_number,
      email: data.email,
      notes: data.notes ?? null,
      created_at: data.created_at ?? new Date(),
    }
    customers.set(id, row)
    return row
  }

  // Helper to clear customers
  ;(mockPrisma as any).clearCustomers = () => {
    customers.clear()
  }

  // Helper to get all customers
  ;(mockPrisma as any).getCustomers = () => {
    return Array.from(customers.values())
  }

  function findCustomerByName(name: string): CustomerRow | undefined {
    for (const customer of customers.values()) {
      if (customer.name === name) {
        return customer
      }
    }
    return undefined
  }

  function findCustomerByEmail(email: string): CustomerRow | undefined {
    for (const customer of customers.values()) {
      if (customer.email === email) {
        return customer
      }
    }
    return undefined
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
