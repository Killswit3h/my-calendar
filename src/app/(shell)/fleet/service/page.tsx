import { DataTable, type TableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'

const SERVICE = [
  { id: 'SV-301', unit: 'Service Truck 07', work: 'Brake pads', provider: 'In-house', scheduled: '2024-09-26', status: 'Scheduled' },
  { id: 'SV-298', unit: 'Mini-Excavator', work: 'Hydraulic leak repair', provider: 'Sunstate', scheduled: '2024-09-24', status: 'In progress' },
]

type ServiceRow = (typeof SERVICE)[number]

const columns: TableColumn<ServiceRow>[] = [
  { key: 'id', header: 'WO', width: 140 },
  { key: 'unit', header: 'Unit', width: 200 },
  { key: 'work', header: 'Work', width: 220 },
  { key: 'provider', header: 'Provider', width: 160 },
  { key: 'scheduled', header: 'Scheduled', width: 140 },
  { key: 'status', header: 'Status', width: 140 },
]

export default function FleetServicePage() {
  return (
    <DataTable
      data={SERVICE}
      columns={columns}
      emptyMessage={
        <EmptyState
          title="Service calendar empty"
          description="Preventative maintenance goes here."
          action={<OpenCalendarLink />}
        />
      }
    />
  )
}
