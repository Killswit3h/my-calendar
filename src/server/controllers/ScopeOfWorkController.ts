import { NextRequest, NextResponse } from "next/server"
import { AbstractController } from "../base/AbstractController"
import { ScopeOfWorkService } from "../services/ScopeOfWorkService"
import { Prisma } from "@prisma/client"
import { ValidationError } from "../base/types"

/**
 * Scope of Work Controller
 * Handles HTTP requests for scope of work operations
 */
export class ScopeOfWorkController extends AbstractController<
  Prisma.scope_of_workGetPayload<{}>,
  Prisma.scope_of_workCreateInput,
  Prisma.scope_of_workUpdateInput,
  ScopeOfWorkService
> {
  protected service: ScopeOfWorkService

  constructor() {
    super()
    this.service = new ScopeOfWorkService()
  }

  /**
   * Handle GET request
   * Supports:
   * - GET /api/scope-of-works - list all scopes (with optional ?description= filter)
   * - GET /api/scope-of-works/[id] - get single scope by ID (path parameter)
   */
  async handleGet(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      // Check if ID is provided in path parameter
      const id = await this.parseId(req, context)

      // Single scope by ID
      if (id !== null) {
        const scope = await this.service.getById(id)
        return this.successResponse(scope, 200)
      }

      // List all scopes with optional description filter
      const queryParams = this.parseQueryParams(req)
      const descriptionFilter = queryParams.description

      let filters: any = {}
      if (descriptionFilter && typeof descriptionFilter === "string") {
        filters.description = {
          contains: descriptionFilter,
          mode: "insensitive",
        }
      }

      const scopes = await this.service.list(filters)
      return this.successResponse(scopes, 200)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  /**
   * Handle POST request
   * Creates a new scope of work
   */
  async handlePost(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      const body = await this.parseBody<Prisma.scope_of_workCreateInput>(req)

      const scope = await this.service.create(body)
      return this.successResponse(scope, 201)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  /**
   * Handle PATCH request
   * Updates an existing scope of work by ID (from path parameter)
   */
  async handlePatch(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      const id = await this.parseId(req, context)

      if (id === null) {
        return this.badRequestResponse("Scope of work ID is required in path")
      }

      const body = await this.parseBody<Prisma.scope_of_workUpdateInput>(req)

      const scope = await this.service.update(id, body)
      return this.successResponse(scope, 200)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  /**
   * Handle DELETE request
   * Deletes a scope of work by ID (from path parameter)
   */
  async handleDelete(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      const id = await this.parseId(req, context)

      if (id === null) {
        return this.badRequestResponse("Scope of work ID is required in path")
      }

      await this.service.delete(id)
      return this.successResponse({ message: "Scope of work deleted successfully" }, 200)
    } catch (error) {
      return this.errorResponse(error)
    }
  }
}
