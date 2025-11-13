import Link from 'next/link'

import { getBaseUrl } from '@/lib/base-url'

async function getChangeOrder(id: string) {
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/api/change-orders/${id}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Not found')
  return res.json()
}

export default async function ChangeOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const changeOrder = await getChangeOrder(id)

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{changeOrder.number}</h1>
        <div className="flex gap-2">
          <Link className="rounded bg-zinc-900 px-3 py-2 text-sm text-white" href={`/change-orders/${changeOrder.id}/edit`}>
            Edit
          </Link>
          <a
            className="rounded bg-indigo-600 px-3 py-2 text-sm text-white"
            href={`/api/change-orders/${changeOrder.id}/pdf`}
            rel="noreferrer"
            target="_blank"
          >
            PDF
          </a>
        </div>
      </div>
      <div className="rounded border p-3">
        <div className="text-sm text-zinc-500">Reason</div>
        <div>{changeOrder.reason || '-'}</div>
      </div>
    </div>
  )
}
