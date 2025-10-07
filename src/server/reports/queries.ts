// src/server/reports/queries.ts
import { Prisma } from '@prisma/client'
import { getPrisma } from '@/lib/db'
import { getEmployees, displayNameFromEmployeeId } from '@/employees'
import { APP_TZ, REPORT_MODE, DEBUG_REPORT_ENABLED, type ReportMode } from '@/lib/appConfig'
import {
  zonedStartOfDayUtc,
  zonedEndOfDayUtc,
  intersectsUtcInterval,
  formatInTimeZone,
  formatAppLocalIso,
} from '@/lib/timezone'

export type ReportRow = {
  project: string
  invoice: string
  crew: string[]
  work: string // FENCE | GUARDRAIL | SHOP | NO WORK | ...
  payroll: string[] // e.g. ["Daily", "Bonus"]
  payment: string // Daily | Adjusted
  vendor: string | null
  timeUnit: string // Day | Hour | Lump Sum
  shift: string // Day | Night | ''
  notes: string
}

export type DaySnapshot = {
  dateYmd: string // YYYY-MM-DD in REPORT_TIMEZONE
  vendor: string | null
  rows: ReportRow[]
}

function parseMeta(description: string): {
  invoice: string
  vendor: string | null
  payment: string
  payroll: string[]
  notes: string
} {
  const lines = (description || "").split(/\r?\n/)
  let invoice = ""
  let vendor: string | null = null
  let payment = ""
  const payroll: string[] = []
  const rest: string[] = []
  for (const ln of lines) {
    const mInv = ln.match(/^\s*invoice\s*#?\s*:\s*(.+)$/i)
    if (mInv && !invoice) {
      invoice = mInv[1].trim()
      continue
    }
    const mVen = ln.match(/^\s*vendor\s*:\s*(.+)$/i)
    if (mVen && !vendor) {
      vendor = mVen[1].trim()
      continue
    }
    const mPay = ln.match(/^\s*payment\s*:\s*(.+)$/i)
    if (mPay && !payment) {
      payment = mPay[1].trim()
      continue
    }
    const mPr = ln.match(/^\s*payroll\s*:\s*(.+)$/i)
    if (mPr) {
      const v = mPr[1].trim()
      if (v) payroll.push(v)
      continue
    }
    rest.push(ln)
  }
  return { invoice, vendor, payment, payroll, notes: rest.join("\n").trim() }
}

function workFromType(type: string | null, notes: string): string {
  const t = (type || "").toUpperCase()
  const n = (notes || "").toUpperCase()
  if (n.includes("NO WORK")) return "NO WORK"
  if (n.includes("SHOP")) return "SHOP"
  if (t) return t
  return ""
}

type Row = {
  id?: string | null
  title: string | null
  description: string | null
  type: string | null
  checklist: unknown
  shift?: string | null
  startsAt: Date
  endsAt: Date
}

type StorageMode = 'NAIVE_ET' | 'UTC_ZONED'

export type ReportQueryDiagnostics = {
  appTz: string
  reportMode: ReportMode
  storageMode: StorageMode
  reportDate: string
  vendor: string | null
  dayStartET: string
  dayEndET: string
  dayStartUTC: string
  dayEndUTC: string
  predicate: string
  sql: string
  totalRows: number
  sample: Array<{
    id: string
    startsAtUTC: string
    startsAtET: string
    endsAtUTC: string
    endsAtET: string
  }>
}

const STORAGE_DETECTION_SQL = `
  SELECT data_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'Event'
    AND column_name = 'startsAt'
  LIMIT 1
`

let cachedStorageMode: StorageMode | null = null
let storageModePromise: Promise<StorageMode> | null = null

async function detectStorageMode(p: any): Promise<StorageMode> {
  if (cachedStorageMode) return cachedStorageMode
  if (!storageModePromise) {
    storageModePromise = (async () => {
      try {
        const rows = (await p.$queryRawUnsafe(STORAGE_DETECTION_SQL)) as Array<{ data_type: string }>
        const dataType = rows?.[0]?.data_type?.toLowerCase() ?? ''
        const mode: StorageMode = dataType.includes('with time zone') ? 'UTC_ZONED' : 'NAIVE_ET'
        cachedStorageMode = mode
        return mode
      } catch (_err) {
        cachedStorageMode = 'NAIVE_ET'
        return 'NAIVE_ET'
      }
    })()
  }
  const mode = await storageModePromise
  cachedStorageMode = mode
  return mode
}

export function __resetReportQueryCacheForTesting() {
  if (process.env.NODE_ENV === 'test') {
    cachedStorageMode = null
    storageModePromise = null
  }
}

function formatEtTimestamp(date: Date): string {
  const { date: ymd, time } = formatInTimeZone(date, APP_TZ)
  return `${ymd}T${time}`
}

function buildPredicate(params: {
  reportMode: ReportMode
  storageMode: StorageMode
  reportDate: string
  dayStartUtc: Date
  dayEndUtc: Date
}): { sql: Prisma.Sql; text: string } {
  const { reportMode, storageMode, reportDate, dayStartUtc, dayEndUtc } = params
  if (reportMode === 'CLAMP') {
    if (storageMode === 'NAIVE_ET') {
      return {
        sql: Prisma.sql`
          DATE(("Event"."startsAt" AT TIME ZONE ${APP_TZ}) AT TIME ZONE ${APP_TZ}) = ${reportDate}
        `,
        text: `DATE((startsAt AT TIME ZONE '${APP_TZ}') AT TIME ZONE '${APP_TZ}') = '${reportDate}'`,
      }
    }
    return {
      sql: Prisma.sql`
        DATE("Event"."startsAt" AT TIME ZONE ${APP_TZ}) = ${reportDate}
      `,
      text: `DATE(startsAt AT TIME ZONE '${APP_TZ}') = '${reportDate}'`,
    }
  }

  if (storageMode === 'NAIVE_ET') {
    return {
      sql: Prisma.sql`
        ("Event"."endsAt" AT TIME ZONE ${APP_TZ}) > ${dayStartUtc}
        AND ("Event"."startsAt" AT TIME ZONE ${APP_TZ}) < ${dayEndUtc}
      `,
      text: `(endsAt AT TIME ZONE '${APP_TZ}') > '${dayStartUtc.toISOString()}' AND (startsAt AT TIME ZONE '${APP_TZ}') < '${dayEndUtc.toISOString()}'`,
    }
  }

  return {
    sql: Prisma.sql`
      "Event"."endsAt" > ${dayStartUtc}
      AND "Event"."startsAt" < ${dayEndUtc}
    `,
    text: `endsAt > '${dayStartUtc.toISOString()}' AND startsAt < '${dayEndUtc.toISOString()}'`,
  }
}

export async function fetchReportEventsWithDiagnostics(
  dateYmd: string,
  vendor?: string | null,
): Promise<{ rows: Row[]; diagnostics: ReportQueryDiagnostics }> {
  const p = await getPrisma()
  const storageMode = await detectStorageMode(p)
  const dayStartUtc = zonedStartOfDayUtc(dateYmd, APP_TZ)
  const dayEndUtc = zonedEndOfDayUtc(dateYmd, APP_TZ)
  const predicate = buildPredicate({
    reportMode: REPORT_MODE,
    storageMode,
    reportDate: dateYmd,
    dayStartUtc,
    dayEndUtc,
  })

  const query = Prisma.sql`
    SELECT
      "Event"."id",
      "Event"."title",
      "Event"."description",
      "Event"."type",
      "Event"."checklist",
      "Event"."shift",
      "Event"."startsAt",
      "Event"."endsAt"
    FROM "Event"
    WHERE ${predicate.sql}
    ORDER BY "Event"."startsAt" ASC, "Event"."title" ASC
  `

  const rawRows = await (p.$queryRaw(query) as Promise<Row[]>)
  const rows = rawRows.map(row => ({
    ...row,
    startsAt: new Date(row.startsAt),
    endsAt: new Date(row.endsAt),
  }))

  const sample = rows.slice(0, 10).map(row => ({
    id: row.id ? String(row.id) : 'unknown',
    startsAtUTC: new Date(row.startsAt).toISOString(),
    startsAtET: formatAppLocalIso(new Date(row.startsAt), APP_TZ),
    endsAtUTC: new Date(row.endsAt).toISOString(),
    endsAtET: formatAppLocalIso(new Date(row.endsAt), APP_TZ),
  }))

  const sqlText = [
    'SELECT "id","title","description","type","checklist","shift","startsAt","endsAt"',
    'FROM "Event"',
    `WHERE ${predicate.text}`,
    'ORDER BY "startsAt" ASC, "title" ASC',
  ].join('\n')

  const diagnostics: ReportQueryDiagnostics = {
    appTz: APP_TZ,
    reportMode: REPORT_MODE,
    storageMode,
    reportDate: dateYmd,
    vendor: vendor ?? null,
    dayStartET: `${formatEtTimestamp(dayStartUtc)} (${APP_TZ})`,
    dayEndET: `${formatEtTimestamp(dayEndUtc)} (${APP_TZ})`,
    dayStartUTC: dayStartUtc.toISOString(),
    dayEndUTC: dayEndUtc.toISOString(),
    predicate: predicate.text,
    sql: sqlText,
    totalRows: rows.length,
    sample,
  }

  return { rows, diagnostics }
}

export async function getEventsForDay(dateYmd: string, vendor?: string | null): Promise<DaySnapshot> {
  const vendorUpper = vendor ? vendor.toUpperCase() : null
  const { rows, diagnostics } = await fetchReportEventsWithDiagnostics(dateYmd, vendor ?? null)
  const dayStartUtc = new Date(diagnostics.dayStartUTC)
  const dayEndUtc = new Date(diagnostics.dayEndUTC)

  const employees = getEmployees()
  const nameById = new Map<string, string>(employees.map(e => [e.id, `${e.firstName} ${e.lastName}`]))

  const overlapping = rows.filter(e =>
    intersectsUtcInterval(new Date(e.startsAt), new Date(e.endsAt), dayStartUtc, dayEndUtc),
  )

  const processed = overlapping.map(e => {
    const meta = parseMeta(e.description || '')
    const cl: any = e.checklist as any
    const crewIds: string[] = Array.isArray(cl?.employees) ? (cl.employees as string[]) : []
    const crew: string[] = crewIds.map(id => {
      const known = nameById.get(id)
      if (known) return known
      const guess = displayNameFromEmployeeId(id)
      return guess || id
    })
    const work = workFromType(e.type ?? null, meta.notes)
    const timeUnit = /adjusted/i.test(meta.payment) ? 'Hour' : 'Day'
    const reportRow: ReportRow = {
      project: e.title || '',
      invoice: meta.invoice,
      crew,
      work,
      payroll: meta.payroll.length ? meta.payroll : [],
      payment: meta.payment || '',
      vendor: meta.vendor ? meta.vendor.toUpperCase() : null,
      timeUnit,
      shift: (e.shift || '').toString().toUpperCase() === 'NIGHT' ? 'Night' : 'Day',
      notes: meta.notes,
    }
    return { raw: e, reportRow }
  })

  const filteredEntries = vendorUpper
    ? processed.filter(({ reportRow }) => (reportRow.vendor || '') === vendorUpper)
    : processed

  filteredEntries.sort((a, b) =>
    a.reportRow.project.localeCompare(b.reportRow.project) ||
    a.reportRow.invoice.localeCompare(b.reportRow.invoice),
  )

  const rowsOut = filteredEntries.map(entry => entry.reportRow)

  if (DEBUG_REPORT_ENABLED) {
    const sample = filteredEntries.slice(0, 10).map(({ raw }) => ({
      id: raw.id ? String(raw.id) : 'unknown',
      startsAtUTC: new Date(raw.startsAt).toISOString(),
      startsAtET: formatAppLocalIso(new Date(raw.startsAt), APP_TZ),
      endsAtUTC: new Date(raw.endsAt).toISOString(),
      endsAtET: formatAppLocalIso(new Date(raw.endsAt), APP_TZ),
    }))

    console.debug('[daily-report]', {
      appTz: diagnostics.appTz,
      reportMode: diagnostics.reportMode,
      storageMode: diagnostics.storageMode,
      reportDate: diagnostics.reportDate,
      vendor: vendor ?? null,
      dayStartET: diagnostics.dayStartET,
      dayEndET: diagnostics.dayEndET,
      dayStartUTC: diagnostics.dayStartUTC,
      dayEndUTC: diagnostics.dayEndUTC,
      predicate: diagnostics.predicate,
      sql: diagnostics.sql,
      totalRows: diagnostics.totalRows,
      returnedRows: rowsOut.length,
      sample,
    })
  }

  return { dateYmd, vendor: vendor ?? null, rows: rowsOut }
}

export async function getEventsForWeek(mondayYmd: string, sundayYmd: string, vendor?: string | null): Promise<DaySnapshot[]> {
  const start = new Date(mondayYmd)
  const days: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start.getTime())
    d.setUTCDate(d.getUTCDate() + i)
    days.push(d.toISOString().slice(0, 10))
  }
  const out: DaySnapshot[] = []
  for (const ymd of days) out.push(await getEventsForDay(ymd, vendor ?? null))
  return out
}
