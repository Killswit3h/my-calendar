'use client'

import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { useFormContext, useFieldArray, useWatch } from 'react-hook-form'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowData,
} from '@tanstack/react-table'

import type { EstimateFormT } from '@/lib/zod-estimates'

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    updateCell: (rowIndex: number, columnId: string, value: unknown) => void
    toggleNote: (rowIndex: number) => void
  }
}

type RowExtras = {
  item?: string
  markupPct?: number
  showNote?: boolean
}

const currency = (cents: number) =>
  (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })

type PayItemOption = {
  id: string
  number: string
  description: string
}

const useDebouncedValue = <T,>(value: T, delay = 200) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(id)
  }, [value, delay])
  return debounced
}

function ItemCell({
  rowId,
  value,
  onChange,
  onSelect,
}: {
  rowId: string
  value?: string
  onChange: (val: string) => void
  onSelect: (option: PayItemOption) => void
}) {
  const [inputValue, setInputValue] = useState(value ?? '')
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<PayItemOption[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const debounced = useDebouncedValue(open ? inputValue : '', 250)

  useEffect(() => {
    setInputValue(value ?? '')
  }, [value, rowId])

  useEffect(() => {
    if (!open) return
    const term = debounced.trim()
    if (!term) {
      setOptions([])
      setActiveIndex(-1)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    const params = new URLSearchParams({ take: '30', q: term })
    fetch(`/api/payitems?${params.toString()}`, { cache: 'no-store', signal: controller.signal })
      .then(async res => {
        if (!res.ok) throw new Error('Failed to load pay items')
        const json = await res.json()
        const rows: PayItemOption[] = Array.isArray(json?.items)
          ? json.items.map((item: any) => ({
              id: String(item.id),
              number: String(item.number),
              description: String(item.description ?? ''),
            }))
          : []
        setOptions(rows)
        setActiveIndex(rows.length ? 0 : -1)
      })
      .catch(() => {
        if (!controller.signal.aborted) setOptions([])
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [debounced, open])

  const selectOption = (option: PayItemOption) => {
    onSelect(option)
    setInputValue(option.number)
    setOpen(false)
    setActiveIndex(-1)
  }

  return (
    <div className="relative">
      <input
        className="w-full bg-transparent px-2 py-1 text-sm outline-none"
        value={inputValue}
        onChange={e => {
          const next = e.target.value
          setInputValue(next)
          onChange(next)
          setOpen(true)
        }}
        onFocus={() => {
          setOpen(true)
          setActiveIndex(-1)
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Item #"
        onKeyDown={e => {
          if (!open || !options.length) return
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActiveIndex(idx => Math.min(options.length - 1, idx + 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActiveIndex(idx => Math.max(0, idx - 1))
          } else if (e.key === 'Enter' && activeIndex >= 0) {
            e.preventDefault()
            selectOption(options[activeIndex])
          }
        }}
      />
      {open ? (
        <div className="absolute left-0 z-50 mt-1 max-h-72 min-w-[320px] overflow-auto rounded border bg-white text-sm shadow dark:bg-zinc-900">
          {loading ? (
            <div className="px-2 py-1 text-zinc-500">Searching…</div>
          ) : options.length === 0 ? (
            <div className="px-2 py-1 text-zinc-500">No matches</div>
          ) : (
            options.map((option, index) => (
              <button
                key={option.id}
                type="button"
                className={`block w-full px-3 py-2 text-left ${
                  index === activeIndex ? 'bg-zinc-100 dark:bg-zinc-800' : ''
                }`}
                onMouseDown={e => {
                  e.preventDefault()
                  selectOption(option)
                }}
              >
                <div className="font-medium">{option.number}</div>
                <div className="text-xs text-zinc-500">{option.description}</div>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}

export default function QBGrid() {
  const { control, getValues } = useFormContext<EstimateFormT>()
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'lineItems',
  })
  const watchedLineItems = useWatch({ control, name: 'lineItems' }) ?? []
  const [extras, setExtras] = useState<Record<string, RowExtras>>({})

  const tableData = useMemo(() => {
    return fields.map((field, index) => {
      const base = watchedLineItems[index] ?? {}
      const extra = extras[field.id] ?? {}
      return { ...base, ...extra, __rowId: field.id }
    })
  }, [fields, watchedLineItems, extras])

  const ensureRow = useCallback(
    (index: number) => {
      const all = getValues('lineItems') ?? []
      const current = all?.[index]
      return current ?? {
        sort: index + 1,
        description: '',
        qty: '1',
        uom: 'EA',
        rateCents: 0,
        taxable: false,
        note: '',
      }
    },
    [getValues],
  )

  const patchRow = useCallback(
    (index: number, patch: Partial<EstimateFormT['lineItems'][number]>) => {
      const base = ensureRow(index)
      const next = { ...base, ...patch }
      update(index, next as EstimateFormT['lineItems'][number])
    },
    [ensureRow, update],
  )

  const setExtra = useCallback((rowId: string, patch: Partial<RowExtras>) => {
    setExtras(prev => ({ ...prev, [rowId]: { ...(prev[rowId] ?? {}), ...patch } }))
  }, [])

  const columns = useMemo<ColumnDef<any>[]>(() => {
    const editableInput = (
      value: any,
      onChange: (val: string) => void,
      opts: { align?: 'right'; type?: string; asTextArea?: boolean } = {},
    ) => {
      if (opts.asTextArea) {
        return (
          <textarea
            className="w-full resize-none bg-transparent px-2 py-1 text-sm outline-none"
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
          />
        )
      }
      return (
        <input
          type={opts.type ?? 'text'}
          className={`w-full bg-transparent px-2 py-1 text-sm outline-none ${opts.align === 'right' ? 'text-right' : ''}`}
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
        />
      )
    }

    return [
      {
        header: 'Item',
        accessorKey: 'item',
        size: 180,
        cell: ({ row }) => {
          const rowId = (row.original as any).__rowId as string
          const current = extras[rowId]?.item ?? ''
          return (
            <ItemCell
              rowId={rowId}
              value={current}
              onChange={val => setExtra(rowId, { item: val })}
              onSelect={option => {
                setExtra(rowId, { item: option.number })
                patchRow(row.index, { description: option.description })
              }}
            />
          )
        },
      },
      {
        header: 'Description',
        accessorKey: 'description',
        size: 360,
        cell: ({ row, table, getValue }) =>
          editableInput(getValue<string>() ?? '', val => table.options.meta?.updateCell(row.index, 'description', val), {
            asTextArea: true,
          }),
      },
      {
        header: 'Qty',
        accessorKey: 'qty',
        size: 70,
        cell: ({ row, table, getValue }) =>
          editableInput(String(getValue() ?? '0'), val => table.options.meta?.updateCell(row.index, 'qty', val), {
            align: 'right',
          }),
      },
      {
        header: 'U/M',
        accessorKey: 'uom',
        size: 70,
        cell: ({ row, table, getValue }) =>
          editableInput(getValue<string>() ?? 'EA', val => table.options.meta?.updateCell(row.index, 'uom', val)),
      },
      {
        header: 'Cost (¢)',
        accessorKey: 'rateCents',
        size: 110,
        cell: ({ row, table, getValue }) =>
          editableInput(String(getValue() ?? 0), val => table.options.meta?.updateCell(row.index, 'rateCents', Number(val)), {
            align: 'right',
            type: 'number',
          }),
      },
      {
        header: 'Amount',
        accessorKey: 'amountCents',
        size: 140,
        cell: ({ row }) => {
          const qty = Number(row.original?.qty ?? 0)
          const cost = Number(row.original?.rateCents ?? 0)
          const amount = Math.round(qty * cost)
          return <div className="px-2 py-1 text-right">{currency(amount)}</div>
        },
      },
      {
        header: 'Markup %',
        accessorKey: 'markupPct',
        size: 100,
        cell: ({ row }) => {
          const rowId = (row.original as any).__rowId as string
          const current = extras[rowId]?.markupPct ?? 0
          return editableInput(
            String(current ?? 0),
            val => setExtra(rowId, { markupPct: Number(val) || 0 }),
            { align: 'right', type: 'number' },
          )
        },
      },
      {
        header: 'Total',
        accessorKey: 'totalCents',
        size: 140,
        cell: ({ row }) => {
          const qty = Number(row.original?.qty ?? 0)
          const cost = Number(row.original?.rateCents ?? 0)
          const amount = Math.round(qty * cost)
          const rowId = (row.original as any).__rowId as string
          const markup = extras[rowId]?.markupPct ?? 0
          const total = Math.round(amount * (1 + markup / 100))
          return <div className="px-2 py-1 text-right font-semibold">{currency(total)}</div>
        },
      },
      {
        header: 'Tax',
        accessorKey: 'taxable',
        size: 90,
        cell: ({ row, table, getValue }) => (
          <select
            className="w-full bg-transparent px-2 py-1 text-sm outline-none"
            value={(getValue<boolean>() ? 'Tax' : 'Non') as string}
            onChange={e => table.options.meta?.updateCell(row.index, 'taxable', e.target.value === 'Tax')}
          >
            <option value="Non">Non</option>
            <option value="Tax">Tax</option>
          </select>
        ),
      },
      {
        header: 'Note',
        id: 'noteToggle',
        size: 80,
        cell: ({ row, table }) => (
          <button
            type="button"
            className="text-sm text-indigo-600"
            onClick={() => table.options.meta?.toggleNote(row.index)}
          >
            Note
          </button>
        ),
      },
      {
        header: '',
        id: 'actions',
        size: 80,
        cell: ({ row }) => (
          <button
            type="button"
            className="text-sm text-red-600"
            onClick={() => {
              const rowId = (row.original as any).__rowId as string
              setExtras(prev => {
                const copy = { ...prev }
                delete copy[rowId]
                return copy
              })
              remove(row.index)
            }}
          >
            Remove
          </button>
        ),
      },
    ]
  }, [extras, remove, setExtra])

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: 'onChange',
    meta: {
      updateCell: (rowIndex, columnId, value) => {
        switch (columnId) {
          case 'description':
            patchRow(rowIndex, { description: String(value ?? '') })
            break
          case 'qty':
            patchRow(rowIndex, { qty: String(value ?? '0') })
            break
          case 'uom':
            patchRow(rowIndex, { uom: String(value ?? 'EA') })
            break
          case 'rateCents':
            patchRow(rowIndex, { rateCents: Number(value) || 0 })
            break
          case 'taxable':
            patchRow(rowIndex, { taxable: Boolean(value) })
            break
          case 'note':
            patchRow(rowIndex, { note: String(value ?? '') })
            break
          default:
            break
        }
      },
      toggleNote: rowIndex => {
        const rowId = fields[rowIndex]?.id
        if (!rowId) return
        setExtra(rowId, { showNote: !extras[rowId]?.showNote })
      },
    },
  })

  const addRow = () =>
    append({
      sort: fields.length + 1,
      description: '',
      qty: '1',
      uom: 'EA',
      rateCents: 0,
      taxable: false,
      note: '',
    })

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      const target = event.target as HTMLElement
      if (target.tagName === 'TEXTAREA') return
      event.preventDefault()
      addRow()
    }
  }

  return (
    <div className="rounded border bg-white shadow-sm dark:bg-zinc-950" onKeyDown={handleKeyDown}>
      <div className="overflow-auto">
        <div className="min-w-[1200px]">
          <div className="grid grid-cols-[160px_360px_70px_70px_110px_140px_100px_140px_90px_80px_80px] bg-zinc-100 text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
            {table.getFlatHeaders().map(header => (
              <div key={header.id} className="px-2 py-2 border-r border-zinc-200 dark:border-zinc-800">
                {flexRender(header.column.columnDef.header, header.getContext())}
              </div>
            ))}
          </div>
          {table.getRowModel().rows.map(row => {
            const rowId = (row.original as any).__rowId as string
            const showNote = extras[rowId]?.showNote
            const currentValues = getValues('lineItems') ?? []
            const noteValue = currentValues?.[row.index]?.note ?? ''
            return (
              <div key={row.id} className="border-t border-zinc-200 dark:border-zinc-800">
                <div className="grid grid-cols-[160px_360px_70px_70px_110px_140px_100px_140px_90px_80px_80px]">
                  {row.getVisibleCells().map(cell => (
                    <div key={cell.id} className="border-r border-zinc-200 px-1.5 py-1 last:border-r-0 dark:border-zinc-800">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  ))}
                </div>
                {showNote ? (
                  <div className="border-t border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <textarea
                      className="w-full rounded border px-2 py-1"
                      placeholder="Internal note"
                      value={noteValue ?? ''}
                      onChange={e => table.options.meta?.updateCell(row.index, 'note', e.target.value)}
                    />
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
      <div className="border-t border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
        <button
          type="button"
          onClick={addRow}
          className="rounded bg-zinc-900 px-3 py-1 text-sm text-white dark:bg-white dark:text-zinc-900"
        >
          Add line
        </button>
      </div>
    </div>
  )
}
