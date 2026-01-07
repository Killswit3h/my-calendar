import { Prisma, PrismaClient } from "@prisma/client"
import { AbstractRepository } from "../base/AbstractRepository"

/**
 * Customer Repository
 * Provides data access operations for the customer model
 */
export class CustomerRepository extends AbstractRepository<
  Prisma.customerGetPayload<{}>,
  Prisma.customerCreateInput,
  Prisma.customerUpdateInput,
  Prisma.customerWhereUniqueInput,
  Prisma.customerWhereInput
> {
  protected getModelName(): string {
    return "customer"
  }

  /**
   * Find customer by email
   */
  async findByEmail(
    email: string,
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<Prisma.customerGetPayload<{}> | null> {
    return this.findFirst(
      { email } as Prisma.customerWhereInput,
      undefined,
      client
    )
  }

  /**
   * Search customers by name (case-insensitive partial match)
   */
  async searchByName(
    query: string,
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<Prisma.customerGetPayload<{}>[]> {
    return this.findMany(
      {
        name: {
          contains: query,
          mode: "insensitive",
        },
      } as Prisma.customerWhereInput,
      undefined,
      client
    )
  }
}
