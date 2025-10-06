// src/app/api/payitems/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { tryPrisma } from '@/lib/dbSafe'

type PayItemPayload = {
  id: string
  number: string
  description: string
  unit: string
  createdAt: string
  updatedAt: string
}

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.trim().replace(/\s+/g, ' ')
}

function normalizeUnit(value: unknown): string {
  const raw = normalizeText(value)
  if (!raw) return ''
  return raw.toUpperCase()
}

function formatRow(row: any): PayItemPayload {
  return {
    id: String(row.id ?? ''),
    number: String(row.number ?? ''),
    description: String(row.description ?? ''),
    unit: String(row.unit ?? ''),
    createdAt: new Date(row.createdAt ?? Date.now()).toISOString(),
    updatedAt: new Date(row.updatedAt ?? Date.now()).toISOString(),
  }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const query = normalizeText(sp.get('q'))
  const takeRaw = Number(sp.get('take') ?? '')
  const take = Number.isFinite(takeRaw) && takeRaw > 0 ? Math.min(Math.floor(takeRaw), 100) : 50

  const rows = await tryPrisma(
    p =>
      p.payItem.findMany({
        where: query
          ? {
              OR: [
                { number: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
              ],
            }
          : undefined,
        orderBy: [{ number: 'asc' }],
        take,
      }),
    [] as any[],
  )

  return NextResponse.json({ items: rows.map(formatRow) })
}

async function readJson(req: NextRequest): Promise<Record<string, any> | null> {
  try {
    const body = await req.json()
    if (body && typeof body === 'object') return body as Record<string, any>
  } catch {}
  return null
}

export async function POST(req: NextRequest) {
  const body = await readJson(req)
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const number = normalizeText(body.number)
  const description = normalizeText(body.description)
  const unit = normalizeUnit(body.unit)

  if (!number) return NextResponse.json({ error: 'number required' }, { status: 400 })
  if (!description) return NextResponse.json({ error: 'description required' }, { status: 400 })
  if (!unit) return NextResponse.json({ error: 'unit required' }, { status: 400 })

  const created = await tryPrisma(
    async p => {
      const existing = await p.payItem.findFirst({
        where: { number: { equals: number, mode: 'insensitive' } },
        select: { id: true },
      })
      if (existing) {
        throw Object.assign(new Error('Pay item number already exists'), { status: 409 })
      }

      return p.payItem.create({
        data: { number, description, unit },
      })
    },
    null as any,
  ).catch((error: any) => {
    if (error?.status === 409) {
      return { error: 'Pay item number already exists', status: 409 }
    }
    const msg = String(error?.message ?? '')
    return { error: msg || 'Failed to create pay item', status: 500 }
  })

  if (!created || 'error' in created) {
    const status = (created as any)?.status ?? 500
    const error = (created as any)?.error ?? 'Failed to create pay item'
    return NextResponse.json({ error }, { status })
  }

  return NextResponse.json(formatRow(created), { status: 201 })
}
