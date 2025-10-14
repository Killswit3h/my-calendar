'use client'

import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

import { Toast } from '@/components/Toast'
import { cn } from '@/lib/theme'

type LocationItem = {
  id: string
  name: string
  sku: string
  unit: string
}

type LocationStock = {
  id: string
  qty: number
  item: LocationItem
}

type InventoryLocation = {
  id: string
  name: string
  code: string
  isTruck: boolean
  createdAt: string
  updatedAt: string
  stocks: LocationStock[]
}

type LocationsResponse = {
  locations: InventoryLocation[]
}

type CreateLocationBody = {
  name: string
  code: string
  isTruck: boolean
}

const EMPTY_FORM: CreateLocationBody = {
  name: '',
  code: '',
  isTruck: false,
}

export default function InventoryLocationsTab() {
  const [locations, setLocations] = useState<InventoryLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<CreateLocationBody>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ open: boolean; message: string }>({ open: false, message: '' })

  const showToast = useCallback((message: string) => setToast({ open: true, message }), [])
  const closeToast = useCallback(() => setToast({ open: false, message: '' }), [])

  const fetchLocations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/inventory/locations', { cache: 'no-store' })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.message || 'Failed to load inventory locations')
      }
      const json = (await res.json()) as LocationsResponse
      setLocations(Array.isArray(json.locations) ? json.locations : [])
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to load inventory locations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchLocations()
  }, [fetchLocations])

  const onChangeField = useCallback(<K extends keyof CreateLocationBody>(key: K, value: CreateLocationBody[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!form.name.trim() || !form.code.trim()) {
        showToast('Name and Code are required')
        return
      }
      setSaving(true)
      try {
        const payload: CreateLocationBody = {
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          isTruck: !!form.isTruck,
        }
        const res = await fetch('/api/inventory/locations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => null)
          throw new Error(json?.message || 'Failed to create inventory location')
        }
        setForm(EMPTY_FORM)
        await fetchLocations()
        showToast('Inventory location created')
      } catch (err) {
        console.error(err)
        showToast(err instanceof Error ? err.message : 'Failed to create inventory location')
      } finally {
        setSaving(false)
      }
    },
    [fetchLocations, form, showToast],
  )

  const rows = useMemo(() => {
    return locations.map(location => {
      const sortedStocks = [...(location.stocks ?? [])].sort((a, b) => b.qty - a.qty)
      const topStocks = sortedStocks.slice(0, 3)
      const totalQty = sortedStocks.reduce((sum, stock) => sum + stock.qty, 0)
      return {
        ...location,
        itemCount: sortedStocks.length,
        totalQty,
        topStocks,
      }
    })
  }, [locations])

  return (
    <div className="flex flex-col gap-6">
      <Toast open={toast.open} message={toast.message} onClose={closeToast} />

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-3xl border border-border bg-surface p-6 shadow-[0_20px_50px_rgba(12,32,21,0.14)]"
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Field label="Name" required>
            <input
              type="text"
              value={form.name}
              onChange={evt => onChangeField('name', evt.target.value)}
              placeholder="Warehouse A"
              required
            />
          </Field>
          <Field label="Code" required>
            <input
              type="text"
              value={form.code}
              onChange={evt => onChangeField('code', evt.target.value)}
              placeholder="WH-A"
              required
            />
          </Field>
          <Field label="Type" inline>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="checkbox"
                checked={form.isTruck}
                onChange={evt => onChangeField('isTruck', evt.target.checked)}
              />
              <span>Mobile (Truck)</span>
            </label>
          </Field>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="submit"
            className="btn primary"
            disabled={saving}
            style={{ padding: '8px 18px' }}
          >
            {saving ? 'Saving…' : 'Add Location'}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_16px_46px_rgba(12,32,21,0.12)]">
        <table className="min-w-full table-fixed">
          <thead style={{ background: 'var(--surface-strong)' }}>
            <tr>
              <TH>Location</TH>
              <TH>Type</TH>
              <TH>Items Stocked</TH>
              <TH>Total Qty</TH>
              <TH>Highlights</TH>
              <TH>Updated</TH>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <TD colSpan={6}>Loading locations…</TD>
              </tr>
            ) : error ? (
              <tr>
                <TD colSpan={6}>
                  <span style={{ color: 'var(--error)' }}>{error}</span>
                </TD>
              </tr>
            ) : rows.length ? (
              rows.map(location => (
                <tr key={location.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <TD>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <strong>{location.name}</strong>
                      <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{location.code}</span>
                    </div>
                  </TD>
                  <TD>{location.isTruck ? 'Truck' : 'Yard'}</TD>
                  <TD>{location.itemCount}</TD>
                  <TD>{location.totalQty}</TD>
                  <TD>
                    {location.topStocks.length ? (
                      <ul className="space-y-1 text-sm text-muted">
                        {location.topStocks.map(stock => (
                          <li key={stock.id}>
                            <span className="text-foreground">{stock.item.name}</span>{' '}
                            <span className="text-xs text-muted">
                              ({stock.qty} {stock.item.unit})
                            </span>
                          </li>
                        ))}
                        {location.itemCount > location.topStocks.length ? (
                          <li className="text-xs text-muted">
                            +{location.itemCount - location.topStocks.length} more
                          </li>
                        ) : null}
                      </ul>
                    ) : (
                      <span className="text-muted">No stock recorded</span>
                    )}
                  </TD>
                  <TD>{formatDate(location.updatedAt)}</TD>
                </tr>
              ))
            ) : (
              <tr>
                <TD colSpan={6}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span>No inventory locations yet.</span>
                    <span style={{ color: 'var(--muted)' }}>
                      Add your first yard or truck using the form above.
                    </span>
                  </div>
                </TD>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

type FieldProps = {
  label: string
  required?: boolean
  inline?: boolean
  children: React.ReactNode
}

function Field({ label, required, inline = false, children }: FieldProps) {
  return (
    <label className={cn('flex flex-col gap-1 text-sm text-muted', inline ? 'min-w-[120px]' : 'min-w-[180px]')}>
      <span className="font-semibold text-foreground">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </span>
      {children}
    </label>
  )
}

type CellProps = React.PropsWithChildren<{ colSpan?: number }>

function TH({ children }: React.PropsWithChildren) {
  return (
    <th
      style={{
        textAlign: 'left',
        padding: '12px',
        fontSize: '0.85rem',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: 'var(--muted)',
      }}
    >
      {children}
    </th>
  )
}

function TD({ children, colSpan }: CellProps) {
  return (
    <td style={{ padding: '12px', verticalAlign: 'top' }} colSpan={colSpan}>
      {children}
    </td>
  )
}

function formatDate(isoDate: string) {
  if (!isoDate) return '—'
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
