import type { ComponentType } from 'react'
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react'

import { formatNumber } from '@/lib/theme'

export type KpiTrend = 'up' | 'down' | 'neutral'

export type KpiCardProps = {
  title: string
  value: number
  suffix?: string
  change?: number
  trend?: KpiTrend
  helper?: string
  icon?: ComponentType<{ className?: string }>
}

export function KpiCard({ title, value, suffix, change, trend = 'neutral', helper, icon: Icon }: KpiCardProps) {
  return (
    <article className="flex min-w-[220px] flex-1 flex-col gap-3 rounded-3xl border border-border/50 bg-surface/95 px-6 py-5 shadow-[0_14px_32px_rgba(7,17,11,0.28)]">
      <header className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-muted/90">
        {Icon ? (
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-accent-600 bg-surface-soft/70">
            <Icon className="h-3.5 w-3.5" />
          </span>
        ) : null}
        <span>{title}</span>
      </header>
      <div className="flex flex-col gap-2">
        <span className="text-[30px] font-semibold leading-tight text-foreground">
          {formatNumber(value)}
          {suffix ? <span className="ml-1 text-base font-medium text-muted">{suffix}</span> : null}
        </span>
        {typeof change === 'number' ? <TrendPill value={change} trend={trend} /> : null}
        {helper ? <p className="text-xs text-muted/90">{helper}</p> : null}
      </div>
    </article>
  )
}

type TrendPillProps = { value: number; trend: KpiTrend }

function TrendPill({ value, trend }: TrendPillProps) {
  const formatted = `${formatNumber(Math.abs(value))}% vs last period`
  if (trend === 'neutral') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">
        <ArrowRight className="h-3 w-3" /> {formatted}
      </span>
    )
  }
  if (trend === 'down') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-danger">
        <ArrowDown className="h-3 w-3" /> {formatted}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
      <ArrowUp className="h-3 w-3" /> {formatted}
    </span>
  )
}
