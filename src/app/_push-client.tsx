'use client'

import { useEffect } from 'react'

export default function PushClient() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.error('Failed to register push service worker', err)
    })
  }, [])

  return null
}
