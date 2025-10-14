import { DataTable, type TableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'
import { REPORT_FIXTURES, type ReportFixture } from '@/lib/fixtures/modules'

const columns: TableColumn<ReportFixture>[] = [
  { key: 'id', header: 'Report', width: 160 },
  { key: 'title', header: 'Title', width: 280 },
  { key: 'author', header: 'Author', width: 160 },
  { key: 'generatedOn', header: 'Generated', width: 200 },
]

export default function ReportsFinancePage() {
  const rows = REPORT_FIXTURES.filter(report => report.category === 'Finance')
  return (
    <DataTable
      data={rows}
      columns={columns}
      emptyMessage={
        <EmptyState
          title="No finance reports"
          description="Connect to your ERP to populate cash flow exports."
          action={<OpenCalendarLink />}
        />
      }
    />
  )
}
