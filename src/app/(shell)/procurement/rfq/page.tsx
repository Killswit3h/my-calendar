import { DataTable, type TableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'
import { PROCUREMENT_FIXTURES, type ProcurementFixture } from '@/lib/fixtures/modules'

const columns: TableColumn<ProcurementFixture>[] = [
  { key: 'id', header: 'RFQ', width: 140 },
  { key: 'vendor', header: 'Vendor', width: 200 },
  { key: 'project', header: 'Project', width: 220 },
  { key: 'status', header: 'Status', width: 160 },
  { key: 'expectedOn', header: 'Due', width: 140 },
]

export default function ProcurementRfqPage() {
  const rows = PROCUREMENT_FIXTURES.filter(item => item.type === 'RFQ')
  return (
    <DataTable
      data={rows}
      columns={columns}
      emptyMessage={
        <EmptyState
          title="No open RFQs"
          description="Issue a new request to solicit vendor pricing."
          action={<OpenCalendarLink />}
        />
      }
    />
  )
}
