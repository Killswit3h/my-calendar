import type { ReactNode } from 'react'

import { BackButton } from '@/components/ui/BackButton'
import { PageHeader } from '@/components/ui/PageHeader'

export default function CalendarLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="Plan crews, assets, and closures across every job. Changes sync in real time across the control center."
        actions={<BackButton />}
      />
      {children}
    </div>
  )
}
