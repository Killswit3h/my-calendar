import CalendarWithData from '@/components/CalendarWithData'
import BackButton from '@/components/BackButton'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default function FullScreenCalendarPage() {
  return (
    <div className="fullscreen-calendar-container">
      <div className="calendar-top-bar">
        <BackButton />
        <div className="calendar-header-info">
          <h1 className="calendar-title">Calendar</h1>
          <p className="calendar-subtitle">Manage your events and schedule</p>
        </div>
      </div>

      <div className="calendar-content">
        <CalendarWithData calendarId="cme9wqhpe0000ht8sr5o3a6wf" />
      </div>
    </div>
  )
}
