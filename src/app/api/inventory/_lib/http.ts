import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { InventoryError, inventoryErrorStatus, isInventoryError } from '@/server/inventory'

export function inventoryErrorResponse(error: unknown) {
  if (isInventoryError(error)) {
    return NextResponse.json(
      {
        error: error.code,
        message: error.message,
        ...(error.meta ? { meta: error.meta } : {}),
      },
      { status: inventoryErrorStatus(error.code) },
    )
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'VALIDATION',
        message: 'Request validation failed',
        issues: error.issues,
      },
      { status: 400 },
    )
  }

  console.error('inventory api unexpected error', error)
  return NextResponse.json({ error: 'UNKNOWN', message: 'Unexpected inventory error' }, { status: 500 })
}

export async function readJsonBody<T = Record<string, unknown>>(req: NextRequest): Promise<T> {
  try {
    const data = (await req.json()) as unknown
    if (!data || typeof data !== 'object') {
      throw new InventoryError('VALIDATION', 'Request body must be a JSON object')
    }
    return data as T
  } catch (error) {
    if (isInventoryError(error)) throw error
    throw new InventoryError('VALIDATION', 'Invalid JSON body', { cause: error })
  }
}

export function parseIncludeDeleted(searchParams: URLSearchParams): boolean {
  const value = searchParams.get('includeDeleted')
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return normalized === 'true' || normalized === '1' || normalized === 'yes'
}
