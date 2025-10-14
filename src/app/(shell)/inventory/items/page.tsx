import { DataTable, type TableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'
import { Toolbar } from '@/components/ui/Toolbar'
import { INVENTORY_FIXTURES, type InventoryFixture } from '@/lib/fixtures/modules'

type InventoryRow = InventoryFixture & {
  quantityDisplay: string
  statusDisplay: string
}

const columns: TableColumn<InventoryRow>[] = [
  { key: 'id', header: 'Item ID', width: 140, minWidth: 120 },
  { key: 'name', header: 'Description', width: 280, minWidth: 220 },
  { key: 'sku', header: 'SKU', width: 160, minWidth: 140 },
  { key: 'quantityDisplay', header: 'On hand', width: 140, minWidth: 130, align: 'right' },
  { key: 'location', header: 'Location', width: 200, minWidth: 160 },
  { key: 'statusDisplay', header: 'Status', width: 140, minWidth: 120 },
  { key: 'category', header: 'Category', width: 160, minWidth: 140 },
]

function buildRows(): InventoryRow[] {
  return INVENTORY_FIXTURES.map(item => ({
    ...item,
    quantityDisplay: `${item.quantity} ${item.unit}`,
    statusDisplay: item.minStock && item.quantity <= item.minStock ? `${item.status} (Watch)` : item.status,
  }))
}

export default function InventoryItemsPage() {
  const rows = buildRows()

  return (
    <div className="space-y-4">
      <Toolbar>
        <div className="text-sm text-muted">Tracking {rows.length} stocked inventory items</div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <button
            type="button"
            className="focus-ring rounded-full border border-border/60 px-3 py-1 transition hover:border-border hover:text-foreground"
          >
            Export summary
          </button>
          <OpenCalendarLink className="border-dashed text-muted hover:text-foreground" />
        </div>
      </Toolbar>
      <DataTable
        data={rows}
        columns={columns}
        skeletonCount={5}
        emptyMessage={
          <EmptyState
            title="No inventory items"
            description="Add your first item or import from your ERP."
            action={<OpenCalendarLink />}
          />
        }
      />
    </div>
  )
}
