'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/theme'

export type ModuleTab = {
  label: string
  href: string
}

export function ModuleTabs({ tabs }: { tabs: ModuleTab[] }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap gap-2 rounded-3xl border border-border bg-surface-soft px-4 py-2 text-sm shadow-inner">
      {tabs.map(tab => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'rounded-full px-3.5 py-1.5 capitalize transition',
              active ? 'bg-accent text-accent-foreground shadow-[0_12px_26px_rgba(47,110,61,0.25)]' : 'text-muted hover:bg-accent-50 hover:text-foreground',
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
