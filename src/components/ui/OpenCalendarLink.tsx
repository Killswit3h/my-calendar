import Link from 'next/link'
import { FolderKanban } from 'lucide-react'

import { cn } from '@/lib/theme'

export function OpenCalendarLink({ className }: { className?: string }) {
  return (
    <Link
      href="/projects"
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent-50',
        className,
      )}
    >
      <FolderKanban className="h-4 w-4" />
      View Projects
    </Link>
  )
}
