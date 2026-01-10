import { NextRequest, NextResponse } from "next/server"
import { AbstractController } from "../base/AbstractController"
import { PaymentTypeService } from "../services/PaymentTypeService"
import { Prisma } from "@prisma/client"

/**
 * Payment Type Controller
 * Handles HTTP requests for payment type operations
 */
export class PaymentTypeController extends AbstractController<
  Prisma.payment_typeGetPayload<{}>,
  Prisma.payment_typeCreateInput,
  Prisma.payment_typeUpdateInput,
  PaymentTypeService
> {
  protected service: PaymentTypeService

  constructor() {
    super()
    this.service = new PaymentTypeService()
  }

  /**
   * Handle GET request
   * Supports:
   * - GET /api/payment-types - list all payment types (with optional ?description= filter)
   * - GET /api/payment-types/[id] - get single payment type by ID (path parameter)
   */
  async handleGet(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      // Check if ID is provided in path parameter
      const id = await this.parseId(req, context)

      // Single payment type by ID
      if (id !== null) {
        const paymentType = await this.service.getById(id)
        return this.successResponse(paymentType, 200)
      }

      // List all payment types with optional description filter
      const queryParams = this.parseQueryParams(req)
      const descriptionFilter = queryParams.description

      let filters: any = {}
      if (descriptionFilter && typeof descriptionFilter === "string") {
        filters.description = {
          contains: descriptionFilter,
          mode: "insensitive",
        }
      }

      const paymentTypes = await this.service.list(filters)
      return this.successResponse(paymentTypes, 200)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  /**
   * Handle POST request
   * Creates a new payment type
   */
  async handlePost(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      const body = await this.parseBody<Prisma.payment_typeCreateInput>(req)

      const paymentType = await this.service.create(body)
      return this.successResponse(paymentType, 201)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  /**
   * Handle PATCH request
   * Updates an existing payment type by ID (from path parameter)
   */
  async handlePatch(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      const id = await this.parseId(req, context)

      if (id === null) {
        return this.badRequestResponse("Payment type ID is required in path")
      }

      const body = await this.parseBody<Prisma.payment_typeUpdateInput>(req)

      const paymentType = await this.service.update(id, body)
      return this.successResponse(paymentType, 200)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  /**
   * Handle DELETE request
   * Deletes a payment type by ID (from path parameter)
   */
  async handleDelete(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      const id = await this.parseId(req, context)

      if (id === null) {
        return this.badRequestResponse("Payment type ID is required in path")
      }

      await this.service.delete(id)
      return this.successResponse({ message: "Payment type deleted successfully" }, 200)
    } catch (error) {
      return this.errorResponse(error)
    }
  }
}
