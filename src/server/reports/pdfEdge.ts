import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { DaySnapshot, ReportRow } from './queries'

function wrapText(text: string, maxWidth: number, font: any, size: number): string[] {
  const words = (text || '').split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const t = line ? line + ' ' + w : w
    if (!line || font.widthOfTextAtSize(t, size) <= maxWidth) line = t
    else { lines.push(line); line = w }
  }
  if (line) lines.push(line)
  return lines
}

function vendorColor(v?: string | null) {
  const s = (v || '').trim().toUpperCase()
  // Tuned to match your sheet colors more closely
  if (s === 'JORGE') return rgb(0.12, 0.62, 0.26)   // green
  if (s === 'TONY')  return rgb(0.18, 0.47, 0.86)   // blue
  if (s === 'CHRIS') return rgb(0.98, 0.50, 0.05)   // orange
  return rgb(0.8, 0.8, 0.8)
}
function timeColor(shift: string) { return (/night/i.test(shift)) ? rgb(0.95,0.86,0.2) : rgb(0.24,0.70,0.29) }

export async function snapshotsToPdf(days: DaySnapshot[], vendor: string | null, tz: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  for (const day of days) {
    let page = doc.addPage([612, 792]) // Letter portrait
    let { width, height } = page.getSize()
    const margin = 36
    let y = height - margin

    // Centered header
    // Use midday UTC to avoid timezone date shift when formatting
    const title = new Date(day.dateYmd + 'T12:00:00Z').toLocaleDateString('en-US', { timeZone: tz, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    const tw = bold.widthOfTextAtSize(title, 18)
    page.drawText(title, { x: (width - tw) / 2, y: y - 18, size: 18, font: bold, color: rgb(0,0,0) })
    y -= 28

    const drawLabelValue = (label: string, value: string, x: number, yTop: number, w: number): number => {
      const labelSize = 9
      const valSize = 11
      page.drawText(label, { x, y: yTop - labelSize, size: labelSize, font, color: rgb(0.3,0.3,0.3) })
      const lines = wrapText(value, w, font, valSize)
      let yy = yTop - labelSize - 4
      for (const ln of lines) { page.drawText(ln, { x, y: yy - valSize, size: valSize, font }); yy -= valSize + 2 }
      return yTop - (labelSize + 4 + (lines.length ? lines.length * (valSize + 2) : valSize)) - 8
    }

    const toRows = (r: ReportRow) => ({
      project: r.project,
      invoice: r.invoice ? `- ${r.invoice} -` : '',
      crew: r.crew.join('\n'),
      work: (r.work || '').replace('GUARDRAIL','G').replace('TEMP_FENCE','TF').replace('FENCE','F').replace('ATTENUATOR','A').replace('HANDRAIL','H').replace('SHOP','S').replace('NO WORK',''),
      payroll: r.payroll.join(', '),
      payment: r.payment,
      vendor: r.vendor ?? '',
      shift: r.shift || 'Day',
      notes: r.notes || '',
    })
    const rows = day.rows.length ? day.rows.map(toRows) : [{ project:'No scheduled work', invoice:'', crew:'', work:'', payroll:'', payment:'', vendor:'', shift:'Day', notes:'' }]

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i] as Record<string, string>

      // Card container
      const cardX = margin
      const cardW = width - margin * 2
      let yy = y - 8
      // Title (project)
      const projLines = wrapText((r.project || '').toUpperCase(), cardW - 12, bold, 12)
      for (const ln of projLines) { page.drawText(ln, { x: cardX + 6, y: yy - 12, size: 12, font: bold }); yy -= 14 }

      // Two-column details
      const colGap = 18
      const colW = (cardW - colGap) / 2
      let leftY = yy - 6
      let rightY = yy - 6
      leftY = drawLabelValue('Invoice', r.invoice || '', cardX + 6, leftY, colW - 12)
      leftY = drawLabelValue('Crew Members', r.crew || '', cardX + 6, leftY, colW - 12)
      leftY = drawLabelValue('Work', r.work || '', cardX + 6, leftY, colW - 12)
      leftY = drawLabelValue('Notes', r.notes || '', cardX + 6, leftY, colW - 12)
      rightY = drawLabelValue('Payroll', r.payroll || '', cardX + 6 + colW + colGap, rightY, colW - 12)
      rightY = drawLabelValue('Payment', r.payment || '', cardX + 6 + colW + colGap, rightY, colW - 12)
      rightY = drawLabelValue('Vendor', r.vendor || '', cardX + 6 + colW + colGap, rightY, colW - 12)
      rightY = drawLabelValue('Time', r.shift || '', cardX + 6 + colW + colGap, rightY, colW - 12)

      const cardBottom = Math.min(leftY, rightY) - 8
      // Border rectangle
      page.drawRectangle({ x: cardX, y: cardBottom, width: cardW, height: (y - cardBottom), borderColor: rgb(0.4,0.4,0.4), borderWidth: 1 })

      y = cardBottom - 14
      if (y < margin + 120 && i < rows.length - 1) {
        page = doc.addPage([612, 792])
        const size = page.getSize(); width = size.width; height = size.height
        y = height - margin
        const tw2 = bold.widthOfTextAtSize(title, 18)
        page.drawText(title, { x: (width - tw2) / 2, y: y - 18, size: 18, font: bold })
        y -= 28
      }
    }
  }
  return await doc.save()
}
