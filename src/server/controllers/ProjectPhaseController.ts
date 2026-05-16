import { NextRequest, NextResponse } from "next/server"
import { formatPhasesForApi } from "@/lib/projectPhaseApiFormat"
import { domainErrorStatus, isDomainError, ValidationError } from "../base/types"
import { ProjectPhaseService } from "../services/ProjectPhaseService"

/**
 * HTTP handlers for GET/PUT `/api/projects/[id]/phases`.
 */
export class ProjectPhaseController {
  private service: ProjectPhaseService

  constructor() {
    this.service = new ProjectPhaseService()
  }

  private errorResponse(error: unknown): NextResponse {
    if (isDomainError(error)) {
      const code = domainErrorStatus(error.code)
      return NextResponse.json(
        {
          error: error.code,
          message: error.message,
          ...(error.meta && { meta: error.meta }),
        },
        { status: code },
      )
    }
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred"
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message },
      { status: 500 },
    )
  }

  /**
   * GET /api/projects/[id]/phases — list phases with lines for the project.
   */
  async handleGet(
    _req: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ): Promise<NextResponse> {
    try {
      const pathParams = await context.params
      const id = parseInt(pathParams.id ?? "", 10)
      if (!Number.isInteger(id) || id <= 0) {
        return this.errorResponse(new ValidationError("Invalid project id"))
      }
      const rows = await this.service.listForProject(id)
      return NextResponse.json({ phases: formatPhasesForApi(rows) }, { status: 200 })
    } catch (error) {
      return this.errorResponse(error)
    }
  }

  /**
   * PUT /api/projects/[id]/phases — replace all phases for the project.
   */
  async handlePut(
    req: NextRequest,
    context: { params: Promise<Record<string, string>> },
  ): Promise<NextResponse> {
    try {
      const pathParams = await context.params
      const id = parseInt(pathParams.id ?? "", 10)
      if (!Number.isInteger(id) || id <= 0) {
        return this.errorResponse(new ValidationError("Invalid project id"))
      }
      let body: unknown
      try {
        body = await req.json()
      } catch {
        return this.errorResponse(new ValidationError("Invalid JSON in request body"))
      }
      const rows = await this.service.replaceForProject(id, body)
      return NextResponse.json({ phases: formatPhasesForApi(rows) }, { status: 200 })
    } catch (error) {
      return this.errorResponse(error)
    }
  }
}
