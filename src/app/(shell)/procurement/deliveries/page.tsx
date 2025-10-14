import { DataTable, type TableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'
import { PROCUREMENT_FIXTURES, type ProcurementFixture } from '@/lib/fixtures/modules'

const columns: TableColumn<ProcurementFixture>[] = [
  { key: 'id', header: 'Delivery', width: 160 },
  { key: 'vendor', header: 'Vendor', width: 200 },
  { key: 'project', header: 'Project', width: 220 },
  { key: 'status', header: 'Status', width: 160 },
  { key: 'expectedOn', header: 'Arriving', width: 140 },
]

export default function ProcurementDeliveriesPage() {
  const rows = PROCUREMENT_FIXTURES.filter(item => item.type === 'Delivery')
  return (
    <DataTable
      data={rows}
      columns={columns}
      emptyMessage={
        <EmptyState
          title="No deliveries scheduled"
          description="Link dispatch or yard check-in to monitor deliveries."
          action={<OpenCalendarLink />}
        />
      }
    />
  )
}
