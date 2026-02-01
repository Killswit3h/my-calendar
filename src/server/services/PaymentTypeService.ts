import { Prisma } from "@prisma/client"
import { AbstractService } from "../base/AbstractService"
import { PaymentTypeRepository } from "../repositories/PaymentTypeRepository"
import {
  ValidationError,
  ConflictError,
} from "../base/types"

/**
 * Payment Type Service
 * Provides business logic for payment type operations
 */
export class PaymentTypeService extends AbstractService<
  Prisma.payment_typeGetPayload<{}>,
  Prisma.payment_typeCreateInput,
  Prisma.payment_typeUpdateInput,
  Prisma.payment_typeWhereUniqueInput,
  PaymentTypeRepository
> {
  protected repository: PaymentTypeRepository

  constructor() {
    super()
    this.repository = new PaymentTypeRepository()
  }

  /**
   * Validate payment type data
   */
  protected async validate(
    data: Prisma.payment_typeCreateInput | Prisma.payment_typeUpdateInput,
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
    data: Prisma.payment_typeCreateInput
  ): Promise<Prisma.payment_typeCreateInput> {
    if (data.description) {
      const trimmed = typeof data.description === "string" 
        ? data.description.trim() 
        : data.description
      
      const existing = await this.repository.findByDescription(trimmed as string)
      if (existing) {
        throw new ConflictError("A payment type with this description already exists")
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
    data: Prisma.payment_typeUpdateInput
  ): Promise<Prisma.payment_typeUpdateInput> {
    if (data.description !== undefined && data.description !== null) {
      const trimmed = typeof data.description === "string"
        ? data.description.trim()
        : data.description

      const existing = await this.repository.findByDescription(trimmed as string)
      if (existing && existing.id !== id) {
        throw new ConflictError("A payment type with this description already exists")
      }

      // Ensure trimmed description is used
      return { ...data, description: trimmed as string }
    }
    return data
  }
}
