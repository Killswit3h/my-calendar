'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Toast } from '@/components/Toast'

const START_OF_YEAR = '__start_of_year__'
const PAGE_SIZE = 1000

export type Cutoff = {
  id: string
  cutoffDate: string
  label: string | null
  year: number
}

export type PreviewRow = {
  jobId: string
  jobName: string
  payItem: string
  description: string
  unit: string
  quantity: number
  firstWorkDate: string
  lastWorkDate: string
}

type JobTotal = {
  jobId: string
  jobName: string
  quantity: number
}

type WindowInfo = {
  startDate: string
  endDate: string
  toCutoff: Cutoff
  previousCutoff: Cutoff | null
}

type PreviewResponse = {
  window: WindowInfo
  rows: PreviewRow[]
  totalRows: number
  page: number
  pageSize: number
  jobTotals: JobTotal[]
  grandTotal: number
}

type Props = {
  open: boolean
  onClose: () => void
}

function numberFmt(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatCutoffOption(cutoff: Cutoff): string {
  return cutoff.label ? `${cutoff.cutoffDate} (${cutoff.label})` : cutoff.cutoffDate
}

function addDays(ymd: string, days: number): string {
  const date = new Date(`${ymd}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function CutoffReportDialog({ open, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [years, setYears] = useState<number[]>([])
  const [cutoffsByYear, setCutoffsByYear] = useState<Record<number, Cutoff[]>>({})
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [fromId, setFromId] = useState<string>('')
  const [toId, setToId] = useState<string>('')
  const [preview, setPreview] = useState<PreviewResponse | null>(null)
  const [toast, setToast] = useState<{ open: boolean; message: string }>({ open: false, message: '' })
  const [page, setPage] = useState(1)

  const showToast = useCallback((message: string) => setToast({ open: true, message }), [])
  const closeToast = useCallback(() => setToast({ open: false, message: '' }), [])

  const loadCutoffs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/fdot-cutoffs', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load cut-offs')
      const json = await res.json()
      const rawYears = Array.isArray(json?.years) ? json.years : []
      const yearsList = [...new Set(rawYears.map((y: unknown) => Number(y)))]
        .filter((value): value is number => Number.isFinite(value))
        .sort((a, b) => a - b)
      const grouped: Record<number, Cutoff[]> = {}
      if (json.cutoffs && typeof json.cutoffs === 'object') {
        Object.entries(json.cutoffs).forEach(([key, value]) => {
          const year = Number(key)
          if (!Number.isFinite(year)) return
          const list: Cutoff[] = Array.isArray(value)
            ? value.map((item: any) => ({
                id: String(item.id ?? ''),
                cutoffDate: String(item.cutoffDate ?? '').slice(0, 10),
                label: item.label != null ? String(item.label) : null,
                year,
              }))
            : []
          grouped[year] = list.sort((a, b) => a.cutoffDate.localeCompare(b.cutoffDate))
        })
      }
      setYears(yearsList)
      setCutoffsByYear(grouped)
      const currentYear = new Date().getFullYear()
      const defaultYear = yearsList.includes(currentYear)
        ? currentYear
        : yearsList[yearsList.length - 1] ?? null
      setSelectedYear(prev => {
        if (prev != null && yearsList.includes(prev)) return prev
        return defaultYear ?? null
      })
    } catch (err) {
      console.error(err)
      showToast('Failed to load cut-off dates')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    if (open) {
      void loadCutoffs()
    }
  }, [open, loadCutoffs])

  useEffect(() => {
    if (!open) return
    setPreview(null)
    setPage(1)
  }, [open, selectedYear, fromId, toId])

  const currentCutoffs = useMemo(() => {
    if (selectedYear == null) return []
    return cutoffsByYear[selectedYear] ?? []
  }, [cutoffsByYear, selectedYear])

  // Establish defaults when year changes
  useEffect(() => {
    if (selectedYear == null) {
      setFromId('')
      setToId('')
      return
    }
    const list = cutoffsByYear[selectedYear] ?? []
    if (!list.length) {
      setFromId('')
      setToId('')
      return
    }
    const today = new Date().toISOString().slice(0, 10)
    let toIndex = list.findIndex(c => c.cutoffDate >= today)
    if (toIndex === -1) toIndex = list.length - 1
    if (toIndex <= 0) {
      // Either first cut-off of the year or before the first cut-off
      setFromId(START_OF_YEAR)
      setToId(list[0]!.id)
    } else {
      setFromId(list[toIndex - 1]!.id)
      setToId(list[toIndex]!.id)
    }
  }, [selectedYear, cutoffsByYear])

  useEffect(() => {
    if (selectedYear == null) return
    const list = cutoffsByYear[selectedYear] ?? []
    if (!list.length) {
      setToId('')
      return
    }
    let next: Cutoff | null = null
    if (fromId === START_OF_YEAR) {
      next = list[0] ?? null
    } else if (fromId) {
      const idx = list.findIndex(c => c.id === fromId)
      if (idx >= 0 && idx + 1 < list.length) next = list[idx + 1] ?? null
    }
    setToId(next?.id ?? '')
  }, [fromId, selectedYear, cutoffsByYear])

  const fromOptions = useMemo(() => {
    if (selectedYear == null) return []
    const list = cutoffsByYear[selectedYear] ?? []
    const opts = list
      .slice(0, Math.max(0, list.length - 1))
      .map(cutoff => ({ id: cutoff.id, label: formatCutoffOption(cutoff), cutoff }))
    if (list.length) {
      opts.unshift({
        id: START_OF_YEAR,
        label: `Start of ${selectedYear} (Jan 1)`,
        cutoff: {
          id: START_OF_YEAR,
          cutoffDate: `${selectedYear}-01-01`,
          label: null,
          year: selectedYear,
        } as Cutoff,
      })
    }
    return opts
  }, [cutoffsByYear, selectedYear])

  const toCutoff = useMemo(() => {
    if (selectedYear == null || !toId) return null
    const list = cutoffsByYear[selectedYear] ?? []
    return list.find(c => c.id === toId) ?? null
  }, [cutoffsByYear, selectedYear, toId])

  const previousCutoff = useMemo(() => {
    if (selectedYear == null) return null
    const list = cutoffsByYear[selectedYear] ?? []
    if (fromId && fromId !== START_OF_YEAR) {
      return list.find(c => c.id === fromId) ?? null
    }
    const toIndex = toCutoff ? list.findIndex(c => c.id === toCutoff.id) : -1
    if (toIndex > 0) {
      return list[toIndex - 1] ?? null
    }
    const prior = cutoffsByYear[selectedYear - 1] ?? []
    return prior.length ? prior[prior.length - 1]! : null
  }, [cutoffsByYear, selectedYear, fromId, toCutoff])

  const computedWindow = useMemo<WindowInfo | null>(() => {
    if (!selectedYear || !toCutoff) return null
    const startDate = previousCutoff ? addDays(previousCutoff.cutoffDate, 1) : `${selectedYear}-01-01`
    return {
      startDate,
      endDate: toCutoff.cutoffDate,
      toCutoff,
      previousCutoff: previousCutoff ?? null,
    }
  }, [selectedYear, toCutoff, previousCutoff])

  const canSubmit = !!selectedYear && !!toCutoff

  const displayWindow = preview?.window ?? computedWindow

  const handlePreview = useCallback(async (pageOverride?: number) => {
    if (!canSubmit) return
    const pageToLoad = pageOverride ?? 1
    setPreviewLoading(true)
    try {
      const res = await fetch('/api/reports/fdot-cutoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: selectedYear,
          toCutoff: toCutoff?.id,
          page: pageToLoad,
          pageSize: PAGE_SIZE,
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json) {
        throw new Error(json?.error || 'Failed to generate report')
      }
      const normalized: PreviewResponse = {
        window: {
          startDate: String(json.window?.startDate ?? ''),
          endDate: String(json.window?.endDate ?? ''),
          toCutoff: {
            id: String(json.window?.toCutoff?.id ?? toCutoff?.id ?? ''),
            cutoffDate: String(json.window?.toCutoff?.cutoffDate ?? toCutoff?.cutoffDate ?? '').slice(0, 10),
            label: json.window?.toCutoff?.label ?? (toCutoff?.label ?? null),
            year: Number(json.window?.toCutoff?.year ?? selectedYear ?? 0),
          },
          previousCutoff: json.window?.previousCutoff
            ? {
                id: String(json.window.previousCutoff.id ?? ''),
                cutoffDate: String(json.window.previousCutoff.cutoffDate ?? '').slice(0, 10),
                label: json.window.previousCutoff.label ?? null,
                year: Number(json.window.previousCutoff.year ?? (selectedYear ?? 0)),
              }
            : null,
        },
        rows: Array.isArray(json.rows)
          ? json.rows.map((row: any) => ({
              jobId: String(row.jobId ?? ''),
              jobName: String(row.jobName ?? ''),
              payItem: String(row.payItem ?? ''),
              description: row.description != null ? String(row.description) : '',
              unit: row.unit != null ? String(row.unit) : '',
              quantity: Number(row.quantity ?? 0),
              firstWorkDate: String(row.firstWorkDate ?? '').slice(0, 10),
              lastWorkDate: String(row.lastWorkDate ?? '').slice(0, 10),
            }))
          : [],
        totalRows: Number(json.totalRows ?? 0),
        page: Number(json.page ?? pageToLoad),
        pageSize: Number(json.pageSize ?? PAGE_SIZE),
        jobTotals: Array.isArray(json.jobTotals)
          ? json.jobTotals.map((jt: any) => ({
              jobId: String(jt.jobId ?? ''),
              jobName: String(jt.jobName ?? ''),
              quantity: Number(jt.quantity ?? 0),
            }))
          : [],
        grandTotal: Number(json.grandTotal ?? 0),
      }
      setPreview(normalized)
      setPage(normalized.page)
    } catch (err) {
      console.error(err)
      showToast(err instanceof Error ? err.message : 'Failed to generate report')
    } finally {
      setPreviewLoading(false)
    }
  }, [canSubmit, selectedYear, toCutoff, showToast])

  const handleExport = useCallback(async () => {
    if (!canSubmit) return
    setExporting(true)
    try {
      const res = await fetch('/api/reports/fdot-cutoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: selectedYear,
          toCutoff: toCutoff?.id,
          format: 'csv',
        }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error || 'Failed to export CSV')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const endDate = computedWindow?.endDate ?? (toCutoff?.cutoffDate ?? '')
      a.download = endDate ? `fdot-cutoff-${endDate}.csv` : 'fdot-cutoff.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast('CSV export ready')
    } catch (err) {
      console.error(err)
      showToast(err instanceof Error ? err.message : 'Failed to export CSV')
    } finally {
      setExporting(false)
    }
  }, [canSubmit, selectedYear, toCutoff, computedWindow, showToast])

  const handleClose = useCallback(() => {
    setPreview(null)
    setPage(1)
    onClose()
  }, [onClose])

  const totalRows = preview?.totalRows ?? 0
  const pageSize = preview?.pageSize ?? PAGE_SIZE
  const currentPage = preview?.page ?? page
  const pageStart = totalRows ? (currentPage - 1) * pageSize + 1 : 0
  const pageEnd = totalRows ? Math.min(currentPage * pageSize, totalRows) : 0
  const hasPrevPage = currentPage > 1
  const hasNextPage = totalRows > pageEnd

  if (!open) return null

  return (
    <div className="modal-root" onClick={e => { if (e.currentTarget === e.target) handleClose() }}>
      <Toast open={toast.open} message={toast.message} onClose={closeToast} />
      <div className="modal-card" style={{ width: 'min(960px, 94vw)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Generate Cut-Off Report</span>
          <button className="icon-btn" aria-label="Close" onClick={handleClose}>
            ✕
          </button>
        </div>
        <div className="form-grid" style={{ gap: '16px' }}>
          <div className="row">
            <div className="col">
              <label>
                <div className="label">Year</div>
                <select
                  value={selectedYear ?? ''}
                  onChange={e => {
                    const value = Number(e.target.value)
                    setSelectedYear(Number.isFinite(value) ? value : null)
                    setPreview(null)
                  }}
                  disabled={loading || !years.length}
                >
                  <option value="" disabled>
                    Select year
                  </option>
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="col">
              <label>
                <div className="label">From Cut-Off</div>
                <select
                  value={fromId}
                  onChange={e => setFromId(e.target.value)}
                  disabled={loading || !fromOptions.length}
                >
                  {!fromOptions.length ? (
                    <option value="">No cut-offs available</option>
                  ) : null}
                  {fromOptions.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="col">
              <label>
                <div className="label">To Cut-Off</div>
                <select value={toId} disabled>
                  <option value={toId || ''}>{toCutoff ? formatCutoffOption(toCutoff) : 'Select From Cut-Off'}</option>
                </select>
              </label>
            </div>
          </div>
          <div>
            <div className="label">Report Window</div>
            {displayWindow ? (
              <div className="muted-sm">
                Report window = previous cut-off + 1 day through selected cut-off (inclusive).
                <br />
                {displayWindow.previousCutoff
                  ? `Previous Cut-Off: ${displayWindow.previousCutoff.cutoffDate}`
                  : `Previous Cut-Off: none (using Jan 1 ${selectedYear})`}
                <br />
                {`Start Date: ${displayWindow.startDate}`} → {`End Date: ${displayWindow.endDate}`}
              </div>
            ) : (
              <div className="muted-sm">Select a year and cut-off pair to view the reporting window.</div>
            )}
          </div>
        </div>
        <div className="modal-actions" style={{ justifyContent: 'flex-start', gap: '12px', marginTop: '20px' }}>
          <button className="btn ghost" onClick={handleClose}>
            Cancel
          </button>
          <button className="btn primary" onClick={() => handlePreview(1)} disabled={!canSubmit || previewLoading}>
            {previewLoading ? 'Loading…' : 'Preview'}
          </button>
          <button className="btn" onClick={handleExport} disabled={!canSubmit || exporting}>
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
        {preview ? (
          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <strong>
                  {`Showing ${pageStart}-${pageEnd} of ${totalRows} line items`}
                </strong>
                <div className="muted-sm">
                  Grand Total Quantity: {numberFmt(preview.grandTotal)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  className="btn ghost"
                  onClick={() => handlePreview(currentPage - 1)}
                  disabled={!hasPrevPage || previewLoading}
                >
                  ← Prev
                </button>
                <span className="muted-sm">Page {currentPage}</span>
                <button
                  className="btn ghost"
                  onClick={() => handlePreview(currentPage + 1)}
                  disabled={!hasNextPage || previewLoading}
                >
                  Next →
                </button>
              </div>
            </div>
            <div className="cutoff-table-wrapper">
              <table className="cutoff-table">
                <thead>
                  <tr>
                    <th>Job Name</th>
                    <th>Job ID</th>
                    <th>Pay Item</th>
                    <th>Description</th>
                    <th>Unit</th>
                    <th style={{ textAlign: 'right' }}>Quantity</th>
                    <th>First Work Date</th>
                    <th>Last Work Date</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.length ? (
                    preview.rows.map((row, idx) => (
                      <tr key={`${row.jobId}-${row.payItem}-${idx}`}>
                        <td>{row.jobName || '—'}</td>
                        <td>{row.jobId || '—'}</td>
                        <td>{row.payItem || '—'}</td>
                        <td>{row.description || '—'}</td>
                        <td>{row.unit || '—'}</td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{numberFmt(row.quantity)}</td>
                        <td>{row.firstWorkDate || '—'}</td>
                        <td>{row.lastWorkDate || '—'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '18px 12px', color: 'var(--muted)' }}>
                        No FDOT quantities found for this window.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {preview.jobTotals.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h4 style={{ margin: '0 0 4px' }}>Totals by Job</h4>
                <div style={{ display: 'grid', gap: '6px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                  {preview.jobTotals.map(total => (
                    <div key={total.jobId || total.jobName} className="surface" style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--border-2)' }}>
                      <div style={{ fontWeight: 600 }}>{total.jobName || 'Unnamed Job'}</div>
                      <div className="muted-sm">ID: {total.jobId || '—'}</div>
                      <div style={{ marginTop: '6px' }}>Quantity: {numberFmt(total.quantity)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
