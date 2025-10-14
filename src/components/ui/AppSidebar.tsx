'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { SHELL_NAV_GROUPS, type NavItem } from '@/lib/routes'
import { cn } from '@/lib/theme'

export default function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const groups = useMemo(() => SHELL_NAV_GROUPS.filter(group => group.items.length), [])

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)')
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => setCollapsed(event.matches)
    handleChange(media)
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  return (
    <aside
      className={cn(
        'group/sidebar sticky top-0 z-40 hidden h-dvh border-r border-border/40 bg-surface backdrop-blur-2xl transition-all md:flex',
        collapsed ? 'w-[84px]' : 'w-[248px]',
      )}
      data-collapsed={collapsed ? 'true' : 'false'}
    >
      <div className="flex h-full w-full flex-col gap-6 px-4 pb-8 pt-7">
        <Link href="/dashboard" className="flex items-center gap-3 px-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-sm font-semibold uppercase tracking-[0.32em] text-white/80">
            G
          </div>
          {!collapsed ? (
            <div className="flex flex-col leading-tight text-white">
              <span className="text-[11px] uppercase tracking-[0.4em] text-white/60">Guaranteed Fence</span>
              <span className="text-base font-semibold">Control Center</span>
            </div>
          ) : null}
        </Link>
        <nav className="flex-1 space-y-5 overflow-y-auto pr-2">
          {groups.map(group => (
            <div key={group.key} className="space-y-2">
              {!collapsed ? (
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-white/40">{group.label}</p>
              ) : (
                <div className="h-2" />
              )}
              <div className="space-y-1">
                {group.items.map(item => (
                  <SidebarLink
                    key={item.key}
                    item={item}
                    collapsed={collapsed}
                    active={isActive(pathname, item.href)}
                    onHover={() => router.prefetch(item.href)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
        <Link
          href="mailto:ops@gfc.com"
          className={cn(
            'mt-auto rounded-2xl border border-white/10 px-3 py-3 text-xs text-white/70 transition hover:border-white/30 hover:text-white',
            collapsed && 'px-2 text-center',
          )}
        >
          {!collapsed ? (
            <>
              <span className="block font-semibold uppercase tracking-[0.24em]">Need help?</span>
              <span className="block text-white/60">ops@gfc.com</span>
            </>
          ) : (
            <span className="block font-semibold">?</span>
          )}
        </Link>
      </div>
    </aside>
  )
}

function SidebarLink({
  item,
  collapsed,
  active,
  onHover,
}: {
  item: NavItem
  collapsed: boolean
  active: boolean
  onHover?: () => void
}) {
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      data-nav-key={item.key}
      onMouseEnter={onHover}
      onFocus={onHover}
      className={cn(
        'group relative flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition duration-150',
        active
          ? 'bg-white/12 text-white shadow-[0_18px_32px_rgba(10,20,14,0.36)]'
          : 'text-white/70 hover:bg-white/8 hover:text-white'
      )}
      data-collapsed={collapsed ? 'true' : 'false'}
      title={collapsed ? item.label : undefined}
    >
      <span
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/10 transition duration-150',
          active ? 'border-white/30 bg-white/15 text-white' : 'text-white/70 group-hover:border-white/20 group-hover:text-white',
        )}
      >
        <item.icon className="h-4 w-4" />
      </span>
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
      {collapsed ? (
        <span className="pointer-events-none absolute left-full ml-3 hidden min-w-[140px] rounded-lg bg-foreground/95 px-3 py-1.5 text-[12px] font-medium text-background opacity-0 shadow-lg transition duration-150 group-hover:opacity-100 group-data-[collapsed=true]:block">
          {item.label}
        </span>
      ) : null}
    </Link>
  )
}

function isActive(pathname: string, href: string) {
  if (href === '/calendar') return pathname.startsWith('/calendar')
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(`${href}/`)
}
