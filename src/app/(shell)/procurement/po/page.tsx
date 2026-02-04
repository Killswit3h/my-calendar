import { DataTable, type TableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'
import { PROCUREMENT_FIXTURES, type ProcurementFixture } from '@/lib/fixtures/modules'

type PoRow = ProcurementFixture & { expectedOn: string }

const columns: TableColumn<PoRow>[] = [
  { key: 'id', header: 'PO', width: 140 },
  { key: 'vendor', header: 'Vendor', width: 200 },
  { key: 'project', header: 'Project', width: 220 },
  { key: 'status', header: 'Status', width: 160 },
  { key: 'expectedOn', header: 'Expected', width: 140 },
]

export default function ProcurementPoPage() {
  const rows: PoRow[] = PROCUREMENT_FIXTURES.filter(item => item.type === 'PO').map(item => ({ ...item, expectedOn: item.expectedOn ?? '—' }))

  return (
    <DataTable
      data={rows}
      columns={columns}
      emptyMessage={
        <EmptyState
          title="No purchase orders"
          description="Issue a PO to track deliveries and commitments."
          action={<OpenCalendarLink />}
        />
      }
    />
  )
}
