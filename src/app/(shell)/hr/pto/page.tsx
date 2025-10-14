import { DataTable, type TableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'

const PTO = [
  { id: 'PTO-221', name: 'Kevin Zhang', range: 'Sep 23 – Sep 27', status: 'Approved', coverage: 'Estimator team' },
  { id: 'PTO-224', name: 'Maria Velasquez', range: 'Oct 14 – Oct 18', status: 'Pending', coverage: 'Crew B lead' },
]

type PtoRow = (typeof PTO)[number]

const columns: TableColumn<PtoRow>[] = [
  { key: 'id', header: 'Request', width: 140 },
  { key: 'name', header: 'Team Member', width: 200 },
  { key: 'range', header: 'Dates', width: 220 },
  { key: 'status', header: 'Status', width: 140 },
  { key: 'coverage', header: 'Coverage Plan', width: 220 },
]

export default function HrPtoPage() {
  return (
    <DataTable
      data={PTO}
      columns={columns}
      emptyMessage={
        <EmptyState
          title="No PTO requests"
          description="Log upcoming PTO to plan crew coverage."
          action={<OpenCalendarLink />}
        />
      }
    />
  )
}
