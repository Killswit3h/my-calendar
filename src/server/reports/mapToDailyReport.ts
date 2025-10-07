import type { DaySnapshot, ReportRow } from '@/server/reports/queries'
import { getEmployees, displayNameFromEmployeeId } from '@/employees'

export type JobRow = {
  projectCompany: string
  invoice: string
  crewMembers: string[]
  work: string
  payroll: boolean
  payment: string
  vendor: string
  time: string
}

export type DailyReport = {
  dateISO: string
  rows: JobRow[]
  yardEmployees?: string[]
  noWorkEmployees?: string[]
}

const YES_RE = /^\s*(yes|y|true|1)\s*$/i
const NO_RE = /^\s*(no|n|false|0)\s*$/i

function workToLetter(work: string): string {
  const w = (work || '').toUpperCase()
  if (w.includes('TEMP')) return 'TF'
  if (w.includes('GUARDRAIL')) return 'G'
  if (w.includes('HANDRAIL')) return 'H'
  if (w.includes('ATTENUATOR')) return 'A'
  if (w.includes('FENCE')) return 'F'
  if (w.includes('SHOP')) return 'S'
  if (w.includes('NO WORK')) return ''
  return work || '—'
}

function normalizeShift(value: unknown): string {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  if (/night/i.test(raw)) return 'Night'
  if (/day/i.test(raw)) return 'Day'
  return raw
}

function resolvePayrollFlag(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (Array.isArray(value)) {
    for (const entry of value) {
      const s = String(entry ?? '').trim()
      if (!s) continue
      if (YES_RE.test(s)) return true
      if (NO_RE.test(s)) return false
    }
    return false
  }
  const s = String(value ?? '').trim()
  if (!s) return false
  if (YES_RE.test(s)) return true
  if (NO_RE.test(s)) return false
  return false
}

function toStringOrDash(v: unknown): string {
  const s = String(v ?? '').trim()
  return s ? s : '—'
}

function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(x => String(x ?? '')).filter(Boolean)
  return []
}

function createCrewNameResolver(): (raw: string) => string {
  const nameById = new Map(getEmployees().map(e => [e.id, `${e.firstName} ${e.lastName}`]))
  const cache = new Map<string, string>()
  return (raw: string): string => {
    const key = String(raw ?? '').trim()
    if (!key) return ''
    const cached = cache.get(key)
    if (cached) return cached
    const known = nameById.get(key)
    if (known) {
      cache.set(key, known)
      return known
    }
    const guess = displayNameFromEmployeeId(key)
    const finalValue = guess || key
    cache.set(key, finalValue)
    return finalValue
  }
}

export function mapEventsToDailyReport(dateISO: string, events: any[]): DailyReport {
  const resolveCrewName = createCrewNameResolver()
  const rows: JobRow[] = (events || []).map((e: any) => {
    const project = e.title ?? e.project ?? e.customer ?? '—'
    const invoice = e.invoice ?? '—'
    const crewRaw = toStringArray(e?.crew?.length ? e.crew : e?.checklist?.employees)
    const crew = crewRaw.map(resolveCrewName).filter(Boolean)
    const work = workToLetter(e.work ?? e.type ?? '—')
    const payroll = typeof e.payrollAffects === 'boolean'
      ? e.payrollAffects
      : resolvePayrollFlag(e?.payroll)
    const payment = e.payment ?? e.paymentTerm ?? '—'
    const vendor = e.vendor ?? e.vendorName ?? '—'
    const shift = normalizeShift(e.shift)
    const time = shift || e.timeUnit || '—'
    return {
      projectCompany: toStringOrDash(project),
      invoice: toStringOrDash(invoice),
      crewMembers: crew,
      work: toStringOrDash(work),
      payroll,
      payment: toStringOrDash(payment),
      vendor: toStringOrDash(vendor),
      time: toStringOrDash(time),
    }
  })
  return { dateISO, rows }
}

export function mapSnapshotToDailyReport(day: DaySnapshot): DailyReport {
  const resolveCrewName = createCrewNameResolver()
  const rows: JobRow[] = (day.rows || []).map((r: ReportRow) => ({
    projectCompany: toStringOrDash(r.project),
    invoice: toStringOrDash(r.invoice),
    crewMembers: Array.isArray(r.crew) ? r.crew.map(resolveCrewName).filter(Boolean) : [],
    work: toStringOrDash(workToLetter(r.work || '')),
    payroll: resolvePayrollFlag(r.payroll),
    payment: toStringOrDash(r.payment),
    vendor: toStringOrDash(r.vendor),
    time: toStringOrDash(normalizeShift(r.shift) || r.timeUnit),
  }))
  // Rule: exclude jobs with no assigned employees from the Daily Report
  .filter(row => Array.isArray(row.crewMembers) && row.crewMembers.length > 0)
  return { dateISO: day.dateYmd, rows }
}
