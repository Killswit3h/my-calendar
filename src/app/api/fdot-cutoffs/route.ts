// src/app/api/fdot-cutoffs/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { fetchAllCutoffs, fetchCutoffYears, fetchCutoffsForYear } from '@/server/fdotCutoffs'

export async function GET(req: NextRequest) {
  const yearParam = req.nextUrl.searchParams.get('year')
  if (yearParam) {
    const year = Number.parseInt(yearParam, 10)
    if (!Number.isFinite(year)) {
      return NextResponse.json({ error: 'Invalid year parameter' }, { status: 400 })
    }
    const cutoffs = await fetchCutoffsForYear(year)
    return NextResponse.json({ year, cutoffs })
  }

  const [years, grouped] = await Promise.all([fetchCutoffYears(), fetchAllCutoffs()])
  return NextResponse.json({ years, cutoffs: grouped })
}
