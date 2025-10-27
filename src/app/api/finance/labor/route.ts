import type { Customer, Employee, Event, EventAssignment, Project } from '@prisma/client'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isFinanceLaborEnabled } from '@/lib/finance/config'
import { getPrisma } from '@/lib/db'
import { aggregateByProject, resolveRange } from '@/lib/finance/labor'

const querySchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
})

export async function GET(request: Request) {
  if (!isFinanceLaborEnabled()) {
    return NextResponse.json({ error: 'Finance labor dashboard is disabled' }, { status: 404 })
  }

  const url = new URL(request.url)
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams))

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters', details: parsed.error.flatten() }, { status: 400 })
  }

  const { from, to } = parsed.data
  const range = resolveRange(from, to)

  if (range.from.getTime() > range.to.getTime()) {
    return NextResponse.json({ error: '`from` must be on or before `to`' }, { status: 400 })
  }

  const prisma = await getPrisma()

  const events = (await prisma.event.findMany({
    where: {
      startsAt: { lte: range.to },
      endsAt: { gte: range.from },
    },
    select: {
      id: true,
      title: true,
      startsAt: true,
      endsAt: true,
      allDay: true,
      calendarId: true,
      projectId: true,
      customerId: true,
    },
  })) as Array<
    Pick<Event, 'id' | 'title' | 'startsAt' | 'endsAt' | 'allDay' | 'calendarId' | 'projectId' | 'customerId'>
  >

  const eventIds = events.map((event: (typeof events)[number]) => event.id)
  const assignments = eventIds.length
    ? (await prisma.eventAssignment.findMany({
        where: { eventId: { in: eventIds } },
        select: {
          id: true,
          eventId: true,
          employeeId: true,
          dayOverride: true,
          hours: true,
        },
      })) as Array<Pick<EventAssignment, 'id' | 'eventId' | 'employeeId' | 'dayOverride' | 'hours'>>
    : []

  const employeeIds = Array.from(new Set(assignments.map(assignment => assignment.employeeId)))
  const employees = employeeIds.length
    ? (await prisma.employee.findMany({
        where: { id: { in: employeeIds } },
        select: { id: true, name: true, hourlyRate: true },
      })) as Array<Pick<Employee, 'id' | 'name' | 'hourlyRate'>>
    : []

  const projectIds = Array.from(new Set(events.map(event => event.projectId).filter(Boolean))) as string[]
  const projects = projectIds.length
    ? (await prisma.project.findMany({
        where: { id: { in: projectIds } },
        select: { id: true, name: true, customerId: true },
      })) as Array<Pick<Project, 'id' | 'name' | 'customerId'>>
    : []

  const customerIds = new Set<string>()
  events.forEach((event: (typeof events)[number]) => {
    if (event.customerId) customerIds.add(event.customerId)
  })
  projects.forEach((project: (typeof projects)[number]) => {
    if (project.customerId) customerIds.add(project.customerId)
  })

  const customers = customerIds.size
    ? (await prisma.customer.findMany({
        where: { id: { in: Array.from(customerIds) } },
        select: { id: true, name: true },
      })) as Array<Pick<Customer, 'id' | 'name'>>
    : []

  if (process.env.NODE_ENV !== 'production') {
    console.debug(
      '[finance/labor] events=%d assignments=%d employees=%d projects=%d customers=%d',
      events.length,
      assignments.length,
      employees.length,
      projects.length,
      customers.length,
    )
  }

  const payload = aggregateByProject({
    events,
    assignments,
    employees,
    projects,
    customers,
    range,
  })

  return NextResponse.json(payload)
}
