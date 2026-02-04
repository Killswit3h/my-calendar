// src/app/api/reports/list/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'

function okRole(): boolean { return true }

export async function GET(req: NextRequest) {
  if (!okRole()) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const sp = req.nextUrl.searchParams
  const kind = sp.get('kind') as any
  const date = sp.get('date')
  const weekStart = sp.get('weekStart')
  const weekEnd = sp.get('weekEnd')
  const vendor = sp.get('vendor')

  const where: any = {}
  if (kind) where.kind = kind
  if (date) where.reportDate = new Date(date)
  if (weekStart) where.weekStart = new Date(weekStart)
  if (weekEnd) where.weekEnd = new Date(weekEnd)
  if (vendor) where.vendor = vendor

  const p = await getPrisma()
  const items = await p.reportFile.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ items })
}
