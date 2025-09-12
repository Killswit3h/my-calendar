import { NextRequest, NextResponse } from "next/server";
import { prismaNode as prisma } from "@/lib/prismaNode";
import { getEventsForDay } from "@/server/reports/queries";
import { renderWeeklyHtml } from "@/server/reports/template";
import { htmlToPdfBuffer } from "@/server/reports/pdf";
import { daySnapshotToXlsx } from "@/server/reports/xlsx";
import { storeFile } from "@/server/blob";

export const runtime = 'nodejs'

function okRole(): boolean { return true; } // TODO integrate real auth

export async function POST(req: NextRequest) {
  if (!okRole()) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const body = await req.json().catch(() => null) as { date?: string; vendor?: string | null } | null;
  const date = (body?.date || '').trim();
  const vendor = (body?.vendor || null) as string | null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: 'date_required' }, { status: 400 });

  try {
    // Debounce duplicates: reuse within 24h
    const existing = await prisma.reportFile.findFirst({
      where: { kind: 'DAILY_PDF', reportDate: new Date(date), vendor: vendor ?? null },
      orderBy: { createdAt: 'desc' },
    });
    if (existing && Date.now() - new Date(existing.createdAt).getTime() < 24*60*60*1000) {
      // try to also find xlsx
      const x = await prisma.reportFile.findFirst({ where: { kind: 'DAILY_XLSX', reportDate: new Date(date), vendor: vendor ?? null }, orderBy: { createdAt: 'desc' } });
      return NextResponse.json({ pdfUrl: existing.blobUrl, xlsxUrl: x?.blobUrl || null });
    }

    const snapshot = await getEventsForDay(date, vendor ?? null);
    const tz = process.env.REPORT_TIMEZONE || 'America/New_York';
    const html = renderWeeklyHtml([snapshot], vendor ?? null, tz);
    const pdfBuf = await htmlToPdfBuffer(html);
    const xlsxBuf = await daySnapshotToXlsx(snapshot);

    const pdfName = `daily-${date}${vendor ? '-' + vendor.toLowerCase() : ''}.pdf`;
    const xlsxName = `daily-${date}${vendor ? '-' + vendor.toLowerCase() : ''}.xlsx`;
    const storedPdf = await storeFile('DAILY_PDF', pdfName, 'application/pdf', pdfBuf);
    const storedXlsx = await storeFile('DAILY_XLSX', xlsxName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', xlsxBuf);

    await prisma.dailyReportSnapshot.create({ data: { reportDate: new Date(date), vendor: vendor ?? null, payloadJson: JSON.stringify(snapshot) } });
    await prisma.reportFile.create({ data: { kind: 'DAILY_PDF', reportDate: new Date(date), vendor: vendor ?? null, blobUrl: storedPdf.url, bytes: storedPdf.bytes } });
    await prisma.reportFile.create({ data: { kind: 'DAILY_XLSX', reportDate: new Date(date), vendor: vendor ?? null, blobUrl: storedXlsx.url, bytes: storedXlsx.bytes } });

    return NextResponse.json({ pdfUrl: storedPdf.url, xlsxUrl: storedXlsx.url });
  } catch (e: any) {
    const msg = (e?.message || 'failed').toString();
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
