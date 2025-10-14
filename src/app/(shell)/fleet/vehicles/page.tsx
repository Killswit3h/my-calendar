import type { Vehicle as VehicleRecord } from '@prisma/client'

import { DataTable, type TableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'
import { FLEET_FIXTURES, type FleetFixture } from '@/lib/fixtures/modules'
import { getPrisma } from '@/lib/db'

type FleetRow = FleetFixture & { nextService: string }

const columns: TableColumn<FleetRow>[] = [
  { key: 'id', header: 'Unit ID', width: 140 },
  { key: 'unit', header: 'Asset', width: 200 },
  { key: 'status', header: 'Status', width: 140 },
  { key: 'location', header: 'Location', width: 220 },
  { key: 'nextService', header: 'Next Service', width: 160 },
]

export default async function FleetVehiclesPage() {
  const useFixtures = process.env.PLAYWRIGHT_TEST === '1'
  let vehiclesDb: VehicleRecord[] = []
  if (!useFixtures) {
    const prisma = await getPrisma()
    try {
      vehiclesDb = await prisma.vehicle.findMany({ orderBy: { unit: 'asc' }, take: 100 })
    } catch {
      vehiclesDb = []
    }
  }

  const rows: FleetRow[] = vehiclesDb.length
    ? vehiclesDb.map((vehicle: VehicleRecord): FleetRow => ({
        id: vehicle.id,
        unit: vehicle.unit,
        status: vehicle.status,
        location: vehicle.location ?? '—',
        nextService: vehicle.nextServiceOn ? new Date(vehicle.nextServiceOn).toISOString().slice(0, 10) : '—',
      }))
    : FLEET_FIXTURES.map(vehicle => ({ ...vehicle, nextService: vehicle.nextService }))

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
