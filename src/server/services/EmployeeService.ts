import { Prisma } from "@prisma/client"
import { AbstractService } from "../base/AbstractService"
import { EmployeeRepository } from "../repositories/EmployeeRepository"
import {
  ValidationError,
  ConflictError,
} from "../base/types"

/**
 * Employee Service
 * Provides business logic for employee operations
 */
export class EmployeeService extends AbstractService<
  Prisma.employeeGetPayload<{}>,
  Prisma.employeeCreateInput,
  Prisma.employeeUpdateInput,
  Prisma.employeeWhereUniqueInput,
  EmployeeRepository
> {
  protected repository: EmployeeRepository

  constructor() {
    super()
    this.repository = new EmployeeRepository()
  }

  /**
   * Validate employee data
   */
  protected async validate(
    data: Prisma.employeeCreateInput | Prisma.employeeUpdateInput,
    isUpdate: boolean = false
  ): Promise<void> {
    // Required fields validation (only for create)
    if (!isUpdate) {
      if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
        throw new ValidationError("name is required and must be a non-empty string")
      }

      // Validate wage_rate - can be number, string, or Prisma.Decimal
      if (data.wage_rate === undefined || data.wage_rate === null) {
        throw new ValidationError(
          "wage_rate is required and must be a positive decimal"
        )
      }

      let wageRateValue: number
      if (typeof data.wage_rate === "number") {
        wageRateValue = data.wage_rate
      } else if (typeof data.wage_rate === "string") {
        wageRateValue = parseFloat(data.wage_rate)
      } else if (data.wage_rate instanceof Prisma.Decimal) {
        wageRateValue = data.wage_rate.toNumber()
      } else {
        throw new ValidationError(
          "wage_rate must be a number, string, or Prisma.Decimal"
        )
      }

      if (isNaN(wageRateValue) || wageRateValue <= 0) {
        throw new ValidationError(
          "wage_rate must be a positive decimal"
        )
      }

      if (!data.start_date) {
        throw new ValidationError("start_date is required")
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

    // Phone number format validation (if provided)
    if (data.phone_number !== undefined && data.phone_number !== null) {
      if (typeof data.phone_number !== "string") {
        throw new ValidationError("phone_number must be a string")
      }
    }

    // Notes validation (if provided)
    if (data.notes !== undefined && data.notes !== null) {
      if (typeof data.notes !== "string") {
        throw new ValidationError("notes must be a string")
      }
      // Trim and validate length
      const trimmed = data.notes.trim()
      if (trimmed.length > 0 && trimmed.length > 10000) {
        throw new ValidationError("notes must be less than 10000 characters")
      }
    }

    // Role validation (if provided)
    if (data.role !== undefined && data.role !== null) {
      if (typeof data.role !== "string") {
        throw new ValidationError("role must be a string")
      }
      const trimmed = data.role.trim()
      if (trimmed.length > 255) {
        throw new ValidationError("role must be less than 255 characters")
      }
    }

    // Location validation (if provided)
    if (data.location !== undefined && data.location !== null) {
      if (typeof data.location !== "string") {
        throw new ValidationError("location must be a string")
      }
      const trimmed = data.location.trim()
      if (trimmed.length > 64) {
        throw new ValidationError("location must be less than 64 characters")
      }
    }
  }

  /**
   * Hook called before create - check email uniqueness and normalize fields
   */
  protected async beforeCreate(
    data: Prisma.employeeCreateInput
  ): Promise<Prisma.employeeCreateInput> {
    if (data.email) {
      const existing = await this.repository.findByEmail(data.email)
      if (existing) {
        throw new ConflictError("An employee with this email already exists")
      }
    }

    // Normalize optional string fields: trim and set to null if empty
    const normalized: Prisma.employeeCreateInput = { ...data }
    if (normalized.notes !== undefined && typeof normalized.notes === "string") {
      normalized.notes = normalized.notes.trim() || null
    }
    if (normalized.role !== undefined && typeof normalized.role === "string") {
      normalized.role = normalized.role.trim() || null
    }
    if (normalized.location !== undefined && typeof normalized.location === "string") {
      normalized.location = normalized.location.trim() || null
    }

    return normalized
  }

  /**
   * Hook called before update - check email uniqueness if email is being changed and normalize fields
   */
  protected async beforeUpdate(
    id: number,
    data: Prisma.employeeUpdateInput
  ): Promise<Prisma.employeeUpdateInput> {
    if (data.email !== undefined && data.email !== null) {
      const existing = await this.repository.findByEmail(data.email as string)
      if (existing && existing.id !== id) {
        throw new ConflictError("An employee with this email already exists")
      }
    }

    // Normalize optional string fields: trim and set to null if empty
    const normalized: Prisma.employeeUpdateInput = { ...data }
    if (normalized.notes !== undefined && normalized.notes !== null && typeof normalized.notes === "string") {
      normalized.notes = normalized.notes.trim() || null
    }
    if (normalized.role !== undefined && normalized.role !== null && typeof normalized.role === "string") {
      normalized.role = normalized.role.trim() || null
    }
    if (normalized.location !== undefined && normalized.location !== null && typeof normalized.location === "string") {
      normalized.location = normalized.location.trim() || null
    }

    return normalized
  }

  /**
   * Activate an employee
   */
  async activateEmployee(
    id: number
  ): Promise<Prisma.employeeGetPayload<{}>> {
    return this.update(id, { active: true })
  }

  /**
   * Deactivate an employee
   */
  async deactivateEmployee(
    id: number
  ): Promise<Prisma.employeeGetPayload<{}>> {
    return this.update(id, { active: false })
  }
}

