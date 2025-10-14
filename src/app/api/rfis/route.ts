import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { getPrisma } from '@/lib/db'

const createSchema = z.object({
  project: z.string().min(1),
  subject: z.string().min(1),
  assignedTo: z.string().optional().nullable(),
  status: z.string().min(1),
  dueDate: z.string().optional().nullable(),
})

export const runtime = 'nodejs'
export const revalidate = 0

export async function GET() {
  const prisma = await getPrisma()
  const items = await prisma.rfi.findMany({ orderBy: { createdAt: 'desc' }, take: 50 })
  return NextResponse.json({ items })
}

export async function POST(req: NextRequest) {
  try {
    const body = createSchema.parse(await req.json())
    const prisma = await getPrisma()
    const created = await prisma.rfi.create({
      data: {
        project: body.project,
        subject: body.subject,
        assignedTo: body.assignedTo ?? null,
        status: body.status,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      },
    })
    return NextResponse.json({ item: created }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', issues: error.issues }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Unable to create RFI' }, { status: 500 })
  }
}
