// src/app/api/customers/prefill/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import customers from '@/data/customers.json'
import { getPrisma } from '@/lib/db'
import { normalizeCustomerName } from '@/lib/customers'

export async function POST() {
  const names = Array.isArray(customers) ? (customers as string[]) : []
  const p = await getPrisma()

  let inserted = 0
  let skipped = 0

  for (const raw of names) {
    const { display } = normalizeCustomerName(String(raw || ''))
    if (!display) { skipped++; continue }
    const existing = await p.customer.findFirst({
      where: { name: { equals: display, mode: 'insensitive' } },
      select: { id: true },
    })
    if (existing) { skipped++; continue }
    await p.customer.create({ data: { id: randomUUID(), name: display, updatedAt: new Date() } })
    inserted++
  }

  return NextResponse.json({ ok: true, inserted, skipped, total: names.length })
}
