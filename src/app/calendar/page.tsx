import CalendarWithData from '@/components/CalendarWithData'
import BackButton from '@/components/BackButton'
import { CalendarAccessPanel } from '@/components/calendar/CalendarAccessPanel'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default function CalendarPage() {
  return (
    <main className="w-full max-w-full space-y-6">
      <BackButton />
      <header>
        <h1 className="text-3xl font-semibold">Calendar</h1>
        <p className="text-muted">Manage your events and schedule</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="card overflow-hidden p-2 md:p-4">
          <div className="w-full">
            <CalendarWithData calendarId="cme9wqhpe0000ht8sr5o3a6wf" />
          </div>
        </section>
        <CalendarAccessPanel className="h-fit" />
      </div>
    </main>
  )
}