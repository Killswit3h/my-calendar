import { Prisma } from "@prisma/client"

/**
 * Error codes for domain errors
 */
export type DomainErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "CONFLICT"
  | "BUSINESS_LOGIC"
  | "DATABASE"
  | "UNKNOWN"

/**
 * Options for domain errors
 */
export type DomainErrorOptions = {
  cause?: unknown
  meta?: Record<string, unknown>
}

/**
 * Base domain error class
 */
export class DomainError extends Error {
  readonly code: DomainErrorCode
  readonly cause?: unknown
  readonly meta?: Record<string, unknown>

  constructor(
    code: DomainErrorCode,
    message: string,
    options: DomainErrorOptions = {}
  ) {
    super(message)
    this.name = "DomainError"
    this.code = code
    this.cause = options.cause
    this.meta = options.meta
  }
}

/**
 * Validation error - input validation failures (400)
 */
export class ValidationError extends DomainError {
  constructor(message: string, options?: DomainErrorOptions) {
    super("VALIDATION", message, options)
    this.name = "ValidationError"
  }
}

/**
 * Not found error - entity not found (404)
 */
export class NotFoundError extends DomainError {
  constructor(message: string, options?: DomainErrorOptions) {
    super("NOT_FOUND", message, options)
    this.name = "NotFoundError"
  }
}

/**
 * Conflict error - unique constraint violations (409)
 */
export class ConflictError extends DomainError {
  constructor(message: string, options?: DomainErrorOptions) {
    super("CONFLICT", message, options)
    this.name = "ConflictError"
  }
}

/**
 * Business logic error - business rule violations (422)
 */
export class BusinessLogicError extends DomainError {
  constructor(message: string, options?: DomainErrorOptions) {
    super("BUSINESS_LOGIC", message, options)
    this.name = "BusinessLogicError"
  }
}

/**
 * Database error - Prisma/database errors (500)
 */
export class DatabaseError extends DomainError {
  constructor(message: string, options?: DomainErrorOptions) {
    super("DATABASE", message, options)
    this.name = "DatabaseError"
  }
}

/**
 * Map domain error code to HTTP status code
 */
export function domainErrorStatus(code: DomainErrorCode): number {
  switch (code) {
    case "VALIDATION":
      return 400
    case "NOT_FOUND":
      return 404
    case "CONFLICT":
      return 409
    case "BUSINESS_LOGIC":
      return 422
    case "DATABASE":
      return 500
    default:
      return 500
  }
}

/**
 * Type guard for domain errors
 */
export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number
  pageSize?: number
  skip?: number
  take?: number
}

/**
 * Pagination result
 */
export interface PaginationResult {
  page: number
  pageSize: number
  total: number
  totalPages: number
}
