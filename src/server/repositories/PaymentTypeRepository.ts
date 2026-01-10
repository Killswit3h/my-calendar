import { Prisma, PrismaClient } from "@prisma/client"
import { AbstractRepository } from "../base/AbstractRepository"

/**
 * Payment Type Repository
 * Provides data access operations for the payment_type model
 */
export class PaymentTypeRepository extends AbstractRepository<
  Prisma.payment_typeGetPayload<{}>,
  Prisma.payment_typeCreateInput,
  Prisma.payment_typeUpdateInput,
  Prisma.payment_typeWhereUniqueInput,
  Prisma.payment_typeWhereInput
> {
  protected getModelName(): string {
    return "payment_type"
  }

  /**
   * Find payment type by description
   */
  async findByDescription(
    description: string,
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<Prisma.payment_typeGetPayload<{}> | null> {
    return this.findFirst(
      { description } as Prisma.payment_typeWhereInput,
      undefined,
      client
    )
  }

  /**
   * Find multiple payment types by IDs
   * Useful for bulk lookups and validation
   */
  async findByIds(
    ids: number[],
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<Prisma.payment_typeGetPayload<{}>[]> {
    return this.findMany(
      { id: { in: ids } } as Prisma.payment_typeWhereInput,
      undefined,
      client
    )
  }
}
