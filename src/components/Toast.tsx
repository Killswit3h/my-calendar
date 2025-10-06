'use client'

import { useEffect } from 'react'

export type ToastProps = {
  message: string
  open: boolean
  duration?: number
  onClose?: () => void
}

export function Toast({ message, open, duration = 4000, onClose }: ToastProps) {
  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => {
      onClose?.()
    }, duration)
    return () => window.clearTimeout(timer)
  }, [open, duration, onClose])

  if (!open) return null

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        right: '1rem',
        bottom: '1rem',
        zIndex: 1000,
        maxWidth: '320px',
        background: 'rgba(32, 38, 45, 0.92)',
        color: '#fff',
        padding: '0.75rem 1rem',
        borderRadius: '0.5rem',
        boxShadow: '0 8px 16px rgba(15, 23, 42, 0.45)',
        fontSize: '0.95rem',
        lineHeight: 1.4,
      }}
    >
      {message}
    </div>
  )
}

export type ToastState = {
  open: boolean
  message: string
}

export function createToastState(): ToastState {
  return { open: false, message: '' }
}
