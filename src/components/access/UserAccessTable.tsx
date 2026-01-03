'use client'

import { RefreshCcw } from 'lucide-react'

import { useUserAccess } from '@/hooks/useUserAccess'
import { cn } from '@/lib/theme'
import { Skeleton } from '@/components/ui/Skeleton'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { REPORT_ACCESS_AREAS } from '@/lib/accessAreas'

type Props = {
  className?: string
  compact?: boolean
}

export function UserAccessTable({ className, compact = false }: Props) {
  const { users, isLoading, error, refetch, toggleAccess, pendingKey } = useUserAccess()

  const rows = isLoading
    ? Array.from({ length: 4 }).map((_, idx) => (
        <TableRow key={`skeleton-${idx}`}>
          <TableCell>
            <Skeleton className="h-4 w-32 rounded-full bg-foreground/10" />
            <Skeleton className="mt-2 h-3 w-48 rounded-full bg-foreground/10" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24 rounded-full bg-foreground/10" />
          </TableCell>
          {REPORT_ACCESS_AREAS.map(area => (
            <TableCell key={area.key} className="text-center">
              <Skeleton className="mx-auto h-6 w-10 rounded-full bg-foreground/10" />
            </TableCell>
          ))}
        </TableRow>
      ))
    : users.map(user => {
        const roles = user.memberships.map(m => m.role).join(', ')
        return (
          <TableRow key={user.id}>
            <TableCell>
              <div className="flex flex-col gap-1">
                <span className="font-medium text-foreground">{user.name ?? 'Unnamed user'}</span>
                <span className="text-xs text-muted">{user.email ?? 'No email on file'}</span>
                <span className="text-[11px] text-muted/80">
                  Updated {new Date(user.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="text-sm text-muted">{roles || '—'}</div>
            </TableCell>
            {REPORT_ACCESS_AREAS.map(area => {
              const checked = user.accessAreas.includes(area.key)
              const key = `${user.id}:${area.key}`
              const pending = pendingKey === key
              return (
                <TableCell key={area.key} className="text-center">
                  <div className="flex flex-col items-center gap-1 text-xs text-muted">
                    <Switch
                      checked={checked}
                      disabled={pending}
                      onCheckedChange={enabled => toggleAccess({ userId: user.id, area: area.key, enabled })}
                      aria-label={`${area.label} access for ${user.name ?? user.email ?? user.id}`}
                    />
                    {!compact ? <span className="text-[11px]">{checked ? 'Allowed' : 'Hidden'}</span> : null}
                  </div>
                </TableCell>
              )
            })}
          </TableRow>
        )
      })

  return (
    <div className={cn('glass rounded-3xl border border-border/50 p-6', className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-muted">User Access</p>
          <h2 className="text-lg font-semibold text-foreground">Reports permissions</h2>
          <p className="text-sm text-muted">Toggle which report surfaces each teammate can open.</p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted transition hover:border-border/80 hover:text-foreground"
        >
          <RefreshCcw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>
      {error ? (
        <div className="mt-4 rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Failed to load users. Please retry.
        </div>
      ) : null}
      <div className="mt-6 overflow-x-auto">
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow className="bg-surface-soft">
              <TableHead>User</TableHead>
              <TableHead>Teams & roles</TableHead>
              {REPORT_ACCESS_AREAS.map(area => (
                <TableHead key={area.key} className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span>{area.label}</span>
                    {!compact ? <span className="text-[11px] text-muted">{area.description}</span> : null}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows
            ) : (
              <TableRow>
                <TableCell colSpan={2 + REPORT_ACCESS_AREAS.length} className="py-10 text-center text-sm text-muted">
                  Invite teammates to assign permissions.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

