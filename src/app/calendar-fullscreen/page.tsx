import CalendarWithData from '@/components/CalendarWithData'
import Link from 'next/link'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default function FullScreenCalendarPage() {
  return (
    <div className="cal-shell">
      <div className="p-4 border-b border-neutral-700 bg-neutral-900">
        <div className="flex items-center gap-4">
          <Link href="/" className="btn">
            ← Back to Dashboard
          </Link>
          <div>
            <h1 className="text-xl font-semibold">Calendar</h1>
            <p className="text-sm text-neutral-400">Manage your events and schedule</p>
          </div>
        </div>
      </div>
      <div className="p-4">
        <CalendarWithData calendarId="cme9wqhpe0000ht8sr5o3a6wf" />
      </div>
    </div>
  )
}
