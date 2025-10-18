// src/components/shell/EmptyState.tsx
import { ReactNode } from 'react'
import { cn } from '@/lib/theme'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-6 text-center", className)}>
      {icon && (
        <div className="mb-4 h-12 w-12 rounded-full bg-card flex items-center justify-center text-muted">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-fg mb-2">{title}</h3>
      <p className="text-muted mb-6 max-w-sm">{description}</p>
      {action && <div>{action}</div>}
    </div>
  )
}
