import type { ReactNode } from 'react'

import { cn } from '@/lib/theme'

type ToolbarProps = {
  children: ReactNode
  className?: string
}

export function Toolbar({ children, className }: ToolbarProps) {
  return (
    <div
      className={cn(
        'glass flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 px-4 py-3 shadow-card sm:px-5',
        className,
      )}
    >
      {children}
    </div>
  )
}
