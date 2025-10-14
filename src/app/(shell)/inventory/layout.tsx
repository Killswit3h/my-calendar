import type { ReactNode } from 'react'

import { ModuleTabs } from '@/components/ui/ModuleTabs'
import { PageHeader } from '@/components/ui/PageHeader'
import { ActionDrawer } from '@/components/ui/ActionDrawer'
import { BackButton } from '@/components/ui/BackButton'

const TABS = [
  { label: 'Items', href: '/inventory/items' },
  { label: 'Transfers', href: '/inventory/transfers' },
  { label: 'Maintenance', href: '/inventory/maintenance' },
]

export default function InventoryLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Inventory"
        description="Track tools, consumables, and fleet assets."
        actions={
          <div className="flex gap-2">
            <BackButton />
            <ActionDrawer
              triggerLabel="New item"
              title="Create inventory item"
              description="Capture quick details for the new item. Full editing happens in the inventory module."
            >
              <form className="flex flex-col gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted">Name</span>
                  <input type="text" className="rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/40" placeholder="e.g. Impact driver" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted">SKU</span>
                  <input type="text" className="rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/40" placeholder="SKU-0001" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted">Default location</span>
                  <input type="text" className="rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/40" placeholder="Yard, Truck-02…" />
                </label>
              </form>
            </ActionDrawer>
            <ActionDrawer
              triggerLabel="New transfer"
              title="Schedule transfer"
              description="Move stock between locations to keep crews supplied."
              variant="ghost"
            >
              <form className="flex flex-col gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted">Item</span>
                  <input type="text" className="rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/40" placeholder="Inventory item" />
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted">From</span>
                    <input type="text" className="rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/40" placeholder="Warehouse A" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-muted">To</span>
                    <input type="text" className="rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/40" placeholder="Truck 07" />
                  </label>
                </div>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted">Quantity</span>
                  <input type="number" min={1} className="rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/40" placeholder="0" />
                </label>
              </form>
            </ActionDrawer>
          </div>
        }
      />
      <ModuleTabs tabs={TABS} />
      <section>{children}</section>
    </div>
  )
}
