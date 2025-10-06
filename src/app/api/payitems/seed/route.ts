// src/app/api/payitems/seed/route.ts
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { tryPrisma } from '@/lib/dbSafe'

const DEFAULT_ITEMS = [
  { number: '620-00001', description: 'Guardrail, Steel, Standard', unit: 'LF' },
  { number: '620-00025', description: 'Guardrail Transition Section', unit: 'EA' },
  { number: '521-00001', description: 'Handrail, Aluminum', unit: 'LF' },
  { number: '700-00001', description: 'Signs, Single Post', unit: 'EA' },
]

export async function POST() {
  try {
    const result = await tryPrisma(
      async p => {
        let created = 0
        let updated = 0

        await p.$transaction(async (tx: any) => {
          for (const item of DEFAULT_ITEMS) {
            const existing = await tx.payItem.findFirst({
              where: { number: { equals: item.number, mode: 'insensitive' } },
              select: { id: true, description: true, unit: true },
            })

            if (existing) {
              if (existing.description !== item.description || existing.unit !== item.unit) {
                await tx.payItem.update({
                  where: { id: existing.id },
                  data: { description: item.description, unit: item.unit },
                })
                updated += 1
              }
            } else {
              await tx.payItem.create({ data: item })
              created += 1
            }
          }
        })

        return { created, updated }
      },
      null as any,
    )

    if (!result) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    return NextResponse.json({ created: result.created, updated: result.updated, total: DEFAULT_ITEMS.length })
  } catch (error: any) {
    const msg = String(error?.message ?? 'Failed to seed pay items')
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
