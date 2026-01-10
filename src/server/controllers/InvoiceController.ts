import { NextRequest, NextResponse } from "next/server"
import { AbstractController } from "../base/AbstractController"
import { InvoiceService } from "../services/InvoiceService"
import { Prisma } from "@prisma/client"

/**
 * Invoice Controller
 * Handles HTTP requests for invoice operations
 */
export class InvoiceController extends AbstractController<
  Prisma.invoiceGetPayload<{}>,
  Prisma.invoiceCreateInput,
  Prisma.invoiceUpdateInput,
  InvoiceService
> {
  protected service: InvoiceService

  constructor() {
    super()
    this.service = new InvoiceService()
  }

  /**
   * Handle GET request
   * Supports:
   * - GET /api/invoices - list all invoices (with optional ?number= filter)
   * - GET /api/invoices/[id] - get single invoice by ID (path parameter)
   */
  async handleGet(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      // Check if ID is provided in path parameter
      const id = await this.parseId(req, context)

      // Single invoice by ID
      if (id !== null) {
        const invoice = await this.service.getById(id)
        return this.successResponse(invoice, 200)
      }

      // List all invoices with optional number filter
      const queryParams = this.parseQueryParams(req)
      const numberFilter = queryParams.number

      let filters: any = {}
      if (numberFilter && typeof numberFilter === "string") {
        filters.number = {
          contains: numberFilter,
          mode: "insensitive",
        }
      }

      const invoices = await this.service.list(filters)
      return this.successResponse(invoices, 200)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  /**
   * Handle POST request
   * Creates a new invoice
   */
  async handlePost(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      const body = await this.parseBody<Prisma.invoiceCreateInput>(req)

      const invoice = await this.service.create(body)
      return this.successResponse(invoice, 201)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  /**
   * Handle PATCH request
   * Updates an existing invoice by ID (from path parameter)
   */
  async handlePatch(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      const id = await this.parseId(req, context)

      if (id === null) {
        return this.badRequestResponse("Invoice ID is required in path")
      }

      const body = await this.parseBody<Prisma.invoiceUpdateInput>(req)

      const invoice = await this.service.update(id, body)
      return this.successResponse(invoice, 200)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  /**
   * Handle DELETE request
   * Deletes an invoice by ID (from path parameter)
   */
  async handleDelete(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      const id = await this.parseId(req, context)

      if (id === null) {
        return this.badRequestResponse("Invoice ID is required in path")
      }

      await this.service.delete(id)
      return this.successResponse({ message: "Invoice deleted successfully" }, 200)
    } catch (error) {
      return this.errorResponse(error)
    }
  }
}
