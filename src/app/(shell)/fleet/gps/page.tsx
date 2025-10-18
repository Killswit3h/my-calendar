import { EmptyState } from '@/components/ui/EmptyState'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'

const GPS = [
  { id: 'GPS-01', unit: 'Service Truck 07', lastPing: '2024-09-21T13:22:00Z', status: 'Moving', location: 'US-441 NB' },
  { id: 'GPS-02', unit: 'Mini-Excavator', lastPing: '2024-09-21T12:58:00Z', status: 'Idle', location: 'I-95 Segment 4' },
]

export default function FleetGpsPage() {
  return (
    <div className="grid gap-3">
      {GPS.map(point => (
        <div key={point.id} className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 text-sm">
          <div>
            <p className="font-semibold text-foreground">{point.unit}</p>
            <p className="text-xs text-muted">{point.location}</p>
          </div>
          <div className="text-right text-xs text-muted">
            <p>{new Date(point.lastPing).toLocaleTimeString()}</p>
            <p>{point.status}</p>
          </div>
        </div>
      ))}
      {!GPS.length ? (
        <EmptyState
          title="No GPS devices"
          description="Pair GPS trackers to monitor asset location."
          action={<OpenCalendarLink />}
        />
      ) : null}
    </div>
  )
}
