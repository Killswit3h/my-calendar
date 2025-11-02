import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getPrisma } from '@/lib/db'

const createSchema = z.object({
  project: z.string().min(1),
  title: z.string().min(1),
  amount: z.number().optional().nullable(),
  status: z.string().min(1),
  submittedAt: z.string().optional().nullable(),
})

export const runtime = 'nodejs'
export const revalidate = 0

export async function GET() {
  const prisma = await getPrisma()
  const items = await prisma.changeOrder.findMany({ orderBy: { createdAt: 'desc' }, take: 50 })
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  try {
    const body = createSchema.parse(await req.json())
    const prisma = await getPrisma()
    const created = await prisma.changeOrder.create({
      data: {
        id: randomUUID(),
        project: body.project,
        title: body.title,
        amount: body.amount ?? null,
        status: body.status,
        submittedAt: body.submittedAt ? new Date(body.submittedAt) : null,
      },
    })
    return NextResponse.json({ item: created }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', issues: error.issues }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Unable to create change order' }, { status: 500 })
  }
}
