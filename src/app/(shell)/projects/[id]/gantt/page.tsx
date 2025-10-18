import { EmptyState } from '@/components/ui/EmptyState'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'

export default function ProjectGanttPage() {
  return (
    <EmptyState
      title="Gantt integration coming soon"
      description="Connect your scheduling source to visualize crew load and dependencies."
      action={
        <div className="flex flex-wrap items-center justify-center gap-2">
          <a className="btn" href="mailto:it@gfc.com?subject=Gantt%20Integration">Request integration</a>
          <OpenCalendarLink className="border-dashed" />
        </div>
      }
    />
  )
}
