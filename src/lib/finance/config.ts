const parseBoolean = (value: string | undefined | null): boolean => {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on'
}

const parseNumber = (value: string | undefined | null, fallback: number): number => {
  if (!value) return fallback
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const FINANCE_LABOR_ENABLED = parseBoolean(process.env.FINANCE_LABOR_ENABLED)

export const LABOR_DEFAULT_DAY_HOURS = parseNumber(process.env.LABOR_DEFAULT_DAY_HOURS, 8)
export const LABOR_OVERTIME_THRESHOLD = process.env.LABOR_OVERTIME_THRESHOLD
  ? parseNumber(process.env.LABOR_OVERTIME_THRESHOLD, 8)
  : null
export const LABOR_OT_MULTIPLIER = parseNumber(process.env.LABOR_OT_MULTIPLIER, 1.5)

export const isFinanceLaborEnabled = () => FINANCE_LABOR_ENABLED
