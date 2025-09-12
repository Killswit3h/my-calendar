import Excel from "exceljs";
import type { DaySnapshot, ReportRow } from "./queries";

export async function daySnapshotToXlsx(day: DaySnapshot): Promise<Buffer> {
  const wb = new Excel.Workbook();
  const ws = wb.addWorksheet(day.dateYmd);
  ws.columns = [
    { header: "Status", key: "status", width: 10 },
    { header: "Project / Company", key: "project", width: 36 },
    { header: "Invoice", key: "invoice", width: 14 },
    { header: "Crew Members", key: "crew", width: 30 },
    { header: "Work", key: "work", width: 12 },
    { header: "Payroll", key: "payroll", width: 18 },
    { header: "Payment", key: "payment", width: 14 },
    { header: "Vendor", key: "vendor", width: 12 },
    { header: "Time", key: "timeUnit", width: 10 },
  ];
  ws.views = [{ state: 'frozen', ySplit: 1 }];

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
  });
  day.rows.forEach(r => ws.addRow(toRow(r)));
  // Wrap text for crew and project/notes
  ["project", "crew"].forEach(k => {
    const col = ws.getColumn(k);
    col.alignment = { wrapText: true, vertical: 'top' };
  });
  ws.getColumn("payroll").alignment = { wrapText: true, vertical: 'top' };

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

