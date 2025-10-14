import type { ReactNode } from 'react'

import { ModuleTabs } from '@/components/ui/ModuleTabs'
import { PageHeader } from '@/components/ui/PageHeader'
import { ActionDrawer } from '@/components/ui/ActionDrawer'
import { BackButton } from '@/components/ui/BackButton'

const TABS = [
  { label: 'People', href: '/hr/people' },
  { label: 'Timesheets', href: '/hr/timesheets' },
  { label: 'Certifications', href: '/hr/certs' },
  { label: 'PTO', href: '/hr/pto' },
]

export default function HrLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Workforce"
        description="Roster, labor hours, and compliance tracking."
        actions={
          <div className="flex flex-wrap gap-2">
            <BackButton />
            <ActionDrawer
              triggerLabel="Invite teammate"
              title="Invite teammate"
              description="Send a welcome email with role-based permissions."
            >
              <form className="flex flex-col gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted">Full name</span>
                  <input type="text" className="rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/40" placeholder="First Last" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted">Email</span>
                  <input type="email" className="rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/40" placeholder="name@company.com" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted">Role</span>
                  <select className="rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/40">
                    <option>Installer</option>
                    <option>Crew Lead</option>
                    <option>Project Manager</option>
                  </select>
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
