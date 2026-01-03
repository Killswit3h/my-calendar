// Removed module; redirect to 404
import { notFound } from "next/navigation";
export default function Page() {
  notFound();
}
import EstimateQBForm from '@/app/(components)/estimates/EstimateQBForm'

import { getBaseUrl } from '@/lib/base-url'

async function getEstimate(id: string) {
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/api/estimates/${id}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Not found')
  const est = await res.json()
  return {
    estimateNumber: est.number as string | undefined,
    initial: {
      date: new Date(est.date).toISOString().slice(0, 10),
      customerId: est.customerId ?? '',
      projectId: est.projectId ?? null,
      attention: est.attention ?? '',
      shortDesc: est.shortDesc ?? '',
      terms: est.terms ?? '',
      notes: est.notes ?? '',
      discountCents: est.discountCents ?? 0,
      taxCents: est.taxCents ?? 0,
      lineItems: est.lineItems.map((line: any, index: number) => ({
        sort: line.sort ?? index + 1,
        description: line.description,
        qty: String(line.qty),
        uom: line.uom,
        rateCents: line.rateCents,
        taxable: line.taxable ?? false,
        note: line.note ?? '',
      })),
    },
  }
}

export default async function EditEstimatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { initial, estimateNumber } = await getEstimate(id)

  return <EstimateQBForm estimateId={id} initial={initial} estimateNumber={estimateNumber} />
}
