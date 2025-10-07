// src/app/api/calendars/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { tryPrisma } from '@/lib/dbSafe'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
} as const

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors as any })
}

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get('search')?.trim()
  const rows = await tryPrisma(
    p =>
      p.calendar.findMany({
        where: search ? { name: { contains: search, mode: 'insensitive' } } : undefined,
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    [] as any[],
  )
  return NextResponse.json(rows, { headers: cors as any })
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null)
  if (!b?.id || !b?.name) {
    return NextResponse.json(
      { error: 'id and name required' },
      { status: 400, headers: cors as any },
    )
  }

  const row = await tryPrisma(
    p =>
      p.calendar.upsert({
        where: { id: String(b.id) },
        update: { name: String(b.name) },
        create: { id: String(b.id), name: String(b.name) },
        select: { id: true, name: true },
      }),
    null as any,
  )

  return NextResponse.json(row, { status: 201, headers: cors as any })
}
