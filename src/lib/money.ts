export function toCents(dollars: number): number {
  return Math.round(dollars * 100)
}

export function fromCents(cents: number): number {
  return cents / 100
}

export function formatUSD(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export function sumCents(amounts: number[]): number {
  return amounts.reduce((sum, amount) => sum + amount, 0)
}

export function mulQtyRate(qty: string | number, rateCents: number): number {
  const quantity = typeof qty === 'string' ? parseFloat(qty) : qty
  if (Number.isNaN(quantity)) return 0
  return Math.round(quantity * rateCents)
}

export function computeTotals(lineTotals: number[], discountCents: number, taxCents: number): { subtotal: number; total: number } {
  const subtotal = sumCents(lineTotals)
  const total = subtotal - discountCents + taxCents
  return { subtotal, total }
}
