import { Prisma, PrismaClient } from "@prisma/client"
import { AbstractService } from "../base/AbstractService"
import { EventQuantityRepository } from "../repositories/EventQuantityRepository"
import { EventRepository } from "../repositories/EventRepository"
import { ProjectPayItemRepository } from "../repositories/ProjectPayItemRepository"
import { ValidationError } from "../base/types"
import type { PaginationOptions } from "../base/types"

/**
 * Event Quantity Service
 * Provides business logic for event quantity operations
 */
export class EventQuantityService extends AbstractService<
  Prisma.event_quantityGetPayload<{}>,
  Prisma.event_quantityCreateInput,
  Prisma.event_quantityUpdateInput,
  Prisma.event_quantityWhereUniqueInput,
  EventQuantityRepository
> {
  protected repository: EventQuantityRepository
  private eventRepository: EventRepository
  private projectPayItemRepository: ProjectPayItemRepository

  constructor() {
    super()
    this.repository = new EventQuantityRepository()
    this.eventRepository = new EventRepository()
    this.projectPayItemRepository = new ProjectPayItemRepository()
  }

  /**
   * List event quantities with optional expand options
   * Supports ?expanded=true to include relations
   */
  async listWithExpand(
    filters?: Prisma.event_quantityWhereInput,
    expandOptions?: { include?: Prisma.event_quantityInclude },
    pagination?: PaginationOptions,
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<Prisma.event_quantityGetPayload<{}>[]> {
    if (expandOptions?.include) {
      return this.repository.findMany(filters, expandOptions, client)
    }
    return this.list(filters, pagination, client)
  }

  /**
   * Validate event quantity data
   */
  protected async validate(
    data: Prisma.event_quantityCreateInput | Prisma.event_quantityUpdateInput,
    isUpdate: boolean = false
  ): Promise<void> {
    const eventId = this.getEventIdFromData(data)

    // Event ID validation (required, must reference valid event if provided)
    if (eventId !== undefined && eventId !== null) {
      if (
        typeof eventId !== "number" ||
        !Number.isInteger(eventId) ||
        eventId <= 0
      ) {
        throw new ValidationError("event_id must be a positive integer")
      }
    } else if (!isUpdate) {
      throw new ValidationError("event_id is required")
    }

    // Project Pay Item ID validation (required, must reference valid project_pay_item if provided)
    const projectPayItemId = this.getProjectPayItemIdFromData(data)

    if (projectPayItemId !== undefined && projectPayItemId !== null) {
      if (
        typeof projectPayItemId !== "number" ||
        !Number.isInteger(projectPayItemId) ||
        projectPayItemId <= 0
      ) {
        throw new ValidationError("project_pay_item_id must be a positive integer")
      }
    } else if (!isUpdate) {
      throw new ValidationError("project_pay_item_id is required")
    }

    // Quantity validation
    if (data.quantity !== undefined) {
      let decimalValue: Prisma.Decimal

      if (data.quantity instanceof Prisma.Decimal) {
        decimalValue = data.quantity
      } else if (typeof data.quantity === "number") {
        if (!Number.isFinite(data.quantity)) {
          throw new ValidationError("quantity must be a finite number")
        }
        decimalValue = new Prisma.Decimal(data.quantity)
      } else if (typeof data.quantity === "string") {
        try {
          decimalValue = new Prisma.Decimal(data.quantity.trim())
        } catch {
          throw new ValidationError("quantity must be a valid number")
        }
      } else {
        throw new ValidationError("quantity must be a number or Decimal")
      }

      if (decimalValue.isNaN()) {
        throw new ValidationError("quantity must be a valid number")
      }

      if (decimalValue.lt(0)) {
        throw new ValidationError("quantity must be non-negative")
      }
    } else if (!isUpdate) {
      throw new ValidationError("quantity is required")
    }

    // Notes validation (Text field - no length limit but should trim)
    if (data.notes !== undefined && data.notes !== null) {
      if (typeof data.notes !== "string") {
        throw new ValidationError("notes must be a string")
      }
    }
  }

  /**
   * Safely read event_id from data (handles raw event_id and Prisma relation format)
   */
  private getEventIdFromData(
    data: Prisma.event_quantityCreateInput | Prisma.event_quantityUpdateInput
  ): number | undefined {
    const withIds = data as Record<string, unknown>
    if (typeof withIds.event_id === "number") return withIds.event_id
    if (
      data.event &&
      typeof data.event === "object" &&
      "connect" in data.event &&
      data.event.connect &&
      typeof data.event.connect === "object" &&
      "id" in data.event.connect
    ) {
      return (data.event.connect as { id: number }).id
    }
    return undefined
  }

  /**
   * Safely read project_pay_item_id from data (handles raw project_pay_item_id and Prisma relation format)
   */
  private getProjectPayItemIdFromData(
    data: Prisma.event_quantityCreateInput | Prisma.event_quantityUpdateInput
  ): number | undefined {
    const withIds = data as Record<string, unknown>
    if (typeof withIds.project_pay_item_id === "number") return withIds.project_pay_item_id
    if (
      data.project_pay_item &&
      typeof data.project_pay_item === "object" &&
      "connect" in data.project_pay_item &&
      data.project_pay_item.connect &&
      typeof data.project_pay_item.connect === "object" &&
      "id" in data.project_pay_item.connect
    ) {
      return (data.project_pay_item.connect as { id: number }).id
    }
    return undefined
  }

  /**
   * Check if data has raw event_id (used for validation and stripping)
   */
  private hasRawEventId(
    data: Prisma.event_quantityCreateInput | Prisma.event_quantityUpdateInput
  ): boolean {
    const withIds = data as Record<string, unknown>
    return withIds.event_id !== undefined
  }

  /**
   * Check if data has raw project_pay_item_id (used for stripping)
   */
  private hasRawProjectPayItemId(
    data: Prisma.event_quantityCreateInput | Prisma.event_quantityUpdateInput
  ): boolean {
    const withIds = data as Record<string, unknown>
    return withIds.project_pay_item_id !== undefined
  }

  /**
   * Extract event_id and project_pay_item_id from data (handles both raw *_id and Prisma relation format)
   */
  private extractForeignKeyIds(
    data: Prisma.event_quantityCreateInput | Prisma.event_quantityUpdateInput
  ): { eventId?: number; projectPayItemId?: number } {
    return {
      eventId: this.getEventIdFromData(data),
      projectPayItemId: this.getProjectPayItemIdFromData(data),
    }
  }

  /**
   * Validate that foreign keys reference existing records
   */
  private async validateForeignKeys(
    eventId?: number,
    projectPayItemId?: number
  ): Promise<void> {
    if (eventId !== undefined) {
      const event = await this.eventRepository.findUnique(
        { id: eventId },
        { select: { id: true } }
      )
      if (!event) {
        throw new ValidationError(`Event with id ${eventId} not found`)
      }
    }

    if (projectPayItemId !== undefined) {
      const projectPayItem = await this.projectPayItemRepository.findUnique(
        { id: projectPayItemId },
        { select: { id: true } }
      )
      if (!projectPayItem) {
        throw new ValidationError(`Project pay item with id ${projectPayItemId} not found`)
      }
    }
  }

  /**
   * Normalize event_id to Prisma relation format
   */
  private normalizeEventRelation(
    data: Prisma.event_quantityCreateInput | Prisma.event_quantityUpdateInput
  ):
    | Prisma.eventCreateNestedOneWithoutQuantitiesInput
    | Prisma.eventUpdateOneRequiredWithoutQuantitiesNestedInput
    | undefined {
    const eventId = this.getEventIdFromData(data)
    if (eventId !== undefined && eventId !== null) {
      return { connect: { id: eventId } }
    }
    return undefined
  }

  private normalizeProjectPayItemRelation(
    data: Prisma.event_quantityCreateInput | Prisma.event_quantityUpdateInput
  ):
    | Prisma.project_pay_itemCreateNestedOneWithoutEvent_quantitiesInput
    | Prisma.project_pay_itemUpdateOneRequiredWithoutEvent_quantitiesNestedInput
    | undefined {
    const projectPayItemId = this.getProjectPayItemIdFromData(data)
    if (projectPayItemId !== undefined && projectPayItemId !== null) {
      return { connect: { id: projectPayItemId } }
    }
    return undefined
  }

  /**
   * Normalize relations and strip raw *_id fields from processed data
   */
  private normalizeRelationsAndStripIds<T extends Prisma.event_quantityCreateInput | Prisma.event_quantityUpdateInput>(
    data: T,
    processed: T
  ): void {
    const proc = processed as Record<string, unknown>
    const normalizedEvent = this.normalizeEventRelation(data)
    if (normalizedEvent) {
      proc.event = normalizedEvent
    }
    const normalizedProjectPayItem = this.normalizeProjectPayItemRelation(data)
    if (normalizedProjectPayItem) {
      proc.project_pay_item = normalizedProjectPayItem
    }
    if (this.hasRawEventId(data)) {
      delete proc.event_id
    }
    if (this.hasRawProjectPayItemId(data)) {
      delete proc.project_pay_item_id
    }
  }

  /**
   * Trim string fields (notes)
   */
  private trimStringFields<T extends Prisma.event_quantityCreateInput | Prisma.event_quantityUpdateInput>(
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
  }

  /**
   * Normalize Decimal fields (quantity)
   */
  private normalizeDecimalFields<T extends Prisma.event_quantityCreateInput | Prisma.event_quantityUpdateInput>(
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
      if (processed.quantity !== undefined && processed.quantity !== null) {
        const normalized = normalizeDecimal(asDecimalInput(processed.quantity))
        if (normalized !== undefined) {
          proc.quantity = normalized
        }
      }
    } else {
      if (processed.quantity) {
        const normalized = normalizeDecimal(asDecimalInput(processed.quantity))
        if (normalized !== undefined) {
          proc.quantity = normalized
        }
      }
    }
  }

  /**
   * Hook called before create - validate FKs and normalize
   */
  protected async beforeCreate(
    data: Prisma.event_quantityCreateInput
  ): Promise<Prisma.event_quantityCreateInput> {
    const processed: Prisma.event_quantityCreateInput = { ...data }

    // Extract and validate foreign keys
    const { eventId, projectPayItemId } = this.extractForeignKeyIds(data)
    await this.validateForeignKeys(eventId, projectPayItemId)

    // Normalize relations and strip raw *_id fields
    this.normalizeRelationsAndStripIds(data, processed)

    // Trim string fields
    this.trimStringFields(processed, false)

    // Normalize Decimal fields
    this.normalizeDecimalFields(processed, false)

    return processed
  }

  /**
   * Hook called before update - validate FKs if changed
   */
  protected async beforeUpdate(
    id: number,
    data: Prisma.event_quantityUpdateInput
  ): Promise<Prisma.event_quantityUpdateInput> {
    const processed: Prisma.event_quantityUpdateInput = { ...data }

    // Extract and validate foreign keys if they're being changed
    const { eventId, projectPayItemId } = this.extractForeignKeyIds(data)
    await this.validateForeignKeys(eventId, projectPayItemId)

    // Normalize relations and strip raw *_id fields
    this.normalizeRelationsAndStripIds(data, processed)

    // Trim string fields if provided
    this.trimStringFields(processed, true)

    // Normalize Decimal fields if provided
    this.normalizeDecimalFields(processed, true)

    return processed
  }
}
