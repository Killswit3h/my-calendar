import { Prisma } from "@prisma/client"
import { AbstractService } from "../base/AbstractService"
import { ProjectPayItemRepository } from "../repositories/ProjectPayItemRepository"
import { ProjectRepository } from "../repositories/ProjectRepository"
import { PayItemRepository } from "../repositories/PayItemRepository"
import { ValidationError } from "../base/types"
import { getPrisma } from "@/lib/db"

/**
 * Project Pay Item Service
 * Provides business logic for project pay item operations
 */
export class ProjectPayItemService extends AbstractService<
  Prisma.project_pay_itemGetPayload<{}>,
  Prisma.project_pay_itemCreateInput,
  Prisma.project_pay_itemUpdateInput,
  Prisma.project_pay_itemWhereUniqueInput,
  ProjectPayItemRepository
> {
  protected repository: ProjectPayItemRepository
  private projectRepository: ProjectRepository
  private payItemRepository: PayItemRepository

  constructor() {
    super()
    this.repository = new ProjectPayItemRepository()
    this.projectRepository = new ProjectRepository()
    this.payItemRepository = new PayItemRepository()
  }

  /**
   * Validate project pay item data
   */
  protected async validate(
    data: Prisma.project_pay_itemCreateInput | Prisma.project_pay_itemUpdateInput,
    isUpdate: boolean = false
  ): Promise<void> {
    const dataAny = data as any

    // Project ID validation (required, must reference valid project if provided)
    let projectId: number | undefined | null = undefined

    if (dataAny.project_id !== undefined && dataAny.project_id !== null) {
      projectId = dataAny.project_id as number
    } else if (
      data.project &&
      typeof data.project === "object" &&
      "connect" in data.project &&
      data.project.connect &&
      typeof data.project.connect === "object" &&
      "id" in data.project.connect
    ) {
      projectId = (data.project.connect as { id: number }).id
    }

    if (projectId !== undefined && projectId !== null) {
      if (
        typeof projectId !== "number" ||
        !Number.isInteger(projectId) ||
        projectId <= 0
      ) {
        throw new ValidationError("project_id must be a positive integer")
      }
    } else if (!isUpdate) {
      throw new ValidationError("project_id is required")
    }

    // Pay Item ID validation (required, must reference valid pay_item if provided)
    let payItemId: number | undefined | null = undefined

    if (dataAny.pay_item_id !== undefined && dataAny.pay_item_id !== null) {
      payItemId = dataAny.pay_item_id as number
    } else if (
      data.pay_item &&
      typeof data.pay_item === "object" &&
      "connect" in data.pay_item &&
      data.pay_item.connect &&
      typeof data.pay_item.connect === "object" &&
      "id" in data.pay_item.connect
    ) {
      payItemId = (data.pay_item.connect as { id: number }).id
    }

    if (payItemId !== undefined && payItemId !== null) {
      if (
        typeof payItemId !== "number" ||
        !Number.isInteger(payItemId) ||
        payItemId <= 0
      ) {
        throw new ValidationError("pay_item_id must be a positive integer")
      }
    } else if (!isUpdate) {
      throw new ValidationError("pay_item_id is required")
    }

    // Contracted quantity validation
    if (data.contracted_quantity !== undefined) {
      let decimalValue: Prisma.Decimal

      if (data.contracted_quantity instanceof Prisma.Decimal) {
        decimalValue = data.contracted_quantity
      } else if (typeof data.contracted_quantity === "number") {
        if (!Number.isFinite(data.contracted_quantity)) {
          throw new ValidationError("contracted_quantity must be a finite number")
        }
        decimalValue = new Prisma.Decimal(data.contracted_quantity)
      } else if (typeof data.contracted_quantity === "string") {
        try {
          decimalValue = new Prisma.Decimal(data.contracted_quantity.trim())
        } catch {
          throw new ValidationError("contracted_quantity must be a valid number")
        }
      } else {
        throw new ValidationError("contracted_quantity must be a number or Decimal")
      }

      if (decimalValue.isNaN()) {
        throw new ValidationError("contracted_quantity must be a valid number")
      }

      if (decimalValue.lt(0)) {
        throw new ValidationError("contracted_quantity must be non-negative")
      }
    } else if (!isUpdate) {
      throw new ValidationError("contracted_quantity is required")
    }

    // Unit rate validation
    if (data.unit_rate !== undefined) {
      let decimalValue: Prisma.Decimal

      if (data.unit_rate instanceof Prisma.Decimal) {
        decimalValue = data.unit_rate
      } else if (typeof data.unit_rate === "number") {
        if (!Number.isFinite(data.unit_rate)) {
          throw new ValidationError("unit_rate must be a finite number")
        }
        decimalValue = new Prisma.Decimal(data.unit_rate)
      } else if (typeof data.unit_rate === "string") {
        try {
          decimalValue = new Prisma.Decimal(data.unit_rate.trim())
        } catch {
          throw new ValidationError("unit_rate must be a valid number")
        }
      } else {
        throw new ValidationError("unit_rate must be a number or Decimal")
      }

      if (decimalValue.isNaN()) {
        throw new ValidationError("unit_rate must be a valid number")
      }

      if (decimalValue.lt(0)) {
        throw new ValidationError("unit_rate must be non-negative")
      }
    } else if (!isUpdate) {
      throw new ValidationError("unit_rate is required")
    }

    // Stockpile billed validation (optional, non-negative)
    if (data.stockpile_billed !== undefined && data.stockpile_billed !== null) {
      let decimalValue: Prisma.Decimal

      if (data.stockpile_billed instanceof Prisma.Decimal) {
        decimalValue = data.stockpile_billed
      } else if (typeof data.stockpile_billed === "number") {
        if (!Number.isFinite(data.stockpile_billed)) {
          throw new ValidationError("stockpile_billed must be a finite number")
        }
        decimalValue = new Prisma.Decimal(data.stockpile_billed)
      } else if (typeof data.stockpile_billed === "string") {
        try {
          decimalValue = new Prisma.Decimal(data.stockpile_billed.trim())
        } catch {
          throw new ValidationError("stockpile_billed must be a valid number")
        }
      } else {
        throw new ValidationError("stockpile_billed must be a number or Decimal")
      }

      if (decimalValue.isNaN()) {
        throw new ValidationError("stockpile_billed must be a valid number")
      }

      if (decimalValue.lt(0)) {
        throw new ValidationError("stockpile_billed must be non-negative")
      }
    }

    // Is original validation (optional boolean)
    if (data.is_original !== undefined && data.is_original !== null) {
      if (typeof data.is_original !== "boolean") {
        throw new ValidationError("is_original must be a boolean")
      }
    }

    // Optional string fields validation (VarChar fields - max 255)
    const varcharFields = [
      "begin_station",
      "end_station",
      "status",
      "locate_ticket",
      "LF_RT",
      "onsite_review",
    ] as const

    for (const field of varcharFields) {
      if (data[field] !== undefined && data[field] !== null) {
        if (typeof data[field] !== "string") {
          throw new ValidationError(`${field} must be a string`)
        }

        const trimmed = (data[field] as string).trim()
        if (trimmed.length > 255) {
          throw new ValidationError(`${field} must be 255 characters or less`)
        }
      }
    }

    // Notes validation (Text field - no length limit but should trim)
    if (data.notes !== undefined && data.notes !== null) {
      if (typeof data.notes !== "string") {
        throw new ValidationError("notes must be a string")
      }
    }
  }

  /**
   * Normalize project_id and pay_item_id to Prisma relation format
   */
  private normalizeProjectRelation(
    data: Prisma.project_pay_itemCreateInput | Prisma.project_pay_itemUpdateInput
  ):
    | Prisma.projectCreateNestedOneWithoutProject_pay_itemsInput
    | Prisma.projectUpdateOneRequiredWithoutProject_pay_itemsNestedInput
    | undefined {
    const dataAny = data as any

    if (dataAny.project_id !== undefined && dataAny.project_id !== null) {
      return {
        connect: { id: dataAny.project_id },
      }
    }

    return undefined
  }

  private normalizePayItemRelation(
    data: Prisma.project_pay_itemCreateInput | Prisma.project_pay_itemUpdateInput
  ):
    | Prisma.pay_itemCreateNestedOneWithoutProject_pay_itemsInput
    | Prisma.pay_itemUpdateOneRequiredWithoutProject_pay_itemsNestedInput
    | undefined {
    const dataAny = data as any

    if (dataAny.pay_item_id !== undefined && dataAny.pay_item_id !== null) {
      return {
        connect: { id: dataAny.pay_item_id },
      }
    }

    return undefined
  }

  /**
   * Hook called before create - validate FKs and set defaults
   */
  protected async beforeCreate(
    data: Prisma.project_pay_itemCreateInput
  ): Promise<Prisma.project_pay_itemCreateInput> {
    const processed: Prisma.project_pay_itemCreateInput = { ...data }
    const dataAny = data as any

    // Extract project_id and pay_item_id for validation
    let projectId: number | undefined
    let payItemId: number | undefined

    if (dataAny.project_id !== undefined && dataAny.project_id !== null) {
      projectId = dataAny.project_id
    } else if (
      data.project &&
      typeof data.project === "object" &&
      "connect" in data.project &&
      data.project.connect &&
      typeof data.project.connect === "object" &&
      "id" in data.project.connect
    ) {
      projectId = (data.project.connect as { id: number }).id
    }

    if (dataAny.pay_item_id !== undefined && dataAny.pay_item_id !== null) {
      payItemId = dataAny.pay_item_id
    } else if (
      data.pay_item &&
      typeof data.pay_item === "object" &&
      "connect" in data.pay_item &&
      data.pay_item.connect &&
      typeof data.pay_item.connect === "object" &&
      "id" in data.pay_item.connect
    ) {
      payItemId = (data.pay_item.connect as { id: number }).id
    }

    // Validate project exists
    if (projectId !== undefined) {
      const project = await this.projectRepository.findUnique(
        { id: projectId },
        { select: { id: true } }
      )
      if (!project) {
        throw new ValidationError(`Project with id ${projectId} not found`)
      }
    }

    // Validate pay_item exists
    if (payItemId !== undefined) {
      const payItem = await this.payItemRepository.findUnique(
        { id: payItemId },
        { select: { id: true } }
      )
      if (!payItem) {
        throw new ValidationError(`Pay item with id ${payItemId} not found`)
      }
    }

    // Normalize relations
    const normalizedProject = this.normalizeProjectRelation(data)
    if (normalizedProject) {
      processed.project =
        normalizedProject as Prisma.projectCreateNestedOneWithoutProject_pay_itemsInput
    }

    const normalizedPayItem = this.normalizePayItemRelation(data)
    if (normalizedPayItem) {
      processed.pay_item =
        normalizedPayItem as Prisma.pay_itemCreateNestedOneWithoutProject_pay_itemsInput
    }

    // Strip raw *_id fields
    if (dataAny.project_id !== undefined) {
      delete (processed as any).project_id
    }
    if (dataAny.pay_item_id !== undefined) {
      delete (processed as any).pay_item_id
    }

    // Set defaults for optional fields
    if (processed.is_original === undefined || processed.is_original === null) {
      processed.is_original = true
    }

    if (processed.stockpile_billed === undefined || processed.stockpile_billed === null) {
      processed.stockpile_billed = new Prisma.Decimal(0)
    } else if (typeof processed.stockpile_billed === "number") {
      processed.stockpile_billed = new Prisma.Decimal(processed.stockpile_billed)
    } else if (typeof processed.stockpile_billed === "string") {
      processed.stockpile_billed = new Prisma.Decimal(processed.stockpile_billed.trim())
    }

    // Trim string fields
    if (processed.notes && typeof processed.notes === "string") {
      processed.notes = processed.notes.trim() || null
    }

    const varcharFields = [
      "begin_station",
      "end_station",
      "status",
      "locate_ticket",
      "LF_RT",
      "onsite_review",
    ] as const

    for (const field of varcharFields) {
      if (processed[field] && typeof processed[field] === "string") {
        ;(processed as any)[field] = (processed[field] as string).trim() || null
      }
    }

    // Normalize Decimal fields
    if (processed.contracted_quantity && typeof processed.contracted_quantity === "number") {
      processed.contracted_quantity = new Prisma.Decimal(processed.contracted_quantity)
    } else if (processed.contracted_quantity && typeof processed.contracted_quantity === "string") {
      processed.contracted_quantity = new Prisma.Decimal(processed.contracted_quantity.trim())
    }

    if (processed.unit_rate && typeof processed.unit_rate === "number") {
      processed.unit_rate = new Prisma.Decimal(processed.unit_rate)
    } else if (processed.unit_rate && typeof processed.unit_rate === "string") {
      processed.unit_rate = new Prisma.Decimal(processed.unit_rate.trim())
    }

    return processed
  }

  /**
   * Hook called before update - validate FKs if changed
   */
  protected async beforeUpdate(
    id: number,
    data: Prisma.project_pay_itemUpdateInput
  ): Promise<Prisma.project_pay_itemUpdateInput> {
    const processed: Prisma.project_pay_itemUpdateInput = { ...data }
    const dataAny = data as any

    // Extract project_id and pay_item_id for validation if they're being changed
    let projectId: number | undefined
    let payItemId: number | undefined

    if (dataAny.project_id !== undefined && dataAny.project_id !== null) {
      projectId = dataAny.project_id
    } else if (
      data.project &&
      typeof data.project === "object" &&
      "connect" in data.project &&
      data.project.connect &&
      typeof data.project.connect === "object" &&
      "id" in data.project.connect
    ) {
      projectId = (data.project.connect as { id: number }).id
    }

    if (dataAny.pay_item_id !== undefined && dataAny.pay_item_id !== null) {
      payItemId = dataAny.pay_item_id
    } else if (
      data.pay_item &&
      typeof data.pay_item === "object" &&
      "connect" in data.pay_item &&
      data.pay_item.connect &&
      typeof data.pay_item.connect === "object" &&
      "id" in data.pay_item.connect
    ) {
      payItemId = (data.pay_item.connect as { id: number }).id
    }

    // Validate project exists if project_id is being changed
    if (projectId !== undefined) {
      const project = await this.projectRepository.findUnique(
        { id: projectId },
        { select: { id: true } }
      )
      if (!project) {
        throw new ValidationError(`Project with id ${projectId} not found`)
      }
    }

    // Validate pay_item exists if pay_item_id is being changed
    if (payItemId !== undefined) {
      const payItem = await this.payItemRepository.findUnique(
        { id: payItemId },
        { select: { id: true } }
      )
      if (!payItem) {
        throw new ValidationError(`Pay item with id ${payItemId} not found`)
      }
    }

    // Normalize relations
    const normalizedProject = this.normalizeProjectRelation(data)
    if (normalizedProject) {
      processed.project =
        normalizedProject as Prisma.projectUpdateOneRequiredWithoutProject_pay_itemsNestedInput
    }

    const normalizedPayItem = this.normalizePayItemRelation(data)
    if (normalizedPayItem) {
      processed.pay_item =
        normalizedPayItem as Prisma.pay_itemUpdateOneRequiredWithoutProject_pay_itemsNestedInput
    }

    // Strip raw *_id fields
    if (dataAny.project_id !== undefined) {
      delete (processed as any).project_id
    }
    if (dataAny.pay_item_id !== undefined) {
      delete (processed as any).pay_item_id
    }

    // Trim string fields if provided
    if (processed.notes !== undefined && processed.notes !== null && typeof processed.notes === "string") {
      processed.notes = processed.notes.trim() || null
    }

    const varcharFields = [
      "begin_station",
      "end_station",
      "status",
      "locate_ticket",
      "LF_RT",
      "onsite_review",
    ] as const

    for (const field of varcharFields) {
      if (processed[field] !== undefined && processed[field] !== null && typeof processed[field] === "string") {
        ;(processed as any)[field] = (processed[field] as string).trim() || null
      }
    }

    // Normalize Decimal fields if provided
    if (processed.contracted_quantity !== undefined && processed.contracted_quantity !== null) {
      if (typeof processed.contracted_quantity === "number") {
        processed.contracted_quantity = new Prisma.Decimal(processed.contracted_quantity)
      } else if (typeof processed.contracted_quantity === "string") {
        processed.contracted_quantity = new Prisma.Decimal(processed.contracted_quantity.trim())
      }
    }

    if (processed.unit_rate !== undefined && processed.unit_rate !== null) {
      if (typeof processed.unit_rate === "number") {
        processed.unit_rate = new Prisma.Decimal(processed.unit_rate)
      } else if (typeof processed.unit_rate === "string") {
        processed.unit_rate = new Prisma.Decimal(processed.unit_rate.trim())
      }
    }

    if (processed.stockpile_billed !== undefined && processed.stockpile_billed !== null) {
      if (typeof processed.stockpile_billed === "number") {
        processed.stockpile_billed = new Prisma.Decimal(processed.stockpile_billed)
      } else if (typeof processed.stockpile_billed === "string") {
        processed.stockpile_billed = new Prisma.Decimal(processed.stockpile_billed.trim())
      }
    }

    return processed
  }
}
