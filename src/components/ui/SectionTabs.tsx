'use client'

import * as Tabs from '@radix-ui/react-tabs'
import type { ReactNode } from 'react'

import { cn } from '@/lib/theme'

export type SectionTabsProps = {
  tabs: Array<{ value: string; label: string; badge?: string | number }>
  value: string
  onValueChange: (value: string) => void
  className?: string
  children?: ReactNode
}

export function SectionTabs({ tabs, value, onValueChange, className, children }: SectionTabsProps) {
  return (
    <Tabs.Root value={value} onValueChange={onValueChange} className={cn('flex flex-col gap-4', className)}>
      <Tabs.List className="flex flex-wrap gap-2 rounded-full bg-surface-soft/60 p-1 text-sm shadow-inset">
        {tabs.map(tab => (
          <Tabs.Trigger
            key={tab.value}
            value={tab.value}
            className={cn(
              'group inline-flex items-center gap-2 rounded-full border border-transparent px-4 py-1.5 font-medium transition duration-150',
              value === tab.value
                ? 'bg-[var(--gfc-green)] text-white shadow-card'
                : 'text-muted hover:border-border hover:bg-surface-soft hover:text-foreground',
            )}
          >
            {tab.label}
            {tab.badge != null ? (
              <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-black/10 px-2 py-0.5 text-[11px] font-semibold text-white/80 group-data-[state=inactive]:bg-black/5">
                {tab.badge}
              </span>
            ) : null}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {children ? <Tabs.Content value={value}>{children}</Tabs.Content> : null}
    </Tabs.Root>
  )
}
