import { Prisma, PrismaClient } from "@prisma/client"
import { AbstractRepository } from "../base/AbstractRepository"

/**
 * Project Pay Item Repository
 * Provides data access operations for the project_pay_item model
 */
export class ProjectPayItemRepository extends AbstractRepository<
  Prisma.project_pay_itemGetPayload<{}>,
  Prisma.project_pay_itemCreateInput,
  Prisma.project_pay_itemUpdateInput,
  Prisma.project_pay_itemWhereUniqueInput,
  Prisma.project_pay_itemWhereInput
> {
  protected getModelName(): string {
    return "project_pay_item"
  }

  /**
   * Find project pay items by project ID
   * Useful for filtering project pay items by project
   */
  async findByProjectId(
    projectId: number,
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<Prisma.project_pay_itemGetPayload<{}>[]> {
    return this.findMany(
      { project_id: projectId } as Prisma.project_pay_itemWhereInput,
      undefined,
      client
    )
  }

  /**
   * Find project pay items by pay item ID
   * Useful for filtering project pay items by pay item
   */
  async findByPayItemId(
    payItemId: number,
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<Prisma.project_pay_itemGetPayload<{}>[]> {
    return this.findMany(
      { pay_item_id: payItemId } as Prisma.project_pay_itemWhereInput,
      undefined,
      client
    )
  }
}
