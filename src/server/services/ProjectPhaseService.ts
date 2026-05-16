import { Prisma } from "@prisma/client"
import { getPrisma } from "@/lib/db"
import { NotFoundError, ValidationError } from "../base/types"
import { ProjectRepository } from "../repositories/ProjectRepository"
import { ProjectPayItemRepository } from "../repositories/ProjectPayItemRepository"
import { ProjectPhaseRepository } from "../repositories/ProjectPhaseRepository"

const MAX_LINE_DESCRIPTION_LEN = 2000

export type ProjectPhaseLineInput = {
  project_pay_item_id: number
  phase_quantity: Prisma.Decimal
  sort_order: number
  line_description: string | null
}

export type ProjectPhaseInput = {
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
  lines: ProjectPhaseLineInput[]
}

export type ReplaceProjectPhasesPayload = {
  phases: ProjectPhaseInput[]
}

/**
 * Pay application phases: load and full replace per project.
 */
export class ProjectPhaseService {
  private phaseRepository: ProjectPhaseRepository
  private projectRepository: ProjectRepository
  private projectPayItemRepository: ProjectPayItemRepository

  constructor() {
    this.phaseRepository = new ProjectPhaseRepository()
    this.projectRepository = new ProjectRepository()
    this.projectPayItemRepository = new ProjectPayItemRepository()
  }

  private parseOptionalDateOnly(value: unknown, fieldName: string): Date | null {
    if (value === undefined || value === null) return null
    if (typeof value !== "string") {
      throw new ValidationError(`${fieldName} must be a date string or null`)
    }
    const trimmed = value.trim()
    if (!trimmed) return null
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
    if (!m) {
      throw new ValidationError(`${fieldName} must be YYYY-MM-DD`)
    }
    const y = Number(m[1])
    const mo = Number(m[2])
    const d = Number(m[3])
    const dt = new Date(Date.UTC(y, mo - 1, d))
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) {
      throw new ValidationError(`${fieldName} must be a valid calendar date`)
    }
    return dt
  }

  private normalizeDecimal(
    value: unknown,
    fieldName: string,
  ): Prisma.Decimal {
    if (value === undefined || value === null) {
      throw new ValidationError(`${fieldName} is required`)
    }
    let dec: Prisma.Decimal
    try {
      dec = new Prisma.Decimal(value as string | number | Prisma.Decimal)
    } catch {
      throw new ValidationError(`${fieldName} must be a finite decimal`)
    }
    if (!dec.isFinite() || dec.isNegative()) {
      throw new ValidationError(`${fieldName} must be a non-negative finite number`)
    }
    return dec
  }

  private validatePhaseInput(raw: unknown, index: number): ProjectPhaseInput {
    if (raw === null || typeof raw !== "object") {
      throw new ValidationError(`phases[${index}] must be an object`)
    }
    const o = raw as Record<string, unknown>
    const nameRaw = o.name
    if (typeof nameRaw !== "string" || !nameRaw.trim()) {
      throw new ValidationError(`phases[${index}].name is required`)
    }
    const name = nameRaw.trim()
    if (name.length > 255) {
      throw new ValidationError(`phases[${index}].name must be at most 255 characters`)
    }
    const sortOrder = o.sort_order
    if (typeof sortOrder !== "number" || !Number.isInteger(sortOrder) || sortOrder < 0) {
      throw new ValidationError(`phases[${index}].sort_order must be a non-negative integer`)
    }
    const linesRaw = o.lines
    if (!Array.isArray(linesRaw)) {
      throw new ValidationError(`phases[${index}].lines must be an array`)
    }
    const lines: ProjectPhaseLineInput[] = []
    for (let j = 0; j < linesRaw.length; j++) {
      const lr = linesRaw[j]
      if (lr === null || typeof lr !== "object") {
        throw new ValidationError(`phases[${index}].lines[${j}] must be an object`)
      }
      const line = lr as Record<string, unknown>
      const ppi = line.project_pay_item_id
      if (typeof ppi !== "number" || !Number.isInteger(ppi) || ppi <= 0) {
        throw new ValidationError(
          `phases[${index}].lines[${j}].project_pay_item_id must be a positive integer`,
        )
      }
      const lSort = line.sort_order
      if (typeof lSort !== "number" || !Number.isInteger(lSort) || lSort < 0) {
        throw new ValidationError(
          `phases[${index}].lines[${j}].sort_order must be a non-negative integer`,
        )
      }
      const qty = this.normalizeDecimal(line.phase_quantity, `phases[${index}].lines[${j}].phase_quantity`)
      let lineDesc: string | null = null
      if (line.line_description !== undefined && line.line_description !== null) {
        if (typeof line.line_description !== "string") {
          throw new ValidationError(
            `phases[${index}].lines[${j}].line_description must be a string or null`,
          )
        }
        const t = line.line_description.trim()
        if (t.length > MAX_LINE_DESCRIPTION_LEN) {
          throw new ValidationError(
            `phases[${index}].lines[${j}].line_description must be at most ${MAX_LINE_DESCRIPTION_LEN} characters`,
          )
        }
        lineDesc = t || null
      }
      lines.push({
        project_pay_item_id: ppi,
        phase_quantity: qty,
        sort_order: lSort,
        line_description: lineDesc,
      })
    }
    const seenInPhase = new Set<number>()
    for (const line of lines) {
      if (seenInPhase.has(line.project_pay_item_id)) {
        throw new ValidationError(
          `phases[${index}] contains duplicate project_pay_item_id ${line.project_pay_item_id}; each pay item may appear once per phase`,
        )
      }
      seenInPhase.add(line.project_pay_item_id)
    }
    let locate: string | null = null
    if (o.locate_ticket !== undefined && o.locate_ticket !== null) {
      if (typeof o.locate_ticket !== "string") {
        throw new ValidationError(`phases[${index}].locate_ticket must be a string or null`)
      }
      const lt = o.locate_ticket.trim()
      if (lt.length > 255) {
        throw new ValidationError(`phases[${index}].locate_ticket must be at most 255 characters`)
      }
      locate = lt || null
    }
    let status: string | null = null
    if (o.status !== undefined && o.status !== null) {
      if (typeof o.status !== "string") {
        throw new ValidationError(`phases[${index}].status must be a string or null`)
      }
      const st = o.status.trim()
      if (st.length > 255) {
        throw new ValidationError(`phases[${index}].status must be at most 255 characters`)
      }
      status = st || null
    }
    let notes: string | null = null
    if (o.notes !== undefined && o.notes !== null) {
      if (typeof o.notes !== "string") {
        throw new ValidationError(`phases[${index}].notes must be a string or null`)
      }
      notes = o.notes.trim() || null
    }

    return {
      sort_order: sortOrder,
      name,
      locate_ticket: locate,
      date_created:
        o.date_created === undefined || o.date_created === null
          ? null
          : this.parseOptionalDateOnly(o.date_created, `phases[${index}].date_created`),
      ready_to_work_date:
        o.ready_to_work_date === undefined || o.ready_to_work_date === null
          ? null
          : this.parseOptionalDateOnly(
              o.ready_to_work_date,
              `phases[${index}].ready_to_work_date`,
            ),
      onsite_review: Boolean(o.onsite_review),
      surveyed: Boolean(o.surveyed),
      status,
      status_date:
        o.status_date === undefined || o.status_date === null
          ? null
          : this.parseOptionalDateOnly(o.status_date, `phases[${index}].status_date`),
      notes,
      lines,
    }
  }

  private parseReplacePayload(body: unknown): ReplaceProjectPhasesPayload {
    if (body === null || typeof body !== "object") {
      throw new ValidationError("Request body must be a JSON object")
    }
    const phasesRaw = (body as Record<string, unknown>).phases
    if (!Array.isArray(phasesRaw)) {
      throw new ValidationError("phases must be an array")
    }
    const phases = phasesRaw.map((p, i) => this.validatePhaseInput(p, i))
    return { phases }
  }

  async listForProject(projectId: number) {
    const project = await this.projectRepository.findUnique({ id: projectId })
    if (!project) {
      throw new NotFoundError("Project not found")
    }
    return this.phaseRepository.findWithLinesByProjectId(projectId)
  }

  async replaceForProject(projectId: number, body: unknown) {
    const project = await this.projectRepository.findUnique({ id: projectId })
    if (!project) {
      throw new NotFoundError("Project not found")
    }
    const { phases } = this.parseReplacePayload(body)
    const allPpiIds = phases.flatMap((p) => p.lines.map((l) => l.project_pay_item_id))
    const uniquePpiIds = [...new Set(allPpiIds)]
    if (uniquePpiIds.length > 0) {
      const rows = await this.projectPayItemRepository.findMany({
        id: { in: uniquePpiIds },
        project_id: projectId,
      } as Prisma.project_pay_itemWhereInput)
      if (rows.length !== uniquePpiIds.length) {
        throw new ValidationError(
          "One or more project_pay_item_id values are missing or do not belong to this project",
        )
      }
      const contractedByPpi = new Map(
        rows.map((r) => [r.id, r.contracted_quantity] as const),
      )
      const sumByPpi = new Map<number, Prisma.Decimal>()
      for (const ph of phases) {
        for (const line of ph.lines) {
          const prev = sumByPpi.get(line.project_pay_item_id) ?? new Prisma.Decimal(0)
          sumByPpi.set(line.project_pay_item_id, prev.plus(line.phase_quantity))
        }
      }
      for (const [ppiId, sum] of sumByPpi) {
        const contracted = contractedByPpi.get(ppiId)
        if (!contracted) continue
        if (sum.gt(contracted)) {
          throw new ValidationError(
            `Phase quantities for project pay item id ${ppiId} total ${sum.toString()} which exceeds contracted quantity ${contracted.toString()}`,
          )
        }
      }
    }

    const prisma = await getPrisma()
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await this.phaseRepository.deleteAllForProject(projectId, tx)
      for (const ph of phases) {
        await tx.project_phase.create({
          data: {
            project_id: projectId,
            sort_order: ph.sort_order,
            name: ph.name,
            locate_ticket: ph.locate_ticket,
            date_created: ph.date_created,
            ready_to_work_date: ph.ready_to_work_date,
            onsite_review: ph.onsite_review,
            surveyed: ph.surveyed,
            status: ph.status,
            status_date: ph.status_date,
            notes: ph.notes,
            lines: {
              create: ph.lines.map((l) => ({
                project_pay_item_id: l.project_pay_item_id,
                phase_quantity:
                  l.phase_quantity instanceof Prisma.Decimal
                    ? l.phase_quantity
                    : new Prisma.Decimal(l.phase_quantity),
                sort_order: l.sort_order,
                line_description: l.line_description,
              })),
            },
          },
        })
      }
    })

    return this.phaseRepository.findWithLinesByProjectId(projectId)
  }
}
