// src/components/providers/ToasterProvider.tsx
"use client"

import { Toaster } from 'sonner'

export function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'rgb(var(--card))',
          border: '1px solid rgb(var(--border))',
          color: 'rgb(var(--fg))',
        },
        className: 'glass',
      }}
    />
  )
}
