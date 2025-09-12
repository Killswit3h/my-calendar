import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEventsForWeek } from "@/server/reports/queries";
import { snapshotsToPdf } from "@/server/reports/pdfEdge";
import { storeFile } from "@/server/blob";

export const runtime = 'edge'

function okRole(): boolean { return true; }

export async function POST(req: NextRequest) {
  if (!okRole()) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const body = await req.json().catch(() => null) as { weekStart?: string; weekEnd?: string; vendor?: string | null } | null;
  const weekStart = (body?.weekStart || '').trim();
  const weekEnd = (body?.weekEnd || '').trim();
  const vendor = (body?.vendor || null) as string | null;
  const re = /^\d{4}-\d{2}-\d{2}$/;
  if (!re.test(weekStart) || !re.test(weekEnd)) return NextResponse.json({ error: 'range_required' }, { status: 400 });

  try {
    const prev = await prisma.reportFile.findFirst({ where: { kind: 'WEEKLY_PDF', weekStart: new Date(weekStart), weekEnd: new Date(weekEnd), vendor: vendor ?? null }, orderBy: { createdAt: 'desc' } });
    if (prev && Date.now() - new Date(prev.createdAt).getTime() < 24*60*60*1000) return NextResponse.json({ pdfUrl: prev.blobUrl });

    const days = await getEventsForWeek(weekStart, weekEnd, vendor ?? null);
    const tz = process.env.REPORT_TIMEZONE || 'America/New_York';
    const pdfBuf = Buffer.from(await snapshotsToPdf(days, vendor ?? null, tz));
    const pdfName = `weekly-${weekStart}-to-${weekEnd}${vendor ? '-' + vendor.toLowerCase() : ''}.pdf`;
    const stored = await storeFile('WEEKLY_PDF', pdfName, 'application/pdf', pdfBuf);
    await prisma.reportFile.create({ data: { kind: 'WEEKLY_PDF', weekStart: new Date(weekStart), weekEnd: new Date(weekEnd), vendor: vendor ?? null, blobUrl: stored.url, bytes: stored.bytes } });
    await prisma.weeklyReportRequest.create({ data: { weekStart: new Date(weekStart), weekEnd: new Date(weekEnd), vendor: vendor ?? null, status: 'SUCCESS', finishedAt: new Date() } });
    return NextResponse.json({ pdfUrl: stored.url });
  } catch (e: any) {
    const msg = (e?.message || 'failed').toString();
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
