import { DataTable, type TableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Toolbar } from '@/components/ui/Toolbar'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'
import { SkeletonRow } from '@/components/ui/Skeleton'
import { FINANCE_FIXTURES, type FinanceFixture } from '@/lib/fixtures/modules'

type FinanceRow = FinanceFixture & { amountDisplay: string }

const columns: TableColumn<FinanceRow>[] = [
  { key: 'id', header: 'Contract', width: 140 },
  { key: 'project', header: 'Project', width: 260 },
  { key: 'amountDisplay', header: 'Amount', width: 160, align: 'right' },
  { key: 'status', header: 'Status', width: 140 },
  { key: 'dueDate', header: 'Executed', width: 140 },
]

const rows: FinanceRow[] = FINANCE_FIXTURES.filter(item => item.type === 'Contract').map(item => ({
    ...item,
    amountDisplay: `$${item.amount.toLocaleString()}`,
  }))

export default function FinanceContractsPage() {
  return (
    <div className="space-y-4">
      <Toolbar>
        <div className="text-sm text-muted">Showing {rows.length} contract records</div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <button type="button" className="focus-ring rounded-full border border-border/60 px-3 py-1 transition hover:border-border hover:text-foreground">
            Export summary
          </button>
        </div>
      </Toolbar>
      <DataTable
        data={rows}
        columns={columns}
        skeletonCount={4}
        emptyMessage={
          <EmptyState
            title="No contracts"
            description="Upload a contract or sync from your ERP."
            action={<OpenCalendarLink />}
          />
        }
      />
    </div>
  )
}
