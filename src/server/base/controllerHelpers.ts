import { NextResponse } from "next/server"

/**
 * Parse an optional query param as integer.
 * Returns undefined if missing or invalid.
 */
export function parseOptionalIntParam(
  value: string | string[] | undefined
): number | undefined {
  const raw = Array.isArray(value) ? value[0] : value
  if (raw === undefined || raw === null || raw === "") return undefined
  const n = parseInt(raw, 10)
  return Number.isInteger(n) && !isNaN(n) ? n : undefined
}

/**
 * Build include object when expanded=true.
 * Use in controllers to avoid duplicating parseExpand logic.
 */
export function parseExpandToInclude<T extends Record<string, boolean>>(
  expanded: string | string[] | undefined,
  includeShape: T
): { include?: T } {
  if (!expanded) return {}
  const v = Array.isArray(expanded) ? expanded[0] : expanded
  if (v === "true") return { include: includeShape }
  return {}
}
