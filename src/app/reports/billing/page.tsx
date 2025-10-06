'use client'

import { useCallback, useMemo, useState } from 'react'
import { Toast } from '@/components/Toast'

type ReportRow = {
  eventId: string
  eventDate: string
  eventTitle: string
  calendarId: string
  payItemNumber: string
  payItemDescription: string
  unit: string
  quantity: string
  stationFrom: string | null
  stationTo: string | null
  notes: string | null
}

function formatDate(dateIso: string): string {
  if (!dateIso) return ''
  const d = new Date(dateIso)
  if (Number.isNaN(d.getTime())) return dateIso
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function buildCsv(rows: ReportRow[]): string {
  const headers = ['eventId', 'eventDate', 'eventTitle', 'payItemNumber', 'payItemDescription', 'unit', 'quantity', 'stationFrom', 'stationTo', 'notes', 'calendarId']
  const lines = [headers.join(',')]
  for (const row of rows) {
    const values = [
      row.eventId,
      new Date(row.eventDate).toISOString(),
      row.eventTitle,
      row.payItemNumber,
      row.payItemDescription,
      row.unit,
      row.quantity,
      row.stationFrom ?? '',
      row.stationTo ?? '',
      row.notes ?? '',
      row.calendarId ?? '',
    ]
    lines.push(values.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
  }
  return lines.join('\n')
}

export default function BillingReportPage() {
  const [form, setForm] = useState({ from: '', to: '', customer: '', calendarId: '' })
  const [data, setData] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ open: boolean; message: string }>({ open: false, message: '' })

  const showToast = useCallback((message: string) => setToast({ open: true, message }), [])
  const closeToast = useCallback(() => setToast({ open: false, message: '' }), [])

  const runReport = useCallback(async () => {
    if (!form.from || !form.to) {
      showToast('From and To dates are required')
      return
    }
    setLoading(true)
    try {
      const url = new URL('/api/reports/quantities', window.location.origin)
      url.searchParams.set('from', form.from)
      url.searchParams.set('to', form.to)
      if (form.customer.trim()) url.searchParams.set('customer', form.customer.trim())
      if (form.calendarId.trim()) url.searchParams.set('calendarId', form.calendarId.trim())
      const res = await fetch(url.toString(), { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        showToast(json.error || 'Failed to load report')
        return
      }
      const rows: ReportRow[] = Array.isArray(json.rows) ? json.rows : []
      setData(rows)
      showToast(`Loaded ${rows.length} rows`)
    } catch (err) {
      console.error(err)
      showToast('Failed to load report')
    } finally {
      setLoading(false)
    }
  }, [form, showToast])

  const handleExport = useCallback(() => {
    if (!data.length) return
    const csv = buildCsv(data)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const fromSafe = form.from || 'start'
    const toSafe = form.to || 'end'
    a.download = `billing-report-${fromSafe}-to-${toSafe}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [data, form.from, form.to])

  const totalQuantity = useMemo(() => {
    return data.reduce((sum, row) => sum + Number.parseFloat(row.quantity || '0'), 0)
  }, [data])

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <Toast message={toast.message} open={toast.open} onClose={closeToast} />
      <h1 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>Billing Cutoff Report</h1>

      <section style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>Filters</h2>
        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span>From date</span>
            <input type="date" value={form.from} onChange={e => setForm(prev => ({ ...prev, from: e.target.value }))} />
          </label>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span>To date</span>
            <input type="date" value={form.to} onChange={e => setForm(prev => ({ ...prev, to: e.target.value }))} />
          </label>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span>Customer contains</span>
            <input type="text" value={form.customer} onChange={e => setForm(prev => ({ ...prev, customer: e.target.value }))} placeholder="Optional" />
          </label>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span>Calendar ID</span>
            <input type="text" value={form.calendarId} onChange={e => setForm(prev => ({ ...prev, calendarId: e.target.value }))} placeholder="Optional" />
          </label>
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button type="button" onClick={runReport} style={{ padding: '0.6rem 1.4rem', borderRadius: '8px', border: 'none', background: '#1f7a4d', color: '#fff' }}>
            {loading ? 'Loading…' : 'Run Report'}
          </button>
          <button type="button" onClick={handleExport} disabled={!data.length} style={{ padding: '0.6rem 1.4rem', borderRadius: '8px', border: '1px solid #d1d5db', background: data.length ? '#fff' : '#f9fafb', color: data.length ? '#1f2937' : '#9ca3af' }}>
            Export CSV
          </button>
        </div>
      </section>

      <section>
        {loading ? <p>Loading report…</p> : null}
        {!loading && !data.length ? <p>No results. Adjust filters and run the report.</p> : null}
        {data.length ? (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem' }}>Date</th>
                    <th style={{ padding: '0.5rem' }}>Event</th>
                    <th style={{ padding: '0.5rem' }}>Pay Item</th>
                    <th style={{ padding: '0.5rem' }}>Description</th>
                    <th style={{ padding: '0.5rem' }}>Unit</th>
                    <th style={{ padding: '0.5rem' }}>Quantity</th>
                    <th style={{ padding: '0.5rem' }}>Station From</th>
                    <th style={{ padding: '0.5rem' }}>Station To</th>
                    <th style={{ padding: '0.5rem' }}>Notes</th>
                    <th style={{ padding: '0.5rem' }}>Calendar</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(row => (
                    <tr key={`${row.eventId}-${row.payItemNumber}-${row.eventDate}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>{formatDate(row.eventDate)}</td>
                      <td style={{ padding: '0.5rem', minWidth: '200px' }}>{row.eventTitle}</td>
                      <td style={{ padding: '0.5rem' }}>{row.payItemNumber}</td>
                      <td style={{ padding: '0.5rem', minWidth: '240px' }}>{row.payItemDescription}</td>
                      <td style={{ padding: '0.5rem' }}>{row.unit}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{Number.parseFloat(row.quantity || '0').toFixed(6).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1')}</td>
                      <td style={{ padding: '0.5rem' }}>{row.stationFrom ?? ''}</td>
                      <td style={{ padding: '0.5rem' }}>{row.stationTo ?? ''}</td>
                      <td style={{ padding: '0.5rem', minWidth: '200px' }}>{row.notes ?? ''}</td>
                      <td style={{ padding: '0.5rem' }}>{row.calendarId ?? ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ marginTop: '1rem', fontWeight: 500 }}>Total quantity: {totalQuantity.toFixed(6).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1')}</p>
          </>
        ) : null}
      </section>
    </div>
  )
}
