import { NextRequest, NextResponse } from "next/server"
import { AbstractController } from "../base/AbstractController"
import { ProjectPayItemService } from "../services/ProjectPayItemService"
import { Prisma } from "@prisma/client"

/**
 * Project Pay Item Controller
 * Handles HTTP requests for project pay item operations
 */
export class ProjectPayItemController extends AbstractController<
  Prisma.project_pay_itemGetPayload<{}>,
  Prisma.project_pay_itemCreateInput,
  Prisma.project_pay_itemUpdateInput,
  ProjectPayItemService
> {
  protected service: ProjectPayItemService

  constructor() {
    super()
    this.service = new ProjectPayItemService()
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
          project: true,
          pay_item: true,
        },
      }
    }

    return {}
  }

  /**
   * Handle GET request
   * Supports:
   * - GET /api/project-pay-items - list all project pay items (with optional ?project_id=, ?pay_item_id= filters)
   * - GET /api/project-pay-items/[id] - get single project pay item by ID (path parameter)
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

      // Single project pay item by ID
      if (id !== null) {
        const projectPayItem = await this.service.getById(id, expandOptions)
        return this.successResponse(projectPayItem, 200)
      }

      // List all project pay items with optional filters
      const projectIdFilter = queryParams.project_id
      const payItemIdFilter = queryParams.pay_item_id

      let filters: any = {}
      if (projectIdFilter && typeof projectIdFilter === "string") {
        const projectId = parseInt(projectIdFilter, 10)
        if (!isNaN(projectId)) {
          filters.project_id = projectId
        }
      }
      if (payItemIdFilter && typeof payItemIdFilter === "string") {
        const payItemId = parseInt(payItemIdFilter, 10)
        if (!isNaN(payItemId)) {
          filters.pay_item_id = payItemId
        }
      }

      // Use repository directly if expand is needed, otherwise use service
      let projectPayItems
      if (expandOptions.include) {
        const repository = (this.service as any).repository
        projectPayItems = await repository.findMany(filters, expandOptions)
      } else {
        projectPayItems = await this.service.list(filters, undefined, undefined)
      }
      return this.successResponse(projectPayItems, 200)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  /**
   * Handle POST request
   * Creates a new project pay item
   * Query parameter ?expanded=true to include all relations in response
   */
  async handlePost(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      const queryParams = this.parseQueryParams(req)
      const expandOptions = this.parseExpand(queryParams.expanded)
      // Accept API-friendly `project_id` and `pay_item_id` and let the service normalize it.
      const body = await this.parseBody<Prisma.project_pay_itemCreateInput & { project_id?: number; pay_item_id?: number }>(req)

      const projectPayItem = await this.service.create(body, expandOptions)
      return this.successResponse(projectPayItem, 201)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  /**
   * Handle PATCH request
   * Updates an existing project pay item by ID (from path parameter)
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
        return this.badRequestResponse("Project pay item ID is required in path")
      }

      // Accept API-friendly `project_id` and `pay_item_id` and let the service normalize it.
      const body = await this.parseBody<Prisma.project_pay_itemUpdateInput & { project_id?: number; pay_item_id?: number }>(req)

      const projectPayItem = await this.service.update(id, body, expandOptions)
      return this.successResponse(projectPayItem, 200)
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  /**
   * Handle DELETE request
   * Deletes a project pay item by ID (from path parameter)
   */
  async handleDelete(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    try {
      const id = await this.parseId(req, context)

      if (id === null) {
        return this.badRequestResponse("Project pay item ID is required in path")
      }

      await this.service.delete(id)
      return this.successResponse({ message: "Project pay item deleted successfully" }, 200)
    } catch (error) {
      return this.errorResponse(error)
    }
  }
}
