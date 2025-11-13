import type { Decimal } from '@prisma/client/runtime/library'

import { sumCents } from '@/lib/money'

type LineLike = { qty: string | number | Decimal; rateCents: number }

export function lineTotalCents(qty: string | number | Decimal, rateCents: number) {
  const quantity = Number(qty)
  if (Number.isNaN(quantity)) throw new Error(`Invalid qty ${qty}`)
  return Math.round(quantity * rateCents)
}

export function recomputeFromLines(lines: LineLike[], discountCents = 0, taxCents = 0) {
  const lineTotals = lines.map(line => lineTotalCents(line.qty, line.rateCents))
  const subtotalCents = sumCents(lineTotals)
  const totalCents = subtotalCents - discountCents + taxCents
  return { lineTotals, subtotalCents, totalCents }
}
