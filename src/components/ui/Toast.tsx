'use client'

import { Toaster, toast } from 'sonner'

export { toast }

export function ToastViewport() {
  return (
    <Toaster
      position="top-right"
      closeButton
      theme="system"
      richColors
      toastOptions={{
        classNames: {
          toast: 'glass border border-border/60 text-foreground shadow-card',
          description: 'text-muted',
          actionButton: 'focus-ring rounded-full bg-[var(--gfc-green)] text-white px-3 py-1 text-sm',
        },
      }}
    />
  )
}
