import type { FinanceChangeOrder } from '@prisma/client'

import { DataTable, type TableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Toolbar } from '@/components/ui/Toolbar'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'
import { FINANCE_FIXTURES, type FinanceFixture } from '@/lib/fixtures/modules'
import { getPrisma } from '@/lib/db'

type FinanceRow = FinanceFixture & { amountDisplay: string }

const columns: TableColumn<FinanceRow>[] = [
  { key: 'id', header: 'CO', width: 140 },
  { key: 'project', header: 'Project', width: 260 },
  { key: 'amountDisplay', header: 'Amount', width: 160, align: 'right' },
  { key: 'status', header: 'Status', width: 140 },
  { key: 'dueDate', header: 'Submitted', width: 140 },
]

export default async function FinanceChangeOrdersPage() {
  const useFixtures = process.env.PLAYWRIGHT_TEST === '1'
  let changeOrdersDb: FinanceChangeOrder[] = []
  if (!useFixtures) {
    const prisma = await getPrisma()
    try {
      changeOrdersDb = await prisma.financeChangeOrder.findMany({ orderBy: { createdAt: 'desc' }, take: 50 })
    } catch {
      changeOrdersDb = []
    }
  }

  const rows: FinanceRow[] = changeOrdersDb.length
    ? changeOrdersDb.map((order: FinanceChangeOrder): FinanceRow => {
        const status = ['Draft', 'Pending', 'Approved'].includes(order.status)
          ? (order.status as FinanceFixture['status'])
          : ('Pending' as FinanceFixture['status'])
        return {
          id: order.id,
          type: 'Change Order',
          project: order.project,
          amount: order.amount ? Number(order.amount) : 0,
          status,
          dueDate: order.submittedAt ? order.submittedAt.toISOString().slice(0, 10) : '—',
          amountDisplay: order.amount ? `$${Number(order.amount).toLocaleString()}` : '—',
        }
      })
    : FINANCE_FIXTURES.filter(item => item.type === 'Change Order').map(item => ({
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
