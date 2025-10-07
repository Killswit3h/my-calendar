export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'

// Minimal “day only” shape for FullCalendar background events
type NagerHoliday = {
  date: string
  localName: string
  name: string
  countryCode: string
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const year = Number(searchParams.get('year') ?? new Date().getUTCFullYear())
  const country = (searchParams.get('country') ?? 'US').toUpperCase()

  const r = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${country}`, {
    // cache holidays for the year
    next: { revalidate: 60 * 60 * 24 * 7 }
  })
  if (!r.ok) return NextResponse.json({ holidays: [] }, { status: 200 })

  const data = (await r.json()) as NagerHoliday[]

  // Return only what the UI needs
  const holidays = data.map(h => ({
    date: h.date,            // YYYY-MM-DD
    title: h.localName || h.name,
    countryCode: h.countryCode
  }))

  return NextResponse.json({ holidays })
}
