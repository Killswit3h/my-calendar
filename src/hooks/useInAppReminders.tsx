// src/hooks/useInAppReminders.tsx
'use client'

import React, { useEffect, useRef } from 'react'
import { toast } from '@/components/ui/Toast'

type Reminder = {
  id: string
  fireAt: string
  entityType: 'event' | 'todo'
  entityId: string
}

const REFRESH_INTERVAL_MS = 5 * 60 * 1000

export function useInAppReminders() {
  const timers = useRef<number[]>([])

  useEffect(() => {
    let cancelled = false

    const clearTimers = () => {
      timers.current.forEach(timerId => window.clearTimeout(timerId))
      timers.current = []
    }

    async function loadAndSchedule() {
      try {
        const res = await fetch('/api/reminders/next?windowHours=24', { cache: 'no-store' })
        if (!res.ok) return
        const { reminders } = (await res.json()) as { reminders: Reminder[] }
        if (cancelled) return

        clearTimers()
        const now = Date.now()
        for (const reminder of reminders) {
          const dueAt = new Date(reminder.fireAt).getTime()
          if (Number.isNaN(dueAt)) continue
          const delay = Math.max(0, dueAt - now)
          const timeoutId = window.setTimeout(() => showReminderToast(reminder), delay)
          timers.current.push(timeoutId)
        }
      } catch (error) {
        console.error('Failed to load reminders', error)
      }
    }

    loadAndSchedule()
    const interval = window.setInterval(loadAndSchedule, REFRESH_INTERVAL_MS)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      clearTimers()
    }
  }, [])
}

function showReminderToast(reminder: Reminder) {
  const url = reminder.entityType === 'event' ? `/events/${reminder.entityId}` : `/todos/${reminder.entityId}`

  toast.custom(
    t => (
      <div className="flex w-80 flex-col gap-3 rounded-xl border border-border bg-surface-soft p-3 text-sm text-foreground shadow-lg">
        <div className="flex flex-col gap-1">
          <span className="font-semibold">Reminder due</span>
          <span className="text-xs text-muted-foreground">
            {reminder.entityType === 'event' ? 'Event' : 'Todo'} is ready.
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <ReminderButton
            label="Open"
            onClick={() => {
              void ackReminder(reminder.id)
              window.location.href = url
              toast.dismiss(t)
            }}
          />
          <ReminderButton
            label="Snooze 5m"
            onClick={() => {
              void snoozeReminder(reminder.id, 5)
              toast.dismiss(t)
            }}
          />
          <ReminderButton
            label="Snooze 10m"
            onClick={() => {
              void snoozeReminder(reminder.id, 10)
              toast.dismiss(t)
            }}
          />
          <ReminderButton
            label="Snooze 60m"
            onClick={() => {
              void snoozeReminder(reminder.id, 60)
              toast.dismiss(t)
            }}
          />
        </div>
      </div>
    ),
    { duration: Infinity, closeButton: true },
  )
}

function ReminderButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground transition hover:border-accent hover:text-accent"
    >
      {label}
    </button>
  )
}

async function ackReminder(reminderId: string) {
  try {
    await fetch('/api/reminders/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reminderId }),
    })
  } catch (error) {
    console.error('Failed to ack reminder', error)
  }
}

async function snoozeReminder(reminderId: string, minutes: number) {
  try {
    await fetch('/api/reminders/snooze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reminderId, minutes }),
    })
  } catch (error) {
    console.error('Failed to snooze reminder', error)
  }
}
