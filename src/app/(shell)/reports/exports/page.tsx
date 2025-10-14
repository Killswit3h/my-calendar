import { EmptyState } from '@/components/ui/EmptyState'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'

export default function ReportsExportsPage() {
  return (
    <EmptyState
      title="Exports"
      description="Push data to Excel, BI, or your data warehouse. Connect a destination to enable scheduled exports."
      action={
        <div className="flex flex-wrap items-center justify-center gap-2">
          <a className="btn" href="mailto:it@gfc.com?subject=Report%20Exports">Request export</a>
          <OpenCalendarLink className="border-dashed" />
        </div>
      }
    />
  )
}
