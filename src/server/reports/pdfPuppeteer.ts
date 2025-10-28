import type { DaySnapshot, ReportRow } from './queries'
import fs from 'fs'
import path from 'path'
import { launchReportBrowser } from '@/server/reports/launchBrowser'

function htmlShell(body: string, styles: string): string {
  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>${styles}</style>
    </head>
    <body>
      ${body}
    </body>
  </html>`
}

// Column widths now adaptive via CSS grid-template-columns in styles.css

function vendorPriority(v?: string | null): number {
  const s = (v || '').toUpperCase().trim()
  if (s === 'JORGE') return 0
  if (s === 'TONY') return 1
  if (s === 'CHRIS') return 2
  return 3
}

function escapeHtml(s: string): string { return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }

function normalizeVendor(raw: string): string {
  return (raw || '').toUpperCase().replace(/\s+/g, ' ').trim()
}

type VendorTag = 'jorge' | 'tony' | 'chris' | 'neutral'
function detectVendorTag(token: string): VendorTag | null {
  const t = normalizeVendor(token)
  if (!t) return null
  if (/^JORGE(\b|$)/.test(t)) return 'jorge'
  if (/^TONY(\b|$)/.test(t)) return 'tony'
  if (/^CHRIS(\b|$)/.test(t)) return 'chris'
  return 'neutral'
}

function vendorChipsHtml(text: string): string {
  const norm = normalizeVendor(text)
  if (!norm) return ''
  const parts = text.split(/[,&+/]+/).map(s => s.trim()).filter(Boolean)
  if (!parts.length) parts.push(text)
  const chips = parts.map((p) => {
    const tag = detectVendorTag(p)
    const label = normalizeVendor(p)
    const cls = tag ? (tag === 'neutral' ? 'vendor-neutral' : `vendor-${tag}`) : 'vendor-neutral'
    return `<span class="vendor-chip ${cls}" aria-label="Vendor: ${escapeHtml(label)}">${escapeHtml(label)}</span>`
  }).join('')
  return `<div class="vendor-chips" role="group" aria-label="Vendor">${chips}</div>`
}

function rowHtml(r: ReportRow): string {
  const cols: Array<{ key: string; text: string; bold?: boolean; align?: 'left'|'center' }> = [
    { key: 'project', text: r.project || '', bold: true, align: 'left' },
    { key: 'invoice', text: r.invoice || '', bold: true, align: 'center' },
    { key: 'crew', text: (r.crew || []).join(', '), align: 'left' },
    { key: 'work', text: r.work || '', align: 'center' },
    { key: 'payroll', text: (r.payroll || []).join(', '), align: 'center' },
    { key: 'payment', text: r.payment || '', bold: true, align: 'center' },
    { key: 'vendor', text: r.vendor || '', bold: true, align: 'center' },
    { key: 'time', text: r.timeUnit || r.shift || '', bold: true, align: 'center' },
  ]
  const cells = cols.map((c) => {
    const normalized = (c.text || '').trim().toUpperCase()
    const isNight = c.key === 'time' && normalized === 'NIGHT'
    const cellClass = ['cell']
    if (c.bold) cellClass.push('bold')
    if (isNight) cellClass.push('time-night')
    const divClass = cellClass.join(' ')
    if (c.key === 'vendor') {
      const chips = vendorChipsHtml(c.text)
      const inner = chips || ''
      return `<td class="${c.align === 'left' ? 'al-left' : 'al-center'}"><div class="${divClass}">${inner}</div></td>`
    }
    return `<td class="${c.align === 'left' ? 'al-left' : 'al-center'}"><div class="${divClass}">${escapeHtml(c.text)}</div></td>`
  }).join('')
  return `<tr class="job-row">${cells}</tr><tr class="job-spacer"><td colspan="8"></td></tr>`
}

function dayHtml(day: DaySnapshot, notes?: string): string {
  const rows = [...(day.rows || [])]
  rows.sort((a, b) => {
    const va = vendorPriority(a.vendor)
    const vb = vendorPriority(b.vendor)
    if (va !== vb) return va - vb
    return (a.project || '').localeCompare(b.project || '')
  })
  const dateTitle = new Date(day.dateYmd + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const jobs = rows.map(rowHtml).join('')
  const notesHtml = notes ? `<div class="notes"><div class="notes-title">Notes</div><div class="notes-body">${escapeHtml(notes)}</div></div>` : ''
  const head = `<thead class="grid-head"><tr>
    <th scope="col" class="al-left">Project/Company</th>
    <th scope="col">Invoice</th>
    <th scope="col" class="al-left">Crew Members</th>
    <th scope="col">Work</th>
    <th scope="col">Payroll</th>
    <th scope="col">Payment</th>
    <th scope="col">Vendor</th>
    <th scope="col">TIME</th>
  </tr></thead>`
  const table = `<table class="grid-table">${head}<tbody>${jobs}</tbody></table>`
  return `<div class="report-wrapper"><div class="report-scale"><div class="title">${escapeHtml(dateTitle)}</div>${table}${notesHtml}</div></div>`
}

export async function snapshotsToPdfPuppeteer(days: DaySnapshot[], options?: { notes?: string }): Promise<Uint8Array> {
  // Load styles from file
  const cssPath = path.join(process.cwd(), 'src', 'reports', 'daily', 'styles.css')
  const styles = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : ''

  const body = days.map((d) => dayHtml(d, options?.notes)).join('\n')
  const html = htmlShell(body, styles)

  const browser = await launchReportBrowser()
  try {
    const page = await browser.newPage()
    await page.emulateMediaType('screen')
    await page.setContent(html, { waitUntil: 'load' })
    const pdf = await page.pdf({ format: 'Letter', printBackground: true, margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' } })
    return new Uint8Array(pdf)
  } finally {
    await browser.close().catch(() => {})
  }
}
