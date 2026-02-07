import { NextRequest, NextResponse } from "next/server"
import { AbstractController } from "../base/AbstractController"
import { EventQuantityService } from "../services/EventQuantityService"
import { parseExpandToInclude, parseOptionalIntParam } from "../base/controllerHelpers"
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

  private parseExpand(
    expanded?: string | string[]
  ): { include?: Prisma.event_quantityInclude } {
    return parseExpandToInclude(expanded, {
      event: true,
      project_pay_item: true,
    })
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
      const filters: Prisma.event_quantityWhereInput = {}
      const eventId = parseOptionalIntParam(queryParams.event_id)
      if (eventId !== undefined) filters.event_id = eventId
      const projectPayItemId = parseOptionalIntParam(queryParams.project_pay_item_id)
      if (projectPayItemId !== undefined) filters.project_pay_item_id = projectPayItemId

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
      return new NextResponse(null, { status: 204 })
    } catch (error) {
      return this.errorResponse(error)
    }
  }
}
