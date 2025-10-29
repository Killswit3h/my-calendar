'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Bell, CalendarDays, Home, Moon, Plus, Search, SunMedium } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { CALENDAR_HOME_PATH } from '@/lib/calendar/constants'
import { QUICK_LINKS, SHELL_EVENTS, SHELL_NAV_ITEMS, type NavItem } from '@/lib/routes'

export default function TopBar() {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  const openSearch = useCallback(() => setSearchOpen(true), [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])

  useEffect(() => {
    const paletteListener = (event: Event) => {
      event.preventDefault()
      openSearch()
    }
    window.addEventListener(SHELL_EVENTS.focusSearch, paletteListener as EventListener)
    return () => window.removeEventListener(SHELL_EVENTS.focusSearch, paletteListener as EventListener)
  }, [openSearch])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        openSearch()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [openSearch])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return SHELL_NAV_ITEMS.slice(0, 6)
    return SHELL_NAV_ITEMS.filter(item => item.label.toLowerCase().includes(term)).slice(0, 10)
  }, [query])

  const handleSelect = useCallback(
    (href: string) => {
      closeSearch()
      setQuery('')
      router.push(href)
    },
    [closeSearch, router],
  )

  const toggleTheme = useCallback(() => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(next)
  }, [resolvedTheme, setTheme])

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-surface/70 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/dashboard"
          className="hidden items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm font-semibold text-white/85 transition hover:border-white/25 hover:text-white lg:inline-flex"
        >
          <Home className="h-4 w-4" />
          Home
        </Link>
        <button
          type="button"
          onClick={openSearch}
          className="glass flex h-12 flex-1 items-center gap-3 rounded-full px-4 text-left text-sm text-muted transition hover:scale-[1.01] hover:text-foreground"
        >
          <Search className="h-4 w-4 text-muted" />
          <span className="flex-1 truncate">Search modules, projects, people…</span>
          <kbd className="flex items-center gap-1 rounded-full border border-border-subtle px-2 py-0.5 text-[11px] text-muted">
            <span className="hidden md:inline">⌘</span>
            <span className="hidden md:inline">K</span>
            <span className="md:hidden">/</span>
          </kbd>
        </button>
        <Link
          href={CALENDAR_HOME_PATH}
          className="hidden items-center gap-2 rounded-full bg-[var(--gfc-green)] px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:scale-[1.02] hover:shadow-elevated sm:inline-flex"
        >
          <CalendarDays className="h-4 w-4" />
          Open Calendar
        </Link>
        <QuickAddMenu />
        <button
          type="button"
          aria-label="Toggle theme"
          onClick={toggleTheme}
          className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-surface-soft transition hover:border-border hover:bg-surface-elevated"
        >
          {mounted && resolvedTheme === 'dark' ? <SunMedium className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <button
          type="button"
          aria-label="Notifications"
          className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-surface-soft text-muted transition hover:border-border hover:bg-surface-elevated hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
        </button>
        <ProfileAvatar />
      </div>
      <CommandPalette
        open={searchOpen}
        query={query}
        setQuery={setQuery}
        onClose={closeSearch}
        onSelect={handleSelect}
        results={filtered}
      />
    </header>
  )
}

function QuickAddMenu() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [open])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={event => {
          event.stopPropagation()
          setOpen(prev => !prev)
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        className="focus-ring inline-flex h-11 items-center gap-2 rounded-full border border-border/60 bg-surface-soft px-4 text-sm font-medium text-foreground transition hover:border-border hover:bg-surface-elevated"
      >
        <Plus className="h-4 w-4" />
        Quick add
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+12px)] min-w-[220px] overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-popover backdrop-blur-xl"
          onClick={event => event.stopPropagation()}
        >
          <ul className="py-2">
            {QUICK_LINKS.map(link => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-foreground transition hover:bg-accent-50"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function ProfileAvatar() {
  return (
    <button
      type="button"
      aria-label="Profile menu"
      className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-gradient-to-br from-accent-50 via-surface-soft to-surface-elevated text-sm font-semibold text-foreground shadow-inset transition hover:border-border"
    >
      JD
    </button>
  )
}

type CommandPaletteProps = {
  open: boolean
  query: string
  setQuery: (value: string) => void
  onClose: () => void
  onSelect: (href: string) => void
  results: NavItem[]
}

function CommandPalette({ open, query, setQuery, onClose, onSelect, results }: CommandPaletteProps) {
  useEffect(() => {
    if (!open) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/45 px-4 py-24 backdrop-blur-md"
      onClick={event => {
        if (event.target === event.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-elevated">
        <div className="flex items-center gap-3 border-b border-border/50 px-5 py-4">
          <Search className="h-4 w-4 text-muted" />
          <input
            autoFocus
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Jump to a module or page"
            className="flex-1 bg-transparent text-sm text-foreground outline-none"
          />
          <kbd className="rounded-full border border-border-subtle px-2 py-0.5 text-[10px] uppercase text-muted">Esc</kbd>
        </div>
        <div className="max-h-72 overflow-y-auto">
          {results.length ? (
            <ul className="flex flex-col">
              {results.map(item => (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => {
                      if (item.href) onSelect(item.href)
                    }}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left text-sm transition hover:bg-accent-50"
                  >
                    <item.icon className="h-4 w-4 text-muted" />
                    <span className="text-foreground">{item.label}</span>
                    <span className="ml-auto text-xs text-muted">{item.href}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-10 text-sm text-muted">No matches — try another term.</div>
          )}
        </div>
      </div>
    </div>
  )
}
