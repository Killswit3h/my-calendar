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
    .transform(value => (value ? value === '1' || value.toLowerCase() === 'true' : true)),
})

type LaborSummaryRow = {
  jobId: string
  jobName: string
  days: number
  employees: number
  employeeIds: string[]
  employeeNames: Record<string, string>
  hours: number
  cost: number
  averageRate: number
}

const toDayKey = (date: Date) => formatInTimeZone(date, APP_TZ).date

export async function GET(request: Request) {
  if (!isFinanceLaborEnabled()) {
    return NextResponse.json({ error: 'Finance labor dashboard is disabled' }, { status: 404 })
  }

  const parsedQuery = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams))
  if (!parsedQuery.success) {
    return NextResponse.json({ error: 'Invalid query parameters', details: parsedQuery.error.format() }, { status: 400 })
  }

  const { start, end, refresh } = parsedQuery.data
  const prisma = await getPrisma()

  let buildResult = { rowsInserted: 0, missingRates: [] as { employeeId: string; day: string }[] }
  if (refresh) {
    buildResult = await buildLaborDaily({ startDate: start, endDate: end, prisma })
  }

  const startUtc = zonedStartOfDayUtc(start)
  const endUtc = zonedStartOfDayUtc(end)

  const rows = await prisma.laborDaily.findMany({
    where: {
      day: { gte: startUtc, lte: endUtc },
    },
    select: {
      jobId: true,
      jobName: true,
      day: true,
      employeeId: true,
      employeeName: true,
      hoursDecimal: true,
      totalCostUsd: true,
    },
  })

  const summaryMap = new Map<
    string,
    {
      jobId: string
      jobName: string
      daySet: Set<string>
      employeeMap: Map<string, string>
      hours: number
      cost: number
    }
  >()

  for (const row of rows) {
    const key = row.jobId
    let bucket = summaryMap.get(key)
    if (!bucket) {
      bucket = {
        jobId: row.jobId,
        jobName: row.jobName,
        daySet: new Set<string>(),
        employeeMap: new Map<string, string>(),
        hours: 0,
        cost: 0,
      }
      summaryMap.set(key, bucket)
    }
    bucket.daySet.add(toDayKey(row.day))
    bucket.employeeMap.set(row.employeeId, row.employeeName)
    bucket.hours += Number(row.hoursDecimal)
    bucket.cost += Number(row.totalCostUsd)
  }

  const summary: LaborSummaryRow[] = Array.from(summaryMap.values())
    .map(bucket => ({
      jobId: bucket.jobId,
      jobName: bucket.jobName,
      days: bucket.daySet.size,
      employees: bucket.employeeMap.size,
      employeeIds: Array.from(bucket.employeeMap.keys()),
      employeeNames: Object.fromEntries(bucket.employeeMap.entries()),
      hours: Number(bucket.hours.toFixed(2)),
      cost: Number(bucket.cost.toFixed(2)),
      averageRate: bucket.hours > 0 ? Number((bucket.cost / bucket.hours).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.cost - a.cost)

  const totals = summary.reduce(
    (acc, job) => {
      acc.hours += job.hours
      acc.cost += job.cost
      acc.jobs += 1
    job.employeeIds.forEach(id => acc.employeeSet.add(id))
    acc.days += job.days
    return acc
  },
    { jobs: 0, hours: 0, cost: 0, employeeSet: new Set<string>(), days: 0 },
  )

  return NextResponse.json({
    range: { start, end },
    generated: buildResult,
    totals: {
      jobs: totals.jobs,
      hours: Number(totals.hours.toFixed(2)),
      cost: Number(totals.cost.toFixed(2)),
      employees: totals.employeeSet.size,
      days: totals.days,
      averageRate: totals.hours > 0 ? Number((totals.cost / totals.hours).toFixed(2)) : 0,
    },
    summary,
  })
}
