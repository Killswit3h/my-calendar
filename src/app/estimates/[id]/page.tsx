import Link from 'next/link'

import { getBaseUrl } from '@/lib/base-url'

async function getEstimate(id: string) {
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/api/estimates/${id}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Not found')
  return res.json()
}

export default async function EstimateDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const estimate = await getEstimate(id)

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{estimate.number}</h1>
        <div className="flex gap-2">
          <Link className="rounded bg-zinc-900 px-3 py-2 text-sm text-white" href={`/estimates/${estimate.id}/edit`}>
            Edit
          </Link>
          <a
            className="rounded bg-indigo-600 px-3 py-2 text-sm text-white"
            href={`/api/estimates/${estimate.id}/pdf`}
            rel="noreferrer"
            target="_blank"
          >
            PDF
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-2">
          <div className="rounded border p-3">
            <div className="text-sm text-zinc-500">Project</div>
            <div>{estimate.project?.name || estimate.projectId || '-'}</div>
          </div>
          <div className="rounded border p-3">
            <div className="text-sm text-zinc-500">Description</div>
            <div>{estimate.shortDesc || '-'}</div>
          </div>
          <div className="overflow-hidden rounded border">
            <div className="grid grid-cols-6 bg-zinc-100 p-2 text-xs font-medium dark:bg-zinc-900">
              <div className="col-span-3">Item Description</div>
              <div>Qty</div>
              <div>U/M</div>
              <div className="text-right">Total</div>
            </div>
            {estimate.lineItems.map((line: any) => (
              <div key={line.id} className="grid grid-cols-6 border-t p-2">
                <div className="col-span-3">
                  <div>{line.description}</div>
                  {line.note ? <div className="text-xs text-zinc-500">{line.note}</div> : null}
                </div>
                <div>{String(line.qty)}</div>
                <div>{line.uom}</div>
                <div className="text-right">
                  {(line.totalCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <div className="rounded border p-3">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>
                {(estimate.subtotalCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Discount</span>
              <span>
                {(estimate.discountCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>
                {(estimate.taxCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>
                {(estimate.totalCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </span>
            </div>
          </div>
          <div className="rounded border p-3">
            <div className="text-sm text-zinc-500">Terms</div>
            <div className="whitespace-pre-line text-sm">{estimate.terms || '-'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
