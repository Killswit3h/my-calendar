'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { FileText } from 'lucide-react'

export type ReportFileItem = {
  id: string
  kind: 'DAILY_PDF' | 'DAILY_XLSX'
  reportDate?: string | null
  vendor?: string | null
  blobUrl: string
  createdAt: string
}

type ResponseShape = {
  items: ReportFileItem[]
}

async function fetchDaily(): Promise<ReportFileItem[]> {
  const response = await fetch('/api/reports/list?kind=DAILY_PDF')
  if (!response.ok) return []
  const data: ResponseShape = await response.json()
  return data.items ?? []
}

export function DailyAutoReports() {
  const [items, setItems] = useState<ReportFileItem[]>([])

  useEffect(() => {
    void fetchDaily().then(setItems).catch(() => setItems([]))
  }, [])

  const grouped = useMemo(() => {
    const map = new Map<string, { date: string; vendor?: string | null; pdf?: ReportFileItem; xlsx?: ReportFileItem }>()
    for (const item of items) {
      const key = `${item.reportDate ?? ''}|${item.vendor ?? ''}`
      const entry = map.get(key) ?? { date: item.reportDate ?? '', vendor: item.vendor }
      if (item.kind === 'DAILY_PDF') entry.pdf = item
      if (item.kind === 'DAILY_XLSX') entry.xlsx = item
      map.set(key, entry)
    }
    return Array.from(map.values()).slice(0, 14)
  }, [items])

  if (!grouped.length) return <EmptyDailyPlaceholder />

  return (
    <div className="grid gap-3">
      {grouped.map(entry => (
        <div
          key={`${entry.date}-${entry.vendor ?? 'na'}`}
          className="flex items-center justify-between rounded-2xl border border-border bg-surface-soft px-5 py-4 text-sm shadow-inner"
        >
          <div>
            <p className="text-base font-semibold text-foreground">{entry.date?.slice(0, 10) || '—'}</p>
            <p className="text-xs text-muted">{entry.vendor || 'All vendors'}</p>
          </div>
          <div className="flex gap-2">
            {entry.pdf ? (
              <Link href={entry.pdf.blobUrl} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground transition hover:bg-accent-50">
                <FileText className="h-3.5 w-3.5" /> PDF
              </Link>
            ) : null}
            {entry.xlsx ? (
              <Link href={entry.xlsx.blobUrl} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground transition hover:bg-accent-50">
                XLSX
              </Link>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyDailyPlaceholder() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center text-sm text-muted">
      Daily reports will appear here after the first automated run.
    </div>
  )
}
