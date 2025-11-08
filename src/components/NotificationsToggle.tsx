// src/components/NotificationsToggle.tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/Toast'

type Status = 'idle' | 'enabled' | 'loading' | 'unsupported'

export default function NotificationsToggle() {
  const [status, setStatus] = useState<Status>('idle')

  const ensureSupport = useCallback(() => {
    if (typeof window === 'undefined') return false
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setStatus('unsupported')
      return false
    }
    return true
  }, [])

  useEffect(() => {
    if (!ensureSupport()) return
    let cancelled = false
    ;(async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        if (!registration) return
        const sub = await registration.pushManager.getSubscription()
        if (!cancelled && sub) {
          setStatus('enabled')
        }
      } catch {
        // ignore
      }
    })()
    return () => {
      cancelled = true
    }
  }, [ensureSupport])

  const enableNotifications = useCallback(async () => {
    if (!ensureSupport()) {
      toast.error('Push notifications are not supported in this browser.')
      return
    }
    const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_VAPID_KEY
    if (!publicKey) {
      toast.error('Push notifications are not configured.')
      return
    }
    setStatus('loading')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        toast.error('Notification permission denied.')
        setStatus('idle')
        return
      }
      const registration = await navigator.serviceWorker.register('/sw.js')
      const active = registration.active ?? (await navigator.serviceWorker.ready)
      if (!active) throw new Error('Service worker failed to activate')

      const existing = await registration.pushManager.getSubscription()
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          applicationServerKey: urlBase64ToUint8Array(publicKey),
          userVisibleOnly: true,
        }))

      const payload = subscription.toJSON()
      await fetch('/api/reminders/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      setStatus('enabled')
      toast.success('Browser notifications enabled.')
    } catch (error: any) {
      console.error('Failed to enable push notifications', error)
      toast.error('Failed to enable notifications.')
      setStatus('idle')
    }
  }, [ensureSupport])

  const label =
    status === 'unsupported'
      ? 'Push not supported'
      : status === 'enabled'
        ? 'Browser push enabled'
        : status === 'loading'
          ? 'Enabling...'
          : 'Enable browser push'

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-muted">Browser notifications</span>
      <Button onClick={enableNotifications} disabled={status !== 'idle'} variant={status === 'enabled' ? 'secondary' : 'default'}>
        {label}
      </Button>
      {status === 'enabled' ? (
        <p className="text-xs text-muted-foreground">Reminders will be delivered as web push notifications.</p>
      ) : null}
      {status === 'unsupported' ? (
        <p className="text-xs text-muted-foreground">Your browser does not support push notifications.</p>
      ) : null}
    </div>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
