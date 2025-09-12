import ExcelJS from 'exceljs'
import type { DaySnapshot, ReportRow } from './queries'

export async function daySnapshotToXlsxEdge(day: DaySnapshot): Promise<Uint8Array> {
  const rows = day.rows.length ? day.rows : ([] as ReportRow[])
  const header = [
    'Status',
    'Project / Company',
    'Invoice',
    'Crew Members',
    'Work',
    'Payroll',
    'Payment',
    'Vendor',
    'Time',
  ]
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(day.dateYmd)
  ws.addRow(header)
  const toRow = (r: ReportRow) => [
    (r.work === 'SHOP' || r.work === 'NO WORK') ? r.work : 'WORK',
    r.project + (r.notes ? `\n${r.notes}` : ''),
    r.invoice,
    r.crew.join(', '),
    r.work,
    r.payroll.join(', '),
    r.payment,
    r.vendor ?? '',
    r.timeUnit,
  ]
  rows.map(toRow).forEach((row) => ws.addRow(row))
  ws.columns = [
    { width: 8 },
    { width: 40 },
    { width: 14 },
    { width: 30 },
    { width: 12 },
    { width: 18 },
    { width: 12 },
    { width: 12 },
    { width: 8 },
  ]
  ;[2,4,6].forEach((i) => { ws.getColumn(i).alignment = { wrapText: true } })
  const buffer = await wb.xlsx.writeBuffer()
  return new Uint8Array(buffer)
}
