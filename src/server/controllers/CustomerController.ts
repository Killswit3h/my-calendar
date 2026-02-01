import { NextRequest, NextResponse } from "next/server"
import { AbstractController } from "../base/AbstractController"
import { CustomerService } from "../services/CustomerService"
import { Prisma } from "@prisma/client"

/**
 * Customer Controller
 * Handles HTTP requests for customer operations
 */
export class CustomerController extends AbstractController<
  Prisma.customerGetPayload<{}>,
  Prisma.customerCreateInput,
  Prisma.customerUpdateInput,
  CustomerService
> {
  protected service: CustomerService

  constructor() {
    super()
    this.service = new CustomerService()
  }

  /**
   * Handle GET request
   * Supports:
   * - GET /api/customers - list all customers (with optional ?search= query)
   * - GET /api/customers/[id] - get single customer by ID (path parameter)
   */
  async handleGet(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      // Check if ID is provided in path parameter
      const id = await this.parseId(req, context)

      // Single customer by ID
      if (id !== null) {
        const customer = await this.service.getById(id)
        return this.successResponse(customer, 200)
      }

      // List all customers with optional search filter
      const queryParams = this.parseQueryParams(req)
      const searchQuery = queryParams.search

      let filters: any = {}
      if (searchQuery && typeof searchQuery === "string") {
        // Use service's searchByName method
        const customers = await this.service.searchByName(searchQuery)
        return this.successResponse(customers, 200)
      }

      const customers = await this.service.list(filters)
      return this.successResponse(customers, 200)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  /**
   * Handle POST request
   * Creates a new customer
   */
  async handlePost(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      const body = await this.parseBody<Prisma.customerCreateInput>(req)

      const customer = await this.service.create(body)
      return this.successResponse(customer, 201)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  /**
   * Handle PATCH request
   * Updates an existing customer by ID (from path parameter)
   */
  async handlePatch(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      const id = await this.parseId(req, context)

      if (id === null) {
        return this.badRequestResponse("Customer ID is required in path")
      }

      const body = await this.parseBody<Prisma.customerUpdateInput>(req)

      const customer = await this.service.update(id, body)
      return this.successResponse(customer, 200)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  /**
   * Handle DELETE request
   * Deletes a customer by ID (from path parameter)
   */
  async handleDelete(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      const id = await this.parseId(req, context)

      if (id === null) {
        return this.badRequestResponse("Customer ID is required in path")
      }

      await this.service.delete(id)
      return this.successResponse(
        { message: "Customer deleted successfully" },
        200
      )
    } catch (error) {
      return this.errorResponse(error)
    }
  }
}
