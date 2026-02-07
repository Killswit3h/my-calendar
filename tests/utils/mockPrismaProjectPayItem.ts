import { MockPrisma } from "./mockPrisma"
import { Prisma } from "@prisma/client"

type ProjectPayItemRow = {
  id: number
  project_id: number
  pay_item_id: number
  contracted_quantity: Prisma.Decimal
  unit_rate: Prisma.Decimal
  is_original: boolean | null
  stockpile_billed: Prisma.Decimal
  notes: string | null
  begin_station: string | null
  end_station: string | null
  status: string | null
  locate_ticket: string | null
  LF_RT: string | null
  onsite_review: string | null
}

/**
 * Extends MockPrisma with project_pay_item model support
 */
export function extendMockPrismaWithProjectPayItem(mockPrisma: MockPrisma) {
  const projectPayItems = new Map<number, ProjectPayItemRow>()
  const projects = new Map<number, { id: number }>() // For project validation
  const payItems = new Map<number, { id: number }>() // For pay_item validation

  const randomId = () => Math.floor(Math.random() * 1000000) + 1

  // Helper to add a project for validation
  ;(mockPrisma as any).addProject = (data: { id?: number }) => {
    const id = data.id ?? randomId()
    projects.set(id, { id })
    return { id }
  }

  // Helper to add a pay_item for validation
  ;(mockPrisma as any).addPayItem = (data: { id?: number }) => {
    const id = data.id ?? randomId()
    payItems.set(id, { id })
    return { id }
  }

  mockPrisma.project_pay_item = {
    findMany: async ({ where, select, orderBy, take, skip }: any = {}) => {
      let rows = Array.from(projectPayItems.values())

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

      if (where?.project_id !== undefined) {
        rows = rows.filter((row) => row.project_id === where.project_id)
      }

      if (where?.pay_item_id !== undefined) {
        rows = rows.filter((row) => row.pay_item_id === where.pay_item_id)
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

      return rows.map((row) => projectPayItem(row, select))
    },

    findUnique: async ({ where, select }: any) => {
      const id = where.id
      const row = projectPayItems.get(id)
      if (!row) return null
      return projectPayItem(row, select)
    },

    findFirst: async ({ where, select }: any) => {
      let rows = Array.from(projectPayItems.values())

      if (where?.project_id !== undefined) {
        rows = rows.filter((row) => row.project_id === where.project_id)
      }

      if (where?.pay_item_id !== undefined) {
        rows = rows.filter((row) => row.pay_item_id === where.pay_item_id)
      }

      const row = rows[0] || null
      return row ? projectPayItem(row, select) : null
    },

    create: async ({ data }: any) => {
      const id = data.id ?? randomId()

      // Convert Decimal fields
      let contracted_quantity: Prisma.Decimal
      if (data.contracted_quantity instanceof Prisma.Decimal) {
        contracted_quantity = data.contracted_quantity
      } else if (typeof data.contracted_quantity === "number") {
        contracted_quantity = new Prisma.Decimal(data.contracted_quantity)
      } else if (typeof data.contracted_quantity === "string") {
        contracted_quantity = new Prisma.Decimal(data.contracted_quantity)
      } else {
        contracted_quantity = new Prisma.Decimal(0)
      }

      let unit_rate: Prisma.Decimal
      if (data.unit_rate instanceof Prisma.Decimal) {
        unit_rate = data.unit_rate
      } else if (typeof data.unit_rate === "number") {
        unit_rate = new Prisma.Decimal(data.unit_rate)
      } else if (typeof data.unit_rate === "string") {
        unit_rate = new Prisma.Decimal(data.unit_rate)
      } else {
        unit_rate = new Prisma.Decimal(0)
      }

      let stockpile_billed: Prisma.Decimal
      if (data.stockpile_billed instanceof Prisma.Decimal) {
        stockpile_billed = data.stockpile_billed
      } else if (typeof data.stockpile_billed === "number") {
        stockpile_billed = new Prisma.Decimal(data.stockpile_billed)
      } else if (typeof data.stockpile_billed === "string") {
        stockpile_billed = new Prisma.Decimal(data.stockpile_billed)
      } else {
        stockpile_billed = new Prisma.Decimal(0)
      }

      // Handle relation format (project: { connect: { id: ... } })
      let project_id: number
      if (data.project_id !== undefined) {
        project_id = data.project_id
      } else if (data.project?.connect?.id !== undefined) {
        project_id = data.project.connect.id
      } else {
        throw new Error("project_id is required")
      }

      let pay_item_id: number
      if (data.pay_item_id !== undefined) {
        pay_item_id = data.pay_item_id
      } else if (data.pay_item?.connect?.id !== undefined) {
        pay_item_id = data.pay_item.connect.id
      } else {
        throw new Error("pay_item_id is required")
      }

      const row: ProjectPayItemRow = {
        id,
        project_id,
        pay_item_id,
        contracted_quantity,
        unit_rate,
        is_original: data.is_original ?? true,
        stockpile_billed,
        notes: data.notes ?? null,
        begin_station: data.begin_station ?? null,
        end_station: data.end_station ?? null,
        status: data.status ?? null,
        locate_ticket: data.locate_ticket ?? null,
        LF_RT: data.LF_RT ?? null,
        onsite_review: data.onsite_review ?? null,
      }
      projectPayItems.set(id, row)
      return { ...row }
    },

    update: async ({ where, data }: any) => {
      const id = where.id
      const row = projectPayItems.get(id)
      if (!row) {
        const Prisma = await import("@prisma/client")
        throw new Prisma.Prisma.PrismaClientKnownRequestError(
          "Record not found",
          { code: "P2025", clientVersion: "test" }
        )
      }

      // Handle Decimal updates
      let contracted_quantity = row.contracted_quantity
      if (data.contracted_quantity !== undefined) {
        if (data.contracted_quantity instanceof Prisma.Decimal) {
          contracted_quantity = data.contracted_quantity
        } else if (typeof data.contracted_quantity === "number") {
          contracted_quantity = new Prisma.Decimal(data.contracted_quantity)
        } else if (typeof data.contracted_quantity === "string") {
          contracted_quantity = new Prisma.Decimal(data.contracted_quantity)
        }
      }

      let unit_rate = row.unit_rate
      if (data.unit_rate !== undefined) {
        if (data.unit_rate instanceof Prisma.Decimal) {
          unit_rate = data.unit_rate
        } else if (typeof data.unit_rate === "number") {
          unit_rate = new Prisma.Decimal(data.unit_rate)
        } else if (typeof data.unit_rate === "string") {
          unit_rate = new Prisma.Decimal(data.unit_rate)
        }
      }

      let stockpile_billed = row.stockpile_billed
      if (data.stockpile_billed !== undefined) {
        if (data.stockpile_billed instanceof Prisma.Decimal) {
          stockpile_billed = data.stockpile_billed
        } else if (typeof data.stockpile_billed === "number") {
          stockpile_billed = new Prisma.Decimal(data.stockpile_billed)
        } else if (typeof data.stockpile_billed === "string") {
          stockpile_billed = new Prisma.Decimal(data.stockpile_billed)
        }
      }

      // Handle relation format (project: { connect: { id: ... } })
      let project_id = row.project_id
      if (data.project_id !== undefined) {
        project_id = data.project_id
      } else if (data.project?.connect?.id !== undefined) {
        project_id = data.project.connect.id
      }

      let pay_item_id = row.pay_item_id
      if (data.pay_item_id !== undefined) {
        pay_item_id = data.pay_item_id
      } else if (data.pay_item?.connect?.id !== undefined) {
        pay_item_id = data.pay_item.connect.id
      }

      const updated: ProjectPayItemRow = {
        ...row,
        project_id,
        pay_item_id,
        contracted_quantity,
        unit_rate,
        stockpile_billed,
        ...(data.is_original !== undefined && { is_original: data.is_original }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.begin_station !== undefined && { begin_station: data.begin_station }),
        ...(data.end_station !== undefined && { end_station: data.end_station }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.locate_ticket !== undefined && { locate_ticket: data.locate_ticket }),
        ...(data.LF_RT !== undefined && { LF_RT: data.LF_RT }),
        ...(data.onsite_review !== undefined && { onsite_review: data.onsite_review }),
      }
      projectPayItems.set(id, updated)
      return { ...updated }
    },

    delete: async ({ where }: any) => {
      const id = where.id
      const row = projectPayItems.get(id)
      if (!row) {
        const Prisma = await import("@prisma/client")
        throw new Prisma.Prisma.PrismaClientKnownRequestError(
          "Record not found",
          { code: "P2025", clientVersion: "test" }
        )
      }
      projectPayItems.delete(id)
      return { ...row }
    },

    count: async ({ where }: any = {}) => {
      if (!where) return projectPayItems.size
      let rows = Array.from(projectPayItems.values())
      if (where.project_id !== undefined) {
        rows = rows.filter((row) => row.project_id === where.project_id)
      }
      if (where.pay_item_id !== undefined) {
        rows = rows.filter((row) => row.pay_item_id === where.pay_item_id)
      }
      return rows.length
    },
  }

  // Mock project.findUnique for validation
  mockPrisma.project = {
    findUnique: async ({ where, select }: any) => {
      const id = where.id
      const project = projects.get(id)
      if (!project) return null
      return projectPayItem(project, select)
    },
  } as any

  // Mock pay_item.findUnique for validation (note: Prisma uses pay_item, not payItem)
  mockPrisma.pay_item = {
    findUnique: async ({ where, select }: any) => {
      const id = where.id
      const payItem = payItems.get(id)
      if (!payItem) return null
      return projectPayItem(payItem, select)
    },
  } as any

  // Helper to add test project pay item records
  ;(mockPrisma as any).addProjectPayItem = (data: {
    id?: number
    project_id: number
    pay_item_id: number
    contracted_quantity: number | string | Prisma.Decimal
    unit_rate: number | string | Prisma.Decimal
    is_original?: boolean | null
    stockpile_billed?: number | string | Prisma.Decimal
    notes?: string | null
    begin_station?: string | null
    end_station?: string | null
    status?: string | null
    locate_ticket?: string | null
    LF_RT?: string | null
    onsite_review?: string | null
  }) => {
    const id = data.id ?? randomId()

    let contracted_quantity: Prisma.Decimal
    if (data.contracted_quantity instanceof Prisma.Decimal) {
      contracted_quantity = data.contracted_quantity
    } else if (typeof data.contracted_quantity === "number") {
      contracted_quantity = new Prisma.Decimal(data.contracted_quantity)
    } else {
      contracted_quantity = new Prisma.Decimal(data.contracted_quantity)
    }

    let unit_rate: Prisma.Decimal
    if (data.unit_rate instanceof Prisma.Decimal) {
      unit_rate = data.unit_rate
    } else if (typeof data.unit_rate === "number") {
      unit_rate = new Prisma.Decimal(data.unit_rate)
    } else {
      unit_rate = new Prisma.Decimal(data.unit_rate)
    }

    let stockpile_billed: Prisma.Decimal
    if (data.stockpile_billed instanceof Prisma.Decimal) {
      stockpile_billed = data.stockpile_billed
    } else if (typeof data.stockpile_billed === "number") {
      stockpile_billed = new Prisma.Decimal(data.stockpile_billed)
    } else {
      stockpile_billed = new Prisma.Decimal(data.stockpile_billed ?? 0)
    }

    const row: ProjectPayItemRow = {
      id,
      project_id: data.project_id,
      pay_item_id: data.pay_item_id,
      contracted_quantity,
      unit_rate,
      is_original: data.is_original ?? true,
      stockpile_billed,
      notes: data.notes ?? null,
      begin_station: data.begin_station ?? null,
      end_station: data.end_station ?? null,
      status: data.status ?? null,
      locate_ticket: data.locate_ticket ?? null,
      LF_RT: data.LF_RT ?? null,
      onsite_review: data.onsite_review ?? null,
    }
    projectPayItems.set(id, row)
    return row
  }

  // Helper to clear project pay items
  ;(mockPrisma as any).clearProjectPayItems = () => {
    projectPayItems.clear()
  }

  // Helper to get all project pay items
  ;(mockPrisma as any).getProjectPayItems = () => {
    return Array.from(projectPayItems.values())
  }
}

function projectPayItem<T extends Record<string, any>>(
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
