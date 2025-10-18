import { DataTable, type TableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Toolbar } from '@/components/ui/Toolbar'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'
import { FINANCE_FIXTURES, type FinanceFixture } from '@/lib/fixtures/modules'

type FinanceRow = FinanceFixture & { amountDisplay: string }

const columns: TableColumn<FinanceRow>[] = [
  { key: 'id', header: 'Invoice', width: 140 },
  { key: 'project', header: 'Project', width: 260 },
  { key: 'amountDisplay', header: 'Amount', width: 160, align: 'right' },
  { key: 'status', header: 'Status', width: 140 },
  { key: 'dueDate', header: 'Due', width: 140 },
]

export default function FinanceInvoicesPage() {
  const rows: FinanceRow[] = FINANCE_FIXTURES.filter(item => item.type === 'Invoice').map(item => ({
    ...item,
    amountDisplay: `$${item.amount.toLocaleString()}`,
  }))
  return (
    <div className="space-y-4">
      <Toolbar>
        <div className="text-sm text-muted">{rows.length} invoices tracked</div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <button type="button" className="focus-ring rounded-full border border-border/60 px-3 py-1 transition hover:border-border hover:text-foreground">
            Aging summary
          </button>
        </div>
      </Toolbar>
      <DataTable
        data={rows}
        columns={columns}
        skeletonCount={4}
        emptyMessage={
          <EmptyState
            title="Invoices are current"
            description="Pending and approved invoices will land here."
            action={<OpenCalendarLink />}
          />
        }
      />
    </div>
  )
}
