import { EmptyState } from '@/components/ui/EmptyState'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'

const FUEL_LOG = [
  { id: 'FUEL-551', unit: 'Dump Truck 03', gallons: 46, cost: 189.4, date: '2024-09-18', location: 'Sunoco – Miami' },
  { id: 'FUEL-552', unit: 'Service Truck 07', gallons: 32, cost: 128.8, date: '2024-09-19', location: 'Yard Tank' },
]

export default function FleetFuelPage() {
  return (
    <div className="space-y-4">
      {FUEL_LOG.map(entry => (
        <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-sm">
          <div>
            <p className="font-semibold text-foreground">{entry.unit}</p>
            <p className="text-xs text-muted">{entry.location}</p>
          </div>
          <div className="text-right text-xs text-muted">
            <p>{entry.date}</p>
            <p>{entry.gallons} gal · ${entry.cost.toFixed(2)}</p>
          </div>
        </div>
      ))}
      {!FUEL_LOG.length ? (
        <EmptyState
          title="No fuel entries"
          description="Connect telematics or import card statements."
          action={<OpenCalendarLink />}
        />
      ) : null}
    </div>
  )
}
