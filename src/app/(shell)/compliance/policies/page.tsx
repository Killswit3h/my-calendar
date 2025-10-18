import { DataTable, type TableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'
import { COMPLIANCE_FIXTURES, type ComplianceFixture } from '@/lib/fixtures/modules'

const columns: TableColumn<ComplianceFixture>[] = [
  { key: 'id', header: 'Policy', width: 140 },
  { key: 'reference', header: 'Title', width: 260 },
  { key: 'owner', header: 'Owner', width: 160 },
  { key: 'status', header: 'Status', width: 160 },
  { key: 'due', header: 'Next Review', width: 160 },
]

export default function CompliancePoliciesPage() {
  const rows = COMPLIANCE_FIXTURES.filter(item => item.type === 'Policy')
  return (
    <DataTable
      data={rows}
      columns={columns}
      emptyMessage={
        <EmptyState
          title="No policies tracked"
          description="Upload policy documents and assign owners."
          action={<OpenCalendarLink />}
        />
      }
    />
  )
}
