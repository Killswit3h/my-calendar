import { notFound } from 'next/navigation'

import { EmptyState } from '@/components/ui/EmptyState'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'
import { KpiCard } from '@/components/ui/KpiCard'
import { StatGrid } from '@/components/ui/StatGrid'
import { PROJECT_FIXTURES } from '@/lib/fixtures/modules'

export default async function ProjectOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = PROJECT_FIXTURES.find(item => item.id === id)
  if (!project) notFound()

  return (
    <div className="flex flex-col gap-6">
      <StatGrid>
        <KpiCard title="Schedule" value={78} suffix="%" change={1.6} trend="up" helper="Percent complete" />
        <KpiCard title="Budget" value={92} suffix="%" change={-2.1} trend="down" helper="Spent vs budget" />
        <KpiCard title="RFIs" value={4} suffix="open" trend="neutral" helper="Linked to this project" />
        <KpiCard title="Submittals" value={3} suffix="pending" trend="neutral" helper="Awaiting review" />
      </StatGrid>
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-glass">
        <h2 className="text-base font-semibold text-foreground">Highlights</h2>
        <ul className="mt-4 space-y-3 text-sm text-muted">
          <li>• Panel deliveries staged for Wednesday night shift.</li>
          <li>• DOT inspection scheduled for Friday 7:30 AM.</li>
          <li>• Coordinate crane blackout with port authority before Monday.</li>
        </ul>
      </section>
      <EmptyState
        title="Link Primavera, Procore, or BIM data"
        description="Drop in your project connector to visualize the full schedule, Gantt, and document links."
        action={<OpenCalendarLink />}
      />
    </div>
  )
}
