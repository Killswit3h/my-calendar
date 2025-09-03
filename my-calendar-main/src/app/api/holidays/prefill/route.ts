import { NextResponse } from 'next/server'
import { upsertHolidays } from '@/lib/holidays'

export async function POST() {
  const year = new Date().getUTCFullYear()
  const countries = (process.env.HOLIDAY_COUNTRIES || 'US')
    .split(',')
    .map(s => s.trim().toUpperCase())
    .filter(Boolean)

  await Promise.all(countries.map(cc => upsertHolidays(year, cc)))
  return NextResponse.json({ ok: true, year, countries })
}
