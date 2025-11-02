import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getPrisma } from '@/lib/db'

const createSchema = z.object({
  employeeName: z.string().min(1),
  certification: z.string().min(1),
  status: z.string().min(1),
  expiresOn: z.string().optional().nullable(),
})

export const runtime = 'nodejs'
export const revalidate = 0

export async function GET() {
  const prisma = await getPrisma()
  const items = await prisma.certification.findMany({ orderBy: { expiresOn: 'asc' }, take: 50 })
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  try {
    const body = createSchema.parse(await req.json())
    const prisma = await getPrisma()
    const created = await prisma.certification.create({
      data: {
        id: randomUUID(),
        employeeName: body.employeeName,
        certification: body.certification,
        status: body.status,
        expiresOn: body.expiresOn ? new Date(body.expiresOn) : null,
        updatedAt: new Date(),
      },
    })
    return NextResponse.json({ item: created }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', issues: error.issues }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Unable to create certification' }, { status: 500 })
  }
}
