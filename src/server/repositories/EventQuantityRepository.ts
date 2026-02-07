import { Prisma, PrismaClient } from "@prisma/client"
import { AbstractRepository } from "../base/AbstractRepository"

/**
 * Event Quantity Repository
 * Provides data access operations for the event_quantity model
 */
export class EventQuantityRepository extends AbstractRepository<
  Prisma.event_quantityGetPayload<{}>,
  Prisma.event_quantityCreateInput,
  Prisma.event_quantityUpdateInput,
  Prisma.event_quantityWhereUniqueInput,
  Prisma.event_quantityWhereInput
> {
  protected getModelName(): string {
    return "event_quantity"
  }

  /**
   * Find event quantities by event ID
   * Useful for filtering event quantities by event
   */
  async findByEventId(
    eventId: number,
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<Prisma.event_quantityGetPayload<{}>[]> {
    return this.findMany(
      { event_id: eventId } as Prisma.event_quantityWhereInput,
      undefined,
      client
    )
  }

  /**
   * Find event quantities by project pay item ID
   * Useful for filtering event quantities by project pay item
   */
  async findByProjectPayItemId(
    projectPayItemId: number,
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<Prisma.event_quantityGetPayload<{}>[]> {
    return this.findMany(
      { project_pay_item_id: projectPayItemId } as Prisma.event_quantityWhereInput,
      undefined,
      client
    )
  }
}
