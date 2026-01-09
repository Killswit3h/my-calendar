import { Prisma } from "@prisma/client"
import { AbstractService } from "../base/AbstractService"
import { ScopeOfWorkRepository } from "../repositories/ScopeOfWorkRepository"
import {
  ValidationError,
  ConflictError,
} from "../base/types"

/**
 * Scope of Work Service
 * Provides business logic for scope of work operations
 */
export class ScopeOfWorkService extends AbstractService<
  Prisma.scope_of_workGetPayload<{}>,
  Prisma.scope_of_workCreateInput,
  Prisma.scope_of_workUpdateInput,
  Prisma.scope_of_workWhereUniqueInput,
  ScopeOfWorkRepository
> {
  protected repository: ScopeOfWorkRepository

  constructor() {
    super()
    this.repository = new ScopeOfWorkRepository()
  }

  /**
   * Validate scope of work data
   */
  protected async validate(
    data: Prisma.scope_of_workCreateInput | Prisma.scope_of_workUpdateInput,
    isUpdate: boolean = false
  ): Promise<void> {
    // Description validation
    if (data.description !== undefined) {
      if (typeof data.description !== "string") {
        throw new ValidationError("description must be a string")
      }

      const trimmed = data.description.trim()
      if (!trimmed) {
        throw new ValidationError("description is required and cannot be empty")
      }

      if (trimmed.length > 255) {
        throw new ValidationError("description must be 255 characters or less")
      }
    } else if (!isUpdate) {
      // Description is required for create
      throw new ValidationError("description is required")
    }
  }

  /**
   * Hook called before create - check description uniqueness
   */
  protected async beforeCreate(
    data: Prisma.scope_of_workCreateInput
  ): Promise<Prisma.scope_of_workCreateInput> {
    if (data.description) {
      const trimmed = typeof data.description === "string" 
        ? data.description.trim() 
        : data.description
      
      const existing = await this.repository.findByDescription(trimmed as string)
      if (existing) {
        throw new ConflictError("A scope of work with this description already exists")
      }
      
      // Ensure trimmed description is used
      return { ...data, description: trimmed as string }
    }
    return data
  }

  /**
   * Hook called before update - check description uniqueness if description is being changed
   */
  protected async beforeUpdate(
    id: number,
    data: Prisma.scope_of_workUpdateInput
  ): Promise<Prisma.scope_of_workUpdateInput> {
    if (data.description !== undefined && data.description !== null) {
      const trimmed = typeof data.description === "string"
        ? data.description.trim()
        : data.description

      const existing = await this.repository.findByDescription(trimmed as string)
      if (existing && existing.id !== id) {
        throw new ConflictError("A scope of work with this description already exists")
      }

      // Ensure trimmed description is used
      return { ...data, description: trimmed as string }
    }
    return data
  }
}
