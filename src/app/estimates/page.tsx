// Removed module; redirect to 404
import { notFound } from "next/navigation";
export default function Page() {
  notFound();
}
import Link from 'next/link'

import { getBaseUrl } from '@/lib/base-url'

type SearchParams = Record<string, string | string[] | undefined>

async function fetchData(searchParams: SearchParams) {
  const baseUrl = getBaseUrl()
  const qs = new URLSearchParams()
  const query = typeof searchParams.q === 'string' ? searchParams.q : Array.isArray(searchParams.q) ? searchParams.q[0] : undefined
  if (query) qs.set('q', query)
  const pageParam = typeof searchParams.page === 'string' ? searchParams.page : Array.isArray(searchParams.page) ? searchParams.page[0] : undefined
  qs.set('page', String(pageParam || 1))
  qs.set('pageSize', '20')

  const res = await fetch(`${baseUrl}/api/estimates?${qs.toString()}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to load estimates')
  return res.json()
}

export default async function EstimatesIndex({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const resolvedSearchParams = await searchParams
  const data = await fetchData(resolvedSearchParams)
  const items: any[] = data.items ?? []
  const { page, total } = data

  const currentQuery =
    typeof resolvedSearchParams.q === 'string'
      ? resolvedSearchParams.q
      : Array.isArray(resolvedSearchParams.q)
        ? resolvedSearchParams.q[0]
        : ''

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <form className="flex gap-2">
          <input className="rounded border px-2 py-1" defaultValue={currentQuery} name="q" placeholder="Search..." />
          <button className="rounded bg-zinc-900 px-3 text-sm text-white">Go</button>
        </form>
        <Link className="rounded bg-emerald-600 px-3 py-2 text-sm text-white" href="/estimates/new">
          New Estimate
        </Link>
      </div>

      <div className="overflow-hidden rounded border">
        <div className="grid grid-cols-6 bg-zinc-100 p-2 text-xs font-medium dark:bg-zinc-900">
          <div>Number</div>
          <div>Status</div>
          <div>Date</div>
          <div className="col-span-2">Description</div>
          <div className="text-right">Total</div>
        </div>
        {items.map((item: any) => (
          <Link
            key={item.id}
            className="grid grid-cols-6 border-t p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
            href={`/estimates/${item.id}`}
          >
            <div>{item.number}</div>
            <div>{item.status}</div>
            <div>{new Date(item.date).toLocaleDateString()}</div>
            <div className="col-span-2">{item.shortDesc || '-'}</div>
            <div className="text-right">
              {(item.totalCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </div>
          </Link>
        ))}
      </div>

      <div className="text-sm text-zinc-500">Page {page} • {total} total</div>
    </div>
  )
}
