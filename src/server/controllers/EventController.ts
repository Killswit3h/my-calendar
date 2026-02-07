import { NextRequest, NextResponse } from "next/server"
import { AbstractController } from "../base/AbstractController"
import { EventService } from "../services/EventService"
import { parseExpandToInclude, parseOptionalIntParam } from "../base/controllerHelpers"
import { Prisma } from "@prisma/client"

/** API-friendly event body: raw FK ids and optional ISO date strings for start_time/end_time */
type EventBodyCreate = Prisma.eventCreateInput & {
  project_id?: number
  scope_of_work_id?: number
  payment_type_id?: number
  invoice_id?: number | null
  start_time?: Date | string
  end_time?: Date | string
}
type EventBodyUpdate = Prisma.eventUpdateInput & {
  project_id?: number
  scope_of_work_id?: number
  payment_type_id?: number
  invoice_id?: number | null
  start_time?: Date | string
  end_time?: Date | string
}

/**
 * Event Controller
 * Handles HTTP requests for event operations (calendar events).
 * Supports: GET list (optional ?project_id=, ?scope_of_work_id=, ?payment_type_id=, ?invoice_id=), GET by id, POST, PATCH, DELETE.
 * Query parameter ?expanded=true includes project, scope_of_work, payment_type, invoice.
 */
export class EventController extends AbstractController<
  Prisma.eventGetPayload<{}>,
  Prisma.eventCreateInput,
  Prisma.eventUpdateInput,
  EventService
> {
  protected service: EventService

  constructor() {
    super()
    this.service = new EventService()
  }

  private parseExpand(
    expanded?: string | string[]
  ): { include?: Prisma.eventInclude } {
    return parseExpandToInclude(expanded, {
      project: true,
      scope_of_work: true,
      payment_type: true,
      invoice: true,
    })
  }

  async handleGet(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      const queryParams = this.parseQueryParams(req)
      const expandOptions = this.parseExpand(queryParams.expanded)
      const id = await this.parseId(req, context)

      if (id !== null) {
        const event = await this.service.getById(id, expandOptions)
        return this.successResponse(event, 200)
      }

      const filters: Prisma.eventWhereInput = {}
      const projectId = parseOptionalIntParam(queryParams.project_id)
      if (projectId !== undefined) filters.project_id = projectId
      const scopeOfWorkId = parseOptionalIntParam(queryParams.scope_of_work_id)
      if (scopeOfWorkId !== undefined) filters.scope_of_work_id = scopeOfWorkId
      const paymentTypeId = parseOptionalIntParam(queryParams.payment_type_id)
      if (paymentTypeId !== undefined) filters.payment_type_id = paymentTypeId
      const invoiceId = parseOptionalIntParam(queryParams.invoice_id)
      if (invoiceId !== undefined) filters.invoice_id = invoiceId

      const events = await this.service.listWithExpand(filters, expandOptions)
      return this.successResponse(events, 200)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  async handlePost(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      const queryParams = this.parseQueryParams(req)
      const expandOptions = this.parseExpand(queryParams.expanded)
      const body = await this.parseBody<EventBodyCreate>(req)

      const event = await this.service.create(body, expandOptions)
      return this.successResponse(event, 201)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  async handlePatch(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      const queryParams = this.parseQueryParams(req)
      const expandOptions = this.parseExpand(queryParams.expanded)
      const id = await this.parseId(req, context)

      if (id === null) {
        return this.badRequestResponse("Event ID is required in path")
      }

      const body = await this.parseBody<EventBodyUpdate>(req)
      const event = await this.service.update(id, body, expandOptions)
      return this.successResponse(event, 200)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  async handleDelete(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      const id = await this.parseId(req, context)

      if (id === null) {
        return this.badRequestResponse("Event ID is required in path")
      }

      await this.service.delete(id)
      return new NextResponse(null, { status: 204 })
    } catch (error) {
      return this.errorResponse(error)
    }
  }
}
