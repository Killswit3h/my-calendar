import { DataTable, type TableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'

const TIMESHEETS = [
  { id: 'TS-901', crew: 'Crew A', week: '2024-W38', hours: 184, status: 'Submitted', approvedBy: 'Dana Cooper' },
  { id: 'TS-902', crew: 'Crew B', week: '2024-W38', hours: 176, status: 'Pending', approvedBy: 'Kira Nunez' },
]

type TimesheetRow = (typeof TIMESHEETS)[number]

const columns: TableColumn<TimesheetRow>[] = [
  { key: 'id', header: 'Sheet', width: 140 },
  { key: 'crew', header: 'Crew', width: 180 },
  { key: 'week', header: 'Week', width: 120 },
  { key: 'hours', header: 'Hours', width: 100, align: 'right' },
  { key: 'status', header: 'Status', width: 140 },
  { key: 'approvedBy', header: 'Approver', width: 180 },
]

export default function HrTimesheetsPage() {
  return (
    <DataTable
      data={TIMESHEETS}
      columns={columns}
      emptyMessage={
        <EmptyState
          title="No timesheets"
          description="Integrate your time-clock system or upload a CSV."
          action={<OpenCalendarLink />}
        />
      }
    />
  )
}
