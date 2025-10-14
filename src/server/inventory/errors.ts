export type InventoryErrorCode = 'VALIDATION' | 'NOT_FOUND' | 'CONFLICT' | 'DEPENDENCY' | 'UNKNOWN'

export type InventoryErrorOptions = {
  cause?: unknown
  meta?: Record<string, unknown>
}

export class InventoryError extends Error {
  readonly code: InventoryErrorCode
  readonly cause?: unknown
  readonly meta?: Record<string, unknown>

  constructor(code: InventoryErrorCode, message: string, options: InventoryErrorOptions = {}) {
    super(message)
    this.name = 'InventoryError'
    this.code = code
    this.cause = options.cause
    this.meta = options.meta
  }
}

export function isInventoryError(error: unknown): error is InventoryError {
  return error instanceof InventoryError
}

export function inventoryErrorStatus(code: InventoryErrorCode): number {
  switch (code) {
    case 'VALIDATION':
      return 400
    case 'NOT_FOUND':
      return 404
    case 'CONFLICT':
    case 'DEPENDENCY':
      return 409
    default:
      return 500
  }
}
