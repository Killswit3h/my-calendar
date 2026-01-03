import CalendarWithData from '@/components/CalendarWithData'
import Link from 'next/link'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default function FullScreenCalendarPage() {
  return (
    <div className="cal-shell">
      <div className="p-4">
        <CalendarWithData calendarId="cme9wqhpe0000ht8sr5o3a6wf" />
      </div>
    </div>
  )
}
