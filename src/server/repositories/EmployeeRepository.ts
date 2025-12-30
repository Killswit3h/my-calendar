import { Prisma, PrismaClient } from "@prisma/client"
import { AbstractRepository } from "../base/AbstractRepository"

/**
 * Employee Repository
 * Provides data access operations for the employee model
 */
export class EmployeeRepository extends AbstractRepository<
  Prisma.employeeGetPayload<{}>,
  Prisma.employeeCreateInput,
  Prisma.employeeUpdateInput,
  Prisma.employeeWhereUniqueInput,
  Prisma.employeeWhereInput
> {
  protected getModelName(): string {
    return "employee"
  }

  /**
   * Find employee by email
   */
  async findByEmail(
    email: string,
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<Prisma.employeeGetPayload<{}> | null> {
    return this.findFirst(
      { email } as Prisma.employeeWhereInput,
      undefined,
      client
    )
  }

  /**
   * Find all active employees
   */
  async findActive(
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<Prisma.employeeGetPayload<{}>[]> {
    return this.findMany(
      { active: true } as Prisma.employeeWhereInput,
      undefined,
      client
    )
  }
}

