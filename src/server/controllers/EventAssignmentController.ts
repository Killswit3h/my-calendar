import { NextRequest, NextResponse } from "next/server"
import { AbstractController } from "../base/AbstractController"
import { EventAssignmentService } from "../services/EventAssignmentService"
import { parseExpandToInclude, parseOptionalIntParam } from "../base/controllerHelpers"
import { Prisma } from "@prisma/client"

/**
 * Event Assignment Controller
 * Handles HTTP requests for event assignment operations (event–employee link).
 * Supports: GET /api/event-assignments (list), GET /api/event-assignments/[id], POST, PATCH, DELETE.
 * Query params: event_id, employee_id (filters), expanded=true (include event, employee).
 */
export class EventAssignmentController extends AbstractController<
  Prisma.event_assignmentGetPayload<{}>,
  Prisma.event_assignmentCreateInput,
  Prisma.event_assignmentUpdateInput,
  EventAssignmentService
> {
  protected service: EventAssignmentService

  constructor() {
    super()
    this.service = new EventAssignmentService()
  }

  private parseExpand(
    expanded?: string | string[]
  ): { include?: Prisma.event_assignmentInclude } {
    return parseExpandToInclude(expanded, {
      event: true,
      employee: true,
    })
  }

  /**
   * Handle GET request
   * GET /api/event-assignments - list with optional ?event_id=, ?employee_id=, ?expanded=true
   * GET /api/event-assignments/[id] - get one by ID
   */
  async handleGet(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      const queryParams = this.parseQueryParams(req)
      const expandOptions = this.parseExpand(queryParams.expanded)

      const id = await this.parseId(req, context)

      if (id !== null) {
        const assignment = await this.service.getById(id, expandOptions)
        return this.successResponse(assignment, 200)
      }

      const filters: Prisma.event_assignmentWhereInput = {}
      const eventId = parseOptionalIntParam(queryParams.event_id)
      if (eventId !== undefined) filters.event_id = eventId
      const employeeId = parseOptionalIntParam(queryParams.employee_id)
      if (employeeId !== undefined) filters.employee_id = employeeId

      const assignments = await this.service.listWithExpand(
        filters,
        expandOptions
      )
      return this.successResponse(assignments, 200)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  /**
   * Handle POST request
   * Body: event_id, employee_id (API-friendly); ?expanded=true for relations in response
   */
  async handlePost(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      const queryParams = this.parseQueryParams(req)
      const expandOptions = this.parseExpand(queryParams.expanded)
      const body = await this.parseBody<
        Prisma.event_assignmentCreateInput & {
          event_id?: number
          employee_id?: number
        }
      >(req)

      const assignment = await this.service.create(body, expandOptions)
      return this.successResponse(assignment, 201)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  /**
   * Handle PATCH request
   * Updates by ID; body same fields as create, all optional; ?expanded=true for relations
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
        return this.badRequestResponse("Event assignment ID is required in path")
      }

      const body = await this.parseBody<
        Prisma.event_assignmentUpdateInput & {
          event_id?: number
          employee_id?: number
        }
      >(req)

      const assignment = await this.service.update(id, body, expandOptions)
      return this.successResponse(assignment, 200)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  /**
   * Handle DELETE request
   * Returns 204 No Content
   */
  async handleDelete(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      const id = await this.parseId(req, context)

      if (id === null) {
        return this.badRequestResponse("Event assignment ID is required in path")
      }

      await this.service.delete(id)
      return new NextResponse(null, { status: 204 })
    } catch (error) {
      return this.errorResponse(error)
    }
  }
}
