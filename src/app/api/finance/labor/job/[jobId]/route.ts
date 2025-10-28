import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getPrisma } from '@/lib/db'
import { isFinanceLaborEnabled } from '@/lib/finance/config'
import { deriveEventSegments, hoursForAssignment, resolveRange } from '@/lib/finance/labor'

const querySchema = z.object({
  start: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  end: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
})

const OVERTIME_THRESHOLD = Number.isFinite(Number(process.env.LABOR_OVERTIME_THRESHOLD))
  ? Number(process.env.LABOR_OVERTIME_THRESHOLD)
  : 8
const OVERTIME_MULTIPLIER = Number.isFinite(Number(process.env.LABOR_OT_MULTIPLIER))
  ? Number(process.env.LABOR_OT_MULTIPLIER)
  : 1.5

const round2 = (value: number) => Math.round(value * 100) / 100

const toNumber = (value: any): number => {
  if (value == null) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'bigint') return Number(value)
  if (typeof value.toNumber === 'function') return Number(value.toNumber())
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

type EventRecord = {
  id: string
  title: string
  startsAt: Date
  endsAt: Date
  allDay: boolean
}

type AssignmentRecord = {
  id: string
  eventId: string
  employeeId: string
  dayOverride: Date | null
  hours: any
  note: string | null
}

type EmployeeRecord = {
  id: string
  name: string | null
  hourlyRate: any
}

export async function GET(request: Request, context: { params: Promise<{ jobId: string }> }) {
  if (!isFinanceLaborEnabled()) {
    return NextResponse.json({ error: 'Finance labor dashboard is disabled' }, { status: 404 })
  }

  const { jobId } = await context.params
  const url = new URL(request.url)
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams))

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters', details: parsed.error.flatten() }, { status: 400 })
  }

  const { start, end } = parsed.data
  const range = resolveRange(start, end)
  const prisma = await getPrisma()

  if (range.from.getTime() > range.to.getTime()) {
    return NextResponse.json({ error: '`start` must be on or before `end`' }, { status: 400 })
  }

  const project = await prisma.project.findUnique({
    where: { id: jobId },
    select: { id: true, name: true, customer: { select: { name: true } } },
  })

  const events = (await prisma.event.findMany({
    where: {
      projectId: jobId,
      startsAt: { lte: range.to },
      endsAt: { gte: range.from },
    },
    select: {
      id: true,
      title: true,
      startsAt: true,
      endsAt: true,
      allDay: true,
    },
  })) as EventRecord[]

  if (events.length === 0) {
    return NextResponse.json({
      range: { start: range.fromIso, end: range.toIso },
      job: { id: jobId, name: project?.name ?? null },
      totals: { days: 0, employees: 0, hours: 0, cost: 0, averageRate: 0 },
      days: [],
    })
  }

  const eventIds = events.map(event => event.id)

  const assignments = (await prisma.eventAssignment.findMany({
    where: { eventId: { in: eventIds } },
    select: {
      id: true,
      eventId: true,
      employeeId: true,
      dayOverride: true,
      hours: true,
      note: true,
    },
  })) as AssignmentRecord[]

  const employeeIds = Array.from(new Set(assignments.map(assignment => assignment.employeeId)))
  const employees = (await prisma.employee.findMany({
    where: { id: { in: employeeIds } },
    select: { id: true, name: true, hourlyRate: true },
  })) as EmployeeRecord[]

  const employeeMap = new Map(employees.map(employee => [employee.id, employee]))
  const assignmentsByEvent = new Map<string, AssignmentRecord[]>()

  for (const assignment of assignments) {
    const bucket = assignmentsByEvent.get(assignment.eventId)
    if (bucket) bucket.push(assignment)
    else assignmentsByEvent.set(assignment.eventId, [assignment])
  }

  type DayEmployeeKey = `${string}::${string}::${string}`

  interface DayEmployeeAccumulator {
    dayKey: string
    eventId: string
    eventTitle: string
    employeeId: string
    employeeName: string
    hours: number
    rate: number
    note: string | null
  }

  const accumulator = new Map<DayEmployeeKey, DayEmployeeAccumulator>()

  for (const event of events) {
    const segments = deriveEventSegments(event).filter(
      segment => segment.dayKey >= range.fromIso && segment.dayKey <= range.toIso,
    )

    if (segments.length === 0) continue

    const eventAssignments = assignmentsByEvent.get(event.id) ?? []

    for (const assignment of eventAssignments) {
      const employee = employeeMap.get(assignment.employeeId)
      if (!employee) continue

      for (const segment of segments) {
        const hours = hoursForAssignment(segment, assignment)
        if (hours <= 0) continue

        const key: DayEmployeeKey = `${segment.dayKey}::${event.id}::${employee.id}`
        const entry =
          accumulator.get(key) ??
          (() => {
            const created: DayEmployeeAccumulator = {
              dayKey: segment.dayKey,
              eventId: event.id,
              eventTitle: event.title,
              employeeId: employee.id,
              employeeName: employee.name ?? employee.id,
              hours: 0,
              rate: toNumber(employee.hourlyRate),
              note: assignment.note ?? null,
            }
            accumulator.set(key, created)
            return created
          })()

        entry.hours = round2(entry.hours + hours)
      }
    }
  }

  const dayBuckets = new Map<
    string,
    {
      hours: number
      cost: number
      employees: DayRow['employees']
    }
  >()

  const uniqueEmployees = new Set<string>()
  let totalsHours = 0
  let totalsCost = 0

  for (const entry of accumulator.values()) {
    const rate = entry.rate > 0 ? entry.rate : 0
    const regularHours = Math.min(entry.hours, OVERTIME_THRESHOLD)
    const overtimeHours = Math.max(entry.hours - regularHours, 0)
    const regularCost = rate > 0 ? round2(regularHours * rate) : 0
    const overtimeCost = rate > 0 ? round2(overtimeHours * rate * OVERTIME_MULTIPLIER) : 0
    const totalCost = round2(regularCost + overtimeCost)

    const bucket =
      dayBuckets.get(entry.dayKey) ??
      (() => {
        const created = { hours: 0, cost: 0, employees: [] as DayRow['employees'] }
        dayBuckets.set(entry.dayKey, created)
        return created
      })()

    bucket.employees.push({
      employeeId: entry.employeeId,
      employeeName: entry.employeeName,
      hours: entry.hours,
      regularHours,
      overtimeHours,
      rate,
      regularCost,
      overtimeCost,
      totalCost,
      eventId: entry.eventId,
      eventTitle: entry.eventTitle,
      note: entry.note,
    })

    bucket.hours = round2(bucket.hours + entry.hours)
    bucket.cost = round2(bucket.cost + totalCost)

    totalsHours = round2(totalsHours + entry.hours)
    totalsCost = round2(totalsCost + totalCost)
    uniqueEmployees.add(entry.employeeId)
  }

  const days: DayRow[] = Array.from(dayBuckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dayKey, bucket]) => ({
      day: dayKey,
      hours: bucket.hours,
      cost: bucket.cost,
      employees: bucket.employees.sort((a, b) => a.employeeName.localeCompare(b.employeeName)),
    }))

  return NextResponse.json({
    range: { start: range.fromIso, end: range.toIso },
    job: {
      id: jobId,
      name: project?.name ?? days[0]?.employees[0]?.eventTitle ?? null,
    },
    totals: {
      days: dayBuckets.size,
      employees: uniqueEmployees.size,
      hours: totalsHours,
      cost: totalsCost,
      averageRate: totalsHours > 0 ? round2(totalsCost / totalsHours) : 0,
    },
    days,
  } satisfies JobDetailResponse)
}

type DayRow = {
  day: string
  hours: number
  cost: number
  employees: Array<{
    employeeId: string
    employeeName: string
    hours: number
    regularHours: number
    overtimeHours: number
    rate: number
    regularCost: number
    overtimeCost: number
    totalCost: number
    eventId: string
    eventTitle: string | null
    note: string | null
  }>
}

type JobDetailResponse = {
  range: { start: string; end: string }
  job: { id: string; name: string | null }
  totals: {
    days: number
    employees: number
    hours: number
    cost: number
    averageRate: number
  }
  days: DayRow[]
}
