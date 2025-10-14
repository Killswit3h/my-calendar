import type { ReactNode } from 'react'

import { ModuleTabs } from '@/components/ui/ModuleTabs'
import { PageHeader } from '@/components/ui/PageHeader'
import { ActionDrawer } from '@/components/ui/ActionDrawer'
import { BackButton } from '@/components/ui/BackButton'

const TABS = [
  { label: 'Users', href: '/admin/users' },
  { label: 'Roles', href: '/admin/roles' },
  { label: 'Integrations', href: '/admin/integrations' },
  { label: 'Automation', href: '/admin/automation' },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Admin"
        description="Manage access control, integrations, and automation triggers."
        actions={
          <div className="flex flex-wrap gap-2">
            <BackButton />
            <ActionDrawer
              triggerLabel="Invite user"
              title="Invite teammate"
              description="Send an invitation email with temporary access."
            >
              <form className="flex flex-col gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted">Email</span>
                  <input type="email" className="rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/40" placeholder="name@company.com" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-muted">Role</span>
                  <select className="rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/40">
                    <option>Viewer</option>
                    <option>Editor</option>
                    <option>Administrator</option>
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
