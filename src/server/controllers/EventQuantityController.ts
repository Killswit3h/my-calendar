import { NextRequest, NextResponse } from "next/server"
import { AbstractController } from "../base/AbstractController"
import { EventQuantityService } from "../services/EventQuantityService"
import { Prisma } from "@prisma/client"

/**
 * Event Quantity Controller
 * Handles HTTP requests for event quantity operations
 */
export class EventQuantityController extends AbstractController<
  Prisma.event_quantityGetPayload<{}>,
  Prisma.event_quantityCreateInput,
  Prisma.event_quantityUpdateInput,
  EventQuantityService
> {
  protected service: EventQuantityService

  constructor() {
    super()
    this.service = new EventQuantityService()
  }

  /**
   * Parse expanded query parameter and build include object
   * If expanded=true, includes all relations
   */
  private parseExpand(
    expanded?: string | string[]
  ): { include?: Prisma.event_quantityInclude } {
    if (!expanded) {
      return {}
    }

    const expandedValue = Array.isArray(expanded) ? expanded[0] : expanded
    
    if (expandedValue === "true") {
      return {
        include: {
          event: true,
          project_pay_item: true,
        },
      }
    }

    return {}
  }

  /**
   * Handle GET request
   * Supports:
   * - GET /api/event-quantities - list all event quantities (with optional ?event_id=, ?project_pay_item_id= filters)
   * - GET /api/event-quantities/[id] - get single event quantity by ID (path parameter)
   * - Query parameter ?expanded=true to include all relations
   */
  async handleGet(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      const queryParams = this.parseQueryParams(req)
      const expandOptions = this.parseExpand(queryParams.expanded)

      // Check if ID is provided in path parameter
      const id = await this.parseId(req, context)

      // Single event quantity by ID
      if (id !== null) {
        const eventQuantity = await this.service.getById(id, expandOptions)
        return this.successResponse(eventQuantity, 200)
      }

      // List all event quantities with optional filters
      const eventIdFilter = queryParams.event_id
      const projectPayItemIdFilter = queryParams.project_pay_item_id

      const filters: Prisma.event_quantityWhereInput = {}
      if (eventIdFilter && typeof eventIdFilter === "string") {
        const eventId = parseInt(eventIdFilter, 10)
        if (!isNaN(eventId)) {
          filters.event_id = eventId
        }
      }
      if (projectPayItemIdFilter && typeof projectPayItemIdFilter === "string") {
        const projectPayItemId = parseInt(projectPayItemIdFilter, 10)
        if (!isNaN(projectPayItemId)) {
          filters.project_pay_item_id = projectPayItemId
        }
      }

      // Use service method that handles expand options
      const eventQuantities = await this.service.listWithExpand(filters, expandOptions)
      return this.successResponse(eventQuantities, 200)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  /**
   * Handle POST request
   * Creates a new event quantity
   * Query parameter ?expanded=true to include all relations in response
   */
  async handlePost(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      const queryParams = this.parseQueryParams(req)
      const expandOptions = this.parseExpand(queryParams.expanded)
      // Accept API-friendly `event_id` and `project_pay_item_id` and let the service normalize it.
      const body = await this.parseBody<Prisma.event_quantityCreateInput & { event_id?: number; project_pay_item_id?: number }>(req)

      const eventQuantity = await this.service.create(body, expandOptions)
      return this.successResponse(eventQuantity, 201)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  /**
   * Handle PATCH request
   * Updates an existing event quantity by ID (from path parameter)
   * Query parameter ?expanded=true to include all relations in response
   */
  async handlePatch(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      const queryParams = this.parseQueryParams(req)
      const expandOptions = this.parseExpand(queryParams.expanded)
      const id = await this.parseId(req, context)

      if (id === null) {
        return this.badRequestResponse("Event quantity ID is required in path")
      }

      // Accept API-friendly `event_id` and `project_pay_item_id` and let the service normalize it.
      const body = await this.parseBody<Prisma.event_quantityUpdateInput & { event_id?: number; project_pay_item_id?: number }>(req)

      const eventQuantity = await this.service.update(id, body, expandOptions)
      return this.successResponse(eventQuantity, 200)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  /**
   * Handle DELETE request
   * Deletes an event quantity by ID (from path parameter)
   */
  async handleDelete(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      const id = await this.parseId(req, context)

      if (id === null) {
        return this.badRequestResponse("Event quantity ID is required in path")
      }

      await this.service.delete(id)
      return this.successResponse({ message: "Event quantity deleted successfully" }, 200)
    } catch (error) {
      return this.errorResponse(error)
    }
  }
}
