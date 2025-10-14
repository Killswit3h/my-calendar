import type { ReactNode } from 'react'
import { cn } from '@/lib/theme'

export type EmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
  className?: string
}

export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'glass flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 px-8 py-14 text-center text-sm text-muted backdrop-blur-xl',
        className,
      )}
    >
      {icon}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description ? <p className="max-w-md text-sm text-muted">{description}</p> : null}
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  )
}
