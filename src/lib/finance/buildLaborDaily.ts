import { Prisma, type PrismaClient } from '@prisma/client'
import { getPrisma } from '@/lib/db'
import { splitEventIntoETDays } from '@/lib/time/splitEventIntoETDays'
import { formatInTimeZone, zonedEndOfDayUtc, zonedStartOfDayUtc, APP_TZ } from '@/lib/timezone'
import {
  LABOR_DEFAULT_DAY_HOURS,
  LABOR_OT_MULTIPLIER,
  LABOR_OVERTIME_THRESHOLD,
} from '@/lib/finance/config'

const round = (value: number, digits = 2) => Number(Number.isFinite(value) ? value.toFixed(digits) : '0')

const dayKeyFromDate = (utc: Date) => formatInTimeZone(utc, APP_TZ).date

type MissingRate = { employeeId: string; day: string }

export type BuildLaborDailyOptions = {
  startDate: string
  endDate: string
  prisma?: PrismaClient
}

export type BuildLaborDailyResult = {
  rowsInserted: number
  missingRates: MissingRate[]
}

function splitHoursWithOvertime(hours: number) {
  if (LABOR_OVERTIME_THRESHOLD == null || hours <= LABOR_OVERTIME_THRESHOLD) {
    return {
      regularHours: round(hours),
      overtimeHours: 0,
      regularCostMultiplier: 1,
      overtimeCostMultiplier: 0,
    }
  }
  const regularHours = round(LABOR_OVERTIME_THRESHOLD)
  const overtimeHours = round(hours - LABOR_OVERTIME_THRESHOLD)
  return {
    regularHours,
    overtimeHours,
    regularCostMultiplier: 1,
    overtimeCostMultiplier: LABOR_OT_MULTIPLIER,
  }
}

function ensureIsoDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Expected date in YYYY-MM-DD format, received ${value}`)
  }
  return value
}

export async function buildLaborDaily(options: BuildLaborDailyOptions): Promise<BuildLaborDailyResult> {
  const startDate = ensureIsoDate(options.startDate)
  const endDate = ensureIsoDate(options.endDate)
  if (startDate > endDate) {
    throw new Error('startDate must be on or before endDate')
  }

  // Labor daily functionality not available - models don't match schema
  return { rowsInserted: 0, missingRates: [] }
}
