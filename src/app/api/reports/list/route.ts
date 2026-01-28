// src/app/api/reports/list/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import type { AccessArea } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { getPrisma } from '@/lib/db'
import { requireAccess } from '@/lib/access'

function areaForKind(kind?: string | null): AccessArea {
  if (!kind) return 'REPORTS_DAILY'
  if (kind.startsWith('WEEKLY')) return 'REPORTS_WEEKLY'
  if (kind.includes('FINANCE')) return 'REPORTS_FINANCE'
  if (kind.includes('EXPORT')) return 'REPORTS_EXPORTS'
  return 'REPORTS_DAILY'
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const kind = sp.get('kind')

  try {
    await requireAccess(areaForKind(kind))
  } catch (error) {
    const status = error instanceof Error && 'status' in error ? Number((error as any).status) : 403
    return NextResponse.json({ error: 'forbidden' }, { status })
  }

  const date = sp.get('date')
  const weekStart = sp.get('weekStart')
  const weekEnd = sp.get('weekEnd')
  const vendor = sp.get('vendor')

  const where: any = {}
  if (kind) where.kind = kind as any
  if (date) where.reportDate = new Date(date)
  if (weekStart) where.weekStart = new Date(weekStart)
  if (weekEnd) where.weekEnd = new Date(weekEnd)
  if (vendor) where.vendor = vendor

  // reportFile model not available
  const items: any[] = []

  return NextResponse.json({ items })
}
