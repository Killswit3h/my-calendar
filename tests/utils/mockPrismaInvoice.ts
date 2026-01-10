import { MockPrisma } from "./mockPrisma"

type InvoiceRow = {
  id: number
  number: string
  is_contract_invoice: boolean | null
}

/**
 * Extends MockPrisma with invoice model support
 */
export function extendMockPrismaWithInvoice(mockPrisma: MockPrisma) {
  const invoices = new Map<number, InvoiceRow>()

  const randomId = () => Math.floor(Math.random() * 1000000) + 1

  mockPrisma.invoice = {
    findMany: async ({ where, select, orderBy, take, skip }: any = {}) => {
      let rows = Array.from(invoices.values())

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

      if (where?.is_contract_invoice !== undefined) {
        rows = rows.filter((row) => row.is_contract_invoice === where.is_contract_invoice)
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
      const row = invoices.get(id)
      if (!row) return null
      return project(row, select)
    },

    findFirst: async ({ where, select }: any) => {
      let rows = Array.from(invoices.values())

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

      const row = rows[0] || null
      return row ? project(row, select) : null
    },

    create: async ({ data }: any) => {
      const id = data.id ?? randomId()
      
      // Check for unique constraint violation on number (case-insensitive)
      const existing = Array.from(invoices.values()).find(
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

      const row: InvoiceRow = {
        id,
        number: data.number,
        is_contract_invoice: data.is_contract_invoice ?? false,
      }
      invoices.set(id, row)
      return { ...row }
    },

    update: async ({ where, data }: any) => {
      const id = where.id
      const row = invoices.get(id)
      if (!row) {
        const Prisma = await import("@prisma/client")
        throw new Prisma.Prisma.PrismaClientKnownRequestError(
          "Record not found",
          { code: "P2025", clientVersion: "test" }
        )
      }

      // Check for unique constraint violation on number if changing (case-insensitive)
      if (data.number !== undefined && data.number.toLowerCase() !== row.number.toLowerCase()) {
        const existing = Array.from(invoices.values()).find(
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

      const updated: InvoiceRow = {
        ...row,
        ...(data.number !== undefined && { number: data.number }),
        ...(data.is_contract_invoice !== undefined && { is_contract_invoice: data.is_contract_invoice }),
      }
      invoices.set(id, updated)
      return { ...updated }
    },

    delete: async ({ where }: any) => {
      const id = where.id
      const row = invoices.get(id)
      if (!row) {
        const Prisma = await import("@prisma/client")
        throw new Prisma.Prisma.PrismaClientKnownRequestError(
          "Record not found",
          { code: "P2025", clientVersion: "test" }
        )
      }
      invoices.delete(id)
      return { ...row }
    },

    count: async ({ where }: any = {}) => {
      if (!where) return invoices.size
      let rows = Array.from(invoices.values())
      if (where.number) {
        rows = rows.filter((row) => row.number === where.number)
      }
      if (where.is_contract_invoice !== undefined) {
        rows = rows.filter((row) => row.is_contract_invoice === where.is_contract_invoice)
      }
      return rows.length
    },
  }

  // Helper to add test invoice records
  // Note: This is a test helper, so it doesn't enforce uniqueness
  // Uniqueness is enforced by the create method
  ;(mockPrisma as any).addInvoice = (data: {
    id?: number
    number: string
    is_contract_invoice?: boolean | null
  }) => {
    const id = data.id ?? randomId()
    
    const row: InvoiceRow = {
      id,
      number: data.number,
      is_contract_invoice: data.is_contract_invoice ?? false,
    }
    invoices.set(id, row)
    return row
  }

  // Helper to clear invoices
  ;(mockPrisma as any).clearInvoices = () => {
    invoices.clear()
  }

  // Helper to get all invoices
  ;(mockPrisma as any).getInvoices = () => {
    return Array.from(invoices.values())
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
