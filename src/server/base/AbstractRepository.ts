import { Prisma, PrismaClient } from "@prisma/client"
import { getPrisma } from "@/lib/db"
import {
  DatabaseError,
  NotFoundError,
  ConflictError,
  DomainError,
} from "./types"

/**
 * Abstract base repository providing generic CRUD operations for Prisma models
 *
 * @template TModel - The Prisma model type (e.g., Prisma.customerGetPayload<{}>)
 * @template TCreateInput - Prisma CreateInput type (e.g., Prisma.customerCreateInput)
 * @template TUpdateInput - Prisma UpdateInput type (e.g., Prisma.customerUpdateInput)
 * @template TWhereUniqueInput - Prisma WhereUniqueInput type (e.g., Prisma.customerWhereUniqueInput)
 * @template TWhereInput - Prisma WhereInput type (e.g., Prisma.customerWhereInput)
 */
export abstract class AbstractRepository<
  TModel,
  TCreateInput,
  TUpdateInput,
  TWhereUniqueInput,
  TWhereInput
> {
  /**
   * Get the Prisma model name (e.g., 'customer', 'employee')
   * Must be implemented by subclasses
   */
  protected abstract getModelName(): string

  /**
   * Get Prisma client or transaction client
   */
  protected async getClient(): Promise<
    PrismaClient | Prisma.TransactionClient
  > {
    return await getPrisma()
  }

  /**
   * Get the Prisma model delegate from the client
   */
  protected async getModelDelegate(
    client?: PrismaClient | Prisma.TransactionClient
  ) {
    const prisma = client ?? (await this.getClient())
    const modelName = this.getModelName()
    return (prisma as any)[modelName] as {
      findMany: (args?: any) => Promise<TModel[]>
      findUnique: (args: any) => Promise<TModel | null>
      findFirst: (args?: any) => Promise<TModel | null>
      create: (args: any) => Promise<TModel>
      update: (args: any) => Promise<TModel>
      delete: (args: any) => Promise<TModel>
      upsert: (args: any) => Promise<TModel>
      count: (args?: any) => Promise<number>
    }
  }

  /**
   * Transform Prisma errors to domain errors
   */
  protected handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case "P2002":
          // Unique constraint violation
          const target = Array.isArray(error.meta?.target)
            ? error.meta.target.join(", ")
            : String(error.meta?.target ?? "field")
          throw new ConflictError(
            `A record with this ${target} already exists`,
            {
              cause: error,
              meta: { target: error.meta?.target },
            }
          )
        case "P2025":
          // Record not found
          throw new NotFoundError("Record not found", { cause: error })
        case "P2003":
          // Foreign key constraint violation
          throw new ConflictError(
            "Cannot perform operation due to related records",
            { cause: error }
          )
        default:
          throw new DatabaseError(`Database error: ${error.message}`, {
            cause: error,
          })
      }
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
      throw new DatabaseError(`Validation error: ${error.message}`, {
        cause: error,
      })
    }
    // Re-throw domain errors as-is
    if (error instanceof DomainError) {
      throw error
    }
    // Wrap unknown errors
    throw new DatabaseError("An unexpected database error occurred", {
      cause: error,
    })
  }

  /**
   * Find many records
   */
  async findMany(
    where?: TWhereInput,
    options?: {
      include?: any
      select?: any
      orderBy?: any
      take?: number
      skip?: number
    },
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<TModel[]> {
    try {
      const model = await this.getModelDelegate(client)
      return await model.findMany({
        where,
        ...options,
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  /**
   * Find a unique record
   */
  async findUnique(
    where: TWhereUniqueInput,
    options?: {
      include?: any
      select?: any
    },
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<TModel | null> {
    try {
      const model = await this.getModelDelegate(client)
      return await model.findUnique({
        where,
        ...options,
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  /**
   * Find first record matching criteria
   */
  async findFirst(
    where?: TWhereInput,
    options?: {
      include?: any
      select?: any
      orderBy?: any
    },
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<TModel | null> {
    try {
      const model = await this.getModelDelegate(client)
      return await model.findFirst({
        where,
        ...options,
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  /**
   * Create a new record
   */
  async create(
    data: TCreateInput,
    options?: {
      include?: any
      select?: any
    },
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<TModel> {
    try {
      const model = await this.getModelDelegate(client)
      return await model.create({
        data,
        ...options,
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  /**
   * Update a record
   */
  async update(
    where: TWhereUniqueInput,
    data: TUpdateInput,
    options?: {
      include?: any
      select?: any
    },
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<TModel> {
    try {
      const model = await this.getModelDelegate(client)
      return await model.update({
        where,
        data,
        ...options,
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  /**
   * Delete a record
   */
  async delete(
    where: TWhereUniqueInput,
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<TModel> {
    try {
      const model = await this.getModelDelegate(client)
      return await model.delete({
        where,
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  /**
   * Upsert a record (create or update)
   */
  async upsert(
    where: TWhereUniqueInput,
    create: TCreateInput,
    update: TUpdateInput,
    options?: {
      include?: any
      select?: any
    },
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<TModel> {
    try {
      const model = await this.getModelDelegate(client)
      return await model.upsert({
        where,
        create,
        update,
        ...options,
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  /**
   * Count records matching criteria
   */
  async count(
    where?: TWhereInput,
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<number> {
    try {
      const model = await this.getModelDelegate(client)
      return await model.count({
        where,
      })
    } catch (error) {
      this.handlePrismaError(error)
    }
  }

  /**
   * Check if a record exists
   */
  async exists(
    where: TWhereUniqueInput,
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<boolean> {
    try {
      const record = await this.findUnique(where, undefined, client)
      return record !== null
    } catch (error) {
      this.handlePrismaError(error)
    }
  }
}
