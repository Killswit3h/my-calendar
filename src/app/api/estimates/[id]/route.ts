import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Removed" }, { status: 404 });
}

export async function PATCH() {
  return NextResponse.json({ error: "Removed" }, { status: 404 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Removed" }, { status: 404 });
}
import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { EstimateUpdateInput } from '@/lib/dto'
import { lineTotalCents, recomputeFromLines } from '@/lib/calc'

const normalizeId = (value?: string | null) => {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length ? trimmed : undefined
}

const normalizeNullableId = (value?: string | null) => {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const estimate = await prisma.estimate.findUnique({
    where: { id },
    include: {
      lineItems: { orderBy: { sort: 'asc' } },
    },
  })
  if (!estimate) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(estimate)
}

const lineTotalFallback = (line: { qty: string | number; rateCents: number }) =>
  lineTotalCents(line.qty, line.rateCents)

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = EstimateUpdateInput.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
  }

  const existing = await prisma.estimate.findUnique({
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
    if (dto.lineItems) {
      recomputedLineTotals = lineTotals
    }
  }

  const updateData: any = {
    ...(dto.date !== undefined ? { date: new Date(dto.date as any) } : {}),
    ...(dto.attention !== undefined ? { attention: dto.attention ?? null } : {}),
    ...(dto.shortDesc !== undefined ? { shortDesc: dto.shortDesc ?? null } : {}),
    ...(dto.terms !== undefined ? { terms: dto.terms ?? null } : {}),
    ...(dto.notes !== undefined ? { notes: dto.notes ?? null } : {}),
    ...(dto.discountCents !== undefined ? { discountCents: dto.discountCents } : {}),
    ...(dto.taxCents !== undefined ? { taxCents: dto.taxCents } : {}),
    ...(subtotalCents !== undefined ? { subtotalCents } : {}),
    ...(totalCents !== undefined ? { totalCents } : {}),
    ...(dto.status ? { status: dto.status } : {}),
  }

  const projectIdProvided = Object.prototype.hasOwnProperty.call(dto, 'projectId')
  const requestedProjectId = projectIdProvided ? normalizeNullableId(dto.projectId) : undefined

  let projectCustomerId: string | undefined
  if (projectIdProvided) {
    if (!requestedProjectId) {
      updateData.projectId = null
    } else {
      const project = await prisma.project.findUnique({
        where: { id: requestedProjectId },
        select: { id: true, customerId: true },
      })
      if (!project) {
        return NextResponse.json({ error: 'Project not found.' }, { status: 400 })
      }
      updateData.projectId = project.id
      projectCustomerId = project.customerId
    }
  }

  const customerIdProvided = Object.prototype.hasOwnProperty.call(dto, 'customerId')
  const requestedCustomerId = customerIdProvided ? normalizeId(dto.customerId) : undefined

  if (customerIdProvided && !requestedCustomerId) {
    return NextResponse.json({ error: 'customerId cannot be blank.' }, { status: 400 })
  }

  if (requestedCustomerId) {
    const customerExists = await prisma.customer.findUnique({
      where: { id: requestedCustomerId },
      select: { id: true },
    })
    if (!customerExists) {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 400 })
    }
  }

  let customerIdToSet: string | undefined = requestedCustomerId

  if (projectCustomerId) {
    if (customerIdToSet && customerIdToSet !== projectCustomerId) {
      return NextResponse.json(
        { error: 'The selected project belongs to a different customer.' },
        { status: 400 },
      )
    }
    if (!customerIdToSet) {
      customerIdToSet = projectCustomerId
    }
  }

  if (customerIdToSet) {
    updateData.customerId = customerIdToSet
  }

  const updated = await prisma.$transaction(async tx => {
    if (dto.lineItems) {
      await tx.estimateLineItem.deleteMany({ where: { estimateId: id } })
    }
    return tx.estimate.update({
      where: { id },
      data: {
        ...updateData,
        ...(dto.lineItems
          ? {
              lineItems: {
                create: dto.lineItems.map((line, index) => ({
                  sort: line.sort,
                  description: line.description,
                  qty: String(line.qty),
                  uom: line.uom,
                  rateCents: line.rateCents,
                  totalCents: recomputedLineTotals ? recomputedLineTotals[index] : lineTotalFallback(line),
                  taxable: line.taxable ?? false,
                  note: line.note ?? null,
                })),
              },
            }
          : {}),
      },
      select: { id: true, number: true, status: true, projectId: true, customerId: true },
    })
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const existing = await prisma.estimate.findUnique({
    where: { id },
    select: { id: true, number: true, projectId: true, customerId: true },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.$transaction([
    prisma.estimateLineItem.deleteMany({ where: { estimateId: id } }),
    prisma.estimate.delete({ where: { id } }),
  ])

  return NextResponse.json({ ok: true })
}
