import * as XLSX from 'xlsx'
import type { DaySnapshot, ReportRow } from './queries'

export function daySnapshotToXlsxEdge(day: DaySnapshot): Uint8Array {
  const rows = day.rows.length ? day.rows : ([] as ReportRow[])
  const data = [["Status","Project / Company","Invoice","Crew Members","Work","Payroll","Payment","Vendor","Time"]]
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
  data.push(...rows.map(toRow))

  const ws = XLSX.utils.aoa_to_sheet(data)
  // Wrap text for columns B (2), D (4), F (6)
  ;(ws as any)['!cols'] = [
    { wch: 8 }, { wch: 40 }, { wch: 14 }, { wch: 30 }, { wch: 12 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 8 },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, day.dateYmd)
  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
  return new Uint8Array(out)
}

