import { MockPrisma } from "./mockPrisma"

type ScopeOfWorkRow = {
  id: number
  description: string
}

/**
 * Extends MockPrisma with scope_of_work model support
 */
export function extendMockPrismaWithScopeOfWork(mockPrisma: MockPrisma) {
  const scopeOfWorks = new Map<number, ScopeOfWorkRow>()

  const randomId = () => Math.floor(Math.random() * 1000000) + 1

  mockPrisma.scope_of_work = {
    findMany: async ({ where, select, orderBy, take, skip }: any = {}) => {
      let rows = Array.from(scopeOfWorks.values())

      if (where?.id) {
        if (where.id.equals !== undefined) {
          rows = rows.filter((row) => row.id === where.id.equals)
        }
        if (where.id.in) {
          const set = new Set(where.id.in)
          rows = rows.filter((row) => set.has(row.id))
        }
      }

      if (where?.description) {
        if (where.description.equals !== undefined) {
          rows = rows.filter((row) => row.description === where.description.equals)
        }
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
      const row = scopeOfWorks.get(id)
      if (!row) return null
      return project(row, select)
    },

    findFirst: async ({ where, select }: any) => {
      let rows = Array.from(scopeOfWorks.values())

      if (where?.description) {
        rows = rows.filter((row) => row.description === where.description)
      }

      const row = rows[0] || null
      return row ? project(row, select) : null
    },

    create: async ({ data }: any) => {
      const id = data.id ?? randomId()
      
      // Check for unique constraint violation on description
      const existing = Array.from(scopeOfWorks.values()).find(
        (row) => row.description === data.description
      )
      if (existing) {
        const Prisma = await import("@prisma/client")
        throw new Prisma.Prisma.PrismaClientKnownRequestError(
          "Unique constraint violation",
          {
            code: "P2002",
            clientVersion: "test",
            meta: { target: ["description"] },
          }
        )
      }

      const row: ScopeOfWorkRow = {
        id,
        description: data.description,
      }
      scopeOfWorks.set(id, row)
      return { ...row }
    },

    update: async ({ where, data }: any) => {
      const id = where.id
      const row = scopeOfWorks.get(id)
      if (!row) {
        const Prisma = await import("@prisma/client")
        throw new Prisma.Prisma.PrismaClientKnownRequestError(
          "Record not found",
          { code: "P2025", clientVersion: "test" }
        )
      }

      // Check for unique constraint violation on description if changing
      if (data.description !== undefined && data.description !== row.description) {
        const existing = Array.from(scopeOfWorks.values()).find(
          (r) => r.description === data.description && r.id !== id
        )
        if (existing) {
          const Prisma = await import("@prisma/client")
          throw new Prisma.Prisma.PrismaClientKnownRequestError(
            "Unique constraint violation",
            {
              code: "P2002",
              clientVersion: "test",
              meta: { target: ["description"] },
            }
          )
        }
      }

      const updated: ScopeOfWorkRow = {
        ...row,
        ...(data.description !== undefined && { description: data.description }),
      }
      scopeOfWorks.set(id, updated)
      return { ...updated }
    },

    delete: async ({ where }: any) => {
      const id = where.id
      const row = scopeOfWorks.get(id)
      if (!row) {
        const Prisma = await import("@prisma/client")
        throw new Prisma.Prisma.PrismaClientKnownRequestError(
          "Record not found",
          { code: "P2025", clientVersion: "test" }
        )
      }
      scopeOfWorks.delete(id)
      return { ...row }
    },

    count: async ({ where }: any = {}) => {
      if (!where) return scopeOfWorks.size
      let rows = Array.from(scopeOfWorks.values())
      if (where.description) {
        rows = rows.filter((row) => row.description === where.description)
      }
      return rows.length
    },
  }

  // Helper to add test scope of work records
  // Note: This is a test helper, so it doesn't enforce uniqueness
  // Uniqueness is enforced by the create method
  ;(mockPrisma as any).addScopeOfWork = (data: {
    id?: number
    description: string
  }) => {
    const id = data.id ?? randomId()
    
    const row: ScopeOfWorkRow = {
      id,
      description: data.description,
    }
    scopeOfWorks.set(id, row)
    return row
  }

  // Helper to clear scope of works
  ;(mockPrisma as any).clearScopeOfWorks = () => {
    scopeOfWorks.clear()
  }

  // Helper to get all scope of works
  ;(mockPrisma as any).getScopeOfWorks = () => {
    return Array.from(scopeOfWorks.values())
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
