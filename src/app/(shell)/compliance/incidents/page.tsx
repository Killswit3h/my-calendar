import { DataTable, type TableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Toolbar } from '@/components/ui/Toolbar'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'
import { COMPLIANCE_FIXTURES, type ComplianceFixture } from '@/lib/fixtures/modules'

const columns: TableColumn<ComplianceFixture>[] = [
  { key: 'id', header: 'Incident', width: 140 },
  { key: 'reference', header: 'Reference', width: 260 },
  { key: 'owner', header: 'Owner', width: 160 },
  { key: 'status', header: 'Status', width: 140 },
  { key: 'due', header: 'Due', width: 140 },
]

export default function ComplianceIncidentsPage() {
  const rows = COMPLIANCE_FIXTURES.filter(item => item.type === 'Incident')
  return (
    <div className="space-y-4">
      <Toolbar>
        <div className="text-sm text-muted">{rows.length} incidents logged</div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <button type="button" className="focus-ring rounded-full border border-border/60 px-3 py-1 transition hover:border-border hover:text-foreground">
            Export log
          </button>
        </div>
      </Toolbar>
      <DataTable
        data={rows}
        columns={columns}
        skeletonCount={4}
        emptyMessage={
          <EmptyState
            title="Zero incidents"
            description="Keep logging near-misses and corrective actions."
            action={<OpenCalendarLink />}
          />
        }
      />
    </div>
  )
}
