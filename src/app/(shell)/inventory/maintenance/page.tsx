// Removed module; redirect to 404
import { notFound } from "next/navigation";
export default function Page() {
  notFound();
}
import { DataTable, type TableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'

const MAINTENANCE = [
  { id: 'MN-041', asset: 'Generator 04', task: 'Oil change', status: 'Scheduled', due: '2024-09-24', owner: 'Fleet' },
  { id: 'MN-042', asset: 'Compressor 02', task: 'Filter replace', status: 'Open', due: '2024-09-26', owner: 'Maintenance' },
]

type MaintenanceRow = (typeof MAINTENANCE)[number]

const columns: TableColumn<MaintenanceRow>[] = [
  { key: 'id', header: 'Ticket', width: 140 },
  { key: 'asset', header: 'Asset', width: 180 },
  { key: 'task', header: 'Task', width: 220 },
  { key: 'status', header: 'Status', width: 120 },
  { key: 'owner', header: 'Owner', width: 140 },
  { key: 'due', header: 'Due', width: 140 },
]

export default function InventoryMaintenancePage() {
  return (
    <DataTable
      data={MAINTENANCE}
      columns={columns}
      emptyMessage={
        <EmptyState
          title="Maintenance all clear"
          description="Schedule preventative tasks to stay ahead."
          action={<OpenCalendarLink />}
        />
      }
    />
  )
}
