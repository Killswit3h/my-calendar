// src/app/api/customers/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { tryPrisma } from '@/lib/dbSafe'

function norm(s: string) {
  return s.trim().replace(/\s+/g, ' ')
}

async function readName(req: NextRequest): Promise<string | null> {
  // 1) ?name=...
  const q = req.nextUrl.searchParams.get('name')
  if (q && q.trim()) return norm(q)

  // 2) JSON body
  const json = (await req.json().catch(() => null)) as any
  if (json && typeof json.name === 'string' && json.name.trim()) {
    return norm(json.name)
  }

  // 3) Form body (only if JSON was absent)
  const form = await req.formData().catch(() => null)
  const f = form?.get('name')
  if (typeof f === 'string' && f.trim()) return norm(f)

  return null
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const search = sp.get('search')?.trim() || ''
  const limit = Math.min(Math.max(parseInt(sp.get('limit') || '20', 10) || 20, 1), 100)
  const offset = Math.max(parseInt(sp.get('offset') || '0', 10) || 0, 0)

  const rows = await tryPrisma(
    p => p.customer.findMany({
      where: search ? { name: { contains: search, mode: 'insensitive' } } : undefined,
      orderBy: { name: 'asc' }, take: limit, skip: offset,
      select: { id: true, name: true },
    }),
    [] as any[],
  )

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const name = await readName(req)
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const row = await tryPrisma(
    p => p.customer.upsert({
      where: { name }, update: {}, create: { name },
      select: { id: true, name: true },
    }),
    null as any,
  )

  return NextResponse.json(row, { status: 200 })
}
