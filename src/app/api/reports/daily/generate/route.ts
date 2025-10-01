// src/app/api/reports/daily/generate/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { getEventsForDay } from '@/server/reports/queries'
import { mapSnapshotToDailyReport } from '@/server/reports/mapToDailyReport'
import { dailyTableToPdf } from '@/server/reports/pdfDailyTable'
import { daySnapshotToXlsxEdge } from '@/server/reports/xlsxEdge'
import { storeFile } from '@/server/blob'

function okRole(): boolean { return true } // TODO: replace with real auth

function normalizeYmd(input: string | null | undefined): string | null {
  const s = (input || '').trim()
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (!m) return null
  const y = m[1]
  const mm = String(Number(m[2])).padStart(2, '0')
  const dd = String(Number(m[3])).padStart(2, '0')
  return `${y}-${mm}-${dd}`
}

export async function POST(req: NextRequest) {
  if (!okRole()) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const body = (await req.json().catch(() => null)) as { date?: string; vendor?: string | null; force?: boolean } | null
  const date = normalizeYmd(body?.date || '') || ''
  const vendor = (body?.vendor ?? null) as string | null
  const force = !!body?.force
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: 'date_required' }, { status: 400 })

  const p = await getPrisma()

  try {
    // Debounce duplicates: reuse within 24h
    const reportDate = new Date(date)
    const devNoBlob = !process.env.BLOB_READ_WRITE_TOKEN && process.env.NODE_ENV !== 'production'
    if (!force && !devNoBlob) {
      const existing = await p.reportFile.findFirst({
        where: { kind: 'DAILY_PDF', reportDate, vendor: vendor ?? null },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true, blobUrl: true },
      })
      if (existing && Date.now() - new Date(existing.createdAt).getTime() < 60 * 60 * 1000) {
        const x = await p.reportFile.findFirst({
          where: { kind: 'DAILY_XLSX', reportDate, vendor: vendor ?? null },
          orderBy: { createdAt: 'desc' },
          select: { blobUrl: true },
        })
        return NextResponse.json({ pdfUrl: existing.blobUrl, xlsxUrl: x?.blobUrl ?? null })
      }
    }

    const snapshot = await getEventsForDay(date, vendor ?? null)
    const reportData = mapSnapshotToDailyReport(snapshot)
    const pdfBytes = await dailyTableToPdf(reportData)
    const pdfBuf = Buffer.from(pdfBytes)
    const xlsxBuf = Buffer.from(await daySnapshotToXlsxEdge(snapshot))

    const suffix = vendor ? `-${vendor.toLowerCase()}` : ''
    const pdfName = `daily-${date}${suffix}.pdf`
    const xlsxName = `daily-${date}${suffix}.xlsx`

    const storedPdf = await storeFile('DAILY_PDF', pdfName, 'application/pdf', pdfBuf)
    const storedXlsx = await storeFile(
      'DAILY_XLSX',
      xlsxName,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xlsxBuf,
    )

    await p.dailyReportSnapshot.create({
      data: { reportDate, vendor: vendor ?? null, payloadJson: JSON.stringify(snapshot) },
    })
    await p.reportFile.create({
      data: { kind: 'DAILY_PDF', reportDate, vendor: vendor ?? null, blobUrl: storedPdf.url, bytes: storedPdf.bytes },
    })
    await p.reportFile.create({
      data: { kind: 'DAILY_XLSX', reportDate, vendor: vendor ?? null, blobUrl: storedXlsx.url, bytes: storedXlsx.bytes },
    })

    return NextResponse.json({ pdfUrl: storedPdf.url, xlsxUrl: storedXlsx.url })
  } catch (e: any) {
    const msg = String(e?.message ?? 'failed')
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
