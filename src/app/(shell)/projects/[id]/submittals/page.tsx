import { DataTable, type TableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Toolbar } from '@/components/ui/Toolbar'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'

const SUBMITTALS = [
  { id: 'SUB-118', title: 'Chain link fabric mockup', status: 'Approved', reviewer: 'Owner', due: '2024-09-22' },
  { id: 'SUB-121', title: 'Crash barrier anchorage', status: 'Pending', reviewer: 'Engineer', due: '2024-09-26' },
]

type SubmittalRow = (typeof SUBMITTALS)[number]

const columns: TableColumn<SubmittalRow>[] = [
  { key: 'id', header: 'Submittal', width: 140 },
  { key: 'title', header: 'Title', width: 260 },
  { key: 'status', header: 'Status', width: 140 },
  { key: 'reviewer', header: 'Reviewer', width: 160 },
  { key: 'due', header: 'Due', width: 140 },
]

export default function ProjectSubmittalsPage() {
  return (
    <div className="space-y-4">
      <Toolbar>
        <div className="text-sm text-muted">{SUBMITTALS.length} submittals in progress</div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <button type="button" className="focus-ring rounded-full border border-border/60 px-3 py-1 transition hover:border-border hover:text-foreground">
            Export log
          </button>
        </div>
      </Toolbar>
      <DataTable
        data={SUBMITTALS}
        columns={columns}
        skeletonCount={3}
        emptyMessage={
          <EmptyState
            title="No submittals"
            description="Upload submittals or sync from your document control system."
            action={<OpenCalendarLink />}
          />
        }
      />
    </div>
  )
}
