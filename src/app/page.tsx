import Link from 'next/link'
import { ArrowDownRight, ArrowUpRight, CalendarDays, Compass, MapPinned, Radar, Timer, Clock, AlertTriangle, CheckCircle } from 'lucide-react'

import { getActionQueueGroups, getDashboardMetrics } from '@/lib/dashboard/metrics'
import { Card } from '@/components/ui/Card'
import { KpiCard } from '@/components/ui/KpiCard'
import { StatGrid } from '@/components/ui/StatGrid'
import { SkeletonRow } from '@/components/ui/Skeleton'

export const revalidate = 60

const KPI_LABELS: Array<{
  key: 'jobsActive' | 'invoicesPending' | 'inventoryLowStock' | 'crewHoursThisWeek' | 'projectsBehindSchedule' | 'safetyAlertsOpen'
  label: string
  helper: string
  suffix?: string
  icon: React.ComponentType<{ className?: string }>
  change: number
  trend: 'up' | 'down' | 'neutral'
}> = [
  {
    key: 'jobsActive',
    label: 'Jobs active',
    helper: 'Crews dispatched across markets',
    icon: MapPinned,
    change: 12.4,
    trend: 'up',
  },
  {
    key: 'invoicesPending',
    label: 'Invoices pending',
    helper: 'Awaiting signatures or submission',
    icon: Timer,
    change: 4.1,
    trend: 'up',
  },
  {
    key: 'inventoryLowStock',
    label: 'Inventory low stock',
    helper: 'Below reorder targets',
    icon: ArrowDownRight,
    change: 6.0,
    trend: 'down',
  },
  {
    key: 'crewHoursThisWeek',
    label: 'Crew hours this week',
    suffix: 'hrs',
    helper: 'Tracked from scheduled work orders',
    icon: ArrowUpRight,
    change: 5.7,
    trend: 'up',
  },
  {
    key: 'projectsBehindSchedule',
    label: 'Projects behind',
    helper: 'Needs recovery plans this week',
    icon: Compass,
    change: 2.1,
    trend: 'down',
  },
  {
    key: 'safetyAlertsOpen',
    label: 'Safety alerts open',
    helper: 'Incidents awaiting closeout',
    icon: CalendarDays,
    change: 1.8,
    trend: 'neutral',
  },
]

const TODAY_SCHEDULE = [
  { id: 'sched-1', time: '07:30', crew: 'Crew 2', title: 'Barrier install – Broward', location: 'US-27 staging', status: 'Dispatched' },
  { id: 'sched-2', time: '09:00', crew: 'Crew 5', title: 'Fence demo – Port Everglades', location: 'Gate 14', status: 'On site' },
  { id: 'sched-3', time: '12:30', crew: 'Crew 1', title: 'Materials pickup', location: 'Miami Yard', status: 'Queued' },
]

const RISK_NOTES = [
  { id: 'risk-1', title: 'Weather shift late Thursday', detail: 'Rain window moves in after 6 PM—adjust pour schedule.', level: 'Watch' },
  { id: 'risk-2', title: 'Night shift overtime', detail: 'Crew 4 projected at 64 hrs—review rotations.', level: 'Action' },
]

const COMPLETED_HIGHLIGHTS = [
  { id: 'done-1', title: 'Guardrail tension review', owner: 'Dana Cooper', completedAt: '06:40' },
  { id: 'done-2', title: 'Daily logistics sync', owner: 'Logistics Bot', completedAt: '07:05' },
  { id: 'done-3', title: 'Segment 4 lane closure notice', owner: 'Traffic Control', completedAt: '07:15' },
]

export default async function DashboardPage() {
  let metrics: Awaited<ReturnType<typeof getDashboardMetrics>>
  let queueGroups: Awaited<ReturnType<typeof getActionQueueGroups>>
  
  try {
    [metrics, queueGroups] = await Promise.all([getDashboardMetrics(), getActionQueueGroups()])
  } catch (error) {
    // Fallback to empty data if database is not available during build
    console.warn('Database not available during build, using fallback data:', error)
    metrics = {
      jobsActive: 0,
      invoicesPending: 0,
      inventoryLowStock: 0,
      crewHoursThisWeek: 0,
      projectsBehindSchedule: 0,
      safetyAlertsOpen: 0,
    }
    queueGroups = []
  }
  
  const actionableItems = queueGroups
    .flatMap(group =>
      group.items.slice(0, 2).map(item => ({
        ...item,
        groupKey: group.key,
      })),
    )
    .slice(0, 4)

export default function Home() {
  return (
    <div className="space-y-8">
      <Card tone="glass" className="relative overflow-hidden p-0" data-testid="dashboard-hero">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(74,222,128,0.18),transparent_55%),linear-gradient(135deg,rgba(23,34,22,0.6),rgba(8,14,10,0.2))]" />
        <div className="relative grid gap-6 px-6 py-6 md:grid-cols-[minmax(0,1fr)_320px] md:items-start">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.32em] text-muted">
              <Radar className="h-3.5 w-3.5" /> AI brief
            </span>
            <h1 className="text-2xl font-semibold leading-tight text-foreground md:text-3xl">
              Crews are staging for three overnight installs and one guardrail repair. Weather stays clear—advance the Thursday
              pour to Wednesday to stay ahead of weekend temps.
            </h1>
            <p className="text-sm text-muted">
              Operations dashboard for tracking projects, employees, and work events.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/projects" className="inline-flex items-center gap-2 rounded-full bg-[var(--gfc-green)] px-5 py-2 text-sm font-semibold text-white shadow-card transition hover:scale-[1.02]">
                <CalendarDays className="h-4 w-4" />
                View Projects
              </Link>
              <Link href="/reports/daily" className="inline-flex items-center gap-2 rounded-full border border-border/60 px-5 py-2 text-sm font-semibold text-foreground transition hover:border-border">
                Daily report
              </Link>
            </div>
          </div>
          <div className="glass rounded-2xl border border-border/50 px-5 py-4 shadow-card">
            <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">Crew snapshot</h2>
            <dl className="mt-4 space-y-3 text-sm text-muted">
              <div className="flex items-center justify-between text-foreground">
                <dt>Crews deployed</dt>
                <dd className="font-semibold">12</dd>
              </div>
              <div className="flex items-center justify-between text-foreground">
                <dt>Standby resources</dt>
                <dd className="font-semibold">3 teams</dd>
              </div>
              <div className="flex items-center justify-between text-foreground">
                <dt>Overtime risk</dt>
                <dd className="font-semibold text-warning">Watchlist</dd>
              </div>
            </dl>
          </div>
        </div>
      </Card>

      <StatGrid>
        {KPI_LABELS.map(item => {
          const value = metrics[item.key]
          return (
            <KpiCard
              key={item.key}
              title={item.label}
              value={value}
              suffix={item.suffix}
              helper={item.helper}
              change={item.change}
              trend={item.trend}
              icon={item.icon}
            />
          )
        })}
      </StatGrid>

      <Card tone="glass" className="space-y-5">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.28em] text-muted">Action queue</h2>
            <p className="text-sm text-muted">Approvals, RFIs, and expiring items surfaced from across modules.</p>
          </div>
          <nav className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-muted">
            {queueGroups.map(group => (
              <span key={group.key} className="rounded-full border border-border/60 px-3 py-1">
                {group.label}
              </span>
            ))}
          </nav>
        </header>
        <div className="grid gap-3 sm:grid-cols-2">
          {actionableItems.map(item => (
            <Link
              key={`${item.groupKey}-${item.id}`}
              href={item.href}
              className="group rounded-2xl border border-border/40 bg-surface-soft/70 px-5 py-4 text-sm transition hover:border-[var(--gfc-green)] hover:shadow-card"
            >
              <p className="font-semibold text-foreground group-hover:text-foreground/90">{item.title}</p>
              {item.description ? <p className="text-muted">{item.description}</p> : null}
              {item.due ? (
                <p className="pt-2 text-xs text-muted">
                  Due {new Date(item.due).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </p>
              ) : null}
            </Link>
          ))}
          {!actionableItems.length ? (
            <Card tone="muted" className="col-span-2 flex items-center justify-center py-10 text-sm text-muted">
              Nothing pending right now—enjoy the clear runway.
            </Card>
          ) : null}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card tone="glass" className="space-y-4">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.28em] text-muted">Today's schedule</h2>
              <p className="text-sm text-muted">Live dispatch updates from the field.</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/40 px-3 py-1 text-xs uppercase tracking-[0.24em] text-muted">
              <Clock className="h-3 w-3" /> EST
            </span>
          </header>
          <ol className="space-y-3">
            {TODAY_SCHEDULE.map(item => (
              <li key={item.id} className="rounded-2xl border border-border/40 bg-surface-soft/70 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">{item.time}</p>
                    <p className="text-base font-semibold text-foreground">{item.title}</p>
                    <p className="text-sm text-muted">{item.location} • {item.crew}</p>
                  </div>
                  <span className="rounded-full border border-border/50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                    {item.status}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </Card>
        <div className="space-y-4">
          <Card tone="glass" className="space-y-3">
            <header className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-muted">
              <AlertTriangle className="h-4 w-4 text-warning" /> Risks & escalations
            </header>
            <ul className="space-y-3">
              {RISK_NOTES.map(item => (
                <li key={item.id} className="rounded-2xl border border-border/40 bg-surface-soft/70 px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted">{item.detail}</p>
                  <span className="mt-2 inline-flex items-center gap-2 rounded-full border border-border/40 px-2 py-1 text-[11px] uppercase tracking-[0.24em] text-warning">
                    {item.level}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
          <Card tone="glass" className="space-y-3">
            <header className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-muted">
              <CheckCircle className="h-4 w-4 text-success" /> Completed this morning
            </header>
            <ul className="space-y-2">
              {COMPLETED_HIGHLIGHTS.map(item => (
                <li key={item.id} className="rounded-2xl border border-border/30 bg-surface-soft/70 px-4 py-2.5 text-sm text-muted">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{item.title}</span>
                    <span className="text-xs uppercase tracking-[0.24em]">{item.completedAt}</span>
                  </div>
                  <span className="text-xs text-muted">Owner: {item.owner}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </main>
  );
}
