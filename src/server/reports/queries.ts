// src/server/reports/queries.ts
import { getPrisma } from "@/lib/db"
import { getEmployees } from "@/employees"

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

function getTz(): string {
  return process.env.REPORT_TIMEZONE || "America/New_York"
}

function tzOffsetMs(at: Date, tz: string): number {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
  const parts = fmt.formatToParts(at)
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value || '0')
  const asUTC = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return asUTC - at.getTime()
}

function fromZonedYmdToUtc(y: number, m: number, d: number, tz: string): Date {
  // Pretend local time (in tz) is UTC, then subtract the zone offset at that instant
  const pretend = new Date(Date.UTC(y, m - 1, d, 0, 0, 0))
  const offset = tzOffsetMs(pretend, tz)
  return new Date(pretend.getTime() - offset)
}

function dayStartEnd(date: string, tz = getTz()): { start: Date; end: Date } {
  const [y, m, d] = date.split('-').map(Number)
  const start = fromZonedYmdToUtc(y, m, d, tz)
  const next = fromZonedYmdToUtc(y, m, d + 1, tz)
  return { start, end: next }
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
  const { start, end } = dayStartEnd(dateYmd)
  const p = await getPrisma()
  const rowsDb = await p.event.findMany({
    where: { OR: [{ startsAt: { lte: end }, endsAt: { gte: start } }] },
    orderBy: [{ title: "asc" }, { startsAt: "asc" }],
    select: { title: true, description: true, type: true, checklist: true, shift: true },
  })

  type Row = { title: string | null; description: string | null; type: string | null; checklist: unknown; shift?: string | null }

  // Map employee id -> display name for crew listing
  const employees = getEmployees()
  const nameById = new Map<string, string>(employees.map(e => [e.id, `${e.firstName} ${e.lastName}`]))

  const all: ReportRow[] = (rowsDb as Row[]).map((e: Row) => {
    const meta = parseMeta(e.description || "")
    const cl: any = e.checklist as any
    const crewIds: string[] = Array.isArray(cl?.employees) ? (cl.employees as string[]) : []
    const crew: string[] = crewIds.map(id => nameById.get(id) || id)
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
