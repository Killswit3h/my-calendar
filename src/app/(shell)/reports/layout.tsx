import type { ReactNode } from 'react'

import { ModuleTabs } from '@/components/ui/ModuleTabs'
import { PageHeader } from '@/components/ui/PageHeader'
import { ActionDrawer } from '@/components/ui/ActionDrawer'
import { BackButton } from '@/components/ui/BackButton'

const TABS = [
  { label: 'Daily', href: '/reports/daily' },
  { label: 'Weekly', href: '/reports/weekly' },
  { label: 'Finance', href: '/reports/finance' },
  { label: 'Exports', href: '/reports/exports' },
]

export default function ReportsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports"
        description="Generate daily logs, trend summaries, and export datasets."
        actions={
          <div className="flex flex-wrap gap-2">
            <BackButton />
            <ActionDrawer
              triggerLabel="Generate daily report"
              title="Generate daily report"
              description="Select a date and vendor to create a PDF and share link."
            >
              <form className="flex flex-col gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted">Date</span>
                  <input type="date" className="rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/40" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted">Vendor (optional)</span>
                  <input type="text" className="rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/40" placeholder="All vendors" />
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
