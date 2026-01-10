import { Prisma, PrismaClient } from "@prisma/client"
import { AbstractRepository } from "../base/AbstractRepository"

/**
 * Pay Item Repository
 * Provides data access operations for the pay_item model
 */
export class PayItemRepository extends AbstractRepository<
  Prisma.pay_itemGetPayload<{}>,
  Prisma.pay_itemCreateInput,
  Prisma.pay_itemUpdateInput,
  Prisma.pay_itemWhereUniqueInput,
  Prisma.pay_itemWhereInput
> {
  protected getModelName(): string {
    return "pay_item"
  }

  /**
   * Find pay item by number (case-insensitive)
   */
  async findByNumber(
    number: string,
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<Prisma.pay_itemGetPayload<{}> | null> {
    return this.findFirst(
      { 
        number: {
          equals: number,
          mode: "insensitive"
        }
      } as Prisma.pay_itemWhereInput,
      undefined,
      client
    )
  }

  /**
   * Find multiple pay items by IDs
   * Useful for bulk lookups and validation
   */
  async findByIds(
    ids: number[],
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<Prisma.pay_itemGetPayload<{}>[]> {
    return this.findMany(
      { id: { in: ids } } as Prisma.pay_itemWhereInput,
      undefined,
      client
    )
  }
}
