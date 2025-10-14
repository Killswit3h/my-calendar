import { DailyAutoReports } from '@/components/reports/DailyAutoReports'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'

export default function ReportsDailyPage() {
  return (
    <div className="grid gap-6">
      <Card tone="glass">
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-foreground">Daily auto-saved reports</h2>
          <p className="text-sm text-muted">The latest 14 days of PDF and Excel snapshots are ready for download.</p>
        </div>
        <div className="mt-4">
          <DailyAutoReports />
        </div>
      </Card>
      <EmptyState
        title="Need more history?"
        description="Connect your blob storage or BI workspace to archive full report history."
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <a className="btn" href="mailto:it@gfc.com?subject=Daily%20report%20retention">Request retention</a>
            <OpenCalendarLink className="border-dashed" />
          </div>
        }
      />
    </div>
  )
}
