import { describe, it, expect } from 'vitest'

import { computeTotals, fromCents, mulQtyRate, toCents } from '../lib/money'

describe('money helpers', () => {
  it('converts to cents and back', () => {
    const cents = toCents(12.34)
    expect(cents).toBe(1234)
    expect(fromCents(cents)).toBeCloseTo(12.34, 6)
  })

  it('handles decimal quantities when multiplying', () => {
    const total = mulQtyRate('150.00', 18500)
    expect(total).toBe(2775000)
  })

  it('aggregates totals with discounts and tax', () => {
    const { subtotal, total } = computeTotals([100, 200, 300], 50, 20)
    expect(subtotal).toBe(600)
    expect(total).toBe(570)
  })
})
