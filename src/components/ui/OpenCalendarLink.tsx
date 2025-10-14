import Link from 'next/link'
import { CalendarDays } from 'lucide-react'

import { cn } from '@/lib/theme'
import { CALENDAR_HOME_PATH } from '@/lib/calendar/constants'

export function OpenCalendarLink({ className }: { className?: string }) {
  return (
    <Link
      href={CALENDAR_HOME_PATH}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent-50',
        className,
      )}
    >
      <CalendarDays className="h-4 w-4" />
      Open calendar
    </Link>
  )
}
