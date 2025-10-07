// src/server/reports/queries.ts
import { getPrisma } from "@/lib/db"
import { getEmployees, displayNameFromEmployeeId } from "@/employees"
import {
  APP_TIMEZONE,
  zonedStartOfDayUtc,
  zonedEndOfDayUtc,
  intersectsUtcInterval,
  formatAppLocalIso,
  formatInTimeZone,
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

export async function getEventsForDay(dateYmd: string, vendor?: string | null): Promise<DaySnapshot> {
  const tz = APP_TIMEZONE
  const start = zonedStartOfDayUtc(dateYmd, tz)
  const endExclusive = zonedEndOfDayUtc(dateYmd, tz)
  const p = await getPrisma()
  const rowsDb = (await p.event.findMany({
    where: {
      endsAt: { gt: start },
      startsAt: { lt: endExclusive },
    },
    orderBy: [{ title: 'asc' }, { startsAt: 'asc' }],
    select: { id: true, title: true, description: true, type: true, checklist: true, shift: true, startsAt: true, endsAt: true },
  })) as Row[]

  if (process.env.DEBUG_DAILY_REPORT === '1' && process.env.NODE_ENV !== 'production') {
    const sample = rowsDb.slice(0, 10).map(row => ({
      id: row.id ?? 'unknown',
      startsAtUtc: new Date(row.startsAt).toISOString(),
      startsAtLocal: formatAppLocalIso(new Date(row.startsAt), tz),
      endsAtUtc: new Date(row.endsAt).toISOString(),
      endsAtLocal: formatAppLocalIso(new Date(row.endsAt), tz),
    }))

    const dayStartLocal = `${dateYmd} 00:00:00`
    const dayEndLocal = formatInTimeZone(endExclusive, tz).date + ' 00:00:00'

    const rawQuery = (await p.$queryRawUnsafe(`
      SELECT "id"
      FROM "Event"
      WHERE ("endsAt" AT TIME ZONE 'UTC' AT TIME ZONE '${tz}') > '${dayStartLocal}'::timestamp
        AND ("startsAt" AT TIME ZONE 'UTC' AT TIME ZONE '${tz}') < '${dayEndLocal}'::timestamp
      ORDER BY "startsAt" ASC
      LIMIT 200
    `)) as Array<{ id: string }>

    const prismaIds = rowsDb.map(row => row.id ?? '')
    const rawIds = rawQuery.map(row => row.id)
    const missingInPrisma = rawIds.filter(id => id && !prismaIds.includes(id))
    const extraInPrisma = prismaIds.filter(id => id && !rawIds.includes(id))

    console.debug('[daily-report-debug]', {
      tz,
      dateYmd,
      dayStartUtc: start.toISOString(),
      dayEndUtc: endExclusive.toISOString(),
      filter: {
        endsAt: { gt: start.toISOString() },
        startsAt: { lt: endExclusive.toISOString() },
      },
      prismaMatches: prismaIds.length,
      rawMatches: rawIds.length,
      missingInPrisma,
      extraInPrisma,
      sample,
    })
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

  // Map employee id -> display name for crew listing
  const employees = getEmployees()
  const nameById = new Map<string, string>(employees.map(e => [e.id, `${e.firstName} ${e.lastName}`]))

  const overlapping = (rowsDb as Row[]).filter(e =>
    intersectsUtcInterval(new Date(e.startsAt), new Date(e.endsAt), start, endExclusive),
  )

  const all: ReportRow[] = overlapping.map((e: Row) => {
    const meta = parseMeta(e.description || "")
    const cl: any = e.checklist as any
    const crewIds: string[] = Array.isArray(cl?.employees) ? (cl.employees as string[]) : []
    const crew: string[] = crewIds.map(id => {
      const known = nameById.get(id)
      if (known) return known
      const guess = displayNameFromEmployeeId(id)
      return guess || id
    })
    const work = workFromType(e.type ?? null, meta.notes)
    const timeUnit = /adjusted/i.test(meta.payment) ? "Hour" : "Day"
    return {
      project: e.title || "",
      invoice: meta.invoice,
      crew,
      work,
      payroll: meta.payroll.length ? meta.payroll : [],
      payment: meta.payment || "",
      vendor: meta.vendor ? meta.vendor.toUpperCase() : null,
      timeUnit,
      shift: (e.shift || '').toString().toUpperCase() === 'NIGHT' ? 'Night' : 'Day',
      notes: meta.notes,
    }
  })

  const filtered = vendor ? all.filter(r => (r.vendor || "").toUpperCase() === vendor.toUpperCase()) : all
  filtered.sort((a, b) => a.project.localeCompare(b.project) || a.invoice.localeCompare(b.invoice))
  return { dateYmd, vendor: vendor ?? null, rows: filtered }
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
