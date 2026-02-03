import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { ChangeOrderCreateInput, ChangeOrderQuery } from '@/lib/dto'
import { nextChangeOrderNumber } from '@/lib/docNumbers'
import { recomputeFromLines } from '@/lib/calc'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const parsed = ChangeOrderQuery.safeParse({
    customerId: url.searchParams.get('customerId') || undefined,
    projectId: url.searchParams.get('projectId') || undefined,
    status: url.searchParams.get('status') || undefined,
    q: url.searchParams.get('q') || undefined,
    page: url.searchParams.get('page') || undefined,
    pageSize: url.searchParams.get('pageSize') || undefined,
  })
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
  }
  const { customerId, projectId, status, q, page, pageSize } = parsed.data
  const where: any = {}
  if (projectId) where.projectId = projectId
  if (status) where.status = status
  if (q) {
    where.OR = [
      { number: { contains: q, mode: 'insensitive' } },
      { reason: { contains: q, mode: 'insensitive' } },
      { notes: { contains: q, mode: 'insensitive' } },
    ]
  }
  if (customerId) {
    where.project = { customerId }
  }

  const [items, total] = await prisma.$transaction([
    prisma.changeOrder.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        number: true,
        status: true,
        date: true,
        projectId: true,
        baseEstimateId: true,
        reason: true,
        totalCents: true,
        updatedAt: true,
      },
    }),
    prisma.changeOrder.count({ where }),
  ])

  return NextResponse.json({ items, total, page, pageSize })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = ChangeOrderCreateInput.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
  }

  const dto = parsed.data
  const number = await nextChangeOrderNumber()
  const { lineTotals, subtotalCents, totalCents } = recomputeFromLines(dto.lineItems, dto.discountCents, dto.taxCents)

  const created = await prisma.changeOrder.create({
    data: {
      number,
      status: 'DRAFT',
      date: new Date(dto.date as any),
      projectId: dto.projectId,
      baseEstimateId: dto.baseEstimateId ?? null,
      reason: dto.reason ?? null,
      terms: dto.terms ?? null,
      notes: dto.notes ?? null,
      subtotalCents,
      discountCents: dto.discountCents,
      taxCents: dto.taxCents,
      totalCents,
      lineItems: {
        create: dto.lineItems.map((line, index) => ({
          sort: line.sort,
          description: line.description,
          qty: String(line.qty),
          uom: line.uom,
          rateCents: line.rateCents,
          totalCents: lineTotals[index],
          taxable: line.taxable ?? false,
          note: line.note ?? null,
        })),
      },
    },
    select: { id: true, number: true, projectId: true },
  })

  return NextResponse.json(created, { status: 201 })
}
