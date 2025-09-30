// src/app/api/reports/daily/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { getEventsForDay } from '@/server/reports/queries'
import { snapshotsToPdfPuppeteer } from '@/server/reports/pdfPuppeteer'

function normalizeYmd(input: string | null): string | null {
  const s = (input || '').trim()
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (!m) return null
  const y = m[1]
  const mm = String(Number(m[2])).padStart(2, '0')
  const dd = String(Number(m[3])).padStart(2, '0')
  return `${y}-${mm}-${dd}`
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const date = normalizeYmd(url.searchParams.get('date'))
  const calendarId = url.searchParams.get('calendarId') || ''
  const download = (url.searchParams.get('download') || '').toLowerCase() === 'pdf'
  if (!date) return NextResponse.json({ error: 'date_required' }, { status: 400 })

  try {
    const snapshot = await getEventsForDay(date, null)
    const pdf = await snapshotsToPdfPuppeteer([snapshot])
    const filename = `Daily-Report-${date}.pdf`
    const res = new NextResponse(Buffer.from(pdf), { headers: { 'Content-Type': 'application/pdf' } })
    if (download) res.headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    return res
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || 'failed') }, { status: 500 })
  }
}

