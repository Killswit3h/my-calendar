import { MockPrisma } from "./mockPrisma"
import { Prisma } from "@prisma/client"

type ProjectRow = {
  id: number
  customer_id: number | null
  name: string
  location: string
  retainage: Prisma.Decimal
  is_payroll: boolean | null
  is_EEO: boolean | null
  vendor: string
  status: string | null
  created_at: Date | null
  updated_at: Date | null
}

/**
 * Extends MockPrisma with project model support
 */
export function extendMockPrismaWithProject(mockPrisma: MockPrisma) {
  const projects = new Map<number, ProjectRow>()
  const customers = new Map<number, { id: number }>() // For customer validation

  const randomId = () => Math.floor(Math.random() * 1000000) + 1

  // Helper to add a customer for validation
  ;(mockPrisma as any).addCustomer = (data: { id?: number }) => {
    const id = data.id ?? randomId()
    customers.set(id, { id })
    return { id }
  }

  mockPrisma.project = {
    findMany: async ({ where, select, orderBy, take, skip }: any = {}) => {
      let rows = Array.from(projects.values())

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

      if (where?.customer_id !== undefined) {
        rows = rows.filter((row) => row.customer_id === where.customer_id)
      }

      if (where?.name) {
        if (where.name.equals !== undefined) {
          const equals = where.name.equals
          const mode = where.name.mode || "default"
          rows = rows.filter((row) => {
            const name = mode === "insensitive" 
              ? row.name.toLowerCase() 
              : row.name
            return name === (mode === "insensitive" ? equals.toLowerCase() : equals)
          })
        }
        if (where.name.contains) {
          const contains = where.name.contains.toLowerCase()
          const mode = where.name.mode || "default"
          rows = rows.filter((row) => {
            const name = mode === "insensitive" 
              ? row.name.toLowerCase() 
              : row.name
            return name.includes(contains)
          })
        }
      }

      if (where?.location) {
        if (where.location.contains) {
          const contains = where.location.contains.toLowerCase()
          const mode = where.location.mode || "default"
          rows = rows.filter((row) => {
            const loc = mode === "insensitive" 
              ? row.location.toLowerCase() 
              : row.location
            return loc.includes(contains)
          })
        }
      }

      if (where?.vendor) {
        if (where.vendor.contains) {
          const contains = where.vendor.contains.toLowerCase()
          const mode = where.vendor.mode || "default"
          rows = rows.filter((row) => {
            const ven = mode === "insensitive" 
              ? row.vendor.toLowerCase() 
              : row.vendor
            return ven.includes(contains)
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
      const row = projects.get(id)
      if (!row) return null
      return project(row, select)
    },

    findFirst: async ({ where, select }: any) => {
      let rows = Array.from(projects.values())

      if (where?.name) {
        const equals = where.name.equals
        const mode = where.name.mode || "default"
        rows = rows.filter((row) => {
          const name = mode === "insensitive" 
            ? row.name.toLowerCase() 
            : row.name
          return name === (mode === "insensitive" ? equals.toLowerCase() : equals)
        })
      }

      const row = rows[0] || null
      return row ? project(row, select) : null
    },

    create: async ({ data }: any) => {
      const id = data.id ?? randomId()
      
      // Check for unique constraint violation on name (case-insensitive)
      const existing = Array.from(projects.values()).find(
        (row) => row.name.toLowerCase() === data.name.toLowerCase()
      )
      if (existing) {
        const Prisma = await import("@prisma/client")
        throw new Prisma.Prisma.PrismaClientKnownRequestError(
          "Unique constraint violation",
          {
            code: "P2002",
            clientVersion: "test",
            meta: { target: ["name"] },
          }
        )
      }

      // Convert retainage to Decimal if needed
      let retainage: Prisma.Decimal
      if (data.retainage instanceof Prisma.Decimal) {
        retainage = data.retainage
      } else if (typeof data.retainage === "number") {
        retainage = new Prisma.Decimal(data.retainage)
      } else if (typeof data.retainage === "string") {
        retainage = new Prisma.Decimal(data.retainage)
      } else {
        retainage = new Prisma.Decimal(0)
      }

      const row: ProjectRow = {
        id,
        customer_id: data.customer_id ?? null,
        name: data.name,
        location: data.location,
        retainage,
        is_payroll: data.is_payroll ?? false,
        is_EEO: data.is_EEO ?? false,
        vendor: data.vendor,
        status: data.status ?? "Not Started",
        created_at: data.created_at ?? new Date(),
        updated_at: data.updated_at ?? new Date(),
      }
      projects.set(id, row)
      return { ...row }
    },

    update: async ({ where, data }: any) => {
      const id = where.id
      const row = projects.get(id)
      if (!row) {
        const Prisma = await import("@prisma/client")
        throw new Prisma.Prisma.PrismaClientKnownRequestError(
          "Record not found",
          { code: "P2025", clientVersion: "test" }
        )
      }

      // Check for unique constraint violation on name if changing (case-insensitive)
      if (data.name !== undefined && data.name.toLowerCase() !== row.name.toLowerCase()) {
        const existing = Array.from(projects.values()).find(
          (r) => r.name.toLowerCase() === data.name.toLowerCase() && r.id !== id
        )
        if (existing) {
          const Prisma = await import("@prisma/client")
          throw new Prisma.Prisma.PrismaClientKnownRequestError(
            "Unique constraint violation",
            {
              code: "P2002",
              clientVersion: "test",
              meta: { target: ["name"] },
            }
          )
        }
      }

      // Handle retainage update
      let retainage = row.retainage
      if (data.retainage !== undefined) {
        if (data.retainage instanceof Prisma.Decimal) {
          retainage = data.retainage
        } else if (typeof data.retainage === "number") {
          retainage = new Prisma.Decimal(data.retainage)
        } else if (typeof data.retainage === "string") {
          retainage = new Prisma.Decimal(data.retainage)
        }
      }

      const updated: ProjectRow = {
        ...row,
        ...(data.customer_id !== undefined && { customer_id: data.customer_id }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.location !== undefined && { location: data.location }),
        retainage,
        ...(data.is_payroll !== undefined && { is_payroll: data.is_payroll }),
        ...(data.is_EEO !== undefined && { is_EEO: data.is_EEO }),
        ...(data.vendor !== undefined && { vendor: data.vendor }),
        ...(data.status !== undefined && { status: data.status }),
        updated_at: new Date(),
      }
      projects.set(id, updated)
      return { ...updated }
    },

    delete: async ({ where }: any) => {
      const id = where.id
      const row = projects.get(id)
      if (!row) {
        const Prisma = await import("@prisma/client")
        throw new Prisma.Prisma.PrismaClientKnownRequestError(
          "Record not found",
          { code: "P2025", clientVersion: "test" }
        )
      }
      projects.delete(id)
      return { ...row }
    },

    count: async ({ where }: any = {}) => {
      if (!where) return projects.size
      let rows = Array.from(projects.values())
      if (where.name) {
        rows = rows.filter((row) => row.name === where.name)
      }
      if (where.customer_id !== undefined) {
        rows = rows.filter((row) => row.customer_id === where.customer_id)
      }
      return rows.length
    },
  }

  // Mock customer.findUnique for validation
  mockPrisma.customer = {
    findUnique: async ({ where, select }: any) => {
      const id = where.id
      const customer = customers.get(id)
      if (!customer) return null
      return project(customer, select)
    },
  } as any

  // Helper to add test project records
  // Note: This is a test helper, so it doesn't enforce uniqueness
  // Uniqueness is enforced by the create method
  ;(mockPrisma as any).addProject = (data: {
    id?: number
    customer_id?: number | null
    name: string
    location: string
    retainage: number | string | Prisma.Decimal
    vendor: string
    is_payroll?: boolean | null
    is_EEO?: boolean | null
    status?: string | null
  }) => {
    const id = data.id ?? randomId()
    
    let retainage: Prisma.Decimal
    if (data.retainage instanceof Prisma.Decimal) {
      retainage = data.retainage
    } else if (typeof data.retainage === "number") {
      retainage = new Prisma.Decimal(data.retainage)
    } else {
      retainage = new Prisma.Decimal(data.retainage)
    }
    
    const row: ProjectRow = {
      id,
      customer_id: data.customer_id ?? null,
      name: data.name,
      location: data.location,
      retainage,
      is_payroll: data.is_payroll ?? false,
      is_EEO: data.is_EEO ?? false,
      vendor: data.vendor,
      status: data.status ?? "ACTIVE",
      created_at: new Date(),
      updated_at: new Date(),
    }
    projects.set(id, row)
    return row
  }

  // Helper to clear projects
  ;(mockPrisma as any).clearProjects = () => {
    projects.clear()
  }

  // Helper to get all projects
  ;(mockPrisma as any).getProjects = () => {
    return Array.from(projects.values())
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
