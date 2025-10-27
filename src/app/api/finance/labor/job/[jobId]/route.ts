import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isFinanceLaborEnabled } from '@/lib/finance/config'
import { buildLaborDaily } from '@/lib/finance/buildLaborDaily'
import { getPrisma } from '@/lib/db'
import { APP_TZ, formatInTimeZone, zonedStartOfDayUtc } from '@/lib/timezone'

const querySchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  refresh: z
    .string()
    .optional()
    .transform(value => (value ? value === '1' || value.toLowerCase() === 'true' : false)),
})

const dayKey = (date: Date) => formatInTimeZone(date, APP_TZ).date

export async function GET(request: Request, context: { params: Promise<{ jobId: string }> }) {
  if (!isFinanceLaborEnabled()) {
    return NextResponse.json({ error: 'Finance labor dashboard is disabled' }, { status: 404 })
  }

  const query = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams))
  if (!query.success) {
    return NextResponse.json({ error: 'Invalid query parameters', details: query.error.format() }, { status: 400 })
  }

  const { start, end, refresh } = query.data
  const { jobId } = await context.params
  const prisma = await getPrisma()

  if (refresh) {
    await buildLaborDaily({ startDate: start, endDate: end, prisma })
  }

  const startUtc = zonedStartOfDayUtc(start)
  const endUtc = zonedStartOfDayUtc(end)

  const rows = await prisma.laborDaily.findMany({
    where: {
      jobId,
      day: { gte: startUtc, lte: endUtc },
    },
    orderBy: [{ day: 'asc' }, { employeeName: 'asc' }],
    select: {
      day: true,
      jobName: true,
      employeeId: true,
      employeeName: true,
      hoursDecimal: true,
      regularHours: true,
      overtimeHours: true,
      rateUsd: true,
      regularCostUsd: true,
      overtimeCostUsd: true,
      totalCostUsd: true,
      eventId: true,
      eventTitle: true,
      note: true,
    },
  })

  if (!rows.length) {
    return NextResponse.json({
      range: { start, end },
      job: { id: jobId, name: null },
      totals: { days: 0, employees: 0, hours: 0, cost: 0 },
      days: [],
    })
  }

  const totals = { hours: 0, cost: 0, days: new Set<string>(), employees: new Set<string>() }
  const dayMap = new Map<
    string,
    {
      day: string
      totalHours: number
      totalCost: number
      employees: {
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
      }[]
    }
  >()

  let jobName: string | null = null

  for (const row of rows) {
    const key = dayKey(row.day)
    totals.days.add(key)
    totals.employees.add(row.employeeId)

    let bucket = dayMap.get(key)
    if (!bucket) {
      bucket = { day: key, totalHours: 0, totalCost: 0, employees: [] }
      dayMap.set(key, bucket)
    }

    const hours = Number(row.hoursDecimal)
    const regularHours = Number(row.regularHours)
    const overtimeHours = Number(row.overtimeHours)
    const rate = Number(row.rateUsd)
    const regularCost = Number(row.regularCostUsd)
    const overtimeCost = Number(row.overtimeCostUsd)
    const totalCost = Number(row.totalCostUsd)

    bucket.totalHours += hours
    bucket.totalCost += totalCost
    bucket.employees.push({
      employeeId: row.employeeId,
      employeeName: row.employeeName,
      hours: Number(hours.toFixed(2)),
      regularHours: Number(regularHours.toFixed(2)),
      overtimeHours: Number(overtimeHours.toFixed(2)),
      rate: Number(rate.toFixed(2)),
      regularCost: Number(regularCost.toFixed(2)),
      overtimeCost: Number(overtimeCost.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      eventId: row.eventId,
      eventTitle: row.eventTitle,
      note: row.note,
    })

    totals.hours += hours
    totals.cost += totalCost
    if (!jobName) jobName = row.jobName
  }

  const days = Array.from(dayMap.values()).map(day => ({
    day: day.day,
    hours: Number(day.totalHours.toFixed(2)),
    cost: Number(day.totalCost.toFixed(2)),
    employees: day.employees,
  }))

  return NextResponse.json({
    range: { start, end },
    job: { id: jobId, name: jobName },
    totals: {
      days: totals.days.size,
      employees: totals.employees.size,
      hours: Number(totals.hours.toFixed(2)),
      cost: Number(totals.cost.toFixed(2)),
      averageRate: totals.hours > 0 ? Number((totals.cost / totals.hours).toFixed(2)) : 0,
    },
    days,
  })
}
