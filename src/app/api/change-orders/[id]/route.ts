import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { ChangeOrderUpdateInput } from '@/lib/dto'
import { recomputeFromLines, lineTotalCents } from '@/lib/calc'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const co = await prisma.changeOrder.findUnique({
    where: { id },
    include: { lineItems: { orderBy: { sort: 'asc' } } },
  })
  if (!co) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(co)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = ChangeOrderUpdateInput.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
  }

  const existing = await prisma.changeOrder.findUnique({
    where: { id },
    include: { lineItems: { orderBy: { sort: 'asc' } } },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const dto = parsed.data
  const discount = dto.discountCents ?? existing.discountCents
  const tax = dto.taxCents ?? existing.taxCents
  const targetLines = dto.lineItems ?? existing.lineItems
  const shouldRecompute = !!dto.lineItems || dto.discountCents !== undefined || dto.taxCents !== undefined

  let subtotalCents: number | undefined
  let totalCents: number | undefined
  let recomputedLineTotals: number[] | undefined

  if (shouldRecompute) {
    const { lineTotals, subtotalCents: sub, totalCents: tot } = recomputeFromLines(targetLines as any, discount, tax)
    subtotalCents = sub
    totalCents = tot
    if (dto.lineItems) recomputedLineTotals = lineTotals
  }

  const updated = await prisma.$transaction(async tx => {
    if (dto.lineItems) {
      await tx.changeOrderLineItem.deleteMany({ where: { changeOrderId: id } })
    }
    return tx.changeOrder.update({
      where: { id },
      data: {
        ...(dto.date !== undefined ? { date: new Date(dto.date as any) } : {}),
        ...(dto.projectId !== undefined ? { projectId: dto.projectId } : {}),
        ...(dto.baseEstimateId !== undefined ? { baseEstimateId: dto.baseEstimateId ?? null } : {}),
        ...(dto.reason !== undefined ? { reason: dto.reason ?? null } : {}),
        ...(dto.terms !== undefined ? { terms: dto.terms ?? null } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes ?? null } : {}),
        ...(dto.discountCents !== undefined ? { discountCents: dto.discountCents } : {}),
        ...(dto.taxCents !== undefined ? { taxCents: dto.taxCents } : {}),
        ...(subtotalCents !== undefined ? { subtotalCents } : {}),
        ...(totalCents !== undefined ? { totalCents } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.lineItems
          ? {
              lineItems: {
                create: dto.lineItems.map((line, index) => ({
                  sort: line.sort,
                  description: line.description,
                  qty: String(line.qty),
                  uom: line.uom,
                  rateCents: line.rateCents,
                  totalCents: recomputedLineTotals ? recomputedLineTotals[index] : lineTotalCents(line.qty, line.rateCents),
                  taxable: line.taxable ?? false,
                  note: line.note ?? null,
                })),
              },
            }
          : {}),
      },
      select: { id: true, number: true, status: true, projectId: true },
    })
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await prisma.changeOrder.findUnique({
    where: { id },
    select: { id: true, number: true, projectId: true },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.$transaction([
    prisma.changeOrderLineItem.deleteMany({ where: { changeOrderId: id } }),
    prisma.changeOrder.delete({ where: { id } }),
  ])

  return NextResponse.json({ ok: true })
}
