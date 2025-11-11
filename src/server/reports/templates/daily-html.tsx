import type { DailyReport } from '@/server/reports/mapToDailyReport'

function escapeHtml(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function vendorClass(v?: string): string {
  const k = String(v || '').trim().toUpperCase()
  if (k === 'JORGE') return 'vendor-jorge'
  if (k === 'TONY')  return 'vendor-tony'
  if (k === 'CHRIS') return 'vendor-chris'
  return ''
}

export function renderDailyHTML(data: DailyReport): string {
  const { dateISO, rows } = data
  const dateStr = new Date(dateISO + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  const yardList = Array.isArray(data.yardEmployees) ? data.yardEmployees.filter(Boolean) : []
  const noWorkList = Array.isArray(data.noWorkEmployees) ? data.noWorkEmployees.filter(Boolean) : []
  const yardNote = typeof data.yardNote === 'string' ? data.yardNote.trim() : ''
  const noWorkNote = typeof data.noWorkNote === 'string' ? data.noWorkNote.trim() : ''

  const bodyRows = (rows || []).map(r => {
    const vendorCls = vendorClass(r.vendor)
    const rawTime = String(r.time ?? '').trim()
    const isNight = rawTime.toUpperCase() === 'NIGHT'
    const timeLabel = escapeHtml(rawTime || '—')
    const timeClass = isNight ? ' time-night' : ''
    return `
      <tr>
        <td class="col-project">${escapeHtml(r.projectCompany || '—')}</td>
        <td class="col-invoice">${escapeHtml(r.invoice || '—')}</td>
        <td class="col-crew">${escapeHtml((r.crewMembers || []).join(', '))}</td>
        <td class="col-work">${escapeHtml(r.work || '—')}</td>
        <td class="col-payroll">${r.payroll ? 'Yes' : 'No'}</td>
        <td class="col-payment">${escapeHtml(r.payment || '—')}</td>
        <td class="col-vendor ${vendorCls}">${escapeHtml(r.vendor || '—')}</td>
        <td class="col-time${timeClass}">${timeLabel}</td>
      </tr>`
  }).join('')

  const renderList = (items: string[]) => {
    if (!items.length) return '<div class="extra-empty">—</div>'
    return `<ul class="extra-list">${items.map(name => `<li>${escapeHtml(name)}</li>`).join('')}</ul>`
  }

  const extras = `
  <div class="extras">
    <div class="extra-card">
      <div class="extra-title">Yard/Shop</div>
      ${renderList(yardList)}
    </div>
    <div class="extra-card">
      <div class="extra-title">No Work</div>
      ${renderList(noWorkList)}
    </div>
  </div>`

  const notes = (yardNote || noWorkNote)
    ? `
  <div class="notes-card">
    <div class="notes-title">Notes</div>
    <div class="notes-body">${escapeHtml(yardNote || noWorkNote || '')}</div>
  </div>`
    : ''

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  @page { size: Letter landscape; margin: 0.25in; }
  html, body { height: 100%; }
  body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; font-size: 10pt; color: #000; }
  h1 { text-align: center; font-size: 12pt; margin: 0; font-weight: 700; }
  .rule { height: 1px; background: #888; margin: 6pt 0 8pt; }

  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  th, td { border: 0.8pt solid #000; padding: 4pt 6pt; vertical-align: middle; word-wrap: break-word; }

  /* Header cells: keep labels on one line to avoid awkward wraps */
  th { background: #e9e9e9; text-transform: uppercase; font-weight:700; font-size:9pt; text-align: center; white-space: nowrap; }

  .col-project { width:35%; text-align: left; }
  .col-invoice { width:10%; text-align:center; }
  .col-crew { width:25%; white-space: pre-wrap; text-align:left; }
  .col-work { width:6%; text-align:center; }
  .col-payroll { width:6%; text-align:center; }
  .col-payment { width:8%; text-align:center; }
  .col-vendor { width:5%; text-align:center; }
  .col-time { width:5%; text-align:center; }
  .col-time.time-night { background: #FFF3B0; font-weight: 700; color: #7C2D12; }

  /* Slightly smaller font for tight header cells to ensure fit */
  th.col-payroll, th.col-vendor { font-size: 8.5pt; padding-left: 4pt; padding-right: 4pt; }

  tbody tr:nth-child(even) { background: #f7f7f7; }

  .vendor-jorge { background:#4CAF50; color:#fff; }
  .vendor-tony  { background:#3B82F6; color:#fff; }
  .vendor-chris { background:#E53935; color:#fff; }

  .extras { display: flex; gap: 12pt; margin-top: 12pt; }
  .extra-card { flex: 1; border: 1pt solid #444; border-radius: 6pt; padding: 8pt; background: #fafafa; }
  .extra-title { font-size: 10pt; font-weight: 700; margin-bottom: 6pt; text-transform: uppercase; }
  .extra-list { list-style: disc; padding-left: 14pt; margin: 0; font-size: 10pt; display: grid; gap: 2pt; }
  .extra-empty { font-size: 9pt; color: #666; }
  .notes-card { margin-top: 16pt; border: 1pt solid #444; border-radius: 6pt; padding: 10pt; background: #f2f2f2; }
  .notes-title { font-size: 10pt; font-weight: 700; margin-bottom: 6pt; text-transform: uppercase; }
  .notes-body { font-size: 10pt; white-space: pre-wrap; color: #333; }
</style>
</head>
<body>
  <h1>${escapeHtml(dateStr)}</h1>
  <div class="rule"></div>
  <table role="table" aria-label="Daily Work Report">
    <thead>
      <tr>
        <th class="col-project">Project/Company</th>
        <th class="col-invoice">Invoice</th>
        <th class="col-crew">Crew Members</th>
        <th class="col-work">Work</th>
        <th class="col-payroll">Payroll</th>
        <th class="col-payment">Payment</th>
        <th class="col-vendor">Vendor</th>
        <th class="col-time">TIME</th>
      </tr>
    </thead>
    <tbody>
      ${bodyRows}
    </tbody>
  </table>
  ${extras}
  ${notes}
</body>
</html>`
}
