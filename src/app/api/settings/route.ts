export const runtime = 'edge'
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getSettings, saveSettings } from '@/lib/settings'

export async function GET() {
  const s = await getSettings()
  return NextResponse.json(s)
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const s = await saveSettings({
    showHolidays: typeof body.showHolidays === 'boolean' ? body.showHolidays : undefined,
    countryCode: typeof body.countryCode === 'string' ? body.countryCode.toUpperCase() : undefined,
    useIcs: typeof body.useIcs === 'boolean' ? body.useIcs : undefined,
    icsUrl: typeof body.icsUrl === 'string' ? body.icsUrl : undefined,
  })
  return NextResponse.json(s)
}
