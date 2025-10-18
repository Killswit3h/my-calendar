'use client'

import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

import { Toast } from '@/components/Toast'
import { cn } from '@/lib/theme'

type InventoryLocation = {
  id: string
  name: string
  code: string
  isTruck: boolean
}

type InventoryStock = {
  id: string
  qty: number
  location: InventoryLocation
}

type InventoryCategory = {
  id: string
  name: string
  slug: string
}

type InventoryItem = {
  id: string
  sku: string
  name: string
  description: string | null
  unit: string
  isConsumable: boolean
  minStock: number
  barcode: string | null
  category: InventoryCategory | null
  defaultLocation: InventoryLocation | null
  stocks: InventoryStock[]
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

type InventoryItemResponse = {
  items: InventoryItem[]
}

type CreateItemBody = {
  sku: string
  name: string
  description?: string | null
  unit: string
  isConsumable: boolean
  minStock: number
  barcode?: string | null
}

const EMPTY_FORM: CreateItemBody = {
  sku: '',
  name: '',
  description: '',
  unit: '',
  isConsumable: false,
  minStock: 0,
  barcode: '',
}

export default function InventoryItemsTab() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<CreateItemBody>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ open: boolean; message: string }>({ open: false, message: '' })

  const showToast = useCallback((message: string) => setToast({ open: true, message }), [])
  const closeToast = useCallback(() => setToast({ open: false, message: '' }), [])

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/inventory/items', { cache: 'no-store' })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.message || 'Failed to load inventory items')
      }
      const json = (await res.json()) as InventoryItemResponse
      setItems(Array.isArray(json.items) ? json.items : [])
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to load inventory items')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchItems()
  }, [fetchItems])

  const onChangeField = useCallback(<K extends keyof CreateItemBody>(key: K, value: CreateItemBody[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSubmit = useCallback(
    async (evt: FormEvent) => {
      evt.preventDefault()
      if (!form.sku.trim() || !form.name.trim() || !form.unit.trim()) {
        showToast('SKU, Name, and Unit are required')
        return
      }
      setSaving(true)
      try {
        const payload: CreateItemBody = {
          sku: form.sku.trim(),
          name: form.name.trim(),
          unit: form.unit.trim(),
          isConsumable: !!form.isConsumable,
          minStock: Number.isFinite(form.minStock) ? form.minStock : 0,
        }
        if (form.description && form.description.trim()) payload.description = form.description.trim()
        if (form.barcode && form.barcode.trim()) payload.barcode = form.barcode.trim()

        const res = await fetch('/api/inventory/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => null)
          throw new Error(json?.message || 'Failed to create inventory item')
        }
        setForm(EMPTY_FORM)
        await fetchItems()
        showToast('Inventory item created')
      } catch (err) {
        console.error(err)
        showToast(err instanceof Error ? err.message : 'Failed to create inventory item')
      } finally {
        setSaving(false)
      }
    },
    [fetchItems, form, showToast],
  )

  const rows = useMemo(() => {
    return items.map(item => {
      const onHand = item.stocks.reduce((sum, stock) => sum + stock.qty, 0)
      return { ...item, onHand }
    })
  }, [items])

  return (
    <div className="flex flex-col gap-6">
      <Toast open={toast.open} message={toast.message} onClose={closeToast} />

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-3xl border border-border bg-surface p-6 shadow-[0_20px_50px_rgba(12,32,21,0.14)]"
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Field label="SKU" required>
            <input
              type="text"
              value={form.sku}
              onChange={evt => onChangeField('sku', evt.target.value)}
              placeholder="e.g. TOOL-001"
              required
            />
          </Field>
          <Field label="Name" required>
            <input
              type="text"
              value={form.name}
              onChange={evt => onChangeField('name', evt.target.value)}
              placeholder="Item name"
              required
            />
          </Field>
          <Field label="Unit" required>
            <input
              type="text"
              value={form.unit}
              onChange={evt => onChangeField('unit', evt.target.value)}
              placeholder="ea, set, bag"
              required
            />
          </Field>
          <Field label="Min Stock">
            <input
              type="number"
              min={0}
              step={1}
              value={form.minStock}
              onChange={evt => onChangeField('minStock', Number(evt.target.value))}
            />
          </Field>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Field label="Description">
            <input
              type="text"
              value={form.description ?? ''}
              onChange={evt => onChangeField('description', evt.target.value)}
              placeholder="Optional description"
            />
          </Field>
          <Field label="Barcode">
            <input
              type="text"
              value={form.barcode ?? ''}
              onChange={evt => onChangeField('barcode', evt.target.value)}
              placeholder="Optional barcode"
            />
          </Field>
          <Field label="Consumable" inline>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="checkbox"
                checked={form.isConsumable}
                onChange={evt => onChangeField('isConsumable', evt.target.checked)}
              />
              <span>Consumable</span>
            </label>
          </Field>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="submit"
            className="btn primary"
            disabled={saving}
            style={{ padding: '8px 16px' }}
          >
            {saving ? 'Saving…' : 'Add Item'}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_16px_46px_rgba(12,32,21,0.12)]">
        <table className="min-w-full table-fixed">
          <thead style={{ background: 'var(--surface-strong)' }}>
            <tr>
              <TH>Name</TH>
              <TH>SKU</TH>
              <TH>Unit</TH>
              <TH>Type</TH>
              <TH>Min Stock</TH>
              <TH>On-Hand</TH>
              <TH>Default Location</TH>
              <TH>Category</TH>
              <TH>Status</TH>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <TD colSpan={9}>
                  <span>Loading inventory…</span>
                </TD>
              </tr>
            ) : error ? (
              <tr>
                <TD colSpan={9}>
                  <span style={{ color: 'var(--error)' }}>{error}</span>
                </TD>
              </tr>
            ) : rows.length ? (
              rows.map(item => (
                <tr key={item.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <TD>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong>{item.name}</strong>
                      {item.description ? (
                        <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{item.description}</span>
                      ) : null}
                    </div>
                  </TD>
                  <TD>{item.sku}</TD>
                  <TD>{item.unit}</TD>
                  <TD>{item.isConsumable ? 'Consumable' : 'Tool'}</TD>
                  <TD>{item.minStock}</TD>
                  <TD>{item.onHand}</TD>
                  <TD>{item.defaultLocation ? item.defaultLocation.name : '—'}</TD>
                  <TD>{item.category ? item.category.name : '—'}</TD>
                  <TD>
                    {item.deletedAt ? (
                      <span style={{ color: 'var(--muted)' }}>Archived</span>
                    ) : (
                      <span style={{ color: 'var(--success)' }}>Active</span>
                    )}
                  </TD>
                </tr>
              ))
            ) : (
              <tr>
                <TD colSpan={9}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span>No inventory items yet.</span>
                    <span style={{ color: 'var(--muted)' }}>Add your first tool or consumable using the form above.</span>
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
    <label className={cn('flex flex-col gap-1 text-sm text-muted', inline ? '' : 'min-w-[180px]')}>
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
