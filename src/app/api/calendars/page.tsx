import MonthGrid from '@/components/calendar/MonthGrid'
import { getMonthGrid } from '@/server/calendarData'

function toClientEvent(ev: any) {
  return { ...ev, startsAt: ev.startsAt.toISOString(), endsAt: ev.endsAt.toISOString() }
}

export default async function CalendarPage({ searchParams }: { searchParams: { y?: string; m?: string } }) {
  const now = new Date()
  const year = Number(searchParams.y ?? now.getUTCFullYear())
  const month0 = Number(searchParams.m ?? now.getUTCMonth()) // 0-based
  const days = await getMonthGrid(year, month0, 'US') // hard-coded US; switch to settings later

  return (
    <div className="space-y-4 p-4">
      <MonthGrid
        days={days.map(d => ({
          date: d.date.toISOString(),
          holiday: d.holiday,
          events: d.events.map(toClientEvent),
        }))}
      />
    </div>
  )
}
