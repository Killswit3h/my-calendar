import { Prisma } from "@prisma/client"
import { AbstractService } from "../base/AbstractService"
import { PayItemRepository } from "../repositories/PayItemRepository"
import {
  ValidationError,
  ConflictError,
} from "../base/types"

/**
 * Pay Item Service
 * Provides business logic for pay item operations
 */
export class PayItemService extends AbstractService<
  Prisma.pay_itemGetPayload<{}>,
  Prisma.pay_itemCreateInput,
  Prisma.pay_itemUpdateInput,
  Prisma.pay_itemWhereUniqueInput,
  PayItemRepository
> {
  protected repository: PayItemRepository

  constructor() {
    super()
    this.repository = new PayItemRepository()
  }

  /**
   * Validate pay item data
   */
  protected async validate(
    data: Prisma.pay_itemCreateInput | Prisma.pay_itemUpdateInput,
    isUpdate: boolean = false
  ): Promise<void> {
    // Number validation
    if (data.number !== undefined) {
      if (typeof data.number !== "string") {
        throw new ValidationError("number must be a string")
      }

      const trimmed = data.number.trim()
      if (!trimmed) {
        throw new ValidationError("number is required and cannot be empty")
      }

      if (trimmed.length > 64) {
        throw new ValidationError("number must be 64 characters or less")
      }
    } else if (!isUpdate) {
      // Number is required for create
      throw new ValidationError("number is required")
    }

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

    // Unit validation
    if (data.unit !== undefined) {
      if (typeof data.unit !== "string") {
        throw new ValidationError("unit must be a string")
      }

      const trimmed = data.unit.trim()
      if (!trimmed) {
        throw new ValidationError("unit is required and cannot be empty")
      }

      if (trimmed.length > 32) {
        throw new ValidationError("unit must be 32 characters or less")
      }
    } else if (!isUpdate) {
      // Unit is required for create
      throw new ValidationError("unit is required")
    }
  }

  /**
   * Hook called before create - check number uniqueness and trim fields
   */
  protected async beforeCreate(
    data: Prisma.pay_itemCreateInput
  ): Promise<Prisma.pay_itemCreateInput> {
    const processed: Prisma.pay_itemCreateInput = { ...data }
    
    if (data.number) {
      const trimmed = typeof data.number === "string" 
        ? data.number.trim() 
        : data.number
      
      // Check for existing pay item with same number (case-insensitive)
      const existing = await this.repository.findByNumber(trimmed as string)
      if (existing) {
        throw new ConflictError("A pay item with this number already exists")
      }
      
      processed.number = trimmed as string
    }
    
    // Trim description and unit if provided
    if (data.description && typeof data.description === "string") {
      processed.description = data.description.trim()
    }
    
    if (data.unit && typeof data.unit === "string") {
      processed.unit = data.unit.trim()
    }
    
    return processed
  }

  /**
   * Hook called before update - check number uniqueness if number is being changed
   */
  protected async beforeUpdate(
    id: number,
    data: Prisma.pay_itemUpdateInput
  ): Promise<Prisma.pay_itemUpdateInput> {
    if (data.number !== undefined && data.number !== null) {
      const trimmed = typeof data.number === "string"
        ? data.number.trim()
        : data.number

      const existing = await this.repository.findByNumber(trimmed as string)
      if (existing && existing.id !== id) {
        throw new ConflictError("A pay item with this number already exists")
      }

      // Ensure trimmed number is used
      return { ...data, number: trimmed as string }
    }
    
    // Also trim description and unit if provided
    const processed: Prisma.pay_itemUpdateInput = { ...data }
    
    if (data.description !== undefined && data.description !== null) {
      const trimmed = typeof data.description === "string"
        ? data.description.trim()
        : data.description
      processed.description = trimmed as string
    }
    
    if (data.unit !== undefined && data.unit !== null) {
      const trimmed = typeof data.unit === "string"
        ? data.unit.trim()
        : data.unit
      processed.unit = trimmed as string
    }
    
    return processed
  }
}
