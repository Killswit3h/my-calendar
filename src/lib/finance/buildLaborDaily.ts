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

  const prisma = options.prisma ?? (await getPrisma())

  const windowStartUtc = zonedStartOfDayUtc(startDate)
  const windowEndExclusiveUtc = zonedEndOfDayUtc(endDate)
  const endDayUtc = zonedStartOfDayUtc(endDate)

  const events = await prisma.event.findMany({
    where: {
      startsAt: { lt: windowEndExclusiveUtc },
      endsAt: { gt: windowStartUtc },
    },
    select: {
      id: true,
      calendarId: true,
      title: true,
      startsAt: true,
      endsAt: true,
    },
  })

  type EventRow = (typeof events)[number]
  const eventIds = events.map((event: EventRow) => event.id)
  if (!eventIds.length) {
    await prisma.laborDaily.deleteMany({
      where: {
        day: {
          gte: windowStartUtc,
          lte: endDayUtc,
        },
      },
    })
    return { rowsInserted: 0, missingRates: [] }
  }

  const [assignments, calendars] = await Promise.all([
    prisma.eventAssignment.findMany({
      where: { eventId: { in: eventIds } },
      select: {
        id: true,
        eventId: true,
        employeeId: true,
        dayOverride: true,
        hours: true,
        note: true,
      },
    }),
    prisma.calendar.findMany({
      where: { id: { in: Array.from(new Set(events.map((event: EventRow) => event.calendarId))) } },
      select: { id: true, name: true },
    }),
  ])

  type AssignmentRow = (typeof assignments)[number]

  const assignmentsByEvent = new Map<string, AssignmentRow[]>()
  for (const assignment of assignments) {
    const list = assignmentsByEvent.get(assignment.eventId)
    if (list) list.push(assignment)
    else assignmentsByEvent.set(assignment.eventId, [assignment])
  }

  const employeeIds = Array.from(new Set(assignments.map((assignment: AssignmentRow) => assignment.employeeId)))

  const [employees, hourlyRates] = await Promise.all([
    prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      select: { id: true, name: true, hourlyRate: true },
    }),
    employeeIds.length
      ? prisma.hourlyRate.findMany({
          where: { employeeId: { in: employeeIds } },
          orderBy: { effectiveDate: 'asc' },
        })
      : Promise.resolve([]),
  ])

  type EmployeeRow = { id: string; name: string | null; hourlyRate: Prisma.Decimal | null }
  type CalendarRow = (typeof calendars)[number]

  const employeesById = new Map<string, EmployeeRow>(
    employees.map((employee: any) => ({
      id: String(employee.id ?? ''),
      name: typeof employee.name === 'string' ? employee.name : null,
      hourlyRate:
        employee.hourlyRate instanceof Prisma.Decimal
          ? employee.hourlyRate
          : employee.hourlyRate != null
            ? new Prisma.Decimal(employee.hourlyRate)
            : null,
    }))
      .filter((employee: EmployeeRow) => employee.id)
      .map((employee: EmployeeRow) => [employee.id, employee]),
  )
  const calendarById = new Map<string, string>(
    calendars
      .map((calendar: CalendarRow) => ({
        id: String((calendar as any).id ?? ''),
        name: typeof (calendar as any).name === 'string' ? (calendar as any).name : undefined,
      }))
      .filter((calendar: { id: string; name?: string }) => calendar.id.length > 0)
      .map((calendar: { id: string; name?: string }) => [calendar.id, calendar.name ?? `Job ${calendar.id}`]),
  )

  const ratesByEmployee = new Map<string, { effectiveDate: Date; rate: number }[]>()
  for (const rateRow of hourlyRates) {
    const list = ratesByEmployee.get(rateRow.employeeId)
    const entry = { effectiveDate: rateRow.effectiveDate, rate: Number(rateRow.rate) }
    if (list) list.push(entry)
    else ratesByEmployee.set(rateRow.employeeId, [entry])
  }
  for (const list of ratesByEmployee.values()) {
    list.sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())
  }

  const baseDay = startDate
  const dayRangeSet = { start: baseDay, end: endDate }

  const dayToUtcCache = new Map<string, Date>()
  const toUtcDay = (day: string) => {
    let cached = dayToUtcCache.get(day)
    if (!cached) {
      cached = zonedStartOfDayUtc(day)
      dayToUtcCache.set(day, cached)
    }
    return cached
  }

  const resolveRate = (employeeId: string, day: string): number | null => {
    const rateRows = ratesByEmployee.get(employeeId)
    const dayUtc = toUtcDay(day)
    const dayMs = dayUtc.getTime()
    if (rateRows && rateRows.length) {
      let candidate: number | null = null
      for (const row of rateRows) {
        if (row.effectiveDate.getTime() <= dayMs) {
          candidate = row.rate
        } else {
          break
        }
      }
      if (candidate != null) return candidate
    }
    const employee = employeesById.get(employeeId)
    if (employee?.hourlyRate != null) return Number(employee.hourlyRate)
    return null
  }

  const missingRateSet = new Set<string>()
  const missingRates: MissingRate[] = []
  const rows: Prisma.LaborDailyCreateManyInput[] = []

  for (const event of events) {
    const segments = splitEventIntoETDays(event.startsAt, event.endsAt)
    if (!segments.length) continue

    const eventAssignments: AssignmentRow[] = assignmentsByEvent.get(event.id) ?? []
    if (!eventAssignments.length) continue

    const baseAssignments = eventAssignments.filter(a => !a.dayOverride)
    const overridesByDay = new Map<string, AssignmentRow[]>()
    for (const assignment of eventAssignments) {
      if (!assignment.dayOverride) continue
      const overrideDay = formatInTimeZone(assignment.dayOverride, APP_TZ).date
      const list = overridesByDay.get(overrideDay)
      if (list) list.push(assignment)
      else overridesByDay.set(overrideDay, [assignment])
    }

    const jobName = calendarById.get(event.calendarId) ?? `Job ${event.calendarId}`

    for (const segment of segments) {
      if (segment.day < dayRangeSet.start || segment.day > dayRangeSet.end) continue

      const overrides = overridesByDay.get(segment.day) ?? []

      const assignmentsByEmployee = new Map<string, AssignmentRow>()
      for (const assignment of baseAssignments) {
        assignmentsByEmployee.set(assignment.employeeId, assignment)
      }
      for (const override of overrides) {
        assignmentsByEmployee.set(override.employeeId, override)
      }

      for (const [employeeId, assignment] of assignmentsByEmployee) {
        const hoursOverride = assignment.hours != null ? Number(assignment.hours) : null
        const segmentHours = round(
          hoursOverride != null ? hoursOverride : Math.min(LABOR_DEFAULT_DAY_HOURS, segment.hours),
        )
        if (segmentHours <= 0) continue

        const rate = resolveRate(employeeId, segment.day)
        if (rate == null) {
          const key = `${employeeId}|${segment.day}`
          if (!missingRateSet.has(key)) {
            missingRateSet.add(key)
            missingRates.push({ employeeId, day: segment.day })
          }
          continue
        }

        const split = splitHoursWithOvertime(segmentHours)
        const regularCost = round(split.regularHours * rate * split.regularCostMultiplier)
        const overtimeCost = round(split.overtimeHours * rate * split.overtimeCostMultiplier)
        const totalCost = round(regularCost + overtimeCost)

        const employee = employeesById.get(employeeId)
        const employeeName = employee?.name ?? employeeId

        rows.push({
          id: `${segment.day}-${event.id}-${employeeId}`,
          jobId: event.calendarId,
          jobName,
          day: toUtcDay(segment.day),
          eventId: event.id,
          eventTitle: event.title,
          employeeId,
          employeeName,
          assignmentId: assignment.id,
          hoursDecimal: new Prisma.Decimal(segmentHours.toFixed(2)),
          regularHours: new Prisma.Decimal(split.regularHours.toFixed(2)),
          overtimeHours: new Prisma.Decimal(split.overtimeHours.toFixed(2)),
          rateUsd: new Prisma.Decimal(rate.toFixed(2)),
          regularCostUsd: new Prisma.Decimal(regularCost.toFixed(2)),
          overtimeCostUsd: new Prisma.Decimal(overtimeCost.toFixed(2)),
          totalCostUsd: new Prisma.Decimal(totalCost.toFixed(2)),
          note: assignment.note ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
    }
  }

  await prisma.$transaction([
    prisma.laborDaily.deleteMany({
      where: {
        day: {
          gte: windowStartUtc,
          lte: endDayUtc,
        },
      },
    }),
    rows.length
      ? prisma.laborDaily.createMany({
          data: rows,
        })
      : undefined,
  ].filter(Boolean) as any)

  return { rowsInserted: rows.length, missingRates }
}
