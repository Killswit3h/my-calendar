import type { PurchaseOrder as PurchaseOrderRecord } from '@prisma/client'

import { DataTable, type TableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'
import { PROCUREMENT_FIXTURES, type ProcurementFixture } from '@/lib/fixtures/modules'
import { getPrisma } from '@/lib/db'

type PoRow = ProcurementFixture & { expectedOn: string }

const columns: TableColumn<PoRow>[] = [
  { key: 'id', header: 'PO', width: 140 },
  { key: 'vendor', header: 'Vendor', width: 200 },
  { key: 'project', header: 'Project', width: 220 },
  { key: 'status', header: 'Status', width: 160 },
  { key: 'expectedOn', header: 'Expected', width: 140 },
]

export default async function ProcurementPoPage() {
  const useFixtures = process.env.PLAYWRIGHT_TEST === '1'
  let ordersDb: PurchaseOrderRecord[] = []
  if (!useFixtures) {
    const prisma = await getPrisma()
    try {
      ordersDb = await prisma.purchaseOrder.findMany({ orderBy: { expectedOn: 'asc' }, take: 50 })
    } catch {
      ordersDb = []
    }
  }

  const rows: PoRow[] = ordersDb.length
    ? ordersDb.map((po: PurchaseOrderRecord): PoRow => ({
        id: po.id,
        type: 'PO',
        vendor: po.vendor,
        project: po.project,
        status: po.status,
        expectedOn: po.expectedOn ? new Date(po.expectedOn).toISOString().slice(0, 10) : '—',
      }))
    : PROCUREMENT_FIXTURES.filter(item => item.type === 'PO').map(item => ({ ...item, expectedOn: item.expectedOn ?? '—' }))

  return (
    <DataTable
      data={rows}
      columns={columns}
      emptyMessage={
        <EmptyState
          title="No purchase orders"
          description="Issue a PO to track deliveries and commitments."
          action={<OpenCalendarLink />}
        />
      }
    />
  )
}
