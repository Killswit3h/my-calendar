'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Toast } from '@/components/Toast'

type CutoffRow = {
  id: string | null
  cutoffDate: string
  label: string
  tempId: string
}

type ApiCutoff = {
  id: string
  cutoffDate: string
  label: string | null
}

type ApiResponse = {
  years: number[]
  cutoffs: Record<string, ApiCutoff[]>
}

function normalizeRows(rows: CutoffRow[]): ApiCutoff[] {
  return rows
    .map(row => ({
      id: row.id ?? '',
      cutoffDate: row.cutoffDate.trim(),
      label: row.label.trim() || null,
    }))
    .filter(row => row.cutoffDate)
}

function makeTempId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `tmp-${Math.random().toString(36).slice(2)}-${Date.now()}`
}

function parseImport(text: string, expectedYear: number): { rows: CutoffRow[]; errors: string[] } {
  const rows: CutoffRow[] = []
  const errors: string[] = []
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
  if (!lines.length) return { rows, errors }

  lines.forEach((line, index) => {
    const [datePart, ...rest] = line.split(',')
    const cutoffDate = (datePart || '').trim()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cutoffDate)) {
      errors.push(`Row ${index + 1}: invalid cutoff_date "${cutoffDate}"`)
      return
    }
    const [year] = cutoffDate.split('-').map(Number)
    if (year !== expectedYear) {
      errors.push(`Row ${index + 1}: year ${year} does not match ${expectedYear}`)
      return
    }
    const label = rest.join(',').trim()
    rows.push({ id: null, cutoffDate, label, tempId: makeTempId() })
  })

  const seen = new Set<string>()
  for (const row of rows) {
    if (seen.has(row.cutoffDate)) {
      errors.push(`Duplicate cutoff date ${row.cutoffDate}`)
    }
    seen.add(row.cutoffDate)
  }

  rows.sort((a, b) => a.cutoffDate.localeCompare(b.cutoffDate))
  return { rows, errors }
}

function validateRows(rows: CutoffRow[], year: number): string[] {
  const errors: string[] = []
  const seen = new Set<string>()
  rows.forEach((row, idx) => {
    if (!row.cutoffDate) {
      errors.push(`Row ${idx + 1}: cutoff date required`)
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.cutoffDate)) {
      errors.push(`Row ${idx + 1}: invalid cutoff date format`)
      return
    }
    const [y] = row.cutoffDate.split('-').map(Number)
    if (y !== year) {
      errors.push(`Row ${idx + 1}: cutoff date must be in ${year}`)
    }
    if (seen.has(row.cutoffDate)) {
      errors.push(`Row ${idx + 1}: duplicate cutoff date ${row.cutoffDate}`)
    }
    seen.add(row.cutoffDate)
  })

  return errors
}

export default function FdotCutoffManager() {
  const [years, setYears] = useState<number[]>([])
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [rows, setRows] = useState<CutoffRow[]>([])
  const originalsRef = useRef<Record<number, ApiCutoff[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [csvText, setCsvText] = useState('')
  const [toast, setToast] = useState<{ open: boolean; message: string }>({ open: false, message: '' })
  const [dirty, setDirty] = useState(false)

  const showToast = useCallback((message: string) => setToast({ open: true, message }), [])
  const closeToast = useCallback(() => setToast({ open: false, message: '' }), [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/fdot-cutoffs', { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load cut-offs')
        const json = (await res.json()) as Partial<ApiResponse>
        const yearsList = Array.isArray(json.years) ? [...new Set(json.years.map(Number))].sort((a, b) => a - b) : []
        const grouped: Record<number, ApiCutoff[]> = {}
        if (json.cutoffs && typeof json.cutoffs === 'object') {
          Object.entries(json.cutoffs).forEach(([key, value]) => {
            const yr = Number(key)
            if (!Number.isFinite(yr)) return
            const arr = Array.isArray(value)
              ? value.map(item => ({
                  id: item.id ?? '',
                  cutoffDate: (item.cutoffDate ?? '').slice(0, 10),
                  label: item.label ?? null,
                }))
              : []
            grouped[yr] = arr
          })
        }
        originalsRef.current = grouped
        setYears(yearsList.length ? yearsList : [])
        const defaultYear = yearsList.includes(new Date().getUTCFullYear())
          ? new Date().getUTCFullYear()
          : yearsList[yearsList.length - 1] ?? null
        setSelectedYear(defaultYear)
        if (defaultYear != null) {
          const base = grouped[defaultYear] ?? []
          setRows(base.map(item => ({
            id: item.id || null,
            cutoffDate: item.cutoffDate,
            label: item.label ?? '',
            tempId: makeTempId(),
          })))
        } else {
          setRows([])
        }
        setDirty(false)
      } catch (err) {
        console.error(err)
        showToast('Failed to load FDOT cut-off dates')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [showToast])

  const onSelectYear = useCallback((value: string) => {
    if (value === 'add') {
      const input = window.prompt('Enter year (e.g., 2025)')
      if (!input) return
      const year = Number.parseInt(input, 10)
      if (!Number.isFinite(year) || year < 2000 || year > 2100) {
        showToast('Invalid year')
        return
      }
      setYears(prev => {
        const set = new Set(prev)
        set.add(year)
        return Array.from(set).sort((a, b) => a - b)
      })
      const existing = originalsRef.current[year] ?? []
      setRows(existing.map(item => ({
        id: item.id || null,
        cutoffDate: item.cutoffDate,
        label: item.label ?? '',
        tempId: makeTempId(),
      })))
      setSelectedYear(year)
      setDirty(false)
      setErrors([])
      return
    }
    const year = Number.parseInt(value, 10)
    if (!Number.isFinite(year)) return
    setSelectedYear(year)
    const existing = originalsRef.current[year] ?? []
    setRows(existing.map(item => ({
      id: item.id || null,
      cutoffDate: item.cutoffDate,
      label: item.label ?? '',
      tempId: makeTempId(),
    })))
    setDirty(false)
    setErrors([])
  }, [showToast])

  const addRow = useCallback(() => {
    setRows(prev => [...prev, { id: null, cutoffDate: '', label: '', tempId: makeTempId() }])
    setDirty(true)
  }, [])

  const updateRow = useCallback((tempId: string, field: 'cutoffDate' | 'label', value: string) => {
    setRows(prev => prev.map(row => (row.tempId === tempId ? { ...row, [field]: value } : row)))
    setDirty(true)
  }, [])

  const deleteRow = useCallback((tempId: string) => {
    setRows(prev => prev.filter(row => row.tempId !== tempId))
    setDirty(true)
  }, [])

  const applyImport = useCallback(() => {
    if (selectedYear == null) return
    const { rows: parsed, errors: errs } = parseImport(csvText, selectedYear)
    if (errs.length) {
      setErrors(errs)
      return
    }
    setRows(parsed)
    setDirty(true)
    setErrors([])
  }, [csvText, selectedYear])

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => a.cutoffDate.localeCompare(b.cutoffDate))
  }, [rows])

  const handleSave = useCallback(async () => {
    if (selectedYear == null) return
    const validationErrors = validateRows(sortedRows, selectedYear)
    if (validationErrors.length) {
      setErrors(validationErrors)
      return
    }
    setErrors([])
    setSaving(true)
    try {
      const res = await fetch(`/api/fdot-cutoffs/${selectedYear}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cutoffs: normalizeRows(sortedRows) }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        showToast(json.error || 'Failed to save cut-offs')
        return
      }
      const savedApi: ApiCutoff[] = Array.isArray(json.cutoffs)
        ? json.cutoffs.map((item: ApiCutoff) => ({
            id: item.id ?? '',
            cutoffDate: (item.cutoffDate ?? '').slice(0, 10),
            label: item.label ?? null,
          }))
        : []
      originalsRef.current[selectedYear] = savedApi
      setRows(
        savedApi.map(item => ({
          id: item.id || null,
          cutoffDate: item.cutoffDate,
          label: item.label ?? '',
          tempId: makeTempId(),
        })),
      )
      setDirty(false)
      showToast('Cut-off dates saved')
    } catch (err) {
      console.error(err)
      showToast('Failed to save cut-offs')
    } finally {
      setSaving(false)
    }
  }, [selectedYear, showToast, sortedRows])

  const unsavedWarning = dirty ? 'You have unsaved changes' : ''

  return (
    <div className="cutoff-manager">
      <Toast open={toast.open} message={toast.message} onClose={closeToast} />
      <div className="cutoff-header">
        <div>
          <h2>FDOT Cut-Off Dates</h2>
          <p className="helper">Manage FDOT cut-off Sundays per year.</p>
        </div>
        <div className="year-select">
          <label>
            Year
            <select
              value={selectedYear ?? ''}
              onChange={e => onSelectYear(e.target.value)}
              disabled={loading}
            >
              <option value="" disabled>
                Select year
              </option>
              {years.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
              <option value="add">➕ Add Year…</option>
            </select>
          </label>
        </div>
      </div>

      {unsavedWarning ? <div className="warning">{unsavedWarning}</div> : null}
      {errors.length ? (
        <div className="error-box">
          <ul>
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="cutoff-table-wrapper">
        <table className="cutoff-table">
          <thead>
            <tr>
              <th style={{ width: '180px' }}>Cut-Off Date</th>
              <th>Label</th>
              <th style={{ width: '80px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.length ? (
              sortedRows.map(row => (
                <tr key={row.tempId}>
                  <td>
                    <input
                      type="date"
                      value={row.cutoffDate}
                      onChange={e => updateRow(row.tempId, 'cutoffDate', e.target.value)}
                      disabled={loading}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={row.label}
                      placeholder="e.g., 2nd Sunday"
                      onChange={e => updateRow(row.tempId, 'label', e.target.value)}
                      disabled={loading}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => deleteRow(row.tempId)}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', color: '#666', padding: '1rem' }}>
                  {selectedYear == null ? 'Select a year to begin' : 'No cut-off dates yet'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="actions">
        <button type="button" className="btn ghost" onClick={addRow} disabled={selectedYear == null || loading}>
          Add Row
        </button>
        <button type="button" className="btn primary" onClick={handleSave} disabled={saving || selectedYear == null}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <section className="import-box">
        <h3>Bulk Import</h3>
        <p className="helper">Paste CSV rows with columns: cutoff_date,label</p>
        <textarea
          value={csvText}
          onChange={e => setCsvText(e.target.value)}
          placeholder={`2025-01-19,\n2025-02-16,\n2025-03-16,\n2025-04-13,2nd Sunday …`}
          rows={6}
        />
        <div className="import-actions">
          <button
            type="button"
            className="btn primary"
            onClick={applyImport}
            disabled={selectedYear == null || !csvText.trim()}
          >
            Replace with CSV
          </button>
          <button type="button" className="btn ghost" onClick={() => setCsvText('')}>
            Clear
          </button>
        </div>
      </section>
    </div>
  )
}
