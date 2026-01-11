import { Prisma } from "@prisma/client"
import { AbstractService } from "../base/AbstractService"
import { ProjectRepository } from "../repositories/ProjectRepository"
import { ValidationError, ConflictError } from "../base/types"
import { getPrisma } from "@/lib/db"

/**
 * Valid project status values
 */
export const PROJECT_STATUS_VALUES = [
  "Not Started",
  "In Progress",
  "Completed",
] as const

export type ProjectStatus = (typeof PROJECT_STATUS_VALUES)[number]

/**
 * Project Service
 * Provides business logic for project operations
 */
export class ProjectService extends AbstractService<
  Prisma.projectGetPayload<{}>,
  Prisma.projectCreateInput,
  Prisma.projectUpdateInput,
  Prisma.projectWhereUniqueInput,
  ProjectRepository
> {
  protected repository: ProjectRepository

  constructor() {
    super()
    this.repository = new ProjectRepository()
  }

  /**
   * Validate project data
   */
  protected async validate(
    data: Prisma.projectCreateInput | Prisma.projectUpdateInput,
    isUpdate: boolean = false
  ): Promise<void> {
    // Name validation
    if (data.name !== undefined) {
      if (typeof data.name !== "string") {
        throw new ValidationError("name must be a string")
      }

      const trimmed = data.name.trim()
      if (!trimmed) {
        throw new ValidationError("name is required and cannot be empty")
      }

      if (trimmed.length > 255) {
        throw new ValidationError("name must be 255 characters or less")
      }
    } else if (!isUpdate) {
      // Name is required for create
      throw new ValidationError("name is required")
    }

    // Location validation
    if (data.location !== undefined) {
      if (typeof data.location !== "string") {
        throw new ValidationError("location must be a string")
      }

      const trimmed = data.location.trim()
      if (!trimmed) {
        throw new ValidationError("location is required and cannot be empty")
      }

      if (trimmed.length > 255) {
        throw new ValidationError("location must be 255 characters or less")
      }
    } else if (!isUpdate) {
      // Location is required for create
      throw new ValidationError("location is required")
    }

    // Retainage validation
    if (data.retainage !== undefined) {
      let decimalValue: Prisma.Decimal

      if (data.retainage instanceof Prisma.Decimal) {
        decimalValue = data.retainage
      } else if (typeof data.retainage === "number") {
        if (!Number.isFinite(data.retainage)) {
          throw new ValidationError("retainage must be a finite number")
        }
        decimalValue = new Prisma.Decimal(data.retainage)
      } else if (typeof data.retainage === "string") {
        try {
          decimalValue = new Prisma.Decimal(data.retainage.trim())
        } catch {
          throw new ValidationError("retainage must be a valid number")
        }
      } else {
        throw new ValidationError("retainage must be a number or Decimal")
      }

      if (decimalValue.isNaN()) {
        throw new ValidationError("retainage must be a valid number")
      }

      if (decimalValue.lt(0)) {
        throw new ValidationError("retainage must be non-negative")
      }
    } else if (!isUpdate) {
      // Retainage is required for create
      throw new ValidationError("retainage is required")
    }

    // Vendor validation
    if (data.vendor !== undefined) {
      if (typeof data.vendor !== "string") {
        throw new ValidationError("vendor must be a string")
      }

      const trimmed = data.vendor.trim()
      if (!trimmed) {
        throw new ValidationError("vendor is required and cannot be empty")
      }

      if (trimmed.length > 255) {
        throw new ValidationError("vendor must be 255 characters or less")
      }
    } else if (!isUpdate) {
      // Vendor is required for create
      throw new ValidationError("vendor is required")
    }

    // Customer ID validation (optional but must reference valid customer if provided)
    // Handle both direct customer_id (from API) and Prisma relation format
    const dataAny = data as any
    let customerId: number | undefined | null = undefined

    if (dataAny.customer_id !== undefined && dataAny.customer_id !== null) {
      customerId = dataAny.customer_id as number
    } else if (
      data.customer &&
      typeof data.customer === "object" &&
      "connect" in data.customer &&
      data.customer.connect &&
      typeof data.customer.connect === "object" &&
      "id" in data.customer.connect
    ) {
      customerId = (data.customer.connect as { id: number }).id
    }

    if (customerId !== undefined && customerId !== null) {
      if (
        typeof customerId !== "number" ||
        !Number.isInteger(customerId) ||
        customerId <= 0
      ) {
        throw new ValidationError("customer_id must be a positive integer")
      }

      // Check if customer exists
      const prisma = await getPrisma()
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { id: true },
      })

      if (!customer) {
        throw new ValidationError(`Customer with id ${customerId} not found`)
      }
    }

    // Optional boolean fields validation
    if (data.is_payroll !== undefined && data.is_payroll !== null) {
      if (typeof data.is_payroll !== "boolean") {
        throw new ValidationError("is_payroll must be a boolean")
      }
    }

    if (data.is_EEO !== undefined && data.is_EEO !== null) {
      if (typeof data.is_EEO !== "boolean") {
        throw new ValidationError("is_EEO must be a boolean")
      }
    }

    // Status validation (optional string, must be one of the allowed enum values)
    if (data.status !== undefined && data.status !== null) {
      if (typeof data.status !== "string") {
        throw new ValidationError("status must be a string")
      }

      const trimmed = data.status.trim()
      if (!PROJECT_STATUS_VALUES.includes(trimmed as ProjectStatus)) {
        throw new ValidationError(
          `status must be one of: ${PROJECT_STATUS_VALUES.join(", ")}`
        )
      }
    }
  }

  /**
   * Normalize customer_id to Prisma relation format
   * Converts API's customer_id to customer: { connect: { id: ... } }
   * or customer: { disconnect: true } if customer_id is null
   */
  private normalizeCustomerRelation(
    data: Prisma.projectCreateInput | Prisma.projectUpdateInput,
    allowDisconnect: boolean = false
  ):
    | Prisma.customerCreateNestedOneWithoutProjectInput
    | Prisma.customerUpdateOneWithoutProjectNestedInput
    | undefined {
    const dataAny = data as any

    if (dataAny.customer_id !== undefined && dataAny.customer_id !== null) {
      // Convert customer_id from API to Prisma relation format
      return {
        connect: { id: dataAny.customer_id },
      }
    } else if (allowDisconnect && dataAny.customer_id === null) {
      // Explicitly setting to null - disconnect the relation (only for updates)
      return { disconnect: true }
    }

    // If customer is already in Prisma format, return undefined to let it pass through
    return undefined
  }

  /**
   * Hook called before create - check name uniqueness and set defaults
   */
  protected async beforeCreate(
    data: Prisma.projectCreateInput
  ): Promise<Prisma.projectCreateInput> {
    const processed: Prisma.projectCreateInput = { ...data }

    if (data.name) {
      const trimmed =
        typeof data.name === "string" ? data.name.trim() : data.name

      // Check for existing project with same name (case-insensitive)
      const existing = await this.repository.findByName(trimmed as string)
      if (existing) {
        throw new ConflictError("A project with this name already exists")
      }

      processed.name = trimmed as string
    }

    // Trim location and vendor
    if (data.location && typeof data.location === "string") {
      processed.location = data.location.trim()
    }

    if (data.vendor && typeof data.vendor === "string") {
      processed.vendor = data.vendor.trim()
    }

    // Normalize customer_id to Prisma relation format
    const normalizedCustomer = this.normalizeCustomerRelation(data, false)
    if (normalizedCustomer) {
      processed.customer =
        normalizedCustomer as Prisma.customerCreateNestedOneWithoutProjectInput
    }

    // Set defaults for optional fields
    if (processed.is_payroll === undefined || processed.is_payroll === null) {
      processed.is_payroll = false
    }

    if (processed.is_EEO === undefined || processed.is_EEO === null) {
      processed.is_EEO = false
    }

    if (processed.status === undefined || processed.status === null) {
      processed.status = "Not Started"
    } else if (typeof processed.status === "string") {
      const trimmed = processed.status.trim()
      if (
        !trimmed ||
        !PROJECT_STATUS_VALUES.includes(trimmed as ProjectStatus)
      ) {
        processed.status = "Not Started"
      } else {
        processed.status = trimmed
      }
    }

    // Note: created_at and updated_at are handled automatically by Prisma defaults
    // Do not include them in the input

    return processed
  }

  /**
   * Hook called before update - check name uniqueness if name is being changed
   */
  protected async beforeUpdate(
    id: number,
    data: Prisma.projectUpdateInput
  ): Promise<Prisma.projectUpdateInput> {
    const processed: Prisma.projectUpdateInput = { ...data }

    if (data.name !== undefined && data.name !== null) {
      const trimmed =
        typeof data.name === "string" ? data.name.trim() : data.name

      const existing = await this.repository.findByName(trimmed as string)
      if (existing && existing.id !== id) {
        throw new ConflictError("A project with this name already exists")
      }

      processed.name = trimmed as string
    }

    // Trim location and vendor if provided
    if (
      data.location !== undefined &&
      data.location !== null &&
      typeof data.location === "string"
    ) {
      processed.location = data.location.trim()
    }

    if (
      data.vendor !== undefined &&
      data.vendor !== null &&
      typeof data.vendor === "string"
    ) {
      processed.vendor = data.vendor.trim()
    }

    // Normalize customer_id to Prisma relation format
    const normalizedCustomer = this.normalizeCustomerRelation(data, true)
    if (normalizedCustomer) {
      processed.customer =
        normalizedCustomer as Prisma.customerUpdateOneWithoutProjectNestedInput
    }

    if (
      data.status !== undefined &&
      data.status !== null &&
      typeof data.status === "string"
    ) {
      const trimmed = data.status.trim()
      if (
        !trimmed ||
        !PROJECT_STATUS_VALUES.includes(trimmed as ProjectStatus)
      ) {
        throw new ValidationError(
          `status must be one of: ${PROJECT_STATUS_VALUES.join(", ")}`
        )
      }
      processed.status = trimmed
    }

    // Note: updated_at is handled automatically by Prisma
    // Do not include it in the input

    return processed
  }
}
