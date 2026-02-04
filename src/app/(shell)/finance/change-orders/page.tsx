import { DataTable, type TableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Toolbar } from '@/components/ui/Toolbar'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'
import { FINANCE_FIXTURES, type FinanceFixture } from '@/lib/fixtures/modules'

type FinanceRow = FinanceFixture & { amountDisplay: string }

const columns: TableColumn<FinanceRow>[] = [
  { key: 'id', header: 'CO', width: 140 },
  { key: 'project', header: 'Project', width: 260 },
  { key: 'amountDisplay', header: 'Amount', width: 160, align: 'right' },
  { key: 'status', header: 'Status', width: 140 },
  { key: 'dueDate', header: 'Submitted', width: 140 },
]

export default function FinanceChangeOrdersPage() {
  const rows: FinanceRow[] = FINANCE_FIXTURES.filter(item => item.type === 'Change Order').map(item => ({
    ...item,
    amountDisplay: `$${item.amount.toLocaleString()}`,
  }))

  return (
    <div className="space-y-4">
      <Toolbar>
        <div className="text-sm text-muted">{rows.length} change orders</div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <button type="button" className="focus-ring rounded-full border border-border/60 px-3 py-1 transition hover:border-border hover:text-foreground">
            Export log
          </button>
        </div>
      </Toolbar>
      <DataTable
        data={rows}
        columns={columns}
        skeletonCount={4}
        emptyMessage={
          <EmptyState
            title="No change orders"
            description="Log potential change orders to track margin impacts."
            action={<OpenCalendarLink />}
          />
        }
      />
    </div>
  )
}
