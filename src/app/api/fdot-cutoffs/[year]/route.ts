// src/app/api/fdot-cutoffs/[year]/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { fetchCutoffsForYear, saveCutoffs } from '@/server/fdotCutoffs'

async function readJson(req: NextRequest): Promise<any | null> {
  try {
    const json = await req.json()
    if (json && typeof json === 'object') return json
  } catch {}
  return null
}

type YearContext = { params: Promise<{ year: string }> }

async function resolveYear(context: YearContext): Promise<number> {
  const { year } = await context.params
  const parsed = Number.parseInt(year ?? '', 10)
  return parsed
}

export async function GET(_req: NextRequest, context: YearContext) {
  const year = await resolveYear(context)
  if (!Number.isFinite(year)) {
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
  }
  const cutoffs = await fetchCutoffsForYear(year)
  return NextResponse.json({ year, cutoffs })
}

export async function PUT(req: NextRequest, context: YearContext) {
  const year = await resolveYear(context)
  if (!Number.isFinite(year)) {
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
  }
  const body = await readJson(req)
  if (!body || !Array.isArray(body.cutoffs)) {
    return NextResponse.json({ error: 'cutoffs array required' }, { status: 400 })
  }

  try {
    const result = await saveCutoffs(year, body.cutoffs, req.headers.get('x-user-id'))
    console.log('telemetry:fdot_cutoffs.save', {
      userId: req.headers.get('x-user-id') ?? null,
      year,
      created: result.created,
      updated: result.updated,
      deleted: result.deleted,
    })
    return NextResponse.json({
      year,
      cutoffs: result.records,
      summary: {
        created: result.created,
        updated: result.updated,
        deleted: result.deleted,
      },
    })
  } catch (error: any) {
    const status = Number.isFinite(error?.status) ? Number(error.status) : 400
    return NextResponse.json({ error: String(error?.message || 'Failed to save cut-offs') }, { status })
  }
}
