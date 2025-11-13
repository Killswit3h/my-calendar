import PdfPreview from '@/app/(components)/estimates/PdfPreview'

import { getBaseUrl } from '@/lib/base-url'

async function getChangeOrder(id: string) {
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/api/change-orders/${id}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Not found')
  return res.json()
}

export default async function EditChangeOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const changeOrder = await getChangeOrder(id)

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Edit Change Order</h1>
        <a
          className="rounded bg-indigo-600 px-3 py-2 text-sm text-white"
          href={`/api/change-orders/${changeOrder.id}/pdf`}
          rel="noreferrer"
          target="_blank"
        >
          PDF
        </a>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-2 rounded border p-3">
          <div>CO Number: {changeOrder.number}</div>
          <div>Project: {changeOrder.project?.name || changeOrder.projectId}</div>
          <div>Base Estimate: {changeOrder.baseEstimate?.number || '-'}</div>
          <div>Reason: {changeOrder.reason || '-'}</div>
          <div className="border-t pt-2">
            <div className="mb-1 text-sm text-zinc-500">Lines</div>
            {changeOrder.lineItems.map((line: any) => (
              <div key={line.id} className="flex justify-between border-b py-1">
                <div className="w-2/3">{line.description}</div>
                <div className="w-1/3 text-right">
                  {(line.totalCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </div>
              </div>
            ))}
          </div>
        </div>
        <PdfPreview id={id} kind="changeOrder" />
      </div>
    </div>
  )
}
