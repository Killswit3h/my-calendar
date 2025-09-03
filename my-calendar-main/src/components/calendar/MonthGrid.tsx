'use client'
import HolidayPill from '@/components/calendar/HolidayPill'

export type CalendarEvent = {
  id: string
  title: string
  startsAt: string
  endsAt: string
}

export type DayCell = {
  date: string
  events: CalendarEvent[]
  holiday?: { name: string; localName: string } | null
}

export default function MonthGrid({ days }: { days: DayCell[] }) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((d) => (
        <div
          key={d.date}
          className="relative h-32 p-1 border rounded-lg overflow-hidden"
        >
          {d.holiday && (
            <div className="absolute top-1 left-1 right-1">
              <HolidayPill title={d.holiday.localName} />
            </div>
          )}
          <div
            className={`text-right text-xs ${d.holiday ? 'mt-5' : ''}`}
          >
            {new Date(d.date).getUTCDate()}
          </div>
          <div className="mt-1 space-y-1 overflow-auto h-[calc(100%-1.75rem)] pr-0.5">
            {d.events.map((ev) => (
              <div
                key={ev.id}
                className="text-xs rounded-md px-2 py-1 bg-gray-200 truncate"
                title={ev.title}
              >
                {ev.title}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
