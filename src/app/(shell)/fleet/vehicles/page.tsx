import { DataTable, type TableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'
import { FLEET_FIXTURES, type FleetFixture } from '@/lib/fixtures/modules'

type FleetRow = FleetFixture & { nextService: string }

const columns: TableColumn<FleetRow>[] = [
  { key: 'id', header: 'Unit ID', width: 140 },
  { key: 'unit', header: 'Asset', width: 200 },
  { key: 'status', header: 'Status', width: 140 },
  { key: 'location', header: 'Location', width: 220 },
  { key: 'nextService', header: 'Next Service', width: 160 },
]

export default function FleetVehiclesPage() {
  const rows: FleetRow[] = FLEET_FIXTURES.map(vehicle => ({ ...vehicle, nextService: vehicle.nextService }))

  return (
    <DataTable
      data={rows}
      columns={columns}
      emptyMessage={
        <EmptyState
          title="No vehicles tracked"
          description="Connect your fleet provider or add units manually."
          action={<OpenCalendarLink />}
        />
      }
    />
  )
}
