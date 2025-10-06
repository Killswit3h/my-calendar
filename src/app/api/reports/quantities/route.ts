// src/app/api/reports/quantities/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { tryPrisma } from '@/lib/dbSafe'

const DAY_MS = 86_400_000

function parseDate(value: string | null): Date | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) return null
  return date
}

function decimalToString(value: Prisma.Decimal): string {
  return value.toFixed(6).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1')
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const fromRaw = sp.get('from')
  const toRaw = sp.get('to')
  const calendarId = sp.get('calendarId')?.trim() || null
  const customerRaw = sp.get('customer')?.trim() || ''

  const from = parseDate(fromRaw)
  const to = parseDate(toRaw)

  if (!from || !to) {
    return NextResponse.json({ error: 'from and to parameters required' }, { status: 400 })
  }

  if (to.getTime() < from.getTime()) {
    return NextResponse.json({ error: 'to must be after from' }, { status: 400 })
  }

  const toExclusive = new Date(to.getTime() + DAY_MS)

  const where: any = {
    event: {
      startsAt: { gte: from, lt: toExclusive },
    },
  }

  if (calendarId) {
    where.event.calendarId = calendarId
  }

  if (customerRaw) {
    where.event.title = { contains: customerRaw, mode: 'insensitive' }
  }

  const rows = await tryPrisma(
    p =>
      p.eventQuantity.findMany({
        where,
        orderBy: [{ event: { startsAt: 'asc' } }, { payItem: { number: 'asc' } }],
        select: {
          id: true,
          quantity: true,
          stationFrom: true,
          stationTo: true,
          notes: true,
          event: { select: { id: true, startsAt: true, title: true, calendarId: true } },
          payItem: { select: { id: true, number: true, description: true, unit: true } },
        },
      }),
    [] as any[],
  )

  const startMs = from.getTime()
  const endMs = toExclusive.getTime()
  const customerNeedle = customerRaw.toLowerCase()

  const filtered = rows.filter((row: any) => {
    const eventStart = row.event?.startsAt ? new Date(row.event.startsAt).getTime() : NaN
    if (!Number.isFinite(eventStart)) return false
    if (eventStart < startMs || eventStart >= endMs) return false
    if (calendarId && row.event?.calendarId !== calendarId) return false
    if (customerNeedle) {
      const title = String(row.event?.title ?? '').toLowerCase()
      if (!title.includes(customerNeedle)) return false
    }
    return true
  })

  const data = filtered.map((row: any) => ({
    eventId: row.event?.id ?? '',
    eventDate: row.event?.startsAt ? new Date(row.event.startsAt).toISOString() : '',
    eventTitle: row.event?.title ?? '',
    calendarId: row.event?.calendarId ?? '',
    payItemId: row.payItem?.id ?? '',
    payItemNumber: row.payItem?.number ?? '',
    payItemDescription: row.payItem?.description ?? '',
    unit: row.payItem?.unit ?? '',
    quantity: decimalToString(row.quantity instanceof Prisma.Decimal ? row.quantity : new Prisma.Decimal(row.quantity ?? 0)),
    stationFrom: row.stationFrom ?? null,
    stationTo: row.stationTo ?? null,
    notes: row.notes ?? null,
  }))

  return NextResponse.json({ rows: data, count: data.length })
}
