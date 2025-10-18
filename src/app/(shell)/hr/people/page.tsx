import { DataTable, type TableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'
import { HR_FIXTURES, type HrFixture } from '@/lib/fixtures/modules'

const columns: TableColumn<HrFixture>[] = [
  { key: 'id', header: 'Employee', width: 140 },
  { key: 'name', header: 'Name', width: 220 },
  { key: 'role', header: 'Role', width: 180 },
  { key: 'status', header: 'Status', width: 120 },
  { key: 'certifications', header: 'Certs', width: 100, align: 'right' },
]

export default function HrPeoplePage() {
  return (
    <DataTable
      data={HR_FIXTURES}
      columns={columns}
      emptyMessage={
        <EmptyState
          title="No teammates"
          description="Invite your crews to manage availability and certifications."
          action={<OpenCalendarLink />}
        />
      }
    />
  )
}
