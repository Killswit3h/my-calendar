// src/app/api/payitems/[id]/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextRequest, NextResponse } from 'next/server'
import { tryPrisma } from '@/lib/dbSafe'

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.trim().replace(/\s+/g, ' ')
}

function normalizeUnit(value: unknown): string {
  const raw = normalizeText(value)
  if (!raw) return ''
  return raw.toUpperCase()
}

function formatRow(row: any) {
  return {
    id: String(row.id ?? ''),
    number: String(row.number ?? ''),
    description: String(row.description ?? ''),
    unit: String(row.unit ?? ''),
    createdAt: new Date(row.createdAt ?? Date.now()).toISOString(),
    updatedAt: new Date(row.updatedAt ?? Date.now()).toISOString(),
  }
}

async function readBody(req: NextRequest): Promise<Record<string, any> | null> {
  try {
    const json = await req.json()
    if (json && typeof json === 'object') return json as Record<string, any>
  } catch {}
  return null
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const body = await readBody(req)
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

  const number = normalizeText(body.number)
  const description = normalizeText(body.description)
  const unit = normalizeUnit(body.unit)

  if (!number) return NextResponse.json({ error: 'number required' }, { status: 400 })
  if (!description) return NextResponse.json({ error: 'description required' }, { status: 400 })
  if (!unit) return NextResponse.json({ error: 'unit required' }, { status: 400 })

  try {
    const row = await tryPrisma(
      async p => {
        const existing = await p.payItem.findUnique({ where: { id }, select: { id: true } })
        if (!existing) {
          throw Object.assign(new Error('Pay item not found'), { status: 404 })
        }

        const conflict = await p.payItem.findFirst({
          where: {
            id: { not: id },
            number: { equals: number, mode: 'insensitive' },
          },
          select: { id: true },
        })

        if (conflict) {
          throw Object.assign(new Error('Pay item number already exists'), { status: 409 })
        }

        return p.payItem.update({
          where: { id },
          data: { number, description, unit },
        })
      },
      null as any,
    )

    if (!row) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    return NextResponse.json(formatRow(row))
  } catch (error: any) {
    const status = Number(error?.status) || 500
    if (status === 404) return NextResponse.json({ error: 'Pay item not found' }, { status })
    if (status === 409) return NextResponse.json({ error: 'Pay item number already exists' }, { status })
    const msg = String(error?.message ?? 'Failed to update pay item')
    return NextResponse.json({ error: msg }, { status: status === 500 ? 500 : status })
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  try {
    const result = await tryPrisma(
      async p => {
        const existing = await p.payItem.findUnique({ where: { id }, select: { id: true } })
        if (!existing) {
          throw Object.assign(new Error('Pay item not found'), { status: 404 })
        }

        const quantityCount = await p.eventQuantity.count({ where: { payItemId: id } })
        if (quantityCount > 0) {
          throw Object.assign(new Error('Pay item has associated quantities'), { status: 409, count: quantityCount })
        }

        await p.payItem.delete({ where: { id } })
        return { ok: true }
      },
      null as any,
    )

    if (!result) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    const status = Number(error?.status) || 500
    if (status === 404) return NextResponse.json({ error: 'Pay item not found' }, { status })
    if (status === 409) {
      return NextResponse.json(
        { error: 'Pay item has associated quantities. Remove quantities before deleting.', count: Number(error?.count) || undefined },
        { status },
      )
    }
    const msg = String(error?.message ?? 'Failed to delete pay item')
    return NextResponse.json({ error: msg }, { status })
  }
}
