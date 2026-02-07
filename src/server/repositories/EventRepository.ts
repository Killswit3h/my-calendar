import { Prisma } from "@prisma/client"
import { AbstractRepository } from "../base/AbstractRepository"

/**
 * Event Repository
 * Provides data access operations for the event model
 */
export class EventRepository extends AbstractRepository<
  Prisma.eventGetPayload<{}>,
  Prisma.eventCreateInput,
  Prisma.eventUpdateInput,
  Prisma.eventWhereUniqueInput,
  Prisma.eventWhereInput
> {
  protected getModelName(): string {
    return "event"
  }
}
