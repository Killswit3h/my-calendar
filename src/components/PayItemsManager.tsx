'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Toast } from '@/components/Toast'

type PayItem = {
  id: string
  number: string
  description: string
  unit: string
  createdAt: string
  updatedAt: string
}

type ImportPreview = {
  rows: Array<{ number: string; description: string; unit: string }>
  errors: string[]
}

const MAX_RESULTS = 50

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])
  return debounced
}

function parseCsv(text: string): ImportPreview {
  const rows: ImportPreview['rows'] = []
  const errors: string[] = []
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
  if (!lines.length) return { rows, errors }

  const [headerLine, ...dataLines] = lines
  const headers = headerLine.split(',').map(h => h.trim().toLowerCase())
  const numberIdx = headers.indexOf('number')
  const descriptionIdx = headers.indexOf('description')
  const unitIdx = headers.indexOf('unit')
  if (numberIdx === -1 || descriptionIdx === -1 || unitIdx === -1) {
    errors.push('CSV header must include number, description, unit columns')
    return { rows, errors }
  }

  dataLines.forEach((line, index) => {
    const parts = line.split(',').map(part => part.trim())
    const number = parts[numberIdx] ?? ''
    const description = parts[descriptionIdx] ?? ''
    const unit = parts[unitIdx] ?? ''
    if (!number || !description || !unit) {
      errors.push(`Row ${index + 1} missing number, description, or unit`)
      return
    }
    rows.push({ number, description, unit })
  })

  return { rows, errors }
}

export type PayItemsManagerProps = {
  condensed?: boolean
}

export default function PayItemsManager({ condensed }: PayItemsManagerProps) {
  const [items, setItems] = useState<PayItem[]>([])
  const originalsRef = useRef(new Map<string, PayItem>())
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query, 250)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ open: boolean; message: string }>({ open: false, message: '' })
  const [createForm, setCreateForm] = useState({ number: '', description: '', unit: '' })
  const [importText, setImportText] = useState('')
  const importPreview = useMemo(() => parseCsv(importText), [importText])
  const [importing, setImporting] = useState(false)
  const [seedLoading, setSeedLoading] = useState(false)

  const showToast = useCallback((message: string) => setToast({ open: true, message }), [])
  const closeToast = useCallback(() => setToast({ open: false, message: '' }), [])

  const loadItems = useCallback(async (search: string) => {
    setLoading(true)
    try {
      const url = new URL('/api/payitems', window.location.origin)
      if (search.trim()) url.searchParams.set('q', search.trim())
      url.searchParams.set('take', String(MAX_RESULTS))
      const res = await fetch(url.toString(), { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load pay items')
      const json = await res.json()
      const list: PayItem[] = Array.isArray(json.items) ? json.items : []
      setItems(list)
      originalsRef.current = new Map(list.map(item => [item.id, item]))
    } catch (err) {
      console.error(err)
      showToast('Failed to load pay items')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    void loadItems(debouncedQuery)
  }, [debouncedQuery, loadItems])

  const resetItem = useCallback((id: string) => {
    const original = originalsRef.current.get(id)
    if (!original) return
    setItems(prev => prev.map(item => (item.id === id ? original : item)))
  }, [])

  const updateItem = useCallback(async (item: PayItem) => {
    const original = originalsRef.current.get(item.id)
    if (original && original.number === item.number && original.description === item.description && original.unit === item.unit) {
      return
    }
    try {
      const res = await fetch(`/api/payitems/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: item.number, description: item.description, unit: item.unit }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        showToast(err.error || 'Failed to update pay item')
        resetItem(item.id)
        return
      }
      const updated = await res.json()
      originalsRef.current.set(item.id, updated)
      setItems(prev => prev.map(p => (p.id === item.id ? updated : p)))
      showToast('Pay item updated')
    } catch (err) {
      console.error(err)
      showToast('Failed to update pay item')
      resetItem(item.id)
    }
  }, [resetItem, showToast])

  const handleDelete = useCallback(async (item: PayItem) => {
    if (!window.confirm(`Delete pay item ${item.number}?`)) return
    try {
      const res = await fetch(`/api/payitems/${item.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        showToast(err.error || 'Failed to delete pay item')
        return
      }
      showToast('Pay item deleted')
      originalsRef.current.delete(item.id)
      setItems(prev => prev.filter(p => p.id !== item.id))
    } catch (err) {
      console.error(err)
      showToast('Failed to delete pay item')
    }
  }, [showToast])

  const handleCreate = useCallback(async () => {
    const number = createForm.number.trim()
    const description = createForm.description.trim()
    const unit = createForm.unit.trim().toUpperCase()
    if (!number || !description || !unit) {
      showToast('Number, description, and unit are required')
      return
    }
    try {
      const res = await fetch('/api/payitems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, description, unit }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        showToast(err.error || 'Failed to create pay item')
        return
      }
      setCreateForm({ number: '', description: '', unit: '' })
      showToast('Pay item created')
      void loadItems(debouncedQuery)
    } catch (err) {
      console.error(err)
      showToast('Failed to create pay item')
    }
  }, [createForm, debouncedQuery, loadItems, showToast])

  const handleImport = useCallback(async () => {
    if (!importPreview.rows.length) {
      showToast('Nothing to import')
      return
    }
    setImporting(true)
    try {
      const res = await fetch('/api/payitems/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: importPreview.rows }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        showToast(json.error || 'Import failed')
        return
      }
      const imported = json.imported ?? 0
      const updated = json.updated ?? 0
      showToast(`Import complete: ${imported} added, ${updated} updated`)
      setImportText('')
      void loadItems(debouncedQuery)
    } catch (err) {
      console.error(err)
      showToast('Import failed')
    } finally {
      setImporting(false)
    }
  }, [importPreview.rows, debouncedQuery, loadItems, showToast])

  const handleSeed = useCallback(async () => {
    setSeedLoading(true)
    try {
      const res = await fetch('/api/payitems/seed', { method: 'POST' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        showToast(json.error || 'Failed to seed pay items')
        return
      }
      const created = json.created ?? 0
      const updated = json.updated ?? 0
      showToast(`Seed complete: ${created} created, ${updated} updated`)
      void loadItems(debouncedQuery)
    } catch (err) {
      console.error(err)
      showToast('Failed to seed pay items')
    } finally {
      setSeedLoading(false)
    }
  }, [debouncedQuery, loadItems, showToast])

  return (
    <div className={condensed ? 'payitems-condensed' : undefined}>
      <Toast message={toast.message} open={toast.open} onClose={closeToast} />

      <section className="span-2" style={{ marginBottom: '1rem' }}>
        <label className="span-2" style={{ display: 'grid', gap: '0.35rem' }}>
          <div className="label">Search Pay Items</div>
          <input
            type="search"
            placeholder="Search by number or description"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="payitems-input"
          />
          <span className="muted-sm">Showing up to {MAX_RESULTS} results.</span>
        </label>
      </section>

      <section className="payitems-card">
        <div className="form-section">Create Pay Item</div>
        <div className="payitems-create-grid">
          <label>
            <span className="label">FDOT Number</span>
            <input value={createForm.number} onChange={e => setCreateForm(prev => ({ ...prev, number: e.target.value }))} className="payitems-input" />
          </label>
          <label>
            <span className="label">Description</span>
            <input value={createForm.description} onChange={e => setCreateForm(prev => ({ ...prev, description: e.target.value }))} className="payitems-input" />
          </label>
          <label>
            <span className="label">Unit (UM)</span>
            <input value={createForm.unit} onChange={e => setCreateForm(prev => ({ ...prev, unit: e.target.value }))} className="payitems-input" />
          </label>
          <div className="payitems-actions">
            <button type="button" className="btn primary" onClick={handleCreate}>Create</button>
          </div>
        </div>
      </section>

      <section className="payitems-card">
        <div className="form-section">Pay Item Catalog</div>
        {loading ? <p className="muted-sm">Loading…</p> : null}
        {!loading && !items.length ? <p className="muted-sm">No pay items found.</p> : null}
        {items.length ? (
          <div className="payitems-table-wrapper">
            <table className="payitems-table">
              <thead>
                <tr>
                  <th>FDOT #</th>
                  <th>Description</th>
                  <th>Unit</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <input
                        value={item.number}
                        onChange={e => setItems(prev => prev.map(p => (p.id === item.id ? { ...p, number: e.target.value } : p)))}
                        onBlur={() => updateItem(item)}
                        className="payitems-input"
                      />
                    </td>
                    <td>
                      <input
                        value={item.description}
                        onChange={e => setItems(prev => prev.map(p => (p.id === item.id ? { ...p, description: e.target.value } : p)))}
                        onBlur={() => updateItem(item)}
                        className="payitems-input"
                      />
                    </td>
                    <td>
                      <input
                        value={item.unit}
                        onChange={e => setItems(prev => prev.map(p => (p.id === item.id ? { ...p, unit: e.target.value.toUpperCase() } : p)))}
                        onBlur={() => updateItem(item)}
                        className="payitems-input"
                      />
                    </td>
                    <td className="payitems-table-actions">
                      <button type="button" className="btn ghost" onClick={() => handleDelete(item)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="payitems-card">
        <div className="form-section">Bulk Import</div>
        <p className="muted-sm">Paste CSV with headers: number, description, unit</p>
        <textarea
          value={importText}
          onChange={e => setImportText(e.target.value)}
          rows={condensed ? 4 : 6}
          className="payitems-textarea"
          placeholder="number,description,unit"
        />
        {importPreview.errors.length ? (
          <ul className="payitems-errors">
            {importPreview.errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        ) : null}
        {importPreview.rows.length ? (
          <div className="payitems-table-wrapper" style={{ maxHeight: '220px' }}>
            <table className="payitems-table">
              <thead>
                <tr>
                  <th>FDOT #</th>
                  <th>Description</th>
                  <th>Unit</th>
                </tr>
              </thead>
              <tbody>
                {importPreview.rows.map((row, idx) => (
                  <tr key={`${row.number}-${idx}`}>
                    <td>{row.number}</td>
                    <td>{row.description}</td>
                    <td>{row.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        <div className="payitems-import-actions">
          <button type="button" className="btn primary" disabled={importing || !importPreview.rows.length} onClick={handleImport}>
            {importing ? 'Importing…' : 'Import'}
          </button>
          <button type="button" className="btn ghost" onClick={handleSeed} disabled={seedLoading}>
            {seedLoading ? 'Seeding…' : 'Run Seed'}
          </button>
        </div>
      </section>
    </div>
  )
}
