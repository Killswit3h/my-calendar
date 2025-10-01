import type { DaySnapshot, ReportRow } from '@/server/reports/queries'

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
}

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

function toStringOrDash(v: unknown): string {
  const s = String(v ?? '').trim()
  return s ? s : '—'
}

function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(x => String(x ?? '')).filter(Boolean)
  return []
}

export function mapEventsToDailyReport(dateISO: string, events: any[]): DailyReport {
  const rows: JobRow[] = (events || []).map((e: any) => {
    const project = e.title ?? e.project ?? e.customer ?? '—'
    const invoice = e.invoice ?? '—'
    const crew = toStringArray(e?.crew?.length ? e.crew : e?.checklist?.employees)
    const work = workToLetter(e.work ?? e.type ?? '—')
    const payroll = !!(e.payrollAffects || (Array.isArray(e?.payroll) && e.payroll.length > 0))
    const payment = e.payment ?? e.paymentTerm ?? '—'
    const vendor = e.vendor ?? e.vendorName ?? '—'
    const time = e.timeUnit ?? e.shift ?? '—'
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
  const rows: JobRow[] = (day.rows || []).map((r: ReportRow) => ({
    projectCompany: toStringOrDash(r.project),
    invoice: toStringOrDash(r.invoice),
    crewMembers: Array.isArray(r.crew) ? r.crew : [],
    work: toStringOrDash(workToLetter(r.work || '')),
    payroll: !!(r.payroll && r.payroll.length),
    payment: toStringOrDash(r.payment),
    vendor: toStringOrDash(r.vendor),
    time: toStringOrDash(r.timeUnit || r.shift),
  }))
  // Rule: exclude jobs with no assigned employees from the Daily Report
  .filter(row => Array.isArray(row.crewMembers) && row.crewMembers.length > 0)
  return { dateISO: day.dateYmd, rows }
}
