import { Prisma, PrismaClient } from "@prisma/client"
import { AbstractService } from "../base/AbstractService"
import { EventAssignmentRepository } from "../repositories/EventAssignmentRepository"
import { EventRepository } from "../repositories/EventRepository"
import { EmployeeRepository } from "../repositories/EmployeeRepository"
import { ValidationError, ConflictError } from "../base/types"
import type { PaginationOptions } from "../base/types"

/**
 * Event Assignment Service
 * Provides business logic for event assignment operations (event–employee link)
 */
export class EventAssignmentService extends AbstractService<
  Prisma.event_assignmentGetPayload<{}>,
  Prisma.event_assignmentCreateInput,
  Prisma.event_assignmentUpdateInput,
  Prisma.event_assignmentWhereUniqueInput,
  EventAssignmentRepository
> {
  protected repository: EventAssignmentRepository
  private eventRepository: EventRepository
  private employeeRepository: EmployeeRepository

  constructor() {
    super()
    this.repository = new EventAssignmentRepository()
    this.eventRepository = new EventRepository()
    this.employeeRepository = new EmployeeRepository()
  }

  /**
   * List event assignments with optional expand options
   * Supports ?expanded=true to include event and employee relations
   */
  async listWithExpand(
    filters?: Prisma.event_assignmentWhereInput,
    expandOptions?: { include?: Prisma.event_assignmentInclude },
    pagination?: PaginationOptions,
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<Prisma.event_assignmentGetPayload<{}>[]> {
    if (expandOptions?.include) {
      return this.repository.findMany(filters, expandOptions, client)
    }
    return this.list(filters, pagination, client)
  }

  /**
   * Validate event assignment data
   */
  protected async validate(
    data: Prisma.event_assignmentCreateInput | Prisma.event_assignmentUpdateInput,
    isUpdate: boolean = false
  ): Promise<void> {
    const eventId = this.getEventIdFromData(data)

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

    const employeeId = this.getEmployeeIdFromData(data)

    if (employeeId !== undefined && employeeId !== null) {
      if (
        typeof employeeId !== "number" ||
        !Number.isInteger(employeeId) ||
        employeeId <= 0
      ) {
        throw new ValidationError("employee_id must be a positive integer")
      }
    } else if (!isUpdate) {
      throw new ValidationError("employee_id is required")
    }
  }

  private getEventIdFromData(
    data: Prisma.event_assignmentCreateInput | Prisma.event_assignmentUpdateInput
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

  private getEmployeeIdFromData(
    data: Prisma.event_assignmentCreateInput | Prisma.event_assignmentUpdateInput
  ): number | undefined {
    const withIds = data as Record<string, unknown>
    if (typeof withIds.employee_id === "number") return withIds.employee_id
    if (
      data.employee &&
      typeof data.employee === "object" &&
      "connect" in data.employee &&
      data.employee.connect &&
      typeof data.employee.connect === "object" &&
      "id" in data.employee.connect
    ) {
      return (data.employee.connect as { id: number }).id
    }
    return undefined
  }

  private hasRawEventId(
    data: Prisma.event_assignmentCreateInput | Prisma.event_assignmentUpdateInput
  ): boolean {
    const withIds = data as Record<string, unknown>
    return withIds.event_id !== undefined
  }

  private hasRawEmployeeId(
    data: Prisma.event_assignmentCreateInput | Prisma.event_assignmentUpdateInput
  ): boolean {
    const withIds = data as Record<string, unknown>
    return withIds.employee_id !== undefined
  }

  private extractForeignKeyIds(
    data: Prisma.event_assignmentCreateInput | Prisma.event_assignmentUpdateInput
  ): { eventId?: number; employeeId?: number } {
    return {
      eventId: this.getEventIdFromData(data),
      employeeId: this.getEmployeeIdFromData(data),
    }
  }

  private async validateForeignKeys(
    eventId?: number,
    employeeId?: number
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

    if (employeeId !== undefined) {
      const employee = await this.employeeRepository.findUnique(
        { id: employeeId },
        { select: { id: true } }
      )
      if (!employee) {
        throw new ValidationError(`Employee with id ${employeeId} not found`)
      }
    }
  }

  private normalizeEventRelation(
    data: Prisma.event_assignmentCreateInput | Prisma.event_assignmentUpdateInput
  ):
    | Prisma.eventCreateNestedOneWithoutAssignmentsInput
    | Prisma.eventUpdateOneRequiredWithoutAssignmentsNestedInput
    | undefined {
    const eventId = this.getEventIdFromData(data)
    if (eventId !== undefined && eventId !== null) {
      return { connect: { id: eventId } }
    }
    return undefined
  }

  private normalizeEmployeeRelation(
    data: Prisma.event_assignmentCreateInput | Prisma.event_assignmentUpdateInput
  ):
    | Prisma.employeeCreateNestedOneWithoutEvent_assignmentsInput
    | Prisma.employeeUpdateOneRequiredWithoutEvent_assignmentsNestedInput
    | undefined {
    const employeeId = this.getEmployeeIdFromData(data)
    if (employeeId !== undefined && employeeId !== null) {
      return { connect: { id: employeeId } }
    }
    return undefined
  }

  private normalizeRelationsAndStripIds<
    T extends
      | Prisma.event_assignmentCreateInput
      | Prisma.event_assignmentUpdateInput
  >(data: T, processed: T): void {
    const proc = processed as Record<string, unknown>
    const normalizedEvent = this.normalizeEventRelation(data)
    if (normalizedEvent) {
      proc.event = normalizedEvent
    }
    const normalizedEmployee = this.normalizeEmployeeRelation(data)
    if (normalizedEmployee) {
      proc.employee = normalizedEmployee
    }
    if (this.hasRawEventId(data)) {
      delete proc.event_id
    }
    if (this.hasRawEmployeeId(data)) {
      delete proc.employee_id
    }
  }

  protected async beforeCreate(
    data: Prisma.event_assignmentCreateInput
  ): Promise<Prisma.event_assignmentCreateInput> {
    const processed: Prisma.event_assignmentCreateInput = { ...data }

    const { eventId, employeeId } = this.extractForeignKeyIds(data)
    await this.validateForeignKeys(eventId, employeeId)

    if (eventId !== undefined && employeeId !== undefined) {
      const existing = await this.repository.findFirstByEventAndEmployee(
        eventId,
        employeeId
      )
      if (existing) {
        throw new ConflictError(
          "An assignment for this event and employee already exists"
        )
      }
    }

    this.normalizeRelationsAndStripIds(data, processed)
    return processed
  }

  protected async beforeUpdate(
    id: number,
    data: Prisma.event_assignmentUpdateInput
  ): Promise<Prisma.event_assignmentUpdateInput> {
    const processed: Prisma.event_assignmentUpdateInput = { ...data }

    const { eventId, employeeId } = this.extractForeignKeyIds(data)
    await this.validateForeignKeys(eventId, employeeId)

    if (eventId !== undefined && employeeId !== undefined) {
      const existing = await this.repository.findFirstByEventAndEmployee(
        eventId,
        employeeId
      )
      if (existing && existing.id !== id) {
        throw new ConflictError(
          "An assignment for this event and employee already exists"
        )
      }
    }

    this.normalizeRelationsAndStripIds(data, processed)
    return processed
  }
}
