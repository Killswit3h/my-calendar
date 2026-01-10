import { Prisma } from "@prisma/client"
import { AbstractService } from "../base/AbstractService"
import { InvoiceRepository } from "../repositories/InvoiceRepository"
import {
  ValidationError,
  ConflictError,
} from "../base/types"

/**
 * Invoice Service
 * Provides business logic for invoice operations
 */
export class InvoiceService extends AbstractService<
  Prisma.invoiceGetPayload<{}>,
  Prisma.invoiceCreateInput,
  Prisma.invoiceUpdateInput,
  Prisma.invoiceWhereUniqueInput,
  InvoiceRepository
> {
  protected repository: InvoiceRepository

  constructor() {
    super()
    this.repository = new InvoiceRepository()
  }

  /**
   * Validate invoice data
   */
  protected async validate(
    data: Prisma.invoiceCreateInput | Prisma.invoiceUpdateInput,
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

      if (trimmed.length > 255) {
        throw new ValidationError("number must be 255 characters or less")
      }
    } else if (!isUpdate) {
      // Number is required for create
      throw new ValidationError("number is required")
    }

    // is_contract_invoice validation (optional boolean)
    if (data.is_contract_invoice !== undefined && data.is_contract_invoice !== null) {
      if (typeof data.is_contract_invoice !== "boolean") {
        throw new ValidationError("is_contract_invoice must be a boolean")
      }
    }
  }

  /**
   * Hook called before create - check number uniqueness and trim fields
   */
  protected async beforeCreate(
    data: Prisma.invoiceCreateInput
  ): Promise<Prisma.invoiceCreateInput> {
    const processed: Prisma.invoiceCreateInput = { ...data }
    
    if (data.number) {
      const trimmed = typeof data.number === "string" 
        ? data.number.trim() 
        : data.number
      
      // Check for existing invoice with same number (case-insensitive)
      const existing = await this.repository.findByNumber(trimmed as string)
      if (existing) {
        throw new ConflictError("An invoice with this number already exists")
      }
      
      processed.number = trimmed as string
    }
    
    // Default is_contract_invoice to false if not provided
    if (processed.is_contract_invoice === undefined || processed.is_contract_invoice === null) {
      processed.is_contract_invoice = false
    }
    
    return processed
  }

  /**
   * Hook called before update - check number uniqueness if number is being changed
   */
  protected async beforeUpdate(
    id: number,
    data: Prisma.invoiceUpdateInput
  ): Promise<Prisma.invoiceUpdateInput> {
    const processed: Prisma.invoiceUpdateInput = { ...data }
    
    if (data.number !== undefined && data.number !== null) {
      const trimmed = typeof data.number === "string"
        ? data.number.trim()
        : data.number

      const existing = await this.repository.findByNumber(trimmed as string)
      if (existing && existing.id !== id) {
        throw new ConflictError("An invoice with this number already exists")
      }

      processed.number = trimmed as string
    }
    
    return processed
  }
}
