import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { EstimateCreateInput, EstimateQuery } from '@/lib/dto'
import { nextEstimateNumber } from '@/lib/docNumbers'
import { recomputeFromLines } from '@/lib/calc'
import { emitChange } from '@/lib/notifications'

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

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const parsed = EstimateQuery.safeParse({
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
  if (customerId) where.customerId = customerId
  if (projectId) where.projectId = projectId
  if (status) where.status = status
  if (q) {
    where.OR = [
      { number: { contains: q, mode: 'insensitive' } },
      { shortDesc: { contains: q, mode: 'insensitive' } },
      { notes: { contains: q, mode: 'insensitive' } },
    ]
  }

  const [items, total] = await prisma.$transaction([
    prisma.estimate.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        number: true,
        status: true,
        date: true,
        customerId: true,
        projectId: true,
        shortDesc: true,
        totalCents: true,
        updatedAt: true,
      },
    }),
    prisma.estimate.count({ where }),
  ])

  return NextResponse.json({ items, total, page, pageSize })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = EstimateCreateInput.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
  }

  const dto = parsed.data
  const requestedCustomerId = normalizeId(dto.customerId)
  const requestedProjectId = normalizeNullableId(dto.projectId)

  let projectCustomerId: string | undefined
  if (requestedProjectId) {
    const project = await prisma.project.findUnique({
      where: { id: requestedProjectId },
      select: { id: true, customerId: true },
    })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 400 })
    }
    projectCustomerId = project.customerId
  }

  let customerId = requestedCustomerId ?? projectCustomerId
  if (!customerId) {
    const candidates = await prisma.customer.findMany({
      select: { id: true },
      orderBy: { createdAt: 'asc' },
      take: 2,
    })
    if (candidates.length === 1) {
      customerId = candidates[0].id
    }
  }
  if (!customerId) {
    return NextResponse.json(
      { error: 'customerId is required when no projectId is provided.' },
      { status: 400 },
    )
  }

  if (!projectCustomerId) {
    const customerExists = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    })
    if (!customerExists) {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 400 })
    }
  } else if (requestedCustomerId && requestedCustomerId !== projectCustomerId) {
    return NextResponse.json(
      { error: 'The selected project belongs to a different customer.' },
      { status: 400 },
    )
  }

  const number = await nextEstimateNumber()
  const { lineTotals, subtotalCents, totalCents } = recomputeFromLines(dto.lineItems, dto.discountCents, dto.taxCents)

  const created = await prisma.estimate.create({
    data: {
      number,
      status: 'DRAFT',
      date: new Date(dto.date as any),
      customerId,
      projectId: requestedProjectId ?? null,
      attention: dto.attention ?? null,
      shortDesc: dto.shortDesc ?? null,
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
    select: { id: true, number: true, projectId: true, customerId: true },
  })

  await emitChange({
    type: 'estimate.created',
    id: created.id,
    projectId: created.projectId,
    customerId: created.customerId,
    number: created.number,
  })

  return NextResponse.json(created, { status: 201 })
}
