import React from 'react'
import type { DaySnapshot, ReportRow } from '@/server/reports/queries'

const SUM = 11.29 + 109.86 + 18 + 60 + 12.43 + 8.43 + 18.73 + 8.43 + 8.43
const W = {
  status: 11.29 / SUM * 100,
  project: 109.86 / SUM * 100,
  invoice: 18 / SUM * 100,
  crew: 60 / SUM * 100,
  work: 12.43 / SUM * 100,
  payroll: 8.43 / SUM * 100,
  payment: 18.73 / SUM * 100,
  vendor: 8.43 / SUM * 100,
  time: 8.43 / SUM * 100,
}

function vendorPriority(v?: string | null): number {
  const s = (v || '').toUpperCase().trim()
  if (s === 'JORGE') return 0
  if (s === 'TONY') return 1
  if (s === 'CHRIS') return 2
  return 3
}

function renderRow(r: ReportRow, i: number) {
  // Bold only for Project/Company, Invoice, Payment, Vendor, Time
  const bold = (key: string) => ['project', 'invoice', 'payment', 'vendor', 'time'].includes(key)
  const status = (r.work === 'SHOP' || r.work === 'NO WORK') ? r.work : 'WORK'
  const cols: Array<{ key: string; text: string; w: number }> = [
    { key: 'status', text: status, w: W.status },
    { key: 'project', text: r.project || '', w: W.project },
    { key: 'invoice', text: r.invoice || '', w: W.invoice },
    { key: 'crew', text: (r.crew || []).join(', '), w: W.crew },
    { key: 'work', text: r.work || '', w: W.work },
    { key: 'payroll', text: (r.payroll || []).join(', '), w: W.payroll },
    { key: 'payment', text: r.payment || '', w: W.payment },
    { key: 'vendor', text: r.vendor || '', w: W.vendor },
    { key: 'time', text: r.timeUnit || r.shift || '', w: W.time },
  ]
  return (
    <div className="job" key={i}>
      <div className="row">
        {cols.map((c) => (
          <div
            key={c.key}
            className={`cell ${bold(c.key) ? 'bold' : ''}`}
            style={{ flexBasis: `${c.w}%`, maxWidth: `${c.w}%`, borderRight: '0.5pt solid #000' }}
          >
            {c.text}
          </div>
        ))}
      </div>
    </div>
  )
}

export function DailyReport({ day, notes }: { day: DaySnapshot; notes?: string }) {
  // Sort rows by vendor priority, then project A–Z
  const rows = [...(day.rows || [])]
  rows.sort((a, b) => {
    const va = vendorPriority(a.vendor)
    const vb = vendorPriority(b.vendor)
    if (va !== vb) return va - vb
    return (a.project || '').localeCompare(b.project || '')
  })

  return (
    <div className="report-wrapper">
      <div className="report-scale">
        <div className="title">{new Date(day.dateYmd + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        <div className="jobs">
          {rows.map((r, i) => renderRow(r, i))}
        </div>
        {notes ? (
          <div className="notes">
            <div className="notes-title">Notes</div>
            <div className="notes-body">{notes}</div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default DailyReport

