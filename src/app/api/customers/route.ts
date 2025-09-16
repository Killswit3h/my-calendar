// src/app/api/customers/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { tryPrisma } from '@/lib/dbSafe'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const search = sp.get('search')?.trim() || ''
  const limit = Math.min(Math.max(parseInt(sp.get('limit') || '20', 10) || 20, 1), 100)
  const offset = Math.max(parseInt(sp.get('offset') || '0', 10) || 0, 0)

  const rows = await tryPrisma(
    p =>
      p.customer.findMany({
        where: search ? { name: { contains: search, mode: 'insensitive' } } : undefined,
        orderBy: { name: 'asc' },
        take: limit,
        skip: offset,
        select: { id: true, name: true },
      }),
    [] as any[],
  )

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null)
  if (!b?.name || typeof b.name !== 'string') {
    return NextResponse.json({ error: 'name required' }, { status: 400 })
  }

  // If id provided, upsert. Otherwise create.
  const created = await tryPrisma(
    async p => {
      if (b.id) {
        return p.customer.upsert({
          where: { id: String(b.id) },
          update: { name: b.name.trim() },
          create: { id: String(b.id), name: b.name.trim() },
          select: { id: true, name: true },
        })
      }
      return p.customer.create({
        data: { name: b.name.trim() },
        select: { id: true, name: true },
      })
    },
    null as any,
  )

  return NextResponse.json(created, { status: 201 })
}
