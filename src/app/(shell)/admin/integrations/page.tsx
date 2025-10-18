import { DataTable, type TableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Toolbar } from '@/components/ui/Toolbar'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'
import { ADMIN_FIXTURES, type AdminFixture } from '@/lib/fixtures/modules'

const columns: TableColumn<AdminFixture>[] = [
  { key: 'id', header: 'Integration', width: 160 },
  { key: 'name', header: 'Name', width: 240 },
  { key: 'status', header: 'Status', width: 160 },
  { key: 'updatedAt', header: 'Last Sync', width: 160 },
]

export default function AdminIntegrationsPage() {
  const rows = ADMIN_FIXTURES.filter(item => item.type === 'Integration')
  return (
    <div className="space-y-4">
      <Toolbar>
        <div className="text-sm text-muted">{rows.length} integrations</div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <button type="button" className="focus-ring rounded-full border border-border/60 px-3 py-1 transition hover:border-border hover:text-foreground">
            Sync now
          </button>
        </div>
      </Toolbar>
      <DataTable
        data={rows}
        columns={columns}
        skeletonCount={3}
        emptyMessage={
          <EmptyState
            title="No integrations"
            description="Connect Procore, Viewpoint, or your ERP."
            action={<OpenCalendarLink />}
          />
        }
      />
    </div>
  )
}
