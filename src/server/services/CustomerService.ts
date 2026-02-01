import { Prisma } from "@prisma/client"
import { AbstractService } from "../base/AbstractService"
import { CustomerRepository } from "../repositories/CustomerRepository"
import { ValidationError, ConflictError } from "../base/types"

/**
 * Customer Service
 * Provides business logic for customer operations
 */
export class CustomerService extends AbstractService<
  Prisma.customerGetPayload<{}>,
  Prisma.customerCreateInput,
  Prisma.customerUpdateInput,
  Prisma.customerWhereUniqueInput,
  CustomerRepository
> {
  protected repository: CustomerRepository

  constructor() {
    super()
    this.repository = new CustomerRepository()
  }

  /**
   * Validate customer data
   */
  protected async validate(
    data: Prisma.customerCreateInput | Prisma.customerUpdateInput,
    isUpdate: boolean = false
  ): Promise<void> {
    // Required fields validation (only for create)
    if (!isUpdate) {
      if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
        throw new ValidationError(
          "name is required and must be a non-empty string"
        )
      }

      if (
        !data.address ||
        typeof data.address !== "string" ||
        !data.address.trim()
      ) {
        throw new ValidationError(
          "address is required and must be a non-empty string"
        )
      }

      if (
        !data.phone_number ||
        typeof data.phone_number !== "string" ||
        !data.phone_number.trim()
      ) {
        throw new ValidationError(
          "phone_number is required and must be a non-empty string"
        )
      }
    }

    // Email format validation (if provided)
    if (data.email !== undefined && data.email !== null) {
      if (typeof data.email !== "string") {
        throw new ValidationError("email must be a string")
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.email)) {
        throw new ValidationError("email must be a valid email format")
      }
    }

    // Normalize string fields (trim whitespace)
    if (data.name && typeof data.name === "string") {
      ;(data as any).name = data.name.trim()
    }
    if (data.address && typeof data.address === "string") {
      ;(data as any).address = data.address.trim()
    }
    if (data.phone_number && typeof data.phone_number === "string") {
      ;(data as any).phone_number = data.phone_number.trim()
    }
    if (data.email && typeof data.email === "string") {
      ;(data as any).email = data.email.trim()
    }
    if (data.notes && typeof data.notes === "string") {
      ;(data as any).notes = data.notes.trim() || null
    }
  }

  /**
   * Hook called before create - check email uniqueness
   */
  protected async beforeCreate(
    data: Prisma.customerCreateInput
  ): Promise<Prisma.customerCreateInput> {
    if (data.email) {
      const existing = await this.repository.findByEmail(data.email)
      if (existing) {
        throw new ConflictError("A customer with this email already exists")
      }
    }
    return data
  }

  /**
   * Hook called before update - check email uniqueness if email is being changed
   */
  protected async beforeUpdate(
    id: number,
    data: Prisma.customerUpdateInput
  ): Promise<Prisma.customerUpdateInput> {
    if (data.email !== undefined && data.email !== null) {
      const existing = await this.repository.findByEmail(data.email as string)
      if (existing && existing.id !== id) {
        throw new ConflictError("A customer with this email already exists")
      }
    }
    return data
  }

  /**
   * Search customers by name (case-insensitive partial match)
   */
  async searchByName(query: string): Promise<Prisma.customerGetPayload<{}>[]> {
    return this.repository.searchByName(query)
  }

  /**
   * Merge or create customer by email
   * If email is provided and a customer exists with that email, update it.
   * Otherwise, create a new customer.
   */
  async mergeOrCreateByEmail(
    payload: Prisma.customerCreateInput
  ): Promise<Prisma.customerGetPayload<{}>> {
    if (!payload.email) {
      // If no email, just create normally
      return this.create(payload)
    }

    const existing = await this.repository.findByEmail(payload.email)
    if (existing) {
      // Merge: update existing customer with new data
      return this.update(existing.id, payload as Prisma.customerUpdateInput)
    }

    // Create new customer
    return this.create(payload)
  }
}
