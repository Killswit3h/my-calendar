import React from 'react'

export type JobEntry = {
  projectCompany: string
  jobNumber: string
  crewMembers: string[]
  workType: string
  payrollAffects: boolean
  paymentTerm: string
  vendor: string
  timeUnit: string
  notes?: string
}

function valOrDash(v: string | undefined | null): string {
  const s = (v ?? '').toString().trim()
  return s ? s : '—'
}

function yesNo(b: boolean | undefined | null): string {
  return b ? 'Yes' : 'No'
}

export function JobCard({ job }: { job: JobEntry }) {
  const rows: Array<{ label: string; value: React.ReactNode; short?: boolean }>[] = [
    [
      { label: 'PROJECT/COMPANY', value: valOrDash(job.projectCompany) },
      { label: 'INVOICE', value: valOrDash(job.jobNumber), short: true },
    ],
    [
      { label: 'CREW MEMBERS', value: valOrDash(job.crewMembers?.join(', ')) },
      { label: 'WORK', value: valOrDash(job.workType), short: true },
    ],
    [
      { label: 'PAYROLL', value: yesNo(!!job.payrollAffects), short: true },
      { label: 'PAYMENT', value: valOrDash(job.paymentTerm), short: true },
    ],
    [
      { label: 'VENDOR', value: valOrDash(job.vendor), short: true },
      { label: 'TIME', value: valOrDash(job.timeUnit), short: true },
    ],
  ]

  return (
    <div className="jj-card" role="group" aria-label="Job card">
      <div className="jj-card-head">{valOrDash(job.projectCompany)}</div>
      <div className="jj-card-body">
        {rows.map((pair, i) => (
          <div key={i} className="jj-row">
            {pair.map((cell, j) => (
              <div key={j} className={"jj-cell" + (cell.short ? ' short' : '')}>
                <div className="jj-label" aria-hidden="true">{cell.label}</div>
                <div className="jj-value">{cell.value}</div>
              </div>
            ))}
          </div>
        ))}
        {job.notes ? (
          <div className="jj-row">
            <div className="jj-cell notes" style={{ width: '100%' }}>
              <div className="jj-label" aria-hidden="true">NOTES</div>
              <div className="jj-value">{job.notes}</div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

