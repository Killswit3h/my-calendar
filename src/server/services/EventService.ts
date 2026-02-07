import { Prisma, PrismaClient } from "@prisma/client"
import { AbstractService } from "../base/AbstractService"
import { EventRepository } from "../repositories/EventRepository"
import { ProjectRepository } from "../repositories/ProjectRepository"
import { ScopeOfWorkRepository } from "../repositories/ScopeOfWorkRepository"
import { PaymentTypeRepository } from "../repositories/PaymentTypeRepository"
import { InvoiceRepository } from "../repositories/InvoiceRepository"
import { ValidationError } from "../base/types"
import type { PaginationOptions } from "../base/types"

/**
 * Event Service
 * Provides business logic for event operations (calendar events with project, scope, payment type, optional invoice).
 */
export class EventService extends AbstractService<
  Prisma.eventGetPayload<{}>,
  Prisma.eventCreateInput,
  Prisma.eventUpdateInput,
  Prisma.eventWhereUniqueInput,
  EventRepository
> {
  protected repository: EventRepository
  private projectRepository: ProjectRepository
  private scopeOfWorkRepository: ScopeOfWorkRepository
  private paymentTypeRepository: PaymentTypeRepository
  private invoiceRepository: InvoiceRepository

  private static readonly LOCATION_MAX_LENGTH = 255

  constructor() {
    super()
    this.repository = new EventRepository()
    this.projectRepository = new ProjectRepository()
    this.scopeOfWorkRepository = new ScopeOfWorkRepository()
    this.paymentTypeRepository = new PaymentTypeRepository()
    this.invoiceRepository = new InvoiceRepository()
  }

  /**
   * List events with optional expand options.
   * Supports ?expanded=true to include project, scope_of_work, payment_type, invoice.
   */
  async listWithExpand(
    filters?: Prisma.eventWhereInput,
    expandOptions?: { include?: Prisma.eventInclude },
    pagination?: PaginationOptions,
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<Prisma.eventGetPayload<{}>[]> {
    if (expandOptions?.include) {
      return this.repository.findMany(filters, expandOptions, client)
    }
    return this.list(filters, pagination, client)
  }

  /**
   * Parse a value to Date (accepts Date or ISO string). Returns undefined if invalid.
   */
  private parseDateTime(value: unknown): Date | undefined {
    if (value instanceof Date) {
      return Number.isFinite(value.getTime()) ? value : undefined
    }
    if (typeof value === "string" && value.trim()) {
      const d = new Date(value.trim())
      return Number.isFinite(d.getTime()) ? d : undefined
    }
    return undefined
  }

  protected async validate(
    data: Prisma.eventCreateInput | Prisma.eventUpdateInput,
    isUpdate: boolean = false
  ): Promise<void> {
    const d = data as Record<string, unknown>

    // project_id (required on create)
    const projectId = this.getProjectIdFromData(data)
    if (projectId !== undefined && projectId !== null) {
      if (typeof projectId !== "number" || !Number.isInteger(projectId) || projectId <= 0) {
        throw new ValidationError("project_id must be a positive integer")
      }
    } else if (!isUpdate) {
      throw new ValidationError("project_id is required")
    }

    // scope_of_work_id (required on create)
    const scopeOfWorkId = this.getScopeOfWorkIdFromData(data)
    if (scopeOfWorkId !== undefined && scopeOfWorkId !== null) {
      if (typeof scopeOfWorkId !== "number" || !Number.isInteger(scopeOfWorkId) || scopeOfWorkId <= 0) {
        throw new ValidationError("scope_of_work_id must be a positive integer")
      }
    } else if (!isUpdate) {
      throw new ValidationError("scope_of_work_id is required")
    }

    // payment_type_id (required on create)
    const paymentTypeId = this.getPaymentTypeIdFromData(data)
    if (paymentTypeId !== undefined && paymentTypeId !== null) {
      if (typeof paymentTypeId !== "number" || !Number.isInteger(paymentTypeId) || paymentTypeId <= 0) {
        throw new ValidationError("payment_type_id must be a positive integer")
      }
    } else if (!isUpdate) {
      throw new ValidationError("payment_type_id is required")
    }

    // invoice_id (optional; if provided must be positive integer)
    const invoiceId = this.getInvoiceIdFromData(data)
    if (invoiceId !== undefined && invoiceId !== null) {
      if (typeof invoiceId !== "number" || !Number.isInteger(invoiceId) || invoiceId <= 0) {
        throw new ValidationError("invoice_id must be a positive integer when provided")
      }
    }

    // start_time (required on create)
    const startTime = this.parseDateTime(d.start_time)
    if (startTime === undefined && d.start_time !== undefined && d.start_time !== null) {
      throw new ValidationError("start_time must be a valid date or ISO date string")
    }
    if (!isUpdate && (startTime === undefined || d.start_time === undefined || d.start_time === null)) {
      throw new ValidationError("start_time is required")
    }

    // end_time (required on create)
    const endTime = this.parseDateTime(d.end_time)
    if (endTime === undefined && d.end_time !== undefined && d.end_time !== null) {
      throw new ValidationError("end_time must be a valid date or ISO date string")
    }
    if (!isUpdate && (endTime === undefined || d.end_time === undefined || d.end_time === null)) {
      throw new ValidationError("end_time is required")
    }
    if (startTime !== undefined && endTime !== undefined && endTime < startTime) {
      throw new ValidationError("end_time must be on or after start_time")
    }

    // is_day_shift (optional boolean)
    if (data.is_day_shift !== undefined && data.is_day_shift !== null) {
      if (typeof data.is_day_shift !== "boolean") {
        throw new ValidationError("is_day_shift must be a boolean")
      }
    }

    // location (optional string, trim, max length)
    if (data.location !== undefined && data.location !== null) {
      if (typeof data.location !== "string") {
        throw new ValidationError("location must be a string")
      }
      const trimmed = data.location.trim()
      if (trimmed.length > EventService.LOCATION_MAX_LENGTH) {
        throw new ValidationError(`location must be ${EventService.LOCATION_MAX_LENGTH} characters or less`)
      }
    }

    // notes (optional string)
    if (data.notes !== undefined && data.notes !== null) {
      if (typeof data.notes !== "string") {
        throw new ValidationError("notes must be a string")
      }
    }

    // FK existence checks
    await this.validateForeignKeys(projectId, scopeOfWorkId, paymentTypeId, invoiceId)
  }

  private getProjectIdFromData(
    data: Prisma.eventCreateInput | Prisma.eventUpdateInput
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

  private getScopeOfWorkIdFromData(
    data: Prisma.eventCreateInput | Prisma.eventUpdateInput
  ): number | undefined {
    const withIds = data as Record<string, unknown>
    if (typeof withIds.scope_of_work_id === "number") return withIds.scope_of_work_id
    if (
      data.scope_of_work &&
      typeof data.scope_of_work === "object" &&
      "connect" in data.scope_of_work &&
      data.scope_of_work.connect &&
      typeof data.scope_of_work.connect === "object" &&
      "id" in data.scope_of_work.connect
    ) {
      return (data.scope_of_work.connect as { id: number }).id
    }
    return undefined
  }

  private getPaymentTypeIdFromData(
    data: Prisma.eventCreateInput | Prisma.eventUpdateInput
  ): number | undefined {
    const withIds = data as Record<string, unknown>
    if (typeof withIds.payment_type_id === "number") return withIds.payment_type_id
    if (
      data.payment_type &&
      typeof data.payment_type === "object" &&
      "connect" in data.payment_type &&
      data.payment_type.connect &&
      typeof data.payment_type.connect === "object" &&
      "id" in data.payment_type.connect
    ) {
      return (data.payment_type.connect as { id: number }).id
    }
    return undefined
  }

  private getInvoiceIdFromData(
    data: Prisma.eventCreateInput | Prisma.eventUpdateInput
  ): number | null | undefined {
    const withIds = data as Record<string, unknown>
    if (withIds.invoice_id === null) return null
    if (typeof withIds.invoice_id === "number") return withIds.invoice_id
    const inv = data.invoice as { connect?: { id: number }; disconnect?: boolean } | undefined
    if (inv?.disconnect) return null
    if (inv?.connect && typeof inv.connect === "object" && "id" in inv.connect) {
      return (inv.connect as { id: number }).id
    }
    return undefined
  }

  private hasRawProjectId(data: Prisma.eventCreateInput | Prisma.eventUpdateInput): boolean {
    return (data as Record<string, unknown>).project_id !== undefined
  }
  private hasRawScopeOfWorkId(data: Prisma.eventCreateInput | Prisma.eventUpdateInput): boolean {
    return (data as Record<string, unknown>).scope_of_work_id !== undefined
  }
  private hasRawPaymentTypeId(data: Prisma.eventCreateInput | Prisma.eventUpdateInput): boolean {
    return (data as Record<string, unknown>).payment_type_id !== undefined
  }
  private hasRawInvoiceId(data: Prisma.eventCreateInput | Prisma.eventUpdateInput): boolean {
    return (data as Record<string, unknown>).invoice_id !== undefined
  }

  private async validateForeignKeys(
    projectId?: number,
    scopeOfWorkId?: number,
    paymentTypeId?: number,
    invoiceId?: number | null
  ): Promise<void> {
    if (projectId !== undefined) {
      const project = await this.projectRepository.findUnique({ id: projectId }, { select: { id: true } })
      if (!project) throw new ValidationError(`Project with id ${projectId} not found`)
    }
    if (scopeOfWorkId !== undefined) {
      const sow = await this.scopeOfWorkRepository.findUnique({ id: scopeOfWorkId }, { select: { id: true } })
      if (!sow) throw new ValidationError(`Scope of work with id ${scopeOfWorkId} not found`)
    }
    if (paymentTypeId !== undefined) {
      const pt = await this.paymentTypeRepository.findUnique({ id: paymentTypeId }, { select: { id: true } })
      if (!pt) throw new ValidationError(`Payment type with id ${paymentTypeId} not found`)
    }
    if (invoiceId !== undefined && invoiceId !== null) {
      const inv = await this.invoiceRepository.findUnique({ id: invoiceId }, { select: { id: true } })
      if (!inv) throw new ValidationError(`Invoice with id ${invoiceId} not found`)
    }
  }

  private normalizeRelationsAndStripIds<T extends Prisma.eventCreateInput | Prisma.eventUpdateInput>(
    data: T,
    processed: T,
    isUpdate: boolean
  ): void {
    const proc = processed as Record<string, unknown>
    const projectId = this.getProjectIdFromData(data)
    if (projectId !== undefined && projectId !== null) proc.project = { connect: { id: projectId } }
    const scopeOfWorkId = this.getScopeOfWorkIdFromData(data)
    if (scopeOfWorkId !== undefined && scopeOfWorkId !== null) proc.scope_of_work = { connect: { id: scopeOfWorkId } }
    const paymentTypeId = this.getPaymentTypeIdFromData(data)
    if (paymentTypeId !== undefined && paymentTypeId !== null) proc.payment_type = { connect: { id: paymentTypeId } }
    const invoiceId = this.getInvoiceIdFromData(data)
    if (invoiceId !== undefined) {
      if (invoiceId === null && isUpdate) proc.invoice = { disconnect: true }
      else if (typeof invoiceId === "number") proc.invoice = { connect: { id: invoiceId } }
    }
    if (this.hasRawProjectId(data)) delete proc.project_id
    if (this.hasRawScopeOfWorkId(data)) delete proc.scope_of_work_id
    if (this.hasRawPaymentTypeId(data)) delete proc.payment_type_id
    if (this.hasRawInvoiceId(data)) delete proc.invoice_id
  }

  private normalizeDates<T extends Prisma.eventCreateInput | Prisma.eventUpdateInput>(
    data: T,
    processed: T
  ): void {
    const proc = processed as Record<string, unknown>
    const startTime = this.parseDateTime(data.start_time as unknown)
    if (startTime !== undefined) proc.start_time = startTime
    const endTime = this.parseDateTime(data.end_time as unknown)
    if (endTime !== undefined) proc.end_time = endTime
  }

  private trimStringFields<T extends Prisma.eventCreateInput | Prisma.eventUpdateInput>(
    processed: T
  ): void {
    const proc = processed as Record<string, unknown>
    if (processed.location !== undefined && processed.location !== null && typeof processed.location === "string") {
      proc.location = processed.location.trim() || null
    }
    if (processed.notes !== undefined && processed.notes !== null && typeof processed.notes === "string") {
      proc.notes = processed.notes.trim() || null
    }
  }

  protected async beforeCreate(data: Prisma.eventCreateInput): Promise<Prisma.eventCreateInput> {
    const processed: Prisma.eventCreateInput = { ...data }
    const projectId = this.getProjectIdFromData(data)
    const scopeOfWorkId = this.getScopeOfWorkIdFromData(data)
    const paymentTypeId = this.getPaymentTypeIdFromData(data)
    const invoiceId = this.getInvoiceIdFromData(data)
    await this.validateForeignKeys(projectId, scopeOfWorkId, paymentTypeId, invoiceId)
    this.normalizeRelationsAndStripIds(data, processed, false)
    this.normalizeDates(data, processed)
    this.trimStringFields(processed)
    return processed
  }

  protected async beforeUpdate(
    id: number,
    data: Prisma.eventUpdateInput
  ): Promise<Prisma.eventUpdateInput> {
    const processed: Prisma.eventUpdateInput = { ...data }
    const projectId = this.getProjectIdFromData(data)
    const scopeOfWorkId = this.getScopeOfWorkIdFromData(data)
    const paymentTypeId = this.getPaymentTypeIdFromData(data)
    const invoiceId = this.getInvoiceIdFromData(data)
    await this.validateForeignKeys(projectId, scopeOfWorkId, paymentTypeId, invoiceId)
    this.normalizeRelationsAndStripIds(data, processed, true)
    this.normalizeDates(data, processed)
    this.trimStringFields(processed)
    return processed
  }
}
