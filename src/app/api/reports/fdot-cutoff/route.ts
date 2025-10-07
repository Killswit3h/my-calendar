// src/app/api/reports/fdot-cutoff/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import {
  exportAggregatedCsv,
  generateAggregatedRows,
  resolveCutoffWindow,
} from '@/server/fdotCutoffs'

async function readJson(req: NextRequest): Promise<any | null> {
  try {
    const json = await req.json()
    if (json && typeof json === 'object') return json
  } catch {}
  return null
}

export async function POST(req: NextRequest) {
  const body = await readJson(req)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const year = Number.parseInt(String(body.year ?? ''), 10)
  if (!Number.isFinite(year)) {
    return NextResponse.json({ error: 'year is required' }, { status: 400 })
  }

  const toCutoff = String(body.toCutoff ?? body.toCutoffId ?? '').trim()
  if (!toCutoff) {
    return NextResponse.json({ error: 'toCutoff is required' }, { status: 400 })
  }

  const window = await resolveCutoffWindow(year, toCutoff)
  if (!window) {
    return NextResponse.json({ error: 'Unable to resolve cut-off window' }, { status: 404 })
  }

  const format = String(body.format ?? 'json').toLowerCase()
  const page = Number.parseInt(String(body.page ?? '1'), 10)
  const pageSize = Number.parseInt(String(body.pageSize ?? '1000'), 10)

  if (format === 'csv') {
    const { csv, rowCount } = await exportAggregatedCsv(window)
    console.log('telemetry:fdot_report.generate', {
      userId: req.headers.get('x-user-id') ?? null,
      year,
      toCutoff: window.toCutoff.cutoffDate,
      format: 'csv',
      rows: rowCount,
    })
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="fdot-cutoff-${window.endDate}.csv"`,
        'Cache-Control': 'no-store',
      },
    })
  }

  const result = await generateAggregatedRows(window, page, pageSize)
  console.log('telemetry:fdot_report.generate', {
    userId: req.headers.get('x-user-id') ?? null,
    year,
    toCutoff: window.toCutoff.cutoffDate,
    format: 'json',
    rows: result.totalRows,
    page: result.page,
    pageSize: result.pageSize,
  })

  return NextResponse.json({
    window: {
      startDate: window.startDate,
      endDate: window.endDate,
      toCutoff: window.toCutoff,
      previousCutoff: window.previousCutoff,
    },
    page: result.page,
    pageSize: result.pageSize,
    totalRows: result.totalRows,
    rows: result.rows,
    grandTotal: result.grandTotal,
  })
}
