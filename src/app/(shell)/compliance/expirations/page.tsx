import { DataTable, type TableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'
import { COMPLIANCE_FIXTURES, type ComplianceFixture } from '@/lib/fixtures/modules'

const columns: TableColumn<ComplianceFixture>[] = [
  { key: 'id', header: 'Item', width: 140 },
  { key: 'reference', header: 'Description', width: 260 },
  { key: 'owner', header: 'Owner', width: 160 },
  { key: 'status', header: 'Status', width: 160 },
  { key: 'due', header: 'Expires', width: 140 },
]

export default function ComplianceExpirationsPage() {
  const rows = COMPLIANCE_FIXTURES.filter(item => item.type === 'Expiration')
  return (
    <DataTable
      data={rows}
      columns={columns}
      emptyMessage={
        <EmptyState
          title="All permits current"
          description="You’ll see expirations and reminders here."
          action={<OpenCalendarLink />}
        />
      }
    />
  )
}
