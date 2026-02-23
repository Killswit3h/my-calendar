import { Prisma, PrismaClient } from "@prisma/client"
import { AbstractRepository } from "../base/AbstractRepository"

/**
 * Event Assignment Repository
 * Provides data access operations for the event_assignment model
 */
export class EventAssignmentRepository extends AbstractRepository<
  Prisma.event_assignmentGetPayload<{}>,
  Prisma.event_assignmentCreateInput,
  Prisma.event_assignmentUpdateInput,
  Prisma.event_assignmentWhereUniqueInput,
  Prisma.event_assignmentWhereInput
> {
  protected getModelName(): string {
    return "event_assignment"
  }

  /**
   * Find event assignments by event ID
   */
  async findByEventId(
    eventId: number,
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<Prisma.event_assignmentGetPayload<{}>[]> {
    return this.findMany(
      { event_id: eventId } as Prisma.event_assignmentWhereInput,
      undefined,
      client
    )
  }

  /**
   * Find event assignments by employee ID
   */
  async findByEmployeeId(
    employeeId: number,
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<Prisma.event_assignmentGetPayload<{}>[]> {
    return this.findMany(
      { employee_id: employeeId } as Prisma.event_assignmentWhereInput,
      undefined,
      client
    )
  }

  /**
   * Find first assignment for (event_id, employee_id) for uniqueness check
   */
  async findFirstByEventAndEmployee(
    eventId: number,
    employeeId: number,
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<Prisma.event_assignmentGetPayload<{}> | null> {
    return this.findFirst(
      {
        event_id: eventId,
        employee_id: employeeId,
      } as Prisma.event_assignmentWhereInput,
      undefined,
      client
    )
  }
}
