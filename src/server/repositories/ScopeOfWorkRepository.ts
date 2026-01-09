import { Prisma, PrismaClient } from "@prisma/client"
import { AbstractRepository } from "../base/AbstractRepository"

/**
 * Scope of Work Repository
 * Provides data access operations for the scope_of_work model
 */
export class ScopeOfWorkRepository extends AbstractRepository<
  Prisma.scope_of_workGetPayload<{}>,
  Prisma.scope_of_workCreateInput,
  Prisma.scope_of_workUpdateInput,
  Prisma.scope_of_workWhereUniqueInput,
  Prisma.scope_of_workWhereInput
> {
  protected getModelName(): string {
    return "scope_of_work"
  }

  /**
   * Find scope of work by description
   */
  async findByDescription(
    description: string,
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<Prisma.scope_of_workGetPayload<{}> | null> {
    return this.findFirst(
      { description } as Prisma.scope_of_workWhereInput,
      undefined,
      client
    )
  }

  /**
   * Find multiple scopes of work by IDs
   * Useful for bulk lookups and validation
   */
  async findByIds(
    ids: number[],
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<Prisma.scope_of_workGetPayload<{}>[]> {
    return this.findMany(
      { id: { in: ids } } as Prisma.scope_of_workWhereInput,
      undefined,
      client
    )
  }
}
