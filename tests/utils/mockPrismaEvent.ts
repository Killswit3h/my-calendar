import { MockPrisma } from "./mockPrisma"
import type { Prisma } from "@prisma/client"

type EventRow = {
  id: number
  project_id: number
  scope_of_work_id: number
  payment_type_id: number
  invoice_id: number | null
  start_time: Date
  end_time: Date
  is_day_shift: boolean
  location: string | null
  notes: string | null
  created_at: Date
  updated_at: Date
}

function toDate(v: Date | string): Date {
  return v instanceof Date ? v : new Date(v)
}

function applySelect<T extends Record<string, unknown>>(
  row: T,
  select?: Record<string, boolean>
): Partial<T> {
  if (!select) return { ...row }
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(select)) {
    if (select[key] === true && key in row) {
      out[key] = row[key]
    }
  }
  return out as Partial<T>
}

/**
 * Extends MockPrisma with event model support (full CRUD) and minimal
 * project, scope_of_work, payment_type, invoice delegates for FK validation.
 */
export function extendMockPrismaWithEvent(mockPrisma: MockPrisma): void {
  const events = new Map<number, EventRow>()
  const projects = new Map<number, { id: number }>()
  const scopeOfWorks = new Map<number, { id: number }>()
  const paymentTypes = new Map<number, { id: number }>()
  const invoices = new Map<number, { id: number }>()

  const randomId = () => Math.floor(Math.random() * 1000000) + 1

  const ext = mockPrisma as MockPrisma & {
    addProject?: (d: { id?: number }) => { id: number }
    addScopeOfWork?: (d: { id?: number }) => { id: number }
    addPaymentType?: (d: { id?: number }) => { id: number }
    addInvoice?: (d: { id?: number }) => { id: number }
    addEvent?: (d: Partial<EventRow> & { id?: number }) => EventRow
  }

  ext.addProject = (data: { id?: number }) => {
    const id = data.id ?? randomId()
    projects.set(id, { id })
    return { id }
  }
  ext.addScopeOfWork = (data: { id?: number }) => {
    const id = data.id ?? randomId()
    scopeOfWorks.set(id, { id })
    return { id }
  }
  ext.addPaymentType = (data: { id?: number }) => {
    const id = data.id ?? randomId()
    paymentTypes.set(id, { id })
    return { id }
  }
  ext.addInvoice = (data: { id?: number }) => {
    const id = data.id ?? randomId()
    invoices.set(id, { id })
    return { id }
  }

  function resolveProjectId(data: Record<string, unknown>): number {
    if (typeof data.project_id === "number") return data.project_id
    const conn = data.project as { connect?: { id: number } } | undefined
    if (conn?.connect?.id !== undefined) return conn.connect.id
    throw new Error("project_id is required")
  }
  function resolveScopeOfWorkId(data: Record<string, unknown>): number {
    if (typeof data.scope_of_work_id === "number") return data.scope_of_work_id
    const conn = data.scope_of_work as { connect?: { id: number } } | undefined
    if (conn?.connect?.id !== undefined) return conn.connect.id
    throw new Error("scope_of_work_id is required")
  }
  function resolvePaymentTypeId(data: Record<string, unknown>): number {
    if (typeof data.payment_type_id === "number") return data.payment_type_id
    const conn = data.payment_type as { connect?: { id: number } } | undefined
    if (conn?.connect?.id !== undefined) return conn.connect.id
    throw new Error("payment_type_id is required")
  }
  function resolveInvoiceId(data: Record<string, unknown>): number | null | undefined {
    if (data.invoice_id === null) return null
    const inv = data.invoice as { connect?: { id: number }; disconnect?: boolean } | undefined
    if (inv?.disconnect) return null
    if (typeof data.invoice_id === "number") return data.invoice_id
    if (inv?.connect?.id !== undefined) return inv.connect.id
    return undefined
  }

  const now = new Date()

  mockPrisma.event = {
    findMany: async (args: {
      where?: Prisma.eventWhereInput
      include?: Prisma.eventInclude
      orderBy?: Prisma.eventOrderByWithRelationInput
      take?: number
      skip?: number
    } = {}) => {
      let rows = Array.from(events.values())
      const { where } = args
      if (where?.id !== undefined) {
        if (typeof where.id === "number") {
          rows = rows.filter((r) => r.id === where.id)
        } else if (where.id.equals !== undefined) {
          rows = rows.filter((r) => r.id === where.id.equals)
        } else if (where.id.in) {
          const set = new Set(where.id.in)
          rows = rows.filter((r) => set.has(r.id))
        }
      }
      if (where?.project_id !== undefined) rows = rows.filter((r) => r.project_id === where.project_id)
      if (where?.scope_of_work_id !== undefined)
        rows = rows.filter((r) => r.scope_of_work_id === where.scope_of_work_id)
      if (where?.payment_type_id !== undefined)
        rows = rows.filter((r) => r.payment_type_id === where.payment_type_id)
      if (where?.invoice_id !== undefined) {
        if (where.invoice_id === null) {
          rows = rows.filter((r) => r.invoice_id === null)
        } else {
          rows = rows.filter((r) => r.invoice_id === where.invoice_id)
        }
      }
      if (args.orderBy) {
        rows = rows.slice()
        const key = Object.keys(args.orderBy)[0] as keyof EventRow
        const dir = (args.orderBy as Record<string, string>)[key] === "desc" ? -1 : 1
        rows.sort((a, b) => {
          const aVal = a[key] as number | Date | string
          const bVal = b[key] as number | Date | string
          if (aVal < bVal) return -1 * dir
          if (aVal > bVal) return 1 * dir
          return 0
        })
      }
      if (args.skip) rows = rows.slice(args.skip)
      if (args.take !== undefined) rows = rows.slice(0, args.take)
      const include = args.include
      return rows.map((row) => {
        const base = { ...row }
        if (!include) return base
        const out: Record<string, unknown> = { ...base }
        if (include.project) out.project = projects.get(row.project_id) ?? null
        if (include.scope_of_work) out.scope_of_work = scopeOfWorks.get(row.scope_of_work_id) ?? null
        if (include.payment_type) out.payment_type = paymentTypes.get(row.payment_type_id) ?? null
        if (include.invoice) out.invoice = row.invoice_id != null ? invoices.get(row.invoice_id) ?? null : null
        return out as EventRow & { project?: unknown; scope_of_work?: unknown; payment_type?: unknown; invoice?: unknown }
      })
    },

    findUnique: async (args: { where: Prisma.eventWhereUniqueInput; include?: Prisma.eventInclude }) => {
      const id = args.where.id
      const row = id != null ? events.get(id) ?? null : null
      if (!row) return null
      const include = args.include
      if (!include) return { ...row }
      const out: Record<string, unknown> = { ...row }
      if (include.project) out.project = projects.get(row.project_id) ?? null
      if (include.scope_of_work) out.scope_of_work = scopeOfWorks.get(row.scope_of_work_id) ?? null
      if (include.payment_type) out.payment_type = paymentTypes.get(row.payment_type_id) ?? null
      if (include.invoice) out.invoice = row.invoice_id != null ? invoices.get(row.invoice_id) ?? null : null
      return out as EventRow & { project?: unknown; scope_of_work?: unknown; payment_type?: unknown; invoice?: unknown }
    },

    findFirst: async (args: { where?: Prisma.eventWhereInput; include?: Prisma.eventInclude }) => {
      let rows = Array.from(events.values())
      const { where } = args
      if (where?.project_id !== undefined) rows = rows.filter((r) => r.project_id === where.project_id)
      if (where?.scope_of_work_id !== undefined)
        rows = rows.filter((r) => r.scope_of_work_id === where.scope_of_work_id)
      if (where?.payment_type_id !== undefined)
        rows = rows.filter((r) => r.payment_type_id === where.payment_type_id)
      if (where?.invoice_id !== undefined) {
        if (where.invoice_id === null) rows = rows.filter((r) => r.invoice_id === null)
        else rows = rows.filter((r) => r.invoice_id === where.invoice_id)
      }
      const row = rows[0] ?? null
      if (!row) return null
      const include = args.include
      if (!include) return { ...row }
      const out: Record<string, unknown> = { ...row }
      if (include.project) out.project = projects.get(row.project_id) ?? null
      if (include.scope_of_work) out.scope_of_work = scopeOfWorks.get(row.scope_of_work_id) ?? null
      if (include.payment_type) out.payment_type = paymentTypes.get(row.payment_type_id) ?? null
      if (include.invoice) out.invoice = row.invoice_id != null ? invoices.get(row.invoice_id) ?? null : null
      return out as EventRow & { project?: unknown; scope_of_work?: unknown; payment_type?: unknown; invoice?: unknown }
    },

    create: async (args: { data: Prisma.eventCreateInput }) => {
      const data = args.data as Record<string, unknown>
      const id = (data.id as number) ?? randomId()
      const project_id = resolveProjectId(data)
      const scope_of_work_id = resolveScopeOfWorkId(data)
      const payment_type_id = resolvePaymentTypeId(data)
      const invoice_id = resolveInvoiceId(data) ?? null
      const start_time = toDate((data.start_time as Date) ?? now)
      const end_time = toDate((data.end_time as Date) ?? now)
      const is_day_shift = typeof data.is_day_shift === "boolean" ? data.is_day_shift : true
      const location = data.location != null && data.location !== "" ? String(data.location) : null
      const notes = data.notes != null && data.notes !== "" ? String(data.notes) : null
      const created_at = now
      const updated_at = now
      const row: EventRow = {
        id,
        project_id,
        scope_of_work_id,
        payment_type_id,
        invoice_id,
        start_time,
        end_time,
        is_day_shift,
        location,
        notes,
        created_at,
        updated_at,
      }
      events.set(id, row)
      return { ...row }
    },

    update: async (args: { where: Prisma.eventWhereUniqueInput; data: Prisma.eventUpdateInput }) => {
      const id = args.where.id
      const row = events.get(id as number)
      if (!row) {
        const P = await import("@prisma/client")
        throw new P.Prisma.PrismaClientKnownRequestError("Record not found", { code: "P2025", clientVersion: "test" })
      }
      const data = args.data as Record<string, unknown>
      const project_id = data.project_id !== undefined ? resolveProjectId(data) : row.project_id
      const scope_of_work_id = data.scope_of_work_id !== undefined ? resolveScopeOfWorkId(data) : row.scope_of_work_id
      const payment_type_id = data.payment_type_id !== undefined ? resolvePaymentTypeId(data) : row.payment_type_id
      let invoice_id = row.invoice_id
      if (data.invoice !== undefined) {
        const inv = data.invoice as { connect?: { id: number }; disconnect?: boolean }
        if (inv?.disconnect) invoice_id = null
        else {
          const resolved = resolveInvoiceId(data)
          if (resolved !== undefined) invoice_id = resolved
        }
      } else if (data.invoice_id !== undefined) {
        invoice_id = resolveInvoiceId(data) ?? null
      }
      const start_time = data.start_time !== undefined ? toDate(data.start_time as Date | string) : row.start_time
      const end_time = data.end_time !== undefined ? toDate(data.end_time as Date | string) : row.end_time
      const is_day_shift = data.is_day_shift !== undefined ? (data.is_day_shift as boolean) : row.is_day_shift
      const location = data.location !== undefined ? (data.location != null && data.location !== "" ? String(data.location) : null) : row.location
      const notes = data.notes !== undefined ? (data.notes != null && data.notes !== "" ? String(data.notes) : null) : row.notes
      const updated_at = new Date()
      const updated: EventRow = {
        ...row,
        project_id,
        scope_of_work_id,
        payment_type_id,
        invoice_id,
        start_time,
        end_time,
        is_day_shift,
        location,
        notes,
        updated_at,
      }
      events.set(row.id, updated)
      return { ...updated }
    },

    delete: async (args: { where: Prisma.eventWhereUniqueInput }) => {
      const id = args.where.id
      const row = events.get(id as number)
      if (!row) {
        const P = await import("@prisma/client")
        throw new P.Prisma.PrismaClientKnownRequestError("Record not found", { code: "P2025", clientVersion: "test" })
      }
      events.delete(row.id)
      return { ...row }
    },

    count: async (args: { where?: Prisma.eventWhereInput } = {}) => {
      const where = args.where
      if (!where) return events.size
      let rows = Array.from(events.values())
      if (where.project_id !== undefined) rows = rows.filter((r) => r.project_id === where.project_id)
      if (where.scope_of_work_id !== undefined) rows = rows.filter((r) => r.scope_of_work_id === where.scope_of_work_id)
      if (where.payment_type_id !== undefined) rows = rows.filter((r) => r.payment_type_id === where.payment_type_id)
      if (where.invoice_id !== undefined) {
        if (where.invoice_id === null) rows = rows.filter((r) => r.invoice_id === null)
        else rows = rows.filter((r) => r.invoice_id === where.invoice_id)
      }
      return rows.length
    },
  }

  mockPrisma.project = {
    findUnique: async (args: { where: { id: number }; select?: Record<string, boolean> }) => {
      const p = projects.get(args.where.id) ?? null
      return p ? applySelect(p as Record<string, unknown>, args.select) : null
    },
  } as Prisma.Delegate<"project">

  mockPrisma.scope_of_work = {
    findUnique: async (args: { where: { id: number }; select?: Record<string, boolean> }) => {
      const s = scopeOfWorks.get(args.where.id) ?? null
      return s ? applySelect(s as Record<string, unknown>, args.select) : null
    },
  } as Prisma.Delegate<"scope_of_work">

  mockPrisma.payment_type = {
    findUnique: async (args: { where: { id: number }; select?: Record<string, boolean> }) => {
      const pt = paymentTypes.get(args.where.id) ?? null
      return pt ? applySelect(pt as Record<string, unknown>, args.select) : null
    },
  } as Prisma.Delegate<"payment_type">

  mockPrisma.invoice = {
    findUnique: async (args: { where: { id: number }; select?: Record<string, boolean> }) => {
      const inv = invoices.get(args.where.id) ?? null
      return inv ? applySelect(inv as Record<string, unknown>, args.select) : null
    },
  } as Prisma.Delegate<"invoice">

  ext.addEvent = (data: Partial<EventRow> & { id?: number }) => {
    const id = data.id ?? randomId()
    const start_time = data.start_time ? toDate(data.start_time) : now
    const end_time = data.end_time ? toDate(data.end_time) : now
    const row: EventRow = {
      id,
      project_id: data.project_id ?? 1,
      scope_of_work_id: data.scope_of_work_id ?? 1,
      payment_type_id: data.payment_type_id ?? 1,
      invoice_id: data.invoice_id ?? null,
      start_time,
      end_time,
      is_day_shift: data.is_day_shift ?? true,
      location: data.location ?? null,
      notes: data.notes ?? null,
      created_at: data.created_at ?? now,
      updated_at: data.updated_at ?? now,
    }
    events.set(id, row)
    return row
  }
}
