import { NextRequest, NextResponse } from "next/server"
import {
  DomainError,
  domainErrorStatus,
  isDomainError,
  NotFoundError,
  ValidationError,
} from "./types"
import type { AbstractService } from "./AbstractService"

/**
 * Abstract base controller providing HTTP request/response handling
 *
 * @template TModel - The Prisma model type
 * @template TCreateDTO - API create DTO (may differ from Prisma input)
 * @template TUpdateDTO - API update DTO
 * @template TService - The service type extending AbstractService
 */
export abstract class AbstractController<
  TModel,
  TCreateDTO,
  TUpdateDTO,
  TService extends AbstractService<TModel, any, any, any, any>
> {
  /**
   * Service instance - must be set by subclasses
   */
  protected abstract service: TService

  /**
   * Parse query parameters from request
   */
  protected parseQueryParams(
    req: NextRequest
  ): Record<string, string | string[] | undefined> {
    const params: Record<string, string | string[] | undefined> = {}
    req.nextUrl.searchParams.forEach((value, key) => {
      const existing = params[key]
      if (existing === undefined) {
        params[key] = value
      } else if (Array.isArray(existing)) {
        existing.push(value)
      } else {
        params[key] = [existing, value]
      }
    })
    return params
  }

  /**
   * Parse path parameters from request context
   */
  protected async parsePathParams(
    context: { params: Promise<Record<string, string>> } | undefined
  ): Promise<Record<string, string>> {
    if (!context?.params) {
      return {}
    }
    return await context.params
  }

  /**
   * Parse JSON body from request
   */
  protected async parseBody<T = unknown>(req: NextRequest): Promise<T> {
    try {
      return await req.json()
    } catch (error) {
      throw new ValidationError("Invalid JSON in request body")
    }
  }

  /**
   * Create success response
   */
  protected successResponse(
    data: unknown,
    statusCode: number = 200,
    headers?: Record<string, string>
  ): NextResponse {
    return NextResponse.json(data, { status: statusCode, headers })
  }

  /**
   * Create error response
   */
  protected errorResponse(
    error: unknown,
    statusCode?: number,
    headers?: Record<string, string>
  ): NextResponse {
    if (isDomainError(error)) {
      const code = statusCode ?? domainErrorStatus(error.code)
      return NextResponse.json(
        {
          error: error.code,
          message: error.message,
          ...(error.meta && { meta: error.meta }),
        },
        { status: code, headers }
      )
    }

    // Handle unknown errors
    const code = statusCode ?? 500
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred"

    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message,
      },
      { status: code, headers }
    )
  }

  /**
   * Create not found response
   */
  protected notFoundResponse(
    message: string = "Resource not found"
  ): NextResponse {
    return this.errorResponse(new NotFoundError(message), 404)
  }

  /**
   * Create bad request response
   */
  protected badRequestResponse(message: string): NextResponse {
    return this.errorResponse(new ValidationError(message), 400)
  }

  /**
   * Handle GET request - must be implemented by subclasses
   */
  abstract handleGet(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse>

  /**
   * Handle POST request - must be implemented by subclasses
   */
  abstract handlePost(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse>

  /**
   * Handle PATCH request - must be implemented by subclasses
   */
  abstract handlePatch(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse>

  /**
   * Handle DELETE request - must be implemented by subclasses
   */
  abstract handleDelete(
    req: NextRequest,
    context?: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse>
}
