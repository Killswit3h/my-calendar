// src/app/api/events/[id]/quantities/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { tryPrisma } from '@/lib/dbSafe'

type QuantityLine = {
  id?: string
  payItemId: string
  quantity: Prisma.Decimal
  stationFrom: string | null
  stationTo: string | null
  notes: string | null
}

const ZERO = new Prisma.Decimal(0)
const MAX_QTY = new Prisma.Decimal('999999999999.999999')

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.trim()
}

function optionalText(value: unknown): string | null {
  const s = normalizeText(value)
  return s ? s : null
}

function parseQuantity(value: unknown): { ok: true; value: Prisma.Decimal } | { ok: false; error: string } {
  if (value === null || value === undefined) {
    return { ok: false, error: 'quantity required' }
  }

  let text: string
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return { ok: false, error: 'quantity must be finite number' }
    text = value.toString()
  } else if (typeof value === 'string') {
    text = value.trim()
  } else {
    return { ok: false, error: 'quantity must be number or string' }
  }

  if (!text) return { ok: false, error: 'quantity required' }
  if (!/^\d+(\.\d{1,6})?$/.test(text)) {
    return { ok: false, error: 'quantity must have at most 6 decimal places' }
  }

  try {
    const decimal = new Prisma.Decimal(text)
    if (decimal.isNaN()) return { ok: false, error: 'quantity invalid' }
    if (decimal.lt(ZERO)) return { ok: false, error: 'quantity must be >= 0' }
    if (decimal.gt(MAX_QTY)) return { ok: false, error: 'quantity too large' }
    return { ok: true, value: decimal }
  } catch {
    return { ok: false, error: 'quantity invalid' }
  }
}

function decimalToString(value: Prisma.Decimal): string {
  return value.toFixed(6).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1')
}

function formatRow(row: any) {
  const quantityValue = row.quantity instanceof Prisma.Decimal ? row.quantity : new Prisma.Decimal(row.quantity ?? 0)
  return {
    id: String(row.id ?? ''),
    eventId: String(row.eventId ?? ''),
    payItemId: String(row.payItemId ?? ''),
    quantity: decimalToString(quantityValue),
    stationFrom: row.stationFrom ?? null,
    stationTo: row.stationTo ?? null,
    notes: row.notes ?? null,
    payItem: row.payItem
      ? {
          id: String(row.payItem.id ?? ''),
          number: String(row.payItem.number ?? ''),
          description: String(row.payItem.description ?? ''),
          unit: String(row.payItem.unit ?? ''),
        }
      : null,
  }
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  const rows = await tryPrisma(
    p =>
      p.eventQuantity.findMany({
        where: { eventId: id },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          eventId: true,
          payItemId: true,
          quantity: true,
          stationFrom: true,
          stationTo: true,
          notes: true,
          payItem: { select: { id: true, number: true, description: true, unit: true } },
        },
      }),
    [] as any[],
  )

  return NextResponse.json({ items: rows.map(formatRow) })
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await ctx.params

  let body: any = null
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const lines = Array.isArray(body?.lines) ? body.lines : null
  if (!lines) {
    return NextResponse.json({ error: 'lines array required' }, { status: 400 })
  }

  if (lines.length > 200) {
    return NextResponse.json({ error: 'too many lines (max 200)' }, { status: 400 })
  }

  const parsed: QuantityLine[] = []
  const errors: Array<{ index: number; reason: string }> = []
  const payItemIds = new Set<string>()

  lines.forEach((line: any, index: number) => {
    const payItemId = normalizeText(line?.payItemId)
    if (!payItemId) {
      errors.push({ index, reason: 'payItemId required' })
      return
    }

    const qtyResult = parseQuantity(line?.quantity)
    if (!qtyResult.ok) {
      errors.push({ index, reason: qtyResult.error })
      return
    }

    const stationFrom = optionalText(line?.stationFrom)
    const stationTo = optionalText(line?.stationTo)
    const notes = optionalText(line?.notes)

    parsed.push({
      payItemId,
      quantity: qtyResult.value,
      stationFrom,
      stationTo,
      notes,
    })
    payItemIds.add(payItemId)
  })

  if (errors.length) {
    return NextResponse.json({ error: 'validation failed', details: errors }, { status: 400 })
  }

  try {
    const result = await tryPrisma(
      async p => {
        const event = await p.event.findUnique({ where: { id: eventId }, select: { id: true } })
        if (!event) {
          throw Object.assign(new Error('Event not found'), { status: 404 })
        }

        const payItems = await p.payItem.findMany({
          where: { id: { in: Array.from(payItemIds) } },
          select: { id: true },
        })
        const foundIds = new Set(payItems.map((item: { id: string }) => item.id))
        const missing = Array.from(payItemIds).filter(id => !foundIds.has(id))
        if (missing.length) {
          throw Object.assign(new Error('One or more pay items not found'), {
            status: 404,
            missing,
          })
        }

        await p.$transaction(async (tx: any) => {
          await tx.eventQuantity.deleteMany({ where: { eventId } })
          if (!parsed.length) return
          for (const line of parsed) {
            await tx.eventQuantity.create({
              data: {
                eventId,
                payItemId: line.payItemId,
                quantity: line.quantity,
                stationFrom: line.stationFrom,
                stationTo: line.stationTo,
                notes: line.notes,
              },
            })
          }
        })

        const total = parsed.reduce((acc, line) => acc.add(line.quantity), new Prisma.Decimal(0))

        return { count: parsed.length, total: decimalToString(total) }
      },
      null as any,
    )

    if (!result) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    const rows = await tryPrisma(
      p =>
        p.eventQuantity.findMany({
          where: { eventId },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          select: {
            id: true,
            eventId: true,
            payItemId: true,
            quantity: true,
            stationFrom: true,
            stationTo: true,
            notes: true,
            payItem: { select: { id: true, number: true, description: true, unit: true } },
          },
        }),
      [] as any[],
    )

    return NextResponse.json({
      count: result.count,
      total: result.total,
      hasQuantities: rows.length > 0,
      items: rows.map(formatRow),
    })
  } catch (error: any) {
    const status = Number(error?.status) || 500
    if (status === 404) {
      if (Array.isArray(error?.missing) && error.missing.length) {
        return NextResponse.json(
          { error: 'Some pay items not found', missing: error.missing },
          { status },
        )
      }
      return NextResponse.json({ error: 'Event not found' }, { status })
    }
    const msg = String(error?.message ?? 'Failed to save quantities')
    return NextResponse.json({ error: msg }, { status })
  }
}
