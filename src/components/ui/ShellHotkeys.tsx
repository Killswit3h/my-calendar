'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { CALENDAR_HOME_PATH } from '@/lib/calendar/constants'
import { HOTKEYS, SHELL_EVENTS } from '@/lib/routes'

export function ShellHotkeys() {
  const router = useRouter()

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return

      if (HOTKEYS.focusSearch.includes(event.key.toLowerCase()) && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        event.preventDefault()
        window.dispatchEvent(new Event(SHELL_EVENTS.focusSearch))
        return
      }

      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key.toLowerCase() === 'g') {
        event.preventDefault()
        const listener = (nextEvent: KeyboardEvent) => {
          const pair = `g ${nextEvent.key.toLowerCase()}`
          if (HOTKEYS.goDashboard.includes(pair)) {
            nextEvent.preventDefault()
            router.push('/dashboard')
          } else if (HOTKEYS.goCalendar.includes(pair)) {
            nextEvent.preventDefault()
            router.push(CALENDAR_HOME_PATH)
          }
        }
        window.addEventListener('keydown', listener, { once: true })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [router])

  return null
}
