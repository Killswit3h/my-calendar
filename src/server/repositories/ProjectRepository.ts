import { Prisma, PrismaClient } from "@prisma/client"
import { AbstractRepository } from "../base/AbstractRepository"

/**
 * Project Repository
 * Provides data access operations for the project model
 */
export class ProjectRepository extends AbstractRepository<
  Prisma.projectGetPayload<{}>,
  Prisma.projectCreateInput,
  Prisma.projectUpdateInput,
  Prisma.projectWhereUniqueInput,
  Prisma.projectWhereInput
> {
  protected getModelName(): string {
    return "project"
  }

  /**
   * Find project by name (case-insensitive)
   */
  async findByName(
    name: string,
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<Prisma.projectGetPayload<{}> | null> {
    return this.findFirst(
      { 
        name: {
          equals: name,
          mode: "insensitive"
        }
      } as Prisma.projectWhereInput,
      undefined,
      client
    )
  }

  /**
   * Find multiple projects by IDs
   * Useful for bulk lookups and validation
   */
  async findByIds(
    ids: number[],
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<Prisma.projectGetPayload<{}>[]> {
    return this.findMany(
      { id: { in: ids } } as Prisma.projectWhereInput,
      undefined,
      client
    )
  }

  /**
   * Find projects by customer ID
   * Useful for filtering projects by customer
   */
  async findByCustomerId(
    customerId: number,
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<Prisma.projectGetPayload<{}>[]> {
    return this.findMany(
      { customer_id: customerId } as Prisma.projectWhereInput,
      undefined,
      client
    )
  }
}
