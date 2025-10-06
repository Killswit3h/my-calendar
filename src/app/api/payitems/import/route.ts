// src/app/api/payitems/import/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { tryPrisma } from '@/lib/dbSafe'

type ImportRow = { number: string; description: string; unit: string }

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.trim().replace(/\s+/g, ' ')
}

function normalizeUnit(value: unknown): string {
  const raw = normalizeText(value)
  if (!raw) return ''
  return raw.toUpperCase()
}

function normalizeRow(row: any): ImportRow | { error: string } {
  const number = normalizeText(row?.number)
  const description = normalizeText(row?.description)
  const unit = normalizeUnit(row?.unit)

  if (!number) return { error: 'number required' }
  if (!description) return { error: 'description required' }
  if (!unit) return { error: 'unit required' }

  return { number, description, unit }
}

export async function POST(req: NextRequest) {
  let body: any = null
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const rows = Array.isArray(body?.rows) ? body.rows : []
  if (!rows.length) {
    return NextResponse.json({ error: 'rows array required' }, { status: 400 })
  }

  const rejected: Array<{ index: number; number?: string; reason: string }> = []
  const normalized: ImportRow[] = []
  const seen = new Map<string, number>()

  rows.forEach((item: any, index: number) => {
    const normalizedRow = normalizeRow(item)
    if ('error' in normalizedRow) {
      rejected.push({ index, number: normalizeText(item?.number), reason: normalizedRow.error })
      return
    }

    const key = normalizedRow.number.toLowerCase()
    if (seen.has(key)) {
      rejected.push({ index, number: normalizedRow.number, reason: 'duplicate number in import payload' })
      return
    }
    seen.set(key, index)
    normalized.push(normalizedRow)
  })

  if (!normalized.length) {
    return NextResponse.json({ imported: 0, updated: 0, rejected })
  }

  try {
    const result = await tryPrisma(
      async p => {
        let created = 0
        let updated = 0

        for (const row of normalized) {
          const existing = await p.payItem.findFirst({
            where: { number: { equals: row.number, mode: 'insensitive' } },
            select: { id: true },
          })

          if (existing) {
            await p.payItem.update({
              where: { id: existing.id },
              data: { number: row.number, description: row.description, unit: row.unit },
            })
            updated += 1
          } else {
            await p.payItem.create({ data: row })
            created += 1
          }
        }

        return { created, updated }
      },
      null as any,
    )

    if (!result) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    return NextResponse.json({ imported: result.created, updated: result.updated, rejected })
  } catch (error: any) {
    const msg = String(error?.message ?? 'Failed to import pay items')
    return NextResponse.json({ error: msg, rejected }, { status: 500 })
  }
}
