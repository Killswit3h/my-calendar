import { NextRequest, NextResponse } from "next/server"
import { AbstractController } from "../base/AbstractController"
import { ProjectService } from "../services/ProjectService"
import { Prisma } from "@prisma/client"

/**
 * Project Controller
 * Handles HTTP requests for project operations
 */
export class ProjectController extends AbstractController<
  Prisma.projectGetPayload<{}>,
  Prisma.projectCreateInput,
  Prisma.projectUpdateInput,
  ProjectService
> {
  protected service: ProjectService

  constructor() {
    super()
    this.service = new ProjectService()
  }

  /**
   * Parse expanded query parameter and build include object
   * If expanded=true, includes all relations
   */
  private parseExpand(expanded?: string | string[]): { include?: any } {
    if (!expanded) {
      return {}
    }

    const expandedValue = Array.isArray(expanded) ? expanded[0] : expanded

    if (expandedValue === "true") {
      return {
        include: {
          customer: true,
        },
      }
    }

    return {}
  }

  /**
   * Handle GET request
   * Supports:
   * - GET /api/projects - list all projects (with optional ?name=, ?location=, ?vendor=, ?customer_id= filters)
   * - GET /api/projects/[id] - get single project by ID (path parameter)
   * - Query parameter ?expanded=true to include all relations
   */
  async handleGet(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> },
  ): Promise<NextResponse> {
    try {
      const queryParams = this.parseQueryParams(req)
      const expandOptions = this.parseExpand(queryParams.expanded)

      // Check if ID is provided in path parameter
      const id = await this.parseId(req, context)

      // Single project by ID
      if (id !== null) {
        const project = await this.service.getById(id, expandOptions)
        return this.successResponse(project, 200)
      }

      // List all projects with optional filters
      const nameFilter = queryParams.name
      const locationFilter = queryParams.location
      const vendorFilter = queryParams.vendor
      const customerIdFilter = queryParams.customer_id

      let filters: any = {}
      if (nameFilter && typeof nameFilter === "string") {
        filters.name = {
          contains: nameFilter,
          mode: "insensitive",
        }
      }
      if (locationFilter && typeof locationFilter === "string") {
        filters.location = {
          contains: locationFilter,
          mode: "insensitive",
        }
      }
      if (vendorFilter && typeof vendorFilter === "string") {
        filters.vendor = {
          contains: vendorFilter,
          mode: "insensitive",
        }
      }
      if (customerIdFilter && typeof customerIdFilter === "string") {
        const customerId = parseInt(customerIdFilter, 10)
        if (!isNaN(customerId)) {
          filters.customer_id = customerId
        }
      }

      // Use repository directly if expand is needed, otherwise use service
      let projects
      if (expandOptions.include) {
        const repository = (this.service as any).repository
        projects = await repository.findMany(filters, expandOptions)
      } else {
        projects = await this.service.list(filters, undefined, undefined)
      }
      return this.successResponse(projects, 200)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  /**
   * Handle POST request
   * Creates a new project
   * Query parameter ?expanded=true to include all relations in response
   */
  async handlePost(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> },
  ): Promise<NextResponse> {
    try {
      const queryParams = this.parseQueryParams(req)
      const expandOptions = this.parseExpand(queryParams.expanded)
      // Accept API-friendly `customer_id` and let the service normalize it.
      const body = await this.parseBody<
        Prisma.projectCreateInput & { customer_id?: number | null }
      >(req)

      const project = await this.service.create(body, expandOptions)
      return this.successResponse(project, 201)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  /**
   * Handle PATCH request
   * Updates an existing project by ID (from path parameter)
   * Query parameter ?expanded=true to include all relations in response
   */
  async handlePatch(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> },
  ): Promise<NextResponse> {
    try {
      const queryParams = this.parseQueryParams(req)
      const expandOptions = this.parseExpand(queryParams.expanded)
      const id = await this.parseId(req, context)

      if (id === null) {
        return this.badRequestResponse("Project ID is required in path")
      }

      // Accept API-friendly `customer_id` and let the service normalize it.
      const body = await this.parseBody<
        Prisma.projectUpdateInput & { customer_id?: number | null }
      >(req)

      const project = await this.service.update(id, body, expandOptions)
      return this.successResponse(project, 200)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  /**
   * Handle DELETE request
   * Deletes a project by ID (from path parameter)
   */
  async handleDelete(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> },
  ): Promise<NextResponse> {
    try {
      const id = await this.parseId(req, context)

      if (id === null) {
        return this.badRequestResponse("Project ID is required in path")
      }

      await this.service.delete(id)
      return this.successResponse(
        { message: "Project deleted successfully" },
        200,
      )
    } catch (error) {
      return this.errorResponse(error)
    }
  }
}
