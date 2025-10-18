'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/theme'

export type ProjectTab = {
  key: string
  label: string
}

export function ProjectTabs({ projectId, tabs }: { projectId: string; tabs: ProjectTab[] }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap gap-2 rounded-2xl border border-border bg-surface/70 px-4 py-2 text-sm">
      {tabs.map(tab => {
        const href = `/projects/${projectId}/${tab.key}`
        const active = pathname === href
        return (
          <Link
            key={tab.key}
            href={href}
            className={cn(
              'rounded-full px-3 py-1 capitalize transition',
              active ? 'bg-accent text-accent-foreground shadow' : 'text-muted hover:bg-accent-50 hover:text-foreground',
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
