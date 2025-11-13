import { NextRequest, NextResponse } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'

import { prisma } from '@/lib/db'
import { EstimatePDF } from '@/server/pdf/renderEstimate'

const companyFooter = {
  address: '1091 E 26th St, Hialeah, FL 33013',
  phones: ['Office: 786-318-0880', 'Contact: 786-484-4657'],
  emails: ['info@guaranteedfence.net'],
  footerNotes: [
    'Quotation forms part of subcontract and supersedes conflicting terms.',
    'Surety bond is excluded; add 2.5% if required.',
    'Pricing valid for 15 days due to steel volatility.',
    'Excludes MOT, excavation, grading, asphalt around posts, grounding, clearing, or grubbing.',
    'Soft digs, engineering calculations, shop drawings, and permits excluded unless noted.',
    'Salvage rights for removed steel/aluminum remain with contractor unless stated otherwise.',
  ],
  badges: ['FDOT DBE CERTIFIED'],
}

export async function GET(_req: NextRequest, context: any) {
  const { id } = context?.params ?? {}
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }
  const estimate = await prisma.estimate.findUnique({
    where: { id },
    include: {
      customer: { select: { name: true } },
      project: { select: { name: true, customer: { select: { name: true } } } },
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

  if (!estimate) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const companyName = estimate.customer?.name ?? estimate.project?.customer?.name ?? 'Company'

  const pdfData = {
    number: estimate.number,
    date: estimate.date,
    companyName,
    attention: estimate.attention,
    project: estimate.project?.name ?? null,
    shortDesc: estimate.shortDesc,
    terms: estimate.terms,
    notes: estimate.notes,
    subtotalCents: estimate.subtotalCents,
    discountCents: estimate.discountCents,
    taxCents: estimate.taxCents,
    totalCents: estimate.totalCents,
    lineItems: estimate.lineItems.map((line) => ({
      description: line.description,
      qty: String(line.qty),
      uom: line.uom,
      rateCents: line.rateCents,
      totalCents: line.totalCents,
      note: line.note,
    })),
    companyBlock: {
      name: companyName,
      ...companyFooter,
    },
  }

  const doc = EstimatePDF({ data: pdfData })

  const stream = await renderToStream(doc)

  return new NextResponse(stream as any, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${estimate.number}.pdf"`,
    },
  })
}
