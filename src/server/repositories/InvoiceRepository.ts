import { Prisma, PrismaClient } from "@prisma/client"
import { AbstractRepository } from "../base/AbstractRepository"

/**
 * Invoice Repository
 * Provides data access operations for the invoice model
 */
export class InvoiceRepository extends AbstractRepository<
  Prisma.invoiceGetPayload<{}>,
  Prisma.invoiceCreateInput,
  Prisma.invoiceUpdateInput,
  Prisma.invoiceWhereUniqueInput,
  Prisma.invoiceWhereInput
> {
  protected getModelName(): string {
    return "invoice"
  }

  /**
   * Find invoice by number (case-insensitive)
   */
  async findByNumber(
    number: string,
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<Prisma.invoiceGetPayload<{}> | null> {
    return this.findFirst(
      { 
        number: {
          equals: number,
          mode: "insensitive"
        }
      } as Prisma.invoiceWhereInput,
      undefined,
      client
    )
  }

  /**
   * Find multiple invoices by IDs
   * Useful for bulk lookups and validation
   */
  async findByIds(
    ids: number[],
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<Prisma.invoiceGetPayload<{}>[]> {
    return this.findMany(
      { id: { in: ids } } as Prisma.invoiceWhereInput,
      undefined,
      client
    )
  }
}
