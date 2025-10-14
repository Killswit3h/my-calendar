import type { ReactNode } from 'react'

import { ModuleTabs } from '@/components/ui/ModuleTabs'
import { PageHeader } from '@/components/ui/PageHeader'
import { ActionDrawer } from '@/components/ui/ActionDrawer'
import { BackButton } from '@/components/ui/BackButton'

const TABS = [
  { label: 'RFQs', href: '/procurement/rfq' },
  { label: 'Purchase Orders', href: '/procurement/po' },
  { label: 'Deliveries', href: '/procurement/deliveries' },
]

export default function ProcurementLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Procurement"
        description="Track quotes, purchase orders, and deliveries."
        actions={
          <div className="flex flex-wrap gap-2">
            <BackButton />
            <ActionDrawer
              triggerLabel="New PO"
              title="Issue purchase order"
              description="Reserve materials and equipment for upcoming work."
            >
              <form className="flex flex-col gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted">Vendor</span>
                  <input type="text" className="rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/40" placeholder="Vendor name" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted">Project</span>
                  <input type="text" className="rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/40" placeholder="Project code" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted">Expected delivery</span>
                  <input type="date" className="rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/40" />
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
