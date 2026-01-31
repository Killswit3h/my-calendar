'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Phase } from '@/components/project/payApplicationTypes'
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
  eventId?: string
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

type ProjectPhaseSummary = {
  id: string
  name: string
  phases: Phase[]
}

const MOCK_PROJECT_PHASES: ProjectPhaseSummary[] = [
  {
    id: 'gfc-m11a2',
    name: 'SR-836 Shoulder Retrofit',
    phases: [
      {
        id: 'phase-1',
        name: 'Phase 1',
        locateTicket: 'TCK-48213',
        dateCreated: '2025-12-01',
        readyToWorkDate: '2025-12-04',
        onsiteReview: true,
        surveyed: true,
        status: 'Ready',
        statusDate: '2025-12-05',
        notes: 'Northbound alignment; ensure MOT update before pour.',
        items: [
          {
            id: 'phase-1-1',
            payItem: '550-5-125',
            description: 'Handrail Fabrication',
            quantity: 500,
            installedQty: 260,
          },
          {
            id: 'phase-1-2',
            payItem: '550-7-330',
            description: 'Handrail Installation',
            quantity: 500,
            installedQty: 240,
          },
        ],
      },
      {
        id: 'phase-2',
        name: 'Phase 2',
        locateTicket: 'TCK-48277',
        dateCreated: '2025-12-06',
        readyToWorkDate: '2025-12-10',
        onsiteReview: false,
        surveyed: true,
        status: 'Pending',
        statusDate: '2025-12-11',
        notes: 'Southbound; await utility clearance.',
        items: [
          {
            id: 'phase-2-1',
            payItem: '550-5-125',
            description: 'Handrail Fabrication',
            quantity: 320,
            installedQty: 120,
          },
          {
            id: 'phase-2-2',
            payItem: '550-7-330',
            description: 'Handrail Installation',
            quantity: 320,
            installedQty: 110,
          },
        ],
      },
    ],
  },
  {
    id: 'gfc-e8w48',
    name: 'I-95 Express Phase 3C',
    phases: [
      {
        id: 'phase-1',
        name: 'Phase 1',
        locateTicket: 'TCK-39102',
        dateCreated: '2025-11-18',
        readyToWorkDate: '2025-11-22',
        onsiteReview: true,
        surveyed: true,
        status: 'Active',
        statusDate: '2025-11-26',
        notes: 'Median segment; coordinate traffic control.',
        items: [
          {
            id: 'phase-1-1',
            payItem: '536-8-114',
            description: 'Guardrail Removal',
            quantity: 1200,
            installedQty: 720,
          },
          {
            id: 'phase-1-2',
            payItem: '536-8-432',
            description: 'Guardrail Installation',
            quantity: 1400,
            installedQty: 880,
          },
        ],
      },
    ],
  },
]

const phaseQtyKey = (phaseId: string, itemId: string) => `${phaseId}:${itemId}`

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
  const [selectedProjectId, setSelectedProjectId] = useState(MOCK_PROJECT_PHASES[0]?.id ?? '')
  const [selectedPhaseId, setSelectedPhaseId] = useState(MOCK_PROJECT_PHASES[0]?.phases[0]?.id ?? '')
  const [phaseQuantities, setPhaseQuantities] = useState<Record<string, string>>({})

  const latestFetchId = useRef(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!eventId) {
        setLines([emptyLine()])
        onHasQuantitiesChange?.(false)
        setLoading(false)
        return
      }
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

  const selectedProject = useMemo(
    () => MOCK_PROJECT_PHASES.find(project => project.id === selectedProjectId) ?? MOCK_PROJECT_PHASES[0],
    [selectedProjectId],
  )

  const phaseOptions = useMemo(() => selectedProject?.phases ?? [], [selectedProject])

  const selectedPhase = useMemo(() => {
    if (!phaseOptions.length) return null
    return phaseOptions.find(phase => phase.id === selectedPhaseId) ?? phaseOptions[0]
  }, [phaseOptions, selectedPhaseId])

  useEffect(() => {
    if (!phaseOptions.length) {
      setSelectedPhaseId('')
      return
    }
    if (phaseOptions.some(phase => phase.id === selectedPhaseId)) return
    setSelectedPhaseId(phaseOptions[0]?.id ?? '')
  }, [phaseOptions, selectedPhaseId])

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

  const updatePhaseQuantity = useCallback((phaseId: string, itemId: string, value: string) => {
    setPhaseQuantities(prev => ({ ...prev, [phaseQtyKey(phaseId, itemId)]: value }))
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
      if (!eventId) {
        throw new Error('Save the event to add quantities.')
      }
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
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <header className="mb-4">
          <h2 className="text-lg font-semibold text-white">Phase Quantities</h2>
          <p className="text-sm text-white/60">
            Choose a project phase to log quantities completed for this event.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/60">Project</label>
            <select
              value={selectedProjectId}
              onChange={(event) => setSelectedProjectId(event.target.value)}
              className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
            >
              {MOCK_PROJECT_PHASES.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-white/60">Phase</label>
            <select
              value={selectedPhase?.id ?? ''}
              onChange={(event) => setSelectedPhaseId(event.target.value)}
              className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
            >
              {phaseOptions.map(phase => (
                <option key={phase.id} value={phase.id}>
                  {phase.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="hidden text-xs text-white/60 lg:grid lg:grid-cols-[1fr,2fr,160px,120px] lg:gap-3">
            <span>Pay Item</span>
            <span>Description</span>
            <span className="text-right">Quantity</span>
            <span className="text-right">Installed</span>
          </div>

          {selectedPhase?.items?.length ? (
            <div className="space-y-4">
              {selectedPhase.items.map(item => (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm shadow-inner lg:grid lg:grid-cols-[1fr,2fr,160px,120px] lg:items-center lg:gap-3"
                >
                  <div className="font-semibold text-white">{item.payItem}</div>
                  <div className="text-white/70">{item.description}</div>
                  <div className="mt-3 lg:mt-0 lg:text-right">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={phaseQuantities[phaseQtyKey(selectedPhase.id, item.id)] ?? ''}
                      onChange={(event) =>
                        updatePhaseQuantity(selectedPhase.id, item.id, event.target.value)
                      }
                      className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60 lg:max-w-[140px] lg:ml-auto"
                      placeholder={item.quantity.toLocaleString()}
                    />
                  </div>
                  <div className="text-white lg:text-right">{item.installedQty.toLocaleString()}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
              No pay items found for this phase.
            </div>
          )}
        </div>
        <p className="mt-4 text-xs text-white/50">
          Mock phase data for now — will be wired to project phases API.
        </p>
      </section>

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
