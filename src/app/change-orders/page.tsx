import Link from 'next/link'

import { getBaseUrl } from '@/lib/base-url'

async function fetchData() {
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/api/change-orders?page=1&pageSize=20`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to load change orders')
  return res.json()
}

export default async function ChangeOrdersIndex() {
  const data = await fetchData()
  const items: any[] = data.items ?? []

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Change Orders</h1>
      </div>
      <div className="overflow-hidden rounded border">
        <div className="grid grid-cols-5 bg-zinc-100 p-2 text-xs font-medium dark:bg-zinc-900">
          <div>Number</div>
          <div>Status</div>
          <div>Date</div>
          <div>Reason</div>
          <div className="text-right">Total</div>
        </div>
        {items.map((item: any) => (
          <Link
            key={item.id}
            className="grid grid-cols-5 border-t p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
            href={`/change-orders/${item.id}`}
          >
            <div>{item.number}</div>
            <div>{item.status}</div>
            <div>{new Date(item.date).toLocaleDateString()}</div>
            <div>{item.reason || '-'}</div>
            <div className="text-right">
              {(item.totalCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
