'use client'

import { useState } from 'react'
import { Loader2, Send } from 'lucide-react'

import { cn } from '@/lib/theme'

export function WeeklyReportGenerator() {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [vendor, setVendor] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)

  const submit = async () => {
    if (!start || !end) {
      setError('Select both the week start and end dates')
      return
    }
    setLoading(true)
    setError(null)
    setUrl(null)
    try {
      const res = await fetch('/api/reports/weekly/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekStart: start,
          weekEnd: end,
          vendor: vendor.trim() ? vendor.trim() : undefined,
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(json?.error || json?.message || 'Failed to generate weekly report')
      }
      const pdfUrl = typeof json?.pdfUrl === 'string' ? json.pdfUrl : null
      if (!pdfUrl) {
        throw new Error('The weekly report did not return a PDF URL')
      }
      setUrl(pdfUrl)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to generate weekly report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 rounded-3xl border border-border bg-surface p-6 shadow-[0_18px_48px_rgba(12,32,21,0.14)]">
      <div>
        <h2 className="text-base font-semibold text-foreground">Generate weekly report</h2>
        <p className="text-sm text-muted">Choose the field week and optionally filter by vendor.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Week start
          <input
            type="date"
            value={start}
            onChange={event => setStart(event.target.value)}
            className="rounded-lg border border-border bg-surface-soft px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Week end
          <input
            type="date"
            value={end}
            onChange={event => setEnd(event.target.value)}
            className="rounded-lg border border-border bg-surface-soft px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          Vendor (optional)
          <input
            type="text"
            value={vendor}
            onChange={event => setVendor(event.target.value)}
            placeholder="Jorge / Tony / Chris"
            className="rounded-lg border border-border bg-surface-soft px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/40"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className={cn(
            'inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-[0_18px_38px_rgba(47,110,61,0.35)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent',
            loading && 'opacity-75',
          )}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Generate weekly PDF
        </button>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            View latest PDF
          </a>
        ) : null}
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  )
}
