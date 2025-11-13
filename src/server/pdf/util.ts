import dayjs from 'dayjs'

export const fmtUSD = (cents?: number | null) => {
  const dollars = (cents ?? 0) / 100
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(dollars)
}

export const fmtDate = (date: Date | string) => dayjs(date).format('MM/DD/YYYY')

export const safe = (value?: string | null) => value ?? ''
