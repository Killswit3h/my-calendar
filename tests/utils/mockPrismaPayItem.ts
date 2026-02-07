import { MockPrisma } from "./mockPrisma"

type PayItemRow = {
  id: number
  number: string
  description: string
  unit: string
}

/**
 * Extends MockPrisma with pay_item model support
 */
export function extendMockPrismaWithPayItem(mockPrisma: MockPrisma) {
  const payItems = new Map<number, PayItemRow>()

  const randomId = () => Math.floor(Math.random() * 1000000) + 1

  mockPrisma.pay_item = {
    findMany: async ({ where, select, orderBy, take, skip }: any = {}) => {
      let rows = Array.from(payItems.values())

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

      if (where?.number) {
        if (where.number.equals !== undefined) {
          const equals = where.number.equals
          const mode = where.number.mode || "default"
          rows = rows.filter((row) => {
            const num = mode === "insensitive" 
              ? row.number.toLowerCase() 
              : row.number
            return num === (mode === "insensitive" ? equals.toLowerCase() : equals)
          })
        }
        if (where.number.contains) {
          const contains = where.number.contains.toLowerCase()
          const mode = where.number.mode || "default"
          rows = rows.filter((row) => {
            const num = mode === "insensitive" 
              ? row.number.toLowerCase() 
              : row.number
            return num.includes(contains)
          })
        }
      }

      if (where?.description) {
        if (where.description.contains) {
          const contains = where.description.contains.toLowerCase()
          const mode = where.description.mode || "default"
          rows = rows.filter((row) => {
            const desc = mode === "insensitive" 
              ? row.description.toLowerCase() 
              : row.description
            return desc.includes(contains)
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
      const id = where.id
      const row = payItems.get(id)
      if (!row) return null
      return project(row, select)
    },

    findFirst: async ({ where, select }: any) => {
      let rows = Array.from(payItems.values())

      if (where?.number) {
        const equals = where.number.equals
        const mode = where.number.mode || "default"
        rows = rows.filter((row) => {
          const num = mode === "insensitive" 
            ? row.number.toLowerCase() 
            : row.number
          return num === (mode === "insensitive" ? equals.toLowerCase() : equals)
        })
      }

      if (where?.description) {
        rows = rows.filter((row) => row.description === where.description)
      }

      const row = rows[0] || null
      return row ? project(row, select) : null
    },

    create: async ({ data }: any) => {
      const id = data.id ?? randomId()
      
      // Check for unique constraint violation on number (case-insensitive)
      const existing = Array.from(payItems.values()).find(
        (row) => row.number.toLowerCase() === data.number.toLowerCase()
      )
      if (existing) {
        const Prisma = await import("@prisma/client")
        throw new Prisma.Prisma.PrismaClientKnownRequestError(
          "Unique constraint violation",
          {
            code: "P2002",
            clientVersion: "test",
            meta: { target: ["number"] },
          }
        )
      }

      const row: PayItemRow = {
        id,
        number: data.number,
        description: data.description,
        unit: data.unit,
      }
      payItems.set(id, row)
      return { ...row }
    },

    update: async ({ where, data }: any) => {
      const id = where.id
      const row = payItems.get(id)
      if (!row) {
        const Prisma = await import("@prisma/client")
        throw new Prisma.Prisma.PrismaClientKnownRequestError(
          "Record not found",
          { code: "P2025", clientVersion: "test" }
        )
      }

      // Check for unique constraint violation on number if changing (case-insensitive)
      if (data.number !== undefined && data.number.toLowerCase() !== row.number.toLowerCase()) {
        const existing = Array.from(payItems.values()).find(
          (r) => r.number.toLowerCase() === data.number.toLowerCase() && r.id !== id
        )
        if (existing) {
          const Prisma = await import("@prisma/client")
          throw new Prisma.Prisma.PrismaClientKnownRequestError(
            "Unique constraint violation",
            {
              code: "P2002",
              clientVersion: "test",
              meta: { target: ["number"] },
            }
          )
        }
      }

      const updated: PayItemRow = {
        ...row,
        ...(data.number !== undefined && { number: data.number }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.unit !== undefined && { unit: data.unit }),
      }
      payItems.set(id, updated)
      return { ...updated }
    },

    delete: async ({ where }: any) => {
      const id = where.id
      const row = payItems.get(id)
      if (!row) {
        const Prisma = await import("@prisma/client")
        throw new Prisma.Prisma.PrismaClientKnownRequestError(
          "Record not found",
          { code: "P2025", clientVersion: "test" }
        )
      }
      payItems.delete(id)
      return { ...row }
    },

    count: async ({ where }: any = {}) => {
      if (!where) return payItems.size
      let rows = Array.from(payItems.values())
      if (where.number) {
        rows = rows.filter((row) => row.number === where.number)
      }
      if (where.description) {
        rows = rows.filter((row) => row.description === where.description)
      }
      return rows.length
    },
  }

  // Helper to add test pay item records
  // Note: This is a test helper, so it doesn't enforce uniqueness
  // Uniqueness is enforced by the create method
  ;(mockPrisma as any).addPayItem = (data: {
    id?: number
    number: string
    description: string
    unit: string
  }) => {
    const id = data.id ?? randomId()
    
    const row: PayItemRow = {
      id,
      number: data.number,
      description: data.description,
      unit: data.unit,
    }
    payItems.set(id, row)
    return row
  }

  // Helper to clear pay items
  ;(mockPrisma as any).clearPayItems = () => {
    payItems.clear()
  }

  // Helper to get all pay items
  ;(mockPrisma as any).getPayItems = () => {
    return Array.from(payItems.values())
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
