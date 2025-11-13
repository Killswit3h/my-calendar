const toNumber = (value: number | string) => {
  const n = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(n)) {
    throw new Error(`Invalid numeric value: ${value}`)
  }
  return n
}

export const toCents = (amount: number | string) => Math.round(toNumber(amount) * 100)

export const fromCents = (cents: number) => cents / 100

export const mulQtyRate = (qty: number | string, rateCents: number) => {
  const quantity = toNumber(qty)
  return Math.round(quantity * rateCents)
}

export const sumCents = (values: number[]) => values.reduce((acc, v) => acc + v, 0)

export const computeTotals = (lineTotals: number[], discountCents = 0, taxCents = 0) => {
  const subtotal = sumCents(lineTotals)
  const total = subtotal - discountCents + taxCents
  return { subtotal, total }
}

export const formatUSD = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(fromCents(cents))
