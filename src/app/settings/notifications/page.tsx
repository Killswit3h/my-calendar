'use client'

import { useState } from 'react'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function NotificationsSettingsPage() {
  const [status, setStatus] = useState<string>('')

  async function handleSubscribe() {
    try {
      if (!('Notification' in window)) {
        setStatus('Notifications not supported in this browser.')
        return
      }
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setStatus('Push not supported on this device.')
        return
      }

      setStatus('Requesting permission…')
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('Permission denied.')
        return
      }

      const reg = await navigator.serviceWorker.ready
      const applicationServerKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY
      if (!applicationServerKey) {
        setStatus('Missing public VAPID key.')
        return
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(applicationServerKey),
      })

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })

      setStatus(res.ok ? 'Push enabled.' : 'Failed to persist subscription.')
    } catch (error) {
      console.error(error)
      setStatus('Subscription failed.')
    }
  }

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <p className="text-sm text-neutral-400">Enable push alerts for todos, events, and project updates.</p>
      </div>
      <button
        type="button"
        onClick={handleSubscribe}
        className="inline-flex items-center rounded-md border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10"
      >
        Enable Push Notifications
      </button>
      {status ? <p className="text-sm text-neutral-300">{status}</p> : null}
    </div>
  )
}
