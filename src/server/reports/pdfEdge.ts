import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { DaySnapshot, ReportRow } from './queries'

export async function snapshotsToPdf(days: DaySnapshot[], vendor: string | null, tz: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  for (const day of days) {
    const page = doc.addPage([792, 612]) // Letter landscape (72dpi)
    const { width, height } = page.getSize()
    const margin = 18
    let y = height - margin

    const title = new Date(day.dateYmd + 'T00:00:00Z').toLocaleDateString('en-US', { timeZone: tz, weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })
    const header = vendor ? `${title} — ${vendor}` : title
    page.drawText(header, { x: margin, y: y - 16, size: 14, font: bold, color: rgb(0,0,0) })
    y -= 28

    // table header
    const cols = [
      { key: 'status', title: 'Status', w: 60 },
      { key: 'project', title: 'Project / Company', w: 210 },
      { key: 'invoice', title: 'Invoice', w: 90 },
      { key: 'crew', title: 'Crew Members', w: 170 },
      { key: 'work', title: 'Work', w: 70 },
      { key: 'payroll', title: 'Payroll', w: 90 },
      { key: 'payment', title: 'Payment', w: 70 },
      { key: 'vendor', title: 'Vendor', w: 70 },
      { key: 'timeUnit', title: 'Time', w: 60 },
    ] as const

    const x0 = margin
    let x = x0
    const th = 16
    for (const c of cols) {
      page.drawRectangle({ x, y: y - th, width: c.w, height: th, color: rgb(0.93,0.93,0.93) })
      page.drawText(c.title, { x: x + 4, y: y - th + 4, size: 10, font: bold })
      x += c.w
    }
    y -= th + 2

    const toRow = (r: ReportRow) => ({
      status: (r.work === 'SHOP' || r.work === 'NO WORK') ? r.work : 'WORK',
      project: r.project + (r.notes ? `\n${r.notes}` : ''),
      invoice: r.invoice,
      crew: r.crew.join(', '),
      work: r.work,
      payroll: r.payroll.join(', '),
      payment: r.payment,
      vendor: r.vendor ?? '',
      timeUnit: r.timeUnit,
    })

    const rows = day.rows.length ? day.rows.map(toRow) : [{ status: '', project: 'No scheduled work', invoice: '', crew: '', work: '', payroll: '', payment: '', vendor: '', timeUnit: '' }]

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i] as Record<string,string>
      x = x0
      const rh = 36 // fixed row height, compact
      // zebra
      if (i % 2 === 1) page.drawRectangle({ x, y: y - rh, width: cols.reduce((s,c)=>s+c.w,0), height: rh, color: rgb(0.98,0.98,0.98) })
      for (const c of cols) {
        page.drawText((r[c.key] || '').toString().slice(0,200), { x: x + 4, y: y - rh + 6, size: 9, font })
        x += c.w
      }
      y -= rh + 2
      if (y < 50 && i < rows.length - 1) { // new page
        y = height - margin
        i--
        // add new page, redraw header and table head
        const np = doc.addPage([792, 612])
        const nw = np.getSize().width
        const nh = np.getSize().height
        page.drawText('', { x:0, y:0 }) // keep TS happy
        ;(page as any) = np
        ;({ width: (width as any), height: (height as any) } = np.getSize() as any)
        y = nh - margin
        page.drawText(header, { x: margin, y: y - 16, size: 14, font: bold })
        y -= 28
        x = x0
        for (const c of cols) {
          page.drawRectangle({ x, y: y - th, width: c.w, height: th, color: rgb(0.93,0.93,0.93) })
          page.drawText(c.title, { x: x + 4, y: y - th + 4, size: 10, font: bold })
          x += c.w
        }
        y -= th + 2
      }
    }
  }
  return await doc.save()
}

