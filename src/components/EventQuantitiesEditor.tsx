'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Toast } from '@/components/Toast'

type PayItemOption = {
  id: string
  number: string
  description: string
  unit: string
}

type QuantityLine = {
  key: string
  payItemId: string | null
  payItemNumber: string
  payItemDescription: string
  unit: string
  quantity: string
  notes: string
}

type Props = {
  eventId: string
  onHasQuantitiesChange?: (hasQuantities: boolean) => void
}

type FetchResult = {
  items: Array<{
    id: string
    payItemId: string
    quantity: string
    stationFrom: string | null
    stationTo: string | null
    notes: string | null
    payItem: PayItemOption | null
  }>
}

function toLine(item: FetchResult['items'][number]): QuantityLine {
  const pay = item.payItem
  return {
    key: item.id || `tmp-${Math.random().toString(36).slice(2, 10)}`,
    payItemId: pay?.id ?? item.payItemId ?? null,
    payItemNumber: pay?.number ?? '',
    payItemDescription: pay?.description ?? '',
    unit: pay?.unit ?? '',
    quantity: item.quantity ?? '',
    notes: item.notes ?? '',
  }
}

function emptyLine(): QuantityLine {
  return {
    key: `tmp-${Math.random().toString(36).slice(2, 10)}`,
    payItemId: null,
    payItemNumber: '',
    payItemDescription: '',
    unit: '',
    quantity: '',
    notes: '',
  }
}

const MIN_QUERY_LENGTH = 1

export function EventQuantitiesEditor({ eventId, onHasQuantitiesChange }: Props) {
  const [lines, setLines] = useState<QuantityLine[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ open: boolean; message: string }>({ open: false, message: '' })
  const [error, setError] = useState<string | null>(null)

  const [activeLineId, setActiveLineId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<PayItemOption[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  const latestFetchId = useRef(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/events/${eventId}/quantities`, { cache: 'no-store' })
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to load quantities')
        const data: FetchResult = await res.json()
        if (cancelled) return
        const mapped = data.items?.map(toLine) ?? []
        setLines(mapped.length ? mapped : [emptyLine()])
        onHasQuantitiesChange?.(mapped.length > 0)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load quantities')
        setLines([emptyLine()])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [eventId, onHasQuantitiesChange])

  const showToast = useCallback((message: string) => {
    setToast({ open: true, message })
  }, [])

  const closeToast = useCallback(() => setToast({ open: false, message: '' }), [])

  const openSearchForLine = useCallback((line: QuantityLine) => {
    setActiveLineId(line.key)
    setSearchTerm(line.payItemNumber ? `${line.payItemNumber} — ${line.payItemDescription}` : '')
    setSearchResults([])
    if (!line.payItemId) {
      void fetchSuggestions('')
    }
  }, [])

  const fetchSuggestions = useCallback(async (query: string) => {
    const trimmed = query.trim()
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setSearchResults([])
      return
    }
    setSearchLoading(true)
    const fetchId = ++latestFetchId.current
    try {
      const url = new URL('/api/payitems', window.location.origin)
      url.searchParams.set('q', trimmed)
      url.searchParams.set('take', '20')
      const res = await fetch(url.toString(), { cache: 'no-store' })
      if (!res.ok) throw new Error('Search failed')
      const payload = await res.json()
      if (latestFetchId.current !== fetchId) return
      const items: PayItemOption[] = Array.isArray(payload.items) ? payload.items : []
      setSearchResults(items)
    } catch {
      if (latestFetchId.current !== fetchId) return
      setSearchResults([])
    } finally {
      if (latestFetchId.current === fetchId) setSearchLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!activeLineId) return
    const handler = window.setTimeout(() => {
      void fetchSuggestions(searchTerm)
    }, 200)
    return () => window.clearTimeout(handler)
  }, [activeLineId, searchTerm, fetchSuggestions])

  useEffect(() => {
    const listener = (ev: MouseEvent) => {
      if (!(ev.target instanceof HTMLElement)) return
      if (ev.target.closest('.qty-payitem-search')) return
      setActiveLineId(null)
    }
    window.addEventListener('mousedown', listener)
    return () => window.removeEventListener('mousedown', listener)
  }, [])

  const updateLine = useCallback((key: string, patch: Partial<QuantityLine>) => {
    setLines(prev => prev.map(line => (line.key === key ? { ...line, ...patch } : line)))
  }, [])

  const removeLine = useCallback((key: string) => {
    setLines(prev => {
      const next = prev.filter(line => line.key !== key)
      return next.length ? next : [emptyLine()]
    })
  }, [])

  const addLine = useCallback(() => {
    setLines(prev => [...prev, emptyLine()])
  }, [])

  const missingRequired = useMemo(() => {
    return lines.some(line => line.payItemId && !line.quantity.trim())
  }, [lines])

  const handleSave = useCallback(async () => {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        lines: lines
          .filter(line => line.payItemId)
          .map(line => ({
            payItemId: line.payItemId!,
            quantity: line.quantity.trim(),
            notes: line.notes.trim() || undefined,
          })),
      }

      const res = await fetch(`/api/events/${eventId}/quantities`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const problem = await res.json().catch(() => ({}))
        throw new Error(problem.error || 'Failed to save quantities')
      }

      const data = await res.json()
      const mapped = Array.isArray(data.items) ? data.items.map(toLine) : []
      setLines(mapped.length ? mapped : [emptyLine()])
      onHasQuantitiesChange?.(mapped.length > 0)
      showToast(mapped.length ? 'Quantities saved' : 'Quantities cleared')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save quantities'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }, [lines, eventId, onHasQuantitiesChange, showToast])

  const renderSearchResults = () => {
    if (!activeLineId) return null
    if (searchTerm.trim().length < MIN_QUERY_LENGTH) {
      return <div className="qty-suggestions">Type at least one character to search.</div>
    }
    if (searchLoading) {
      return <div className="qty-suggestions">Searching…</div>
    }
    if (!searchResults.length) {
      return <div className="qty-suggestions">No matches found.</div>
    }
    return (
      <ul className="qty-suggestions" role="listbox">
        {searchResults.map(option => (
          <li key={option.id}>
            <button
              type="button"
              onClick={() => {
                updateLine(activeLineId, {
                  payItemId: option.id,
                  payItemNumber: option.number,
                  payItemDescription: option.description,
                  unit: option.unit,
                })
                setActiveLineId(null)
                setSearchTerm('')
              }}
            >
              <span className="qty-suggestion-number">{option.number}</span>
              <span className="qty-suggestion-desc">{option.description}</span>
              <span className="qty-suggestion-unit">{option.unit}</span>
            </button>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <section className="qty-editor">
      <header className="qty-header">
        <h4>Quantities</h4>
        <div className="qty-actions">
          <button type="button" className="btn ghost" onClick={addLine}>Add Line</button>
          <button type="button" className="btn primary" onClick={handleSave} disabled={saving || (!!lines.length && lines.every(line => !line.payItemId)) || missingRequired}>
            {saving ? 'Saving…' : 'Save Quantities'}
          </button>
        </div>
      </header>
      {error ? <div className="qty-error" role="alert">{error}</div> : null}
      {loading ? (
        <div className="qty-loading">Loading quantities…</div>
      ) : (
        <div className="qty-grid" role="list">
          {lines.map(line => {
            const hasPayItem = !!line.payItemId
            const displayValue = hasPayItem
              ? `${line.payItemNumber} — ${line.payItemDescription}`
              : activeLineId === line.key
                ? searchTerm
                : ''
            return (
              <div key={line.key} className="qty-row" role="listitem">
                <div className="qty-cell qty-payitem">
                  <label>
                    <span className="label">Pay Item</span>
                    <div className="qty-payitem-search">
                      <input
                        type="text"
                        value={displayValue}
                        placeholder="Search pay item"
                        onFocus={() => openSearchForLine(line)}
                        onChange={e => {
                          if (activeLineId !== line.key) setActiveLineId(line.key)
                          setSearchTerm(e.target.value)
                        }}
                      />
                      {hasPayItem ? (
                        <button
                          type="button"
                          className="btn ghost"
                          onClick={() => updateLine(line.key, { payItemId: null, payItemNumber: '', payItemDescription: '', unit: '' })}
                        >
                          Clear
                        </button>
                      ) : null}
                      {activeLineId === line.key ? renderSearchResults() : null}
                    </div>
                  </label>
                </div>
                <div className="qty-inline">
                  <div className="qty-cell qty-unit">
                    <label>
                      <span className="label">Unit</span>
                      <input type="text" value={line.unit} disabled aria-disabled style={{ background: '#f5f5f5' }} />
                    </label>
                  </div>
                  <div className="qty-cell qty-quantity">
                    <label>
                      <span className="label">Quantity</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={line.quantity}
                        onChange={e => updateLine(line.key, { quantity: e.target.value })}
                        placeholder="0.000000"
                      />
                    </label>
                  </div>
                </div>
                <div className="qty-cell qty-notes">
                  <label>
                    <span className="label">Notes</span>
                    <textarea value={line.notes} onChange={e => updateLine(line.key, { notes: e.target.value })} rows={3} />
                  </label>
                </div>
                <div className="qty-actions-column">
                  <button type="button" className="btn ghost" onClick={() => removeLine(line.key)} aria-label="Remove line">Remove</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <p className="qty-hint">Select pay items from the master list. Units are read-only and follow the pay item definition.</p>
      <Toast message={toast.message} open={toast.open} onClose={closeToast} />
    </section>
  )
}

export default EventQuantitiesEditor
