'use client'

import { useEffect } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'

import type { EstimateFormT } from '@/lib/zod-estimates'

const toNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

export default function TotalsCard() {
  const { control, setValue } = useFormContext<EstimateFormT>()
  const lines = useWatch({ control, name: 'lineItems' }) || []

  useEffect(() => {
    setValue('discountCents', 0, { shouldDirty: false })
    setValue('taxCents', 0, { shouldDirty: false })
  }, [setValue])

  const subtotal = lines.reduce((acc: number, line: any) => {
    const qty = toNumber(line?.qty)
    const rate = toNumber(line?.rateCents)
    return acc + Math.round(qty * rate)
  }, 0)

  const total = subtotal

  return (
    <div className="w-full space-y-2 rounded border p-3 md:w-80">
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>{(subtotal / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
      </div>
      <div className="flex justify-between font-semibold">
        <span>Total</span>
        <span>{(total / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
      </div>
    </div>
  )
}
