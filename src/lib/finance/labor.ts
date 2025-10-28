import type { Customer, Employee, Event, EventAssignment, Project } from '@prisma/client'
import { APP_TZ, addDaysUtc, formatInTimeZone, zonedEndOfDayUtc, zonedStartOfDayUtc } from '@/lib/timezone'

const DEFAULT_DAY_HOURS = (() => {
  const raw = Number(process.env.LABOR_DEFAULT_DAY_HOURS ?? 8)
  return Number.isFinite(raw) && raw > 0 ? raw : 8
})()

type NumericLike = number | null | undefined | { toNumber: () => number } | { toString: () => string }

const toNumber = (value: NumericLike): number => {
  if (value == null) return 0
  if (typeof value === 'number') return value
  if (typeof (value as any).toNumber === 'function') {
    return Number((value as any).toNumber())
  }
  if (typeof (value as any).toString === 'function') {
    const asNumber = Number((value as any).toString())
    return Number.isFinite(asNumber) ? asNumber : 0
  }
  return 0
}

export interface EventSegment {
  eventId: string
  start: Date
  end: Date
  hours: number
  isAllDay: boolean
  dayKey: string
  index: number
  isFirstSegment: boolean
  isLastSegment: boolean
}

export interface HoursAssignmentInput
  extends Pick<EventAssignment, 'id' | 'eventId' | 'employeeId' | 'dayOverride' | 'hours'> {}

export const toDayKey = (date: Date) => formatInTimeZone(date, APP_TZ).date

const normalizeTitleKey = (title: string) =>
  title
    .toLowerCase()
    .replace(/\b\d{1,2}(?:st|nd|rd|th)?\b/g, '')
    .replace(/\d{2,4}/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled'

const round2 = (value: number) => Math.round(value * 100) / 100

export const deriveEventSegments = (event: Pick<Event, 'id' | 'startsAt' | 'endsAt' | 'allDay'>): EventSegment[] => {
  const start = new Date(event.startsAt)
  const end = new Date(event.endsAt)

  const buildSegment = (segmentStart: Date, segmentEnd: Date, hours: number, index: number): EventSegment => ({
    eventId: event.id,
    start: segmentStart,
    end: segmentEnd,
    hours,
    isAllDay: event.allDay,
    dayKey: toDayKey(segmentStart),
    index,
    isFirstSegment: index === 0,
    isLastSegment: false,
  })

  const segments: EventSegment[] = []

  if (event.allDay) {
    const startDay = formatInTimeZone(start, APP_TZ).date
    const endAnchor = end.getTime() > start.getTime() ? new Date(end.getTime() - 1) : start
    const endDay = formatInTimeZone(endAnchor, APP_TZ).date

    let cursor = zonedStartOfDayUtc(startDay)
    const last = zonedStartOfDayUtc(endDay)
    let index = 0

    while (cursor.getTime() <= last.getTime()) {
      const next = addDaysUtc(cursor, 1)
      segments.push(buildSegment(cursor, next, DEFAULT_DAY_HOURS, index))
      cursor = next
      index += 1
    }
  } else {
    if (end.getTime() <= start.getTime()) {
      segments.push(buildSegment(start, end, 0, 0))
    } else {
      const startDay = formatInTimeZone(start, APP_TZ).date
      const endAnchor = new Date(end.getTime() - 1)
      const endDay = formatInTimeZone(endAnchor, APP_TZ).date

      let cursor = zonedStartOfDayUtc(startDay)
      const last = zonedStartOfDayUtc(endDay)
      let index = 0

      while (cursor.getTime() <= last.getTime()) {
        const next = addDaysUtc(cursor, 1)
        const segmentStart = new Date(Math.max(start.getTime(), cursor.getTime()))
        const segmentEnd = new Date(Math.min(end.getTime(), next.getTime()))
        if (segmentEnd.getTime() > segmentStart.getTime()) {
          const hours = Math.max((segmentEnd.getTime() - segmentStart.getTime()) / 3_600_000, 0)
          segments.push(buildSegment(segmentStart, segmentEnd, hours, index))
          index += 1
        }
        cursor = next
      }
    }
  }

  if (segments.length === 0) {
    segments.push(buildSegment(start, end, 0, 0))
  }

  segments.forEach((segment, idx) => {
    segment.index = idx
    segment.isFirstSegment = idx === 0
    segment.isLastSegment = idx === segments.length - 1
  })

  return segments
}

export const hoursForAssignment = (segment: EventSegment, assignment: HoursAssignmentInput): number => {
  const override = assignment.hours != null ? toNumber(assignment.hours) : null

  if (assignment.dayOverride) {
    const dayOverrideKey = toDayKey(new Date(assignment.dayOverride))
    if (dayOverrideKey !== segment.dayKey) {
      return 0
    }
    return override != null ? override : segment.hours
  }

  if (override != null) {
    return segment.isFirstSegment ? override : 0
  }

  return segment.hours
}

export interface FinanceLaborEmployee {
  employeeId: string
  name: string
  payRate: number
  hours: number
  cost: number
  missingPayRate: boolean
}

export interface FinanceLaborProject {
  projectKey: string
  projectId?: string
  projectName: string
  customerId?: string
  customerName?: string
  firstEvent: string
  lastEvent: string
  totalHours: number
  totalCost: number
  employees: FinanceLaborEmployee[]
  warnings: string[]
  eventCount: number
}

export interface FinanceLaborResponse {
  range: { from: string; to: string }
  projects: FinanceLaborProject[]
  summary: {
    projects: number
    totalHours: number
    totalCost: number
    employees: number
    warnings: number
  }
}

type AggregationRange = {
  from: Date
  to: Date
  fromIso: string
  toIso: string
}

interface AggregateInput {
  events: Array<
    Pick<Event, 'id' | 'title' | 'startsAt' | 'endsAt' | 'allDay' | 'projectId' | 'customerId' | 'calendarId'>
  >
  assignments: HoursAssignmentInput[]
  employees: Array<Pick<Employee, 'id' | 'name' | 'hourlyRate'>>
  projects: Array<Pick<Project, 'id' | 'name' | 'customerId'>>
  customers: Array<Pick<Customer, 'id' | 'name'>>
  range: AggregationRange
}

interface ProjectBucket {
  projectKey: string
  projectId?: string
  projectName: string
  customerId?: string
  customerName?: string
  firstEvent?: Date
  lastEvent?: Date
  totalHours: number
  totalCost: number
  employees: Map<
    string,
    {
      employeeId: string
      name: string
      payRate: number
      hours: number
      cost: number
      missingPayRate: boolean
    }
  >
  warnings: Set<string>
  eventCount: number
}

export const aggregateByProject = ({
  events,
  assignments,
  employees,
  projects,
  customers,
  range,
}: AggregateInput): FinanceLaborResponse => {
  const fromDay = range.fromIso
  const toDay = range.toIso

  const employeeMap = new Map(employees.map(emp => [emp.id, emp]))
  const projectMap = new Map(projects.map(project => [project.id, project]))
  const customerMap = new Map(customers.map(customer => [customer.id, customer]))

  const assignmentsByEvent = new Map<string, HoursAssignmentInput[]>()
  for (const assignment of assignments) {
    const bucket = assignmentsByEvent.get(assignment.eventId)
    if (bucket) {
      bucket.push(assignment)
    } else {
      assignmentsByEvent.set(assignment.eventId, [assignment])
    }
  }

  const syntheticBuckets = new Map<string, ProjectBucket>()

  for (const event of events) {
    const segments = deriveEventSegments(event)
    const relevantSegments = segments.filter(segment => segment.dayKey >= fromDay && segment.dayKey <= toDay)
    if (relevantSegments.length === 0) {
      continue
    }

    const project = event.projectId ? projectMap.get(event.projectId) ?? null : null
    const customerId = event.customerId ?? project?.customerId ?? undefined
    const customer = customerId ? customerMap.get(customerId) ?? null : null

    let projectKey: string
    let projectName: string
    if (project) {
      projectKey = `project:${project.id}`
      projectName = project.name
    } else {
      const normalized = normalizeTitleKey(event.title)
      projectKey = `synthetic:${customerId ?? 'none'}:${normalized}`
      projectName = customer ? `Unassigned — ${customer.name}` : event.title
    }

    let bucket = syntheticBuckets.get(projectKey)
    if (!bucket) {
      bucket = {
        projectKey,
        projectId: project?.id ?? undefined,
        projectName,
        customerId,
        customerName: customer?.name,
        totalHours: 0,
        totalCost: 0,
        employees: new Map(),
        warnings: new Set(),
        eventCount: 0,
      }
      syntheticBuckets.set(projectKey, bucket)
    }

    bucket.eventCount += 1

    const eventStart = relevantSegments[0]!.start
    const eventEnd = relevantSegments[relevantSegments.length - 1]!.end

    if (!bucket.firstEvent || eventStart.getTime() < bucket.firstEvent.getTime()) {
      bucket.firstEvent = eventStart
    }
    if (!bucket.lastEvent || eventEnd.getTime() > bucket.lastEvent.getTime()) {
      bucket.lastEvent = eventEnd
    }

    if (!project && !customer) {
      bucket.warnings.add(`Event ${event.id} has no project or customer link`)
    }

    if (new Date(event.endsAt).getTime() <= new Date(event.startsAt).getTime()) {
      bucket.warnings.add(`Event ${event.id} has non-positive duration`)
    }

    const eventAssignments = assignmentsByEvent.get(event.id) ?? []
    if (eventAssignments.length === 0) {
      bucket.warnings.add(`Event ${event.id} has no employee assignments`)
    }

    for (const assignment of eventAssignments) {
      const employee = employeeMap.get(assignment.employeeId)
      if (!employee) {
        bucket.warnings.add(`Assignment ${assignment.id} references missing employee ${assignment.employeeId}`)
        continue
      }

      let hoursAccumulator = 0
      for (const segment of relevantSegments) {
        const segmentHours = hoursForAssignment(segment, assignment)
        if (segmentHours > 0) {
          hoursAccumulator += segmentHours
        }
      }

      if (hoursAccumulator <= 0) {
        continue
      }

      const payRate = toNumber(employee.hourlyRate)
      const missingRate = payRate <= 0
      if (missingRate) {
        bucket.warnings.add(`Employee ${employee.name ?? employee.id} has no pay rate`)
      }

      const cost = round2(hoursAccumulator * (missingRate ? 0 : payRate))

      const employeeBucket =
        bucket.employees.get(employee.id) ??
        ({
          employeeId: employee.id,
          name: employee.name ?? employee.id,
          payRate,
          hours: 0,
          cost: 0,
          missingPayRate: missingRate,
        } as FinanceLaborEmployee)

      employeeBucket.hours = round2(employeeBucket.hours + hoursAccumulator)
      employeeBucket.cost = round2(employeeBucket.cost + cost)
      employeeBucket.missingPayRate = employeeBucket.missingPayRate || missingRate
      employeeBucket.payRate = payRate

      bucket.employees.set(employee.id, employeeBucket)
      bucket.totalHours = round2(bucket.totalHours + hoursAccumulator)
      bucket.totalCost = round2(bucket.totalCost + cost)
    }
  }

  const projectsOut: FinanceLaborProject[] = []
  const globalEmployeeIds = new Set<string>()
  let totalWarnings = 0
  let totalHours = 0
  let totalCost = 0

  for (const bucket of syntheticBuckets.values()) {
    const employeesArray = Array.from(bucket.employees.values()).sort((a, b) => a.name.localeCompare(b.name))
    employeesArray.forEach(emp => globalEmployeeIds.add(emp.employeeId))

    totalHours = round2(totalHours + bucket.totalHours)
    totalCost = round2(totalCost + bucket.totalCost)
    totalWarnings += bucket.warnings.size

    projectsOut.push({
      projectKey: bucket.projectKey,
      projectId: bucket.projectId,
      projectName: bucket.projectName,
      customerId: bucket.customerId,
      customerName: bucket.customerName,
      firstEvent: bucket.firstEvent ? bucket.firstEvent.toISOString() : range.from.toISOString(),
      lastEvent: bucket.lastEvent ? bucket.lastEvent.toISOString() : range.to.toISOString(),
      totalHours: round2(bucket.totalHours),
      totalCost: round2(bucket.totalCost),
      employees: employeesArray,
      warnings: Array.from(bucket.warnings.values()),
      eventCount: bucket.eventCount,
    })
  }

  projectsOut.sort((a, b) => b.totalCost - a.totalCost || a.projectName.localeCompare(b.projectName))

  return {
    range: { from: range.fromIso, to: range.toIso },
    projects: projectsOut,
    summary: {
      projects: projectsOut.length,
      totalHours: round2(totalHours),
      totalCost: round2(totalCost),
      employees: globalEmployeeIds.size,
      warnings: totalWarnings,
    },
  }
}

export const resolveRange = (from?: string, to?: string): AggregationRange => {
  const today = new Date()
  const defaultFrom = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))
  const defaultTo = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0))

  const parseDateOrDefault = (value: string | undefined, fallback: Date): Date => {
    if (!value) return new Date(fallback)
    const match = /^\d{4}-\d{2}-\d{2}$/.test(value)
    if (!match) return new Date(fallback)
    return zonedStartOfDayUtc(value)
  }

  const fromDate = parseDateOrDefault(from, defaultFrom)
  const toDateRaw = parseDateOrDefault(to, defaultTo)
  const toDate = zonedEndOfDayUtc(formatInTimeZone(toDateRaw, APP_TZ).date)

  return {
    from: fromDate,
    to: toDate,
    fromIso: formatInTimeZone(fromDate, APP_TZ).date,
    toIso: formatInTimeZone(toDateRaw, APP_TZ).date,
  }
}
