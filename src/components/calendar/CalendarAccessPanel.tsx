'use client'

import { Shield } from 'lucide-react'

import { useUserAccess } from '@/hooks/useUserAccess'
import { cn } from '@/lib/theme'
import { REPORT_ACCESS_AREAS } from '@/lib/accessAreas'
import { Skeleton } from '@/components/ui/Skeleton'
import { Switch } from '@/components/ui/switch'

type Props = {
  className?: string
}

export function CalendarAccessPanel({ className }: Props) {
  const { users, isLoading, toggleAccess, pendingKey } = useUserAccess()

  return (
    <section className={cn('glass rounded-3xl border border-border/60 p-5', className)}>
      <div className="flex items-center gap-3">
        <Shield className="h-5 w-5 text-accent" />
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-muted">Reports</p>
          <h2 className="text-lg font-semibold text-foreground">Who can open reports?</h2>
          <p className="text-sm text-muted">Grant or revoke access to the Daily, Weekly, Finance, and Export shelves.</p>
        </div>
      </div>
      <div className="mt-5 space-y-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, idx) => (
              <div key={`skeleton-${idx}`} className="rounded-2xl border border-border/40 bg-surface-soft p-4">
                <Skeleton className="h-4 w-48 rounded-full bg-foreground/10" />
                <Skeleton className="mt-2 h-3 w-32 rounded-full bg-foreground/10" />
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {REPORT_ACCESS_AREAS.map(area => (
                    <Skeleton key={area.key} className="h-12 rounded-2xl bg-foreground/10" />
                  ))}
                </div>
              </div>
            ))
          : users.map(user => (
              <article key={user.id} className="rounded-2xl border border-border/40 bg-surface-soft/50 p-4 shadow-inner">
                <div className="flex flex-col gap-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{user.name ?? 'Unnamed user'}</p>
                      <p className="text-xs text-muted">{user.email ?? 'No email on file'}</p>
                    </div>
                    <span className="text-xs text-muted">
                      {user.accessAreas.length}/{REPORT_ACCESS_AREAS.length} areas
                    </span>
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-muted">
                    {user.memberships.map(m => m.role).join(', ') || 'No team'}
                  </p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {REPORT_ACCESS_AREAS.map(area => {
                    const checked = user.accessAreas.includes(area.key)
                    const key = `${user.id}:${area.key}`
                    const pending = pendingKey === key
                    return (
                      <div
                        key={area.key}
                        className="flex items-center justify-between rounded-2xl border border-border/40 bg-background/40 px-3 py-2"
                      >
                        <div className="flex flex-col text-xs text-muted">
                          <span className="text-sm font-medium text-foreground">{area.label}</span>
                          <span className="text-[11px]">{area.description}</span>
                        </div>
                        <Switch
                          checked={checked}
                          disabled={pending}
                          onCheckedChange={enabled => toggleAccess({ userId: user.id, area: area.key, enabled })}
                          aria-label={`${area.label} access for ${user.name ?? user.email ?? user.id}`}
                        />
                      </div>
                    )
                  })}
                </div>
              </article>
            ))}
        {!isLoading && !users.length ? (
          <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
            Invite teammates to start assigning report access.
          </div>
        ) : null}
      </div>
    </section>
  )
}










