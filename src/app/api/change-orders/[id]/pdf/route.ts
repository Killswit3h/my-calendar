import { NextRequest, NextResponse } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'

import { prisma } from '@/lib/db'
import { ChangeOrderPDF } from '@/server/pdf/renderChangeOrder'

export async function GET(_req: NextRequest, context: any) {
  const { id } = context?.params ?? {}
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }
  const changeOrder = await prisma.changeOrder.findUnique({
    where: { id },
    include: {
      project: { select: { name: true } },
      baseEstimate: { select: { number: true } },
      lineItems: {
        orderBy: { sort: 'asc' },
        select: {
          description: true,
          qty: true,
          uom: true,
          rateCents: true,
          totalCents: true,
          note: true,
        },
      },
    },
  })

  if (!changeOrder) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const pdfData = {
    number: changeOrder.number,
    date: changeOrder.date,
    project: changeOrder.project?.name ?? '',
    baseEstimate: changeOrder.baseEstimate?.number ?? null,
    reason: changeOrder.reason,
    terms: changeOrder.terms,
    notes: changeOrder.notes,
    subtotalCents: changeOrder.subtotalCents,
    discountCents: changeOrder.discountCents,
    taxCents: changeOrder.taxCents,
    totalCents: changeOrder.totalCents,
    lineItems: changeOrder.lineItems.map((line) => ({
      description: line.description,
      qty: String(line.qty),
      uom: line.uom,
      rateCents: line.rateCents,
      totalCents: line.totalCents,
      note: line.note,
    })),
  }

  const doc = ChangeOrderPDF({ data: pdfData })

  const stream = await renderToStream(doc)

  return new NextResponse(stream as any, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${changeOrder.number}.pdf"`,
    },
  })
}
