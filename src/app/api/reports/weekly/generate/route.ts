// src/app/api/reports/weekly/generate/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { getEventsForWeek } from '@/server/reports/queries'
import { snapshotsToPdf } from '@/server/reports/pdfEdge'
import { storeFile } from '@/server/blob'

function okRole(): boolean { return true }

export async function POST(req: NextRequest) {
  if (!okRole()) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const body = (await req.json().catch(() => null)) as {
    weekStart?: string
    weekEnd?: string
    vendor?: string | null
  } | null

  const weekStart = (body?.weekStart || '').trim()
  const weekEnd = (body?.weekEnd || '').trim()
  const vendor = (body?.vendor ?? null) as string | null

  const re = /^\d{4}-\d{2}-\d{2}$/
  if (!re.test(weekStart) || !re.test(weekEnd)) {
    return NextResponse.json({ error: 'range_required' }, { status: 400 })
  }

  const p = await getPrisma()

  try {
    // reuse result if created within last 24h
    const prev = await p.reportFile.findFirst({
      where: { kind: 'WEEKLY_PDF', weekStart: new Date(weekStart), weekEnd: new Date(weekEnd), vendor: vendor ?? null },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, blobUrl: true },
    })
    if (prev && Date.now() - new Date(prev.createdAt).getTime() < 24 * 60 * 60 * 1000) {
      return NextResponse.json({ pdfUrl: prev.blobUrl })
    }

    const days = await getEventsForWeek(weekStart, weekEnd, vendor ?? null)
    const tz = process.env.REPORT_TIMEZONE || 'America/New_York'
    const pdfBuf = Buffer.from(await snapshotsToPdf(days, vendor ?? null, tz))

    const suffix = vendor ? `-${vendor.toLowerCase()}` : ''
    const pdfName = `weekly-${weekStart}-to-${weekEnd}${suffix}.pdf`

    const stored = await storeFile('WEEKLY_PDF', pdfName, 'application/pdf', pdfBuf)

    await p.reportFile.create({
      data: {
        kind: 'WEEKLY_PDF',
        weekStart: new Date(weekStart),
        weekEnd: new Date(weekEnd),
        vendor: vendor ?? null,
        blobUrl: stored.url,
        bytes: stored.bytes,
      },
    })
    await p.weeklyReportRequest.create({
      data: {
        weekStart: new Date(weekStart),
        weekEnd: new Date(weekEnd),
        vendor: vendor ?? null,
        status: 'SUCCESS',
        finishedAt: new Date(),
      },
    })

    return NextResponse.json({ pdfUrl: stored.url })
  } catch (e: any) {
    const msg = String(e?.message ?? 'failed')
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
