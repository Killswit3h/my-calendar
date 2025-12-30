import { Prisma, PrismaClient } from "@prisma/client"
import {
  ValidationError,
  NotFoundError,
  BusinessLogicError,
  type DomainError,
  type PaginationOptions,
  type PaginationResult,
} from "./types"
import type { AbstractRepository } from "./AbstractRepository"

/**
 * Abstract base service providing business logic patterns and lifecycle hooks
 *
 * @template TModel - The Prisma model type
 * @template TCreateInput - Prisma CreateInput type
 * @template TUpdateInput - Prisma UpdateInput type
 * @template TWhereUniqueInput - Prisma WhereUniqueInput type
 * @template TRepository - The repository type extending AbstractRepository
 */
export abstract class AbstractService<
  TModel,
  TCreateInput,
  TUpdateInput,
  TWhereUniqueInput,
  TRepository extends AbstractRepository<
    TModel,
    TCreateInput,
    TUpdateInput,
    TWhereUniqueInput,
    any
  >
> {
  /**
   * Repository instance - must be set by subclasses
   */
  protected abstract repository: TRepository

  /**
   * Validate data before create/update
   * Override in subclasses to add validation logic
   */
  protected async validate(
    data: TCreateInput | TUpdateInput,
    isUpdate: boolean = false
  ): Promise<void> {
    // Override in subclasses
  }

  /**
   * Hook called before create
   * Override in subclasses to add pre-create logic
   */
  protected async beforeCreate(data: TCreateInput): Promise<TCreateInput> {
    return data
  }

  /**
   * Hook called after create
   * Override in subclasses to add post-create logic
   */
  protected async afterCreate(entity: TModel): Promise<void> {
    // Override in subclasses
  }

  /**
   * Hook called before update
   * Override in subclasses to add pre-update logic
   */
  protected async beforeUpdate(
    id: number,
    data: TUpdateInput
  ): Promise<TUpdateInput> {
    return data
  }

  /**
   * Hook called after update
   * Override in subclasses to add post-update logic
   */
  protected async afterUpdate(entity: TModel): Promise<void> {
    // Override in subclasses
  }

  /**
   * Hook called before delete
   * Override in subclasses to add pre-delete validation
   */
  protected async beforeDelete(id: number): Promise<void> {
    // Override in subclasses to add business rule checks
  }

  /**
   * List records with optional filtering and pagination
   */
  async list(
    filters?: any,
    pagination?: PaginationOptions,
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<TModel[]> {
    const where = filters
    const options: any = {}

    if (pagination) {
      if (pagination.page && pagination.pageSize) {
        options.skip = (pagination.page - 1) * pagination.pageSize
        options.take = pagination.pageSize
      } else if (
        pagination.skip !== undefined &&
        pagination.take !== undefined
      ) {
        options.skip = pagination.skip
        options.take = pagination.take
      }
    }

    return this.repository.findMany(where, options, client)
  }

  /**
   * Get paginated results
   */
  async listPaginated(
    filters?: any,
    pagination: PaginationOptions = { page: 1, pageSize: 20 },
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<{ data: TModel[]; pagination: PaginationResult }> {
    const page = pagination.page ?? 1
    const pageSize = pagination.pageSize ?? 20
    const skip = (page - 1) * pageSize

    const [data, total] = await Promise.all([
      this.repository.findMany(filters, { skip, take: pageSize }, client),
      this.repository.count(filters, client),
    ])

    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  }

  /**
   * Get a record by ID
   */
  async getById(
    id: number,
    options?: {
      include?: any
      select?: any
    },
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<TModel> {
    const record = await this.repository.findUnique(
      { id } as TWhereUniqueInput,
      options,
      client
    )
    if (!record) {
      throw new NotFoundError(`Record with id ${id} not found`)
    }
    return record
  }

  /**
   * Create a new record with validation and lifecycle hooks
   */
  async create(
    data: TCreateInput,
    options?: {
      include?: any
      select?: any
    },
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<TModel> {
    // Validate
    await this.validate(data, false)

    // Pre-create hook
    const processedData = await this.beforeCreate(data)

    // Create
    const entity = await this.repository.create(processedData, options, client)

    // Post-create hook
    await this.afterCreate(entity)

    return entity
  }

  /**
   * Update a record with validation and lifecycle hooks
   */
  async update(
    id: number,
    data: TUpdateInput,
    options?: {
      include?: any
      select?: any
    },
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<TModel> {
    // Ensure record exists
    await this.getById(id, undefined, client)

    // Validate
    await this.validate(data, true)

    // Pre-update hook
    const processedData = await this.beforeUpdate(id, data)

    // Update
    const entity = await this.repository.update(
      { id } as TWhereUniqueInput,
      processedData,
      options,
      client
    )

    // Post-update hook
    await this.afterUpdate(entity)

    return entity
  }

  /**
   * Delete a record with business rule checks
   */
  async delete(
    id: number,
    client?: PrismaClient | Prisma.TransactionClient
  ): Promise<TModel> {
    // Ensure record exists
    await this.getById(id, undefined, client)

    // Pre-delete hook (for business rule validation)
    await this.beforeDelete(id)

    // Delete
    return this.repository.delete({ id } as TWhereUniqueInput, client)
  }

  /**
   * Execute operations within a transaction
   */
  async withTransaction<T>(
    callback: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    const prisma = await this.repository["getClient"]()
    if ("$transaction" in prisma) {
      return (prisma as PrismaClient).$transaction(callback)
    }
    // If already in a transaction, execute directly
    return callback(prisma as Prisma.TransactionClient)
  }
}
