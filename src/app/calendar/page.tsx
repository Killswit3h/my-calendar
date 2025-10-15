// src/app/calendar/page.tsx
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import CalendarWithData from '@/components/CalendarWithData'
import BackButton from '@/components/BackButton'
import MonthView from '@/components/calendar/MonthView'
import { getEventsOverlapping } from '@/lib/events'
import { startOfMonth, endOfMonth, addDays } from 'date-fns'

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ view?: string; d?: string }> }) {
  const params = await searchParams
  const view = params?.view || 'fullcalendar'
  const base = params?.d ? new Date(params.d) : new Date()
  
  // For month view, fetch events with proper overlap query
  let monthEvents: any[] = []
  if (view === 'month') {
    const start = addDays(startOfMonth(base), -7) // buffer for leading week
    const end = addDays(endOfMonth(base), 7)      // buffer for trailing week
    const events = await getEventsOverlapping(start, end)
    monthEvents = events.map((e: any) => ({
      id: e.id,
      title: e.title,
      startsAt: e.startsAt,
      endsAt: e.endsAt,
      color: e.type ? getColorForType(e.type) : undefined
    }))
  }

  return (
    <main className="w-full max-w-full space-y-6">
      <BackButton />
      <header>
        <h1 className="text-3xl font-semibold">Calendar</h1>
        <p className="text-muted">Manage your events and schedule</p>
      </header>
      
      {/* View selector */}
      <div className="flex gap-2">
        <a 
          href="?view=fullcalendar" 
          className={`btn ${view === 'fullcalendar' ? 'btn-primary' : ''}`}
        >
          Full Calendar
        </a>
        <a 
          href="?view=month" 
          className={`btn ${view === 'month' ? 'btn-primary' : ''}`}
        >
          Month Grid
        </a>
      </div>
      
      <section className="card p-2 md:p-4 overflow-hidden">
        <div className="w-full">
          {view === 'month' ? (
            <MonthView monthDate={base} events={monthEvents} />
          ) : (
            <CalendarWithData calendarId="cme9wqhpe0000ht8sr5o3a6wf" />
          )}
        </div>
      </section>
    </main>
  )
}

function getColorForType(type: string): string {
  const colors: Record<string, string> = {
    'GUARDRAIL': 'rgba(34,197,94,0.35)',
    'FENCE': 'rgba(251,146,60,0.35)',
    'HANDRAIL': 'rgba(96,165,250,0.35)',
    'TEMP_FENCE': 'rgba(250,204,21,0.35)',
    'ATTENUATOR': 'rgba(239,68,68,0.35)',
  }
  return colors[type] || 'rgba(0,140,120,0.35)'
}