import { MockPrisma } from "./mockPrisma"
import { Prisma } from "@prisma/client"

type ProjectPhaseRow = {
  id: number
  project_id: number
  sort_order: number
  name: string
  locate_ticket: string | null
  date_created: Date | null
  ready_to_work_date: Date | null
  onsite_review: boolean
  surveyed: boolean
  status: string | null
  status_date: Date | null
  notes: string | null
  created_at: Date
  updated_at: Date
}

type ProjectPhaseLineRow = {
  id: number
  phase_id: number
  project_pay_item_id: number
  phase_quantity: Prisma.Decimal
  sort_order: number
  line_description: string | null
}

/**
 * Mock `project_phase` + nested `project_phase_line` for ProjectPhaseService tests.
 */
export function extendMockPrismaWithProjectPhase(mockPrisma: MockPrisma) {
  const phaseById = new Map<number, ProjectPhaseRow>()
  const lineById = new Map<number, ProjectPhaseLineRow>()
  let nextPhaseId = 1
  let nextLineId = 1
  const now = () => new Date()

  mockPrisma.project_phase = {
    deleteMany: async ({ where }: { where?: { project_id?: number } } = {}) => {
      const pid = where?.project_id
      if (pid === undefined) {
        return { count: 0 }
      }
      let count = 0
      for (const [id, ph] of [...phaseById.entries()]) {
        if (ph.project_id === pid) {
          for (const [lid, line] of [...lineById.entries()]) {
            if (line.phase_id === id) lineById.delete(lid)
          }
          phaseById.delete(id)
          count++
        }
      }
      return { count }
    },

    create: async ({ data }: { data: Record<string, unknown> }): Promise<ProjectPhaseRow & { lines: ProjectPhaseLineRow[] }> => {
      const id = nextPhaseId++
      const t = now()
      const phase: ProjectPhaseRow = {
        id,
        project_id: data.project_id as number,
        sort_order: (data.sort_order as number) ?? 0,
        name: data.name as string,
        locate_ticket: (data.locate_ticket as string | null) ?? null,
        date_created: (data.date_created as Date | null) ?? null,
        ready_to_work_date: (data.ready_to_work_date as Date | null) ?? null,
        onsite_review: Boolean(data.onsite_review),
        surveyed: Boolean(data.surveyed),
        status: (data.status as string | null) ?? null,
        status_date: (data.status_date as Date | null) ?? null,
        notes: (data.notes as string | null) ?? null,
        created_at: t,
        updated_at: t,
      }
      phaseById.set(id, phase)
      const nested = data.lines as { create?: Array<Record<string, unknown>> } | undefined
      const creates = nested?.create ?? []
      const lineRows: ProjectPhaseLineRow[] = []
      for (const lc of creates) {
        const lid = nextLineId++
        const qty = lc.phase_quantity as Prisma.Decimal
        const row: ProjectPhaseLineRow = {
          id: lid,
          phase_id: id,
          project_pay_item_id: lc.project_pay_item_id as number,
          phase_quantity: qty instanceof Prisma.Decimal ? qty : new Prisma.Decimal(qty as number | string),
          sort_order: (lc.sort_order as number) ?? 0,
          line_description: (lc.line_description as string | null | undefined) ?? null,
        }
        lineById.set(lid, row)
        lineRows.push(row)
      }
      return { ...phase, lines: lineRows }
    },

    findMany: async ({
      where,
      include,
      orderBy,
    }: {
      where?: { project_id?: number }
      include?: { lines?: { orderBy?: Record<string, string> } }
      orderBy?: Array<Record<string, string>> | Record<string, string>
    } = {}) => {
      let rows = [...phaseById.values()]
      if (where?.project_id !== undefined) {
        rows = rows.filter((p) => p.project_id === where.project_id)
      }
      if (orderBy) {
        const orders = Array.isArray(orderBy) ? orderBy : [orderBy]
        rows = rows.slice()
        rows.sort((a, b) => {
          for (const ob of orders) {
            const key = Object.keys(ob)[0]
            const dir = ob[key] === "desc" ? -1 : 1
            const av = (a as unknown as Record<string, number>)[key]
            const bv = (b as unknown as Record<string, number>)[key]
            if (av < bv) return -1 * dir
            if (av > bv) return 1 * dir
          }
          return 0
        })
      }
      if (!include?.lines) {
        return rows
      }
      const lineOrder = include.lines.orderBy?.sort_order === "desc" ? -1 : 1
      return rows.map((ph) => {
        const phaseLines = [...lineById.values()]
          .filter((l) => l.phase_id === ph.id)
          .sort((a, b) => (a.sort_order < b.sort_order ? -1 : a.sort_order > b.sort_order ? 1 : 0) * lineOrder)
        return { ...ph, lines: phaseLines }
      })
    },
  }
}
