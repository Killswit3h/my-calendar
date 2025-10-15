// src/app/calendar/page.tsx
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import CalendarWithData from '@/components/CalendarWithData'
import BackButton from '@/components/BackButton'

export default function CalendarPage() {
  return (
    <main className="mx-auto max-w-7xl space-y-6">
      <BackButton />
      <header>
        <h1 className="text-3xl font-semibold">Calendar</h1>
        <p className="text-muted">Manage your events and schedule</p>
      </header>
      <section className="card p-4">
        <CalendarWithData calendarId="cme9wqhpe0000ht8sr5o3a6wf" />
      </section>
    </main>
  )
}