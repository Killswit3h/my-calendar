// src/components/shell/PageHeader.tsx
import { ReactNode } from 'react'
import { BackButton } from './BackButton'
import { cn } from '@/lib/theme'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  showBackButton?: boolean
  backHref?: string
  className?: string
}

export function PageHeader({
  title,
  description,
  actions,
  showBackButton = true,
  backHref,
  className
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-4">
        {showBackButton && <BackButton href={backHref} />}
        <div>
          <h1 className="text-3xl font-bold text-fg">{title}</h1>
          {description && (
            <p className="text-muted mt-1">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}
