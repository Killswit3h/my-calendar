'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

type NotificationItem = {
  id: string
  title: string
  body: string
  resourceType: 'Todo' | 'Project' | 'CalendarEvent'
  resourceId: string
  createdAt: string
  readAt: string | null
}

function urlFor(item: NotificationItem) {
  if (item.resourceType === 'Project') return `/projects/${item.resourceId}`
  if (item.resourceType === 'Todo') return `/planner/todos?todo=${item.resourceId}`
  if (item.resourceType === 'CalendarEvent') return `/calendar?event=${item.resourceId}`
  return '/'
}

export function NotificationDrawer() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const payload = (await res.json()) as NotificationItem[]
        setItems(payload)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('open-notifications', handler as EventListener)
    return () => window.removeEventListener('open-notifications', handler as EventListener)
  }, [])

  useEffect(() => {
    if (open) void load()
  }, [open, load])

  const close = () => setOpen(false)

  const markAllRead = async () => {
    const unread = items.filter(item => !item.readAt).map(item => item.id)
    if (!unread.length) return
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: unread }),
    })
    await load()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40 backdrop-blur-sm" onClick={close}>
      <aside
        className="h-full w-full max-w-md bg-white p-4 text-neutral-900 shadow-2xl dark:bg-neutral-950 dark:text-neutral-100"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Notifications</h2>
          <div className="flex items-center gap-3 text-sm">
            <button disabled={loading} onClick={markAllRead} className="text-blue-500 enabled:hover:underline">
              Mark all read
            </button>
            <Link href="/settings/notifications" className="text-blue-400 hover:underline">
              Enable push
            </Link>
            <button onClick={close} aria-label="Close notifications">
              ✕
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-neutral-500">You&apos;re all caught up.</p>
        ) : (
          <ul className="flex flex-col gap-2 overflow-y-auto">
            {items.map(item => (
              <li key={item.id} className={`rounded-lg border border-neutral-200 p-3 dark:border-white/10 ${item.readAt ? 'opacity-70' : ''}`}>
                <Link href={urlFor(item)} onClick={close}>
                  <div className="font-semibold">{item.title}</div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-300">{item.body}</p>
                  <p className="text-xs text-neutral-500">{new Date(item.createdAt).toLocaleString()}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  )
}
