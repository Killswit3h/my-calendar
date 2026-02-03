import type { ReactNode } from 'react'

import { EmptyState } from '@/components/ui/EmptyState'
import { OpenCalendarLink } from '@/components/ui/OpenCalendarLink'
import { getUserAreas } from '@/lib/access'
import { REPORT_ACCESS_AREAS } from '@/lib/accessAreas'

type Props = { children: ReactNode }

export default async function Layout({ children }: Props) {
  const areas = await getUserAreas()
  const allowed = areas.some(area => REPORT_ACCESS_AREAS.some(entry => entry.key === area))

  if (!allowed) {
    return (
      <div className="py-16">
        <EmptyState
          title="Reports are locked"
          description="Ask an administrator to grant you access to Daily, Weekly, Finance, or Export reports."
          action={<OpenCalendarLink />}
        />
      </div>
    )
  }

  return <>{children}</>
}
