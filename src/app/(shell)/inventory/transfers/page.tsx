import { DataTable, type TableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'

const FALLBACK_TRANSFERS = [
  { id: 'TR-118', item: 'Impact driver', from: 'Yard', to: 'Truck-02', qty: 4, status: 'In transit', requested: '2024-09-20' },
  { id: 'TR-121', item: 'Fence hardware set', from: 'Yard', to: 'SR-836', qty: 12, status: 'Delivered', requested: '2024-09-18' },
]

type TransferRow = {
  id: string
  item: string
  from: string
  to: string
  qty: number
  status: string
  requested: string
}

const columns: TableColumn<TransferRow>[] = [
  { key: 'id', header: 'Transfer', width: 140 },
  { key: 'item', header: 'Item', width: 200 },
  { key: 'from', header: 'From', width: 140 },
  { key: 'to', header: 'To', width: 140 },
  { key: 'qty', header: 'Qty', width: 80, align: 'right' },
  { key: 'status', header: 'Status', width: 140 },
  { key: 'requested', header: 'Requested', width: 140 },
]

export default function InventoryTransfersPage() {
  const rows: TransferRow[] = FALLBACK_TRANSFERS

  return (
    <DataTable
      data={rows}
      columns={columns}
      emptyMessage={
        <EmptyState
          title="No transfers scheduled"
          description="Create transfers to coordinate load-outs."
          action={<OpenCalendarLink />}
        />
      }
    />
  )
}
