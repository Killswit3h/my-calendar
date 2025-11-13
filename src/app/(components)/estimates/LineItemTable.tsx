'use client'

import { useFieldArray, useFormContext } from 'react-hook-form'

import type { EstimateFormT } from '@/lib/zod-estimates'

export default function LineItemTable() {
  const { control, register, watch } = useFormContext<EstimateFormT>()
  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' })
  const items = watch('lineItems')

  const addRow = () =>
    append({
      sort: fields.length + 1,
      description: '',
      qty: '1',
      uom: 'EA',
      rateCents: 0,
      taxable: false,
    })

  return (
    <div className="overflow-hidden rounded-md border">
      <div className="grid grid-cols-12 bg-zinc-100 p-2 text-xs font-medium dark:bg-zinc-900">
        <div className="col-span-6">Item Description</div>
        <div className="col-span-1 text-right">Qty</div>
        <div className="col-span-1">U/M</div>
        <div className="col-span-2 text-right">Rate (¢)</div>
        <div className="col-span-2 text-right">Total (¢)</div>
      </div>
      {fields.map((field, index) => {
        const qty = Number(items?.[index]?.qty ?? 0)
        const rate = Number(items?.[index]?.rateCents ?? 0)
        const lineTotal = Math.round(qty * rate)

        return (
          <div key={field.id} className="grid grid-cols-12 items-start gap-2 border-t p-2">
            <input
              {...register(`lineItems.${index}.sort`, { valueAsNumber: true })}
              className="hidden"
              type="number"
            />
            <textarea
              {...register(`lineItems.${index}.description`)}
              className="col-span-6 min-h-[40px] rounded border px-2 py-1"
              placeholder="Describe the work..."
            />
            <input
              {...register(`lineItems.${index}.qty`)}
              className="col-span-1 rounded border px-2 py-1 text-right"
            />
            <input
              {...register(`lineItems.${index}.uom`)}
              className="col-span-1 rounded border px-2 py-1"
            />
            <input
              {...register(`lineItems.${index}.rateCents`, { valueAsNumber: true })}
              className="col-span-2 rounded border px-2 py-1 text-right"
              type="number"
            />
            <div className="col-span-2 self-center pr-2 text-right">{lineTotal.toLocaleString()}</div>
            <div className="col-span-12 flex justify-between">
              <input
                {...register(`lineItems.${index}.note`)}
                className="w-[80%] rounded border px-2 py-1 text-xs"
                placeholder="Optional note (prints smaller under description)"
              />
              <button type="button" className="text-sm text-red-600" onClick={() => remove(index)}>
                Remove
              </button>
            </div>
          </div>
        )
      })}
      <div className="p-2">
        <button type="button" className="rounded bg-zinc-900 px-3 py-1 text-sm text-white" onClick={addRow}>
          Add line
        </button>
      </div>
    </div>
  )
}

