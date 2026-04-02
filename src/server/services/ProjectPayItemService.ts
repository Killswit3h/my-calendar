import { Prisma, PrismaClient } from "@prisma/client"
import { AbstractService } from "../base/AbstractService"
import { ProjectPayItemRepository } from "../repositories/ProjectPayItemRepository"
import { ProjectRepository } from "../repositories/ProjectRepository"
import { PayItemRepository } from "../repositories/PayItemRepository"
import { BusinessLogicError, ValidationError } from "../base/types"
import { getPrisma } from "@/lib/db"
import type { PaginationOptions } from "../base/types"

/**
 * Project Pay Item Service
 * Provides business logic for project pay item operations
 */
export class ProjectPayItemService extends AbstractService<
  Prisma.project_pay_itemGetPayload<{}>,
  Prisma.project_pay_itemCreateInput,
  Prisma.project_pay_itemUpdateInput,
  Prisma.project_pay_itemWhereUniqueInput,
  ProjectPayItemRepository
> {
  protected repository: ProjectPayItemRepository
  private projectRepository: ProjectRepository
  private payItemRepository: PayItemRepository

  constructor() {
    super()
    this.repository = new ProjectPayItemRepository()
    this.projectRepository = new ProjectRepository()
    this.payItemRepository = new PayItemRepository()
  }

  private parseOptionalDate(value: unknown, fieldName: string): Date | undefined {
    if (value === undefined || value === null) return undefined
    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) {
        throw new ValidationError(`${fieldName} must be a valid date`)
      }
      return value
    }
    if (typeof value === "string") {
      const trimmed = value.trim()
      if (!trimmed) return undefined
      const parsed = new Date(trimmed)
      if (Number.isNaN(parsed.getTime())) {
        throw new ValidationError(`${fieldName} must be a valid date`)
      }
      return parsed
    }
    throw new ValidationError(`${fieldName} must be a date or ISO string`)
  }

  /**
   * List project pay items with optional expand options
   * Supports ?expanded=true to include relations
   */
  async listWithExpand(
    filters?: Prisma.project_pay_itemWhereInput,
    expandOptions?: { include?: Prisma.project_pay_itemInclude },
    pagination?: PaginationOptions,
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<Prisma.project_pay_itemGetPayload<{}>[]> {
    if (expandOptions?.include) {
      return this.repository.findMany(filters, expandOptions, client)
    }
    return this.list(filters, pagination, client)
  }

  /**
   * Validate project pay item data
   */
  protected async validate(
    data: Prisma.project_pay_itemCreateInput | Prisma.project_pay_itemUpdateInput,
    isUpdate: boolean = false
  ): Promise<void> {
    const projectId = this.getProjectIdFromData(data)

    // Project ID validation (required, must reference valid project if provided)
    if (projectId !== undefined && projectId !== null) {
      if (
        typeof projectId !== "number" ||
        !Number.isInteger(projectId) ||
        projectId <= 0
      ) {
        throw new ValidationError("project_id must be a positive integer")
      }
    } else if (!isUpdate) {
      throw new ValidationError("project_id is required")
    }

    // Pay Item ID validation (required on create unless pay_item_number is provided)
    const payItemId = this.getPayItemIdFromData(data)
    const raw = data as Record<string, unknown>
    const payItemNumberRaw = raw.pay_item_number
    const payItemNumber =
      typeof payItemNumberRaw === "string" ? payItemNumberRaw.trim() : ""

    if (payItemId !== undefined && payItemId !== null) {
      if (
        typeof payItemId !== "number" ||
        !Number.isInteger(payItemId) ||
        payItemId <= 0
      ) {
        throw new ValidationError("pay_item_id must be a positive integer")
      }
    } else if (!isUpdate) {
      if (!payItemNumber) {
        throw new ValidationError("pay_item_id or pay_item_number is required")
      }
      if (payItemNumber.length > 255) {
        throw new ValidationError("pay_item_number must be 255 characters or less")
      }
    } else if (payItemNumberRaw !== undefined && payItemNumberRaw !== null) {
      if (typeof payItemNumberRaw !== "string" || !payItemNumberRaw.trim()) {
        throw new ValidationError("pay_item_number must be a non-empty string when provided")
      }
    }

    // Contracted quantity validation
    if (data.contracted_quantity !== undefined) {
      let decimalValue: Prisma.Decimal

      if (data.contracted_quantity instanceof Prisma.Decimal) {
        decimalValue = data.contracted_quantity
      } else if (typeof data.contracted_quantity === "number") {
        if (!Number.isFinite(data.contracted_quantity)) {
          throw new ValidationError("contracted_quantity must be a finite number")
        }
        decimalValue = new Prisma.Decimal(data.contracted_quantity)
      } else if (typeof data.contracted_quantity === "string") {
        try {
          decimalValue = new Prisma.Decimal(data.contracted_quantity.trim())
        } catch {
          throw new ValidationError("contracted_quantity must be a valid number")
        }
      } else {
        throw new ValidationError("contracted_quantity must be a number or Decimal")
      }

      if (decimalValue.isNaN()) {
        throw new ValidationError("contracted_quantity must be a valid number")
      }

      if (decimalValue.lt(0)) {
        throw new ValidationError("contracted_quantity must be non-negative")
      }
    } else if (!isUpdate) {
      throw new ValidationError("contracted_quantity is required")
    }

    // Unit rate validation
    if (data.unit_rate !== undefined) {
      let decimalValue: Prisma.Decimal

      if (data.unit_rate instanceof Prisma.Decimal) {
        decimalValue = data.unit_rate
      } else if (typeof data.unit_rate === "number") {
        if (!Number.isFinite(data.unit_rate)) {
          throw new ValidationError("unit_rate must be a finite number")
        }
        decimalValue = new Prisma.Decimal(data.unit_rate)
      } else if (typeof data.unit_rate === "string") {
        try {
          decimalValue = new Prisma.Decimal(data.unit_rate.trim())
        } catch {
          throw new ValidationError("unit_rate must be a valid number")
        }
      } else {
        throw new ValidationError("unit_rate must be a number or Decimal")
      }

      if (decimalValue.isNaN()) {
        throw new ValidationError("unit_rate must be a valid number")
      }

      if (decimalValue.lt(0)) {
        throw new ValidationError("unit_rate must be non-negative")
      }
    } else if (!isUpdate) {
      throw new ValidationError("unit_rate is required")
    }

    // Stockpile billed validation (optional, non-negative)
    if (data.stockpile_billed !== undefined && data.stockpile_billed !== null) {
      let decimalValue: Prisma.Decimal

      if (data.stockpile_billed instanceof Prisma.Decimal) {
        decimalValue = data.stockpile_billed
      } else if (typeof data.stockpile_billed === "number") {
        if (!Number.isFinite(data.stockpile_billed)) {
          throw new ValidationError("stockpile_billed must be a finite number")
        }
        decimalValue = new Prisma.Decimal(data.stockpile_billed)
      } else if (typeof data.stockpile_billed === "string") {
        try {
          decimalValue = new Prisma.Decimal(data.stockpile_billed.trim())
        } catch {
          throw new ValidationError("stockpile_billed must be a valid number")
        }
      } else {
        throw new ValidationError("stockpile_billed must be a number or Decimal")
      }

      if (decimalValue.isNaN()) {
        throw new ValidationError("stockpile_billed must be a valid number")
      }

      if (decimalValue.lt(0)) {
        throw new ValidationError("stockpile_billed must be non-negative")
      }
    }

    // Is original validation (optional boolean)
    if (data.is_original !== undefined && data.is_original !== null) {
      if (typeof data.is_original !== "boolean") {
        throw new ValidationError("is_original must be a boolean")
      }
    }

    if ((data as any).surveyed !== undefined && (data as any).surveyed !== null) {
      if (typeof (data as any).surveyed !== "boolean") {
        throw new ValidationError("surveyed must be a boolean")
      }
    }

    this.parseOptionalDate((data as any).ready_to_work_date, "ready_to_work_date")
    this.parseOptionalDate((data as any).status_date, "status_date")

    // Optional string fields validation (VarChar fields - max 255)
    const varcharFields = [
      "begin_station",
      "end_station",
      "status",
      "locate_ticket",
      "LF_RT",
      "onsite_review",
    ] as const

    for (const field of varcharFields) {
      if (data[field] !== undefined && data[field] !== null) {
        if (typeof data[field] !== "string") {
          throw new ValidationError(`${field} must be a string`)
        }

        const trimmed = (data[field] as string).trim()
        if (trimmed.length > 255) {
          throw new ValidationError(`${field} must be 255 characters or less`)
        }
      }
    }

    // Notes validation (Text field - no length limit but should trim)
    if (data.notes !== undefined && data.notes !== null) {
      if (typeof data.notes !== "string") {
        throw new ValidationError("notes must be a string")
      }
    }

    const rawLine = data as Record<string, unknown>
    if (rawLine.line_item_number !== undefined && rawLine.line_item_number !== null) {
      if (typeof rawLine.line_item_number !== "string") {
        throw new ValidationError("line_item_number must be a string")
      }
      if (rawLine.line_item_number.trim().length > 255) {
        throw new ValidationError("line_item_number must be 255 characters or less")
      }
    }
    if (rawLine.line_item_unit !== undefined && rawLine.line_item_unit !== null) {
      if (typeof rawLine.line_item_unit !== "string") {
        throw new ValidationError("line_item_unit must be a string")
      }
      if (rawLine.line_item_unit.trim().length > 255) {
        throw new ValidationError("line_item_unit must be 255 characters or less")
      }
    }
    if (rawLine.line_item_description !== undefined && rawLine.line_item_description !== null) {
      if (typeof rawLine.line_item_description !== "string") {
        throw new ValidationError("line_item_description must be a string")
      }
      if (rawLine.line_item_description.length > 20000) {
        throw new ValidationError("line_item_description must be 20000 characters or less")
      }
    }
  }

  /**
   * Safely read project_id from data (handles raw project_id and Prisma relation format)
   */
  private getProjectIdFromData(
    data: Prisma.project_pay_itemCreateInput | Prisma.project_pay_itemUpdateInput
  ): number | undefined {
    const withIds = data as Record<string, unknown>
    if (typeof withIds.project_id === "number") return withIds.project_id
    if (
      data.project &&
      typeof data.project === "object" &&
      "connect" in data.project &&
      data.project.connect &&
      typeof data.project.connect === "object" &&
      "id" in data.project.connect
    ) {
      return (data.project.connect as { id: number }).id
    }
    return undefined
  }

  /**
   * Safely read pay_item_id from data (handles raw pay_item_id and Prisma relation format)
   */
  private getPayItemIdFromData(
    data: Prisma.project_pay_itemCreateInput | Prisma.project_pay_itemUpdateInput
  ): number | undefined {
    const withIds = data as Record<string, unknown>
    if (typeof withIds.pay_item_id === "number") return withIds.pay_item_id
    if (
      data.pay_item &&
      typeof data.pay_item === "object" &&
      "connect" in data.pay_item &&
      data.pay_item.connect &&
      typeof data.pay_item.connect === "object" &&
      "id" in data.pay_item.connect
    ) {
      return (data.pay_item.connect as { id: number }).id
    }
    return undefined
  }

  /**
   * Check if data has raw project_id (used for validation and stripping)
   */
  private hasRawProjectId(
    data: Prisma.project_pay_itemCreateInput | Prisma.project_pay_itemUpdateInput
  ): boolean {
    const withIds = data as Record<string, unknown>
    return withIds.project_id !== undefined
  }

  /**
   * Check if data has raw pay_item_id (used for stripping)
   */
  private hasRawPayItemId(
    data: Prisma.project_pay_itemCreateInput | Prisma.project_pay_itemUpdateInput
  ): boolean {
    const withIds = data as Record<string, unknown>
    return withIds.pay_item_id !== undefined
  }

  /**
   * Extract project_id and pay_item_id from data (handles both raw *_id and Prisma relation format)
   */
  private extractForeignKeyIds(
    data: Prisma.project_pay_itemCreateInput | Prisma.project_pay_itemUpdateInput
  ): { projectId?: number; payItemId?: number } {
    return {
      projectId: this.getProjectIdFromData(data),
      payItemId: this.getPayItemIdFromData(data),
    }
  }

  /**
   * Validate that foreign keys reference existing records
   */
  private async validateForeignKeys(
    projectId?: number,
    payItemId?: number
  ): Promise<void> {
    if (projectId !== undefined) {
      const project = await this.projectRepository.findUnique(
        { id: projectId },
        { select: { id: true } }
      )
      if (!project) {
        throw new ValidationError(`Project with id ${projectId} not found`)
      }
    }

    if (payItemId !== undefined && payItemId !== null) {
      const payItem = await this.payItemRepository.findUnique(
        { id: payItemId },
        { select: { id: true } }
      )
      if (!payItem) {
        throw new ValidationError(`Pay item with id ${payItemId} not found`)
      }
    }
  }

  /**
   * Normalize project_id and pay_item_id to Prisma relation format
   */
  private normalizeProjectRelation(
    data: Prisma.project_pay_itemCreateInput | Prisma.project_pay_itemUpdateInput
  ):
    | Prisma.projectCreateNestedOneWithoutProject_pay_itemsInput
    | Prisma.projectUpdateOneRequiredWithoutProject_pay_itemsNestedInput
    | undefined {
    const projectId = this.getProjectIdFromData(data)
    if (projectId !== undefined && projectId !== null) {
      return { connect: { id: projectId } }
    }
    return undefined
  }

  private normalizePayItemRelation(
    data: Prisma.project_pay_itemCreateInput | Prisma.project_pay_itemUpdateInput
  ):
    | Prisma.pay_itemCreateNestedOneWithoutProject_pay_itemsInput
    | Prisma.pay_itemUpdateOneRequiredWithoutProject_pay_itemsNestedInput
    | undefined {
    const payItemId = this.getPayItemIdFromData(data)
    if (payItemId !== undefined && payItemId !== null) {
      return { connect: { id: payItemId } }
    }
    return undefined
  }

  /**
   * Normalize relations and strip raw *_id fields from processed data
   */
  private normalizeRelationsAndStripIds<T extends Prisma.project_pay_itemCreateInput | Prisma.project_pay_itemUpdateInput>(
    data: T,
    processed: T
  ): void {
    const proc = processed as Record<string, unknown>
    const normalizedProject = this.normalizeProjectRelation(data)
    if (normalizedProject) {
      proc.project = normalizedProject
    }
    const normalizedPayItem = this.normalizePayItemRelation(data)
    if (normalizedPayItem) {
      proc.pay_item = normalizedPayItem
    }
    if (this.hasRawProjectId(data)) {
      delete proc.project_id
    }
    if (this.hasRawPayItemId(data)) {
      delete proc.pay_item_id
    }
  }

  /**
   * Trim string fields (notes and varchar fields)
   */
  private trimStringFields<T extends Prisma.project_pay_itemCreateInput | Prisma.project_pay_itemUpdateInput>(
    processed: T,
    isUpdate: boolean = false
  ): void {
    const proc = processed as Record<string, unknown>
    if (isUpdate) {
      if (processed.notes !== undefined && processed.notes !== null && typeof processed.notes === "string") {
        proc.notes = processed.notes.trim() || null
      }
    } else {
      if (processed.notes && typeof processed.notes === "string") {
        proc.notes = processed.notes.trim() || null
      }
    }
    const varcharFields = [
      "begin_station",
      "end_station",
      "status",
      "locate_ticket",
      "LF_RT",
      "onsite_review",
      "line_item_number",
      "line_item_unit",
    ] as const
    for (const field of varcharFields) {
      if (isUpdate) {
        if (processed[field] !== undefined && processed[field] !== null && typeof processed[field] === "string") {
          proc[field] = (processed[field] as string).trim() || null
        }
      } else {
        if (processed[field] && typeof processed[field] === "string") {
          proc[field] = (processed[field] as string).trim() || null
        }
      }
    }
    if (isUpdate) {
      if (
        processed.line_item_description !== undefined &&
        processed.line_item_description !== null &&
        typeof processed.line_item_description === "string"
      ) {
        proc.line_item_description = processed.line_item_description.trim() || null
      }
    } else {
      if (processed.line_item_description && typeof processed.line_item_description === "string") {
        proc.line_item_description = processed.line_item_description.trim() || null
      }
    }
  }

  private normalizeDateFields<T extends Prisma.project_pay_itemCreateInput | Prisma.project_pay_itemUpdateInput>(
    processed: T
  ): void {
    const proc = processed as Record<string, unknown>
    const ready = this.parseOptionalDate((processed as any).ready_to_work_date, "ready_to_work_date")
    if (ready !== undefined) {
      proc.ready_to_work_date = ready
    } else if ((processed as any).ready_to_work_date === null) {
      proc.ready_to_work_date = null
    }

    const statusDate = this.parseOptionalDate((processed as any).status_date, "status_date")
    if (statusDate !== undefined) {
      proc.status_date = statusDate
    } else if ((processed as any).status_date === null) {
      proc.status_date = null
    }
  }

  /**
   * Normalize Decimal fields (contracted_quantity, unit_rate, stockpile_billed)
   * Note: stockpile_billed is handled separately in setCreateDefaults for create operations
   */
  private normalizeDecimalFields<T extends Prisma.project_pay_itemCreateInput | Prisma.project_pay_itemUpdateInput>(
    processed: T,
    isUpdate: boolean = false
  ): void {
    const normalizeDecimal = (
      value: number | string | Prisma.Decimal | null | undefined
    ): Prisma.Decimal | undefined => {
      if (value === undefined || value === null) return undefined
      if (value instanceof Prisma.Decimal) return value
      if (typeof value === "number") return new Prisma.Decimal(value)
      if (typeof value === "string") return new Prisma.Decimal(value.trim())
      return undefined
    }
    const proc = processed as Record<string, unknown>
    const asDecimalInput = (
      v: unknown
    ): number | string | Prisma.Decimal | null | undefined =>
      v === undefined || v === null
        ? undefined
        : typeof v === "number" || typeof v === "string" || v instanceof Prisma.Decimal
          ? v
          : undefined
    if (isUpdate) {
      if (processed.contracted_quantity !== undefined && processed.contracted_quantity !== null) {
        const normalized = normalizeDecimal(asDecimalInput(processed.contracted_quantity))
        if (normalized !== undefined) {
          proc.contracted_quantity = normalized
        }
      }
      if (processed.unit_rate !== undefined && processed.unit_rate !== null) {
        const normalized = normalizeDecimal(asDecimalInput(processed.unit_rate))
        if (normalized !== undefined) {
          proc.unit_rate = normalized
        }
      }
      if (processed.stockpile_billed !== undefined && processed.stockpile_billed !== null) {
        const normalized = normalizeDecimal(asDecimalInput(processed.stockpile_billed))
        if (normalized !== undefined) {
          proc.stockpile_billed = normalized
        }
      }
    } else {
      if (processed.contracted_quantity) {
        const normalized = normalizeDecimal(asDecimalInput(processed.contracted_quantity))
        if (normalized !== undefined) {
          proc.contracted_quantity = normalized
        }
      }
      if (processed.unit_rate) {
        const normalized = normalizeDecimal(asDecimalInput(processed.unit_rate))
        if (normalized !== undefined) {
          proc.unit_rate = normalized
        }
      }
    }
  }

  /**
   * Set defaults for create operations
   */
  private setCreateDefaults(processed: Prisma.project_pay_itemCreateInput): void {
    if (processed.is_original === undefined || processed.is_original === null) {
      processed.is_original = true
    }

    if (processed.stockpile_billed === undefined || processed.stockpile_billed === null) {
      processed.stockpile_billed = new Prisma.Decimal(0)
    } else if (typeof processed.stockpile_billed === "number") {
      processed.stockpile_billed = new Prisma.Decimal(processed.stockpile_billed)
    } else if (typeof processed.stockpile_billed === "string") {
      processed.stockpile_billed = new Prisma.Decimal(processed.stockpile_billed.trim())
    }
  }

  /**
   * Hook called before delete — block when event quantities reference this line
   */
  protected async beforeDelete(id: number): Promise<void> {
    const prisma = await getPrisma()
    const count = await prisma.event_quantity.count({
      where: { project_pay_item_id: id },
    })
    if (count > 0) {
      throw new BusinessLogicError(
        "Cannot delete this pay line while calendar quantities reference it. Remove quantities on the calendar first.",
      )
    }
  }

  /**
   * Hook called before create - validate FKs and set defaults
   */
  protected async beforeCreate(
    data: Prisma.project_pay_itemCreateInput
  ): Promise<Prisma.project_pay_itemCreateInput> {
    const processed: Prisma.project_pay_itemCreateInput = { ...data }
    const procAny = processed as Record<string, unknown>

    if (
      typeof procAny.pay_item_number === "string" &&
      (procAny.pay_item_number as string).trim() &&
      this.getPayItemIdFromData(processed) === undefined
    ) {
      const num = (procAny.pay_item_number as string).trim()
      const found = await this.payItemRepository.findByNumber(num)
      if (found) {
        processed.pay_item = { connect: { id: found.id } }
        procAny.line_item_number = null
        const descCreate =
          typeof procAny.pay_item_description === "string"
            ? (procAny.pay_item_description as string).trim()
            : ""
        const unitCreate =
          typeof procAny.pay_item_unit === "string"
            ? (procAny.pay_item_unit as string).trim()
            : ""
        procAny.line_item_description = descCreate || null
        procAny.line_item_unit = unitCreate || "ea"
      } else {
        const desc =
          typeof procAny.pay_item_description === "string"
            ? (procAny.pay_item_description as string).trim()
            : ""
        const unitRaw =
          typeof procAny.pay_item_unit === "string"
            ? (procAny.pay_item_unit as string).trim()
            : ""
        delete procAny.pay_item
        delete procAny.pay_item_id
        procAny.line_item_number = num
        procAny.line_item_description = desc || null
        procAny.line_item_unit = unitRaw || "ea"
      }
    }

    delete procAny.pay_item_number
    delete procAny.pay_item_description
    delete procAny.pay_item_unit

    // Extract and validate foreign keys
    const { projectId, payItemId } = this.extractForeignKeyIds(processed)
    await this.validateForeignKeys(projectId, payItemId)

    // Normalize relations and strip raw *_id fields
    this.normalizeRelationsAndStripIds(data, processed)

    // Prisma create input does not accept scalar pay_item_id — only pay_item connect; omit both when unlinked
    const procClean = processed as Record<string, unknown>
    if (procClean.pay_item === undefined || procClean.pay_item === null) {
      delete procClean.pay_item_id
    }

    // Set defaults for optional fields
    this.setCreateDefaults(processed)

    // Trim string fields
    this.trimStringFields(processed, false)

    this.normalizeDateFields(processed)

    // Normalize Decimal fields
    this.normalizeDecimalFields(processed, false)

    return processed
  }

  /**
   * Hook called before update - validate FKs if changed
   */
  protected async beforeUpdate(
    id: number,
    data: Prisma.project_pay_itemUpdateInput
  ): Promise<Prisma.project_pay_itemUpdateInput> {
    const processed: Prisma.project_pay_itemUpdateInput = { ...data }
    const procAny = processed as Record<string, unknown>

    let payItemRel: Prisma.project_pay_itemUpdateInput["pay_item"] | undefined

    if (typeof procAny.pay_item_number === "string") {
      const num = (procAny.pay_item_number as string).trim()
      delete procAny.pay_item_number
      if (num) {
        const found = await this.payItemRepository.findByNumber(num)
        if (found) {
          payItemRel = { connect: { id: found.id } }
          procAny.line_item_number = null
          const descCat =
            typeof procAny.pay_item_description === "string"
              ? (procAny.pay_item_description as string).trim()
              : ""
          const unitCat =
            typeof procAny.pay_item_unit === "string"
              ? (procAny.pay_item_unit as string).trim()
              : ""
          procAny.line_item_description = descCat || null
          procAny.line_item_unit = unitCat || "ea"
          delete procAny.pay_item_description
          delete procAny.pay_item_unit
        } else {
          payItemRel = { disconnect: true }
          procAny.line_item_number = num
          const desc =
            typeof procAny.pay_item_description === "string"
              ? (procAny.pay_item_description as string).trim()
              : ""
          const unitRaw =
            typeof procAny.pay_item_unit === "string"
              ? (procAny.pay_item_unit as string).trim()
              : ""
          procAny.line_item_description = desc || null
          procAny.line_item_unit = unitRaw || "ea"
          delete procAny.pay_item_description
          delete procAny.pay_item_unit
        }
      }
    }

    if (typeof procAny.pay_item_description === "string" && payItemRel === undefined) {
      procAny.line_item_description = (procAny.pay_item_description as string).trim() || null
      delete procAny.pay_item_description
    } else if (procAny.pay_item_description !== undefined && payItemRel === undefined) {
      delete procAny.pay_item_description
    }

    if (typeof procAny.pay_item_unit === "string" && payItemRel === undefined) {
      procAny.line_item_unit = (procAny.pay_item_unit as string).trim() || "ea"
      delete procAny.pay_item_unit
    } else if (procAny.pay_item_unit !== undefined && payItemRel === undefined) {
      delete procAny.pay_item_unit
    }

    if (payItemRel !== undefined) {
      procAny.pay_item = payItemRel
    }

    // Extract and validate foreign keys if they're being changed
    const { projectId, payItemId } = this.extractForeignKeyIds(processed)
    await this.validateForeignKeys(projectId, payItemId)

    // Normalize relations and strip raw *_id fields
    this.normalizeRelationsAndStripIds(data, processed)

    if (payItemRel !== undefined) {
      procAny.pay_item = payItemRel
    }

    // Trim string fields if provided
    this.trimStringFields(processed, true)

    this.normalizeDateFields(processed)

    // Normalize Decimal fields if provided
    this.normalizeDecimalFields(processed, true)

    return processed
  }
}
