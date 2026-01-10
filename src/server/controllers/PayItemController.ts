import { NextRequest, NextResponse } from "next/server"
import { AbstractController } from "../base/AbstractController"
import { PayItemService } from "../services/PayItemService"
import { Prisma } from "@prisma/client"

/**
 * Pay Item Controller
 * Handles HTTP requests for pay item operations
 */
export class PayItemController extends AbstractController<
  Prisma.pay_itemGetPayload<{}>,
  Prisma.pay_itemCreateInput,
  Prisma.pay_itemUpdateInput,
  PayItemService
> {
  protected service: PayItemService

  constructor() {
    super()
    this.service = new PayItemService()
  }

  /**
   * Handle GET request
   * Supports:
   * - GET /api/pay-items - list all pay items (with optional ?number= and ?description= filters)
   * - GET /api/pay-items/[id] - get single pay item by ID (path parameter)
   */
  async handleGet(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      // Check if ID is provided in path parameter
      const id = await this.parseId(req, context)

      // Single pay item by ID
      if (id !== null) {
        const payItem = await this.service.getById(id)
        return this.successResponse(payItem, 200)
      }

      // List all pay items with optional filters
      const queryParams = this.parseQueryParams(req)
      const numberFilter = queryParams.number
      const descriptionFilter = queryParams.description

      let filters: any = {}
      if (numberFilter && typeof numberFilter === "string") {
        filters.number = {
          contains: numberFilter,
          mode: "insensitive",
        }
      }
      if (descriptionFilter && typeof descriptionFilter === "string") {
        filters.description = {
          contains: descriptionFilter,
          mode: "insensitive",
        }
      }

      const payItems = await this.service.list(filters)
      return this.successResponse(payItems, 200)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  /**
   * Handle POST request
   * Creates a new pay item
   */
  async handlePost(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      const body = await this.parseBody<Prisma.pay_itemCreateInput>(req)

      const payItem = await this.service.create(body)
      return this.successResponse(payItem, 201)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  /**
   * Handle PATCH request
   * Updates an existing pay item by ID (from path parameter)
   */
  async handlePatch(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      const id = await this.parseId(req, context)

      if (id === null) {
        return this.badRequestResponse("Pay item ID is required in path")
      }

      const body = await this.parseBody<Prisma.pay_itemUpdateInput>(req)

      const payItem = await this.service.update(id, body)
      return this.successResponse(payItem, 200)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  /**
   * Handle DELETE request
   * Deletes a pay item by ID (from path parameter)
   */
  async handleDelete(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      const id = await this.parseId(req, context)

      if (id === null) {
        return this.badRequestResponse("Pay item ID is required in path")
      }

      await this.service.delete(id)
      return this.successResponse({ message: "Pay item deleted successfully" }, 200)
    } catch (error) {
      return this.errorResponse(error)
    }
  }
}
