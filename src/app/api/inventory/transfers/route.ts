import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getPrisma } from '@/lib/db'

const createSchema = z.object({
  itemId: z.string().min(1),
  fromLocationId: z.string().min(1),
  toLocationId: z.string().min(1),
  qty: z.number().int().positive(),
  status: z.string().min(1),
  notes: z.string().optional().nullable(),
})

export const runtime = 'nodejs'
export const revalidate = 0

export async function GET() {
  const prisma = await getPrisma()
  const items = await prisma.inventoryTransfer.findMany({
    include: {
      item: { select: { name: true } },
      fromLocation: { select: { name: true } },
      toLocation: { select: { name: true } },
    },
    orderBy: { requestedAt: 'desc' },
    take: 50,
  })
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  try {
    const body = createSchema.parse(await req.json())
    const prisma = await getPrisma()
    const created = await prisma.inventoryTransfer.create({
      data: {
        id: randomUUID(),
        itemId: body.itemId,
        fromLocationId: body.fromLocationId,
        toLocationId: body.toLocationId,
        qty: body.qty,
        status: body.status,
        notes: body.notes ?? null,
      },
      include: {
        item: { select: { name: true } },
        fromLocation: { select: { name: true } },
        toLocation: { select: { name: true } },
      },
    })
    return NextResponse.json({ item: created }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', issues: error.issues }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Unable to create transfer' }, { status: 500 })
  }
}
