// src/server/fdotCutoffs.ts
import { Prisma } from '@prisma/client'
import { getPrisma } from '@/lib/db'
import { tryPrisma } from '@/lib/dbSafe'

export type FdotCutoffRecord = {
  id: string
  year: number
  cutoffDate: string
  label: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export type CutoffInputRow = {
  id?: string | null
  cutoffDate: string
  label?: string | null
}

export type CutoffWindow = {
  year: number
  startDate: string
  endDate: string
  startDateUtc: Date
  endDateUtc: Date
  toCutoff: FdotCutoffRecord
  previousCutoff: FdotCutoffRecord | null
}

function normalizeYmd(input: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    throw new Error('Invalid cutoff_date format; expected YYYY-MM-DD')
  }
  return input
}

function toUtcDate(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(n => Number.parseInt(n, 10))
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    throw new Error('Invalid cutoff_date components')
  }
  return new Date(Date.UTC(y, m - 1, d))
}

function ensureSameYear(expected: number, ymd: string) {
  const [y] = ymd.split('-').map(n => Number.parseInt(n, 10))
  if (y !== expected) {
    throw new Error('All cutoff dates must belong to the selected year')
  }
}

function toPayload(row: any): FdotCutoffRecord {
  return {
    id: String(row.id ?? ''),
    year: Number(row.year ?? 0),
    cutoffDate: new Date(row.cutoffDate ?? Date.now()).toISOString().slice(0, 10),
    label: row.label ? String(row.label) : null,
    createdBy: row.createdBy ? String(row.createdBy) : null,
    createdAt: new Date(row.createdAt ?? Date.now()).toISOString(),
    updatedAt: new Date(row.updatedAt ?? Date.now()).toISOString(),
  }
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime())
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export async function fetchCutoffYears(): Promise<number[]> {
  const rows = await tryPrisma(
    p =>
      p.fdotCutoff.findMany({
        select: { year: true },
        distinct: ['year'],
        orderBy: { year: 'asc' },
      }),
    [] as Array<{ year: number }>,
  )
  return rows.map(row => row.year).sort((a, b) => a - b)
}

export async function fetchCutoffsForYear(year: number): Promise<FdotCutoffRecord[]> {
  if (!Number.isFinite(year)) return []
  const rows = await tryPrisma(
    p =>
      p.fdotCutoff.findMany({
        where: { year },
        orderBy: { cutoffDate: 'asc' },
      }),
    [] as any[],
  )
  return rows.map(toPayload)
}

export async function fetchAllCutoffs(): Promise<Record<string, FdotCutoffRecord[]>> {
  const rows = await tryPrisma(
    p => p.fdotCutoff.findMany({ orderBy: [{ year: 'asc' }, { cutoffDate: 'asc' }] }),
    [] as any[],
  )
  const grouped = new Map<number, FdotCutoffRecord[]>()
  rows.forEach(row => {
    const payload = toPayload(row)
    if (!grouped.has(payload.year)) grouped.set(payload.year, [])
    grouped.get(payload.year)!.push(payload)
  })
  const out: Record<string, FdotCutoffRecord[]> = {}
  Array.from(grouped.entries())
    .sort((a, b) => a[0] - b[0])
    .forEach(([yr, list]) => {
      out[String(yr)] = list
    })
  return out
}

export type SaveResult = {
  created: number
  updated: number
  deleted: number
  records: FdotCutoffRecord[]
}

export async function saveCutoffs(
  year: number,
  rows: CutoffInputRow[],
  userId: string | null,
): Promise<SaveResult> {
  if (!Number.isFinite(year)) {
    throw Object.assign(new Error('year is required'), { status: 400 })
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    return { created: 0, updated: 0, deleted: 0, records: [] }
  }

  const seenDates = new Set<string>()
  const normalizedRows = rows.map(row => {
    const ymdValue = normalizeYmd(String(row.cutoffDate ?? '').trim())
    ensureSameYear(year, ymdValue)
    if (seenDates.has(ymdValue)) {
      throw Object.assign(new Error(`Duplicate cutoff date: ${ymdValue}`), { status: 400 })
    }
    seenDates.add(ymdValue)
    return {
      id: row.id ? String(row.id) : null,
      cutoffDate: ymdValue,
      label: row.label ? String(row.label).trim() || null : null,
    }
  })

  const sorted = [...normalizedRows].sort((a, b) => (a.cutoffDate < b.cutoffDate ? -1 : a.cutoffDate > b.cutoffDate ? 1 : 0))
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i]!.cutoffDate !== normalizedRows[i]!.cutoffDate) {
      // Input not sorted, but we sort server-side as well. No-op.
    }
  }

  const prisma = await getPrisma()
  const existing = await prisma.fdotCutoff.findMany({ where: { year } })
  const existingById = new Map(existing.map(row => [String(row.id), row]))
  const keepIds = new Set(sorted.map(row => (row.id ? row.id : '').trim()).filter(Boolean))
  const toDelete = existing.filter(row => !keepIds.has(String(row.id))).map(row => String(row.id))

  let created = 0
  let updated = 0

  const results = await prisma.$transaction(async tx => {
    if (toDelete.length > 0) {
      await tx.fdotCutoff.deleteMany({ where: { id: { in: toDelete } } })
    }

    const persisted: any[] = []
    for (const row of sorted) {
      const data = {
        year,
        cutoffDate: toUtcDate(row.cutoffDate),
        label: row.label,
      }
      if (row.id && existingById.has(row.id)) {
        const existingRow = existingById.get(row.id)!
        const hasChanges =
          existingRow.year !== year ||
          new Date(existingRow.cutoffDate).toISOString().slice(0, 10) !== row.cutoffDate ||
          (existingRow.label || null) !== (row.label || null)
        if (hasChanges) {
          const updatedRow = await tx.fdotCutoff.update({
            where: { id: row.id },
            data,
          })
          updated += 1
          persisted.push(updatedRow)
        } else {
          persisted.push(existingRow)
        }
      } else {
        const createdRow = await tx.fdotCutoff.create({
          data: {
            ...data,
            createdBy: userId,
          },
        })
        created += 1
        persisted.push(createdRow)
      }
    }

    return persisted
  })

  const formatted = results
    .map(toPayload)
    .sort((a, b) => (a.cutoffDate < b.cutoffDate ? -1 : a.cutoffDate > b.cutoffDate ? 1 : 0))

  const deleted = toDelete.length

  return { created, updated, deleted, records: formatted }
}

export async function resolveCutoffWindow(
  year: number,
  toCutoffIdOrDate: string,
): Promise<CutoffWindow | null> {
  const cutoffs = await fetchCutoffsForYear(year)
  if (!cutoffs.length) return null

  const target = cutoffs.find(c => c.id === toCutoffIdOrDate || c.cutoffDate === toCutoffIdOrDate)
  if (!target) return null

  const index = cutoffs.findIndex(c => c.id === target.id)
  let previous: FdotCutoffRecord | null = null
  if (index > 0) {
    previous = cutoffs[index - 1]!
  } else {
    const priorYear = await fetchCutoffsForYear(year - 1)
    if (priorYear.length) {
      previous = priorYear[priorYear.length - 1]!
    }
  }

  let startDateUtc: Date
  if (previous) {
    startDateUtc = addDays(new Date(previous.cutoffDate + 'T00:00:00Z'), 1)
  } else {
    startDateUtc = new Date(Date.UTC(year, 0, 1))
  }
  const endDateUtc = new Date(target.cutoffDate + 'T00:00:00Z')

  return {
    year,
    startDate: ymd(startDateUtc),
    endDate: ymd(endDateUtc),
    startDateUtc,
    endDateUtc,
    toCutoff: target,
    previousCutoff: previous,
  }
}

export type AggregatedRow = {
  jobId: string
  jobName: string
  payItem: string
  description: string
  unit: string
  quantity: number
  firstWorkDate: string
  lastWorkDate: string
}

export type AggregatedResult = {
  rows: AggregatedRow[]
  totalRows: number
  page: number
  pageSize: number
  jobTotals: Array<{ jobId: string; jobName: string; quantity: number }>
  grandTotal: number
}

async function runAggregation(
  start: Date,
  endExclusive: Date,
): Promise<AggregatedRow[]> {
  const query = Prisma.sql`
    SELECT
      j."id" AS job_id,
      COALESCE(j."name", '') AS job_name,
      COALESCE(w."pay_item", '') AS pay_item,
      COALESCE(pi."description", w."pay_item_description", '') AS description,
      COALESCE(NULLIF(w."unit", ''), pi."unit", '') AS unit,
      SUM(COALESCE(w."quantity", 0)) AS total_quantity,
      MIN(w."work_date") AS first_work_date,
      MAX(w."work_date") AS last_work_date
    FROM "work_logs" w
    INNER JOIN "jobs" j ON j."id" = w."job_id"
    LEFT JOIN "pay_items" pi ON (pi."number" = w."pay_item")
    WHERE w."work_date" >= ${start} AND w."work_date" < ${endExclusive}
      AND (
        COALESCE(j."is_fdot", FALSE) = TRUE OR
        UPPER(COALESCE(j."client_type", '')) = 'FDOT'
      )
    GROUP BY j."id", j."name", w."pay_item", pi."description", pi."unit", w."pay_item_description"
    ORDER BY j."name" ASC, w."pay_item" ASC
  `

  try {
    const rows = await tryPrisma(
      (p) =>
        p.$queryRaw<Array<{
          job_id: string
          job_name: string | null
          pay_item: string | null
          description: string | null
          unit: string | null
          total_quantity: Prisma.Decimal | number | null
          first_work_date: Date | string | null
          last_work_date: Date | string | null
        }>>(query),
      [] as Array<{
        job_id: string
        job_name: string | null
        pay_item: string | null
        description: string | null
        unit: string | null
        total_quantity: Prisma.Decimal | number | null
        first_work_date: Date | string | null
        last_work_date: Date | string | null
      }>,
    )

    return rows.map(row => ({
      jobId: String(row.job_id ?? ''),
      jobName: String(row.job_name ?? ''),
      payItem: String(row.pay_item ?? ''),
      description: row.description ? String(row.description) : '',
      unit: row.unit ? String(row.unit) : '',
      quantity: Number(row.total_quantity ?? 0),
      firstWorkDate: row.first_work_date ? new Date(row.first_work_date).toISOString().slice(0, 10) : '',
      lastWorkDate: row.last_work_date ? new Date(row.last_work_date).toISOString().slice(0, 10) : '',
    }))
  } catch (error) {
    console.error('Failed to aggregate FDOT work logs', error)
    return []
  }
}

export async function generateAggregatedRows(
  window: CutoffWindow,
  page: number,
  pageSize: number,
): Promise<AggregatedResult> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.min(Math.floor(pageSize), 2000) : 1000

  const endExclusive = addDays(window.endDateUtc, 1)
  const allRows = await runAggregation(window.startDateUtc, endExclusive)
  const totalRows = allRows.length
  const offset = (safePage - 1) * safePageSize
  const rows = allRows.slice(offset, offset + safePageSize)

  const jobTotalsMap = new Map<string, { jobId: string; jobName: string; quantity: number }>()
  let grand = 0
  allRows.forEach(row => {
    const key = row.jobId || row.jobName
    const current = jobTotalsMap.get(key) ?? { jobId: row.jobId, jobName: row.jobName, quantity: 0 }
    current.quantity += row.quantity
    jobTotalsMap.set(key, current)
    grand += row.quantity
  })

  const jobTotals = Array.from(jobTotalsMap.values()).sort((a, b) => a.jobName.localeCompare(b.jobName))

  return {
    rows,
    totalRows,
    page: safePage,
    pageSize: safePageSize,
    jobTotals,
    grandTotal: grand,
  }
}

export async function exportAggregatedCsv(window: CutoffWindow): Promise<{ csv: string; rowCount: number }> {
  const rows = await runAggregation(window.startDateUtc, addDays(window.endDateUtc, 1))
  const header = '"Job Name","Job ID","Pay Item","Description","Unit","Quantity","First Work Date","Last Work Date"'
  const lines = rows.map(row => {
    const cells = [
      row.jobName,
      row.jobId,
      row.payItem,
      row.description,
      row.unit,
      row.quantity.toFixed(2),
      row.firstWorkDate,
      row.lastWorkDate,
    ]
    return cells
      .map(value => {
        const str = value == null ? '' : String(value)
        return '"' + str.replace(/"/g, '""') + '"'
      })
      .join(',')
  })

  const linesWithWindow = [
    '"Window Start","Window End"',
    `"${window.startDate}","${window.endDate}"`,
    '',
    header,
    ...lines,
  ]
  return { csv: linesWithWindow.join('\n'), rowCount: rows.length }
}
