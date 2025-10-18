import { DataTable, type TableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Toolbar } from '@/components/ui/Toolbar'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'
import { ADMIN_FIXTURES, type AdminFixture } from '@/lib/fixtures/modules'

const columns: TableColumn<AdminFixture>[] = [
  { key: 'id', header: 'Role', width: 140 },
  { key: 'name', header: 'Name', width: 220 },
  { key: 'status', header: 'Status', width: 140 },
  { key: 'updatedAt', header: 'Updated', width: 160 },
]

export default function AdminRolesPage() {
  const rows = ADMIN_FIXTURES.filter(item => item.type === 'Role')
  return (
    <div className="space-y-4">
      <Toolbar>
        <div className="text-sm text-muted">{rows.length} roles</div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <button type="button" className="focus-ring rounded-full border border-border/60 px-3 py-1 transition hover:border-border hover:text-foreground">
            Export roles
          </button>
        </div>
      </Toolbar>
      <DataTable
        data={rows}
        columns={columns}
        skeletonCount={2}
        emptyMessage={
          <EmptyState
            title="No roles defined"
            description="Create permission templates to manage access."
            action={<OpenCalendarLink />}
          />
        }
      />
    </div>
  )
}
