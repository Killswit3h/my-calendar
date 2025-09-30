// src/app/api/reports/daily/generate/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { getEventsForDay } from '@/server/reports/queries'
import { renderDailyTablePDF } from '@/reports'
import { snapshotsToPdfPuppeteer } from '@/server/reports/pdfPuppeteer'
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
    const tz = process.env.REPORT_TIMEZONE || 'America/New_York'

    // Map to DailyTablePDF contract
    const dailyData = {
      date: snapshot.dateYmd,
      rows: snapshot.rows.map((r) => {
        const w = (r.work || '').toUpperCase()
        const work = w.includes('TEMP') ? 'TF'
          : w.includes('GUARDRAIL') ? 'G'
          : w.includes('HANDRAIL') ? 'H'
          : w.includes('ATTENUATOR') ? 'A'
          : w.includes('FENCE') ? 'F'
          : w.includes('SHOP') ? 'S'
          : w.includes('NO WORK') ? ''
          : (r.work || '')
        return {
          projectCompany: r.project || '',
          invoice: r.invoice || '',
          crewMembers: Array.isArray(r.crew) ? r.crew : [],
          work,
          payroll: !!(r.payroll && r.payroll.length),
          payment: r.payment || '',
          vendor: r.vendor || '',
          time: r.timeUnit || r.shift || '',
        }
      }),
    }
    let pdfBuf: Buffer
    try {
      pdfBuf = await renderDailyTablePDF(dailyData)
    } catch (err: any) {
      // Try to isolate the offending row for easier debugging
      for (let i = 0; i < dailyData.rows.length; i++) {
        try {
          await renderDailyTablePDF({ date: dailyData.date, rows: dailyData.rows.slice(0, i + 1) })
        } catch (inner: any) {
          const bad = dailyData.rows[i]
          const types = Object.fromEntries(Object.entries(bad as any).map(([k, v]) => [k, typeof v]))
          const summary = `pdf_render_failed: row ${i + 1} ${bad?.projectCompany ? `(${bad.projectCompany})` : ''}`.trim()
          // Field-by-field probe
          const base = { projectCompany: '-', invoice: '-', crewMembers: ['-'], work: '-', payroll: false, payment: '-', vendor: '-', time: '-' }
          const keys: Array<keyof typeof base> = ['projectCompany','invoice','crewMembers','work','payroll','payment','vendor','time']
          const fieldFindings: Record<string, string> = {}
          for (const k of keys) {
            const testRow = { ...base, [k]: (bad as any)[k] }
            try {
              await renderDailyTablePDF({ date: dailyData.date, rows: [testRow] })
              fieldFindings[String(k)] = 'ok'
            } catch (e: any) {
              fieldFindings[String(k)] = String(e?.message || 'failed')
            }
          }
          // Fallback to Puppeteer so the user still gets a PDF
          try {
            const fallback = await snapshotsToPdfPuppeteer([snapshot])
            const suffix = vendor ? `-${vendor.toLowerCase()}` : ''
            const pdfName = `daily-${date}${suffix}.pdf`
            const storedPdf = await storeFile('DAILY_PDF', pdfName, 'application/pdf', Buffer.from(fallback))
            return NextResponse.json({ pdfUrl: storedPdf.url, note: `${summary}`, details: { index: i, types, fieldFindings } }, { status: 200 })
          } catch (fbErr: any) {
            return NextResponse.json({ error: `${summary}: ${String(inner?.message || 'failed')}`, index: i, row: bad, types, fieldFindings }, { status: 500 })
          }
        }
      }
      try {
        const fallback = await snapshotsToPdfPuppeteer([snapshot])
        const suffix = vendor ? `-${vendor.toLowerCase()}` : ''
        const pdfName = `daily-${date}${suffix}.pdf`
        const storedPdf = await storeFile('DAILY_PDF', pdfName, 'application/pdf', Buffer.from(fallback))
        return NextResponse.json({ pdfUrl: storedPdf.url, note: 'fallback_puppeteer' }, { status: 200 })
      } catch (fbErr: any) {
        return NextResponse.json({ error: 'pdf_render_failed', message: String(err?.message || 'failed') }, { status: 500 })
      }
    }
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
