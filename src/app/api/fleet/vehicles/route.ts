import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getPrisma } from '@/lib/db'

const createSchema = z.object({
  unit: z.string().min(1),
  status: z.string().min(1),
  location: z.string().optional().nullable(),
  nextServiceOn: z.string().optional().nullable(),
})

export const runtime = 'nodejs'
export const revalidate = 0

export async function GET() {
  const prisma = await getPrisma()
  const items = await prisma.vehicle.findMany({ orderBy: { unit: 'asc' }, take: 100 })
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  try {
    const body = createSchema.parse(await req.json())
    const prisma = await getPrisma()
    const created = await prisma.vehicle.create({
      data: {
        unit: body.unit,
        status: body.status,
        location: body.location ?? null,
        nextServiceOn: body.nextServiceOn ? new Date(body.nextServiceOn) : null,
      },
    })
    return NextResponse.json({ item: created }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', issues: error.issues }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Unable to create vehicle' }, { status: 500 })
  }
}
