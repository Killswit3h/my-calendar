import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getPrisma } from '@/lib/db'

const createSchema = z.object({
  poNumber: z.string().min(1),
  project: z.string().min(1),
  vendor: z.string().min(1),
  status: z.string().min(1),
  expectedOn: z.string().optional().nullable(),
})

export const runtime = 'nodejs'
export const revalidate = 0

export async function GET() {
  const prisma = await getPrisma()
  const items = await prisma.purchaseOrder.findMany({ orderBy: { createdAt: 'desc' }, take: 50 })
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  try {
    const body = createSchema.parse(await req.json())
    const prisma = await getPrisma()
    const created = await prisma.purchaseOrder.create({
      data: {
        poNumber: body.poNumber,
        project: body.project,
        vendor: body.vendor,
        status: body.status,
        expectedOn: body.expectedOn ? new Date(body.expectedOn) : null,
      },
    })
    return NextResponse.json({ item: created }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', issues: error.issues }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Unable to create purchase order' }, { status: 500 })
  }
}
