// src/app/(shell)/dashboard/page.tsx
import { PageHeader } from "../../../components/ui/PageHeader";
import KpiGrid from "../../../components/ui/KpiGrid";
import KpiCard from "../../../components/ui/KpiCard";
import ActionQueue from "../../../components/ui/ActionQueue";

import { getActionQueueGroups, getDashboardMetrics } from "../../../lib/dashboard/metrics";
import { CALENDAR_HOME_PATH } from "../../../lib/calendar/constants";
import Link from "next/link";

export const revalidate = 60;


const KPI_LABELS = [
  { key: "jobsActive", label: "Jobs active", helper: "Crews dispatched across markets", iconName: "MapPinned", change: 12.4, trend: "up" as const },
  { key: "invoicesPending", label: "Invoices pending", helper: "Awaiting signatures or submission", iconName: "Timer", change: 4.1, trend: "up" as const },
  { key: "inventoryLowStock", label: "Inventory low stock", helper: "Below reorder targets", iconName: "ArrowDownRight", change: 6.0, trend: "down" as const },
  { key: "crewHoursThisWeek", label: "Crew hours this week", helper: "Tracked from scheduled work orders", iconName: "ArrowUpRight", change: 5.7, trend: "up" as const, suffix: "hrs" },
  { key: "projectsBehindSchedule", label: "Projects behind", helper: "Needs recovery plans this week", iconName: "Compass", change: 2.1, trend: "down" as const },
  { key: "safetyAlertsOpen", label: "Safety alerts open", helper: "Incidents awaiting closeout", iconName: "CalendarDays", change: 1.8, trend: "neutral" as const },
] as const;

export default async function DashboardPage() {
  const [metrics, groups] = await Promise.all([getDashboardMetrics(), getActionQueueGroups()]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard"
        description="Unified view of jobs, crews, RFIs, and POs"
        actions={
          <div className="flex gap-2">
            <Link href={CALENDAR_HOME_PATH} className="px-3 py-1.5 rounded-lg token-accent text-sm">Open calendar</Link>
            <Link href="/reports/daily" className="px-3 py-1.5 rounded-lg bg-muted/10 text-sm token-fg border border-white/10">Daily report</Link>
          </div>
        }
      />

      <KpiGrid>
        {KPI_LABELS.map((k) => (
          <KpiCard
            key={k.key}
            label={k.label}
            value={Number((metrics as any)[k.key] ?? 0)}
            hint={k.helper}
            suffix={(k as any).suffix}
            change={k.change}
            trend={k.trend}
            iconName={k.iconName}
          />
        ))}
      </KpiGrid>

      <ActionQueue groups={groups} />
    </div>
  );
}
