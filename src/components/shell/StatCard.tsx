// src/components/shell/StatCard.tsx
import { ReactNode } from 'react'
import { cn } from '@/lib/theme'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: ReactNode
  className?: string
}

export function StatCard({ title, value, change, changeLabel, icon, className }: StatCardProps) {
  const getTrendIcon = () => {
    if (change === undefined) return null
    if (change > 0) return <TrendingUp className="h-3 w-3" />
    if (change < 0) return <TrendingDown className="h-3 w-3" />
    return <Minus className="h-3 w-3" />
  }

  const getTrendColor = () => {
    if (change === undefined) return 'text-muted'
    if (change > 0) return 'text-accent'
    if (change < 0) return 'text-danger'
    return 'text-muted'
  }

  return (
    <div className={cn("glass rounded-lg", className)}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted">{title}</p>
            <p className="text-2xl font-bold text-fg">{value}</p>
            {change !== undefined && (
              <div className={cn("flex items-center gap-1 text-xs", getTrendColor())}>
                {getTrendIcon()}
                <span>{Math.abs(change)}%</span>
                {changeLabel && <span className="text-muted">vs {changeLabel}</span>}
              </div>
            )}
          </div>
          {icon && (
            <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              {icon}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
