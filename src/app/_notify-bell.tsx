'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function NotifyBell() {
  const { data } = useSWR<{ count: number }>('/api/notifications/unread-count', fetcher, {
    refreshInterval: 10_000,
  })

  const handleOpen = () => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(new Event('open-notifications'))
  }

  return (
    <button
      type="button"
      onClick={handleOpen}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white hover:bg-white/10"
      aria-label="Notifications"
    >
      <span role="img" aria-hidden="true">
        🔔
      </span>
      {data?.count ? (
        <span className="absolute -top-1 -right-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
          {data.count}
        </span>
      ) : null}
    </button>
  )
}
