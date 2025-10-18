'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/theme'

type BackButtonProps = {
  href?: string
  label?: string
  className?: string
}

export function BackButton({ href = '/dashboard', label = 'Back to dashboard', className }: BackButtonProps) {
  const router = useRouter()

  if (href === 'back') {
    return (
      <button
        type="button"
        onClick={() => router.back()}
        className={cn(
          'focus-ring inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface-soft px-4 py-2 text-sm font-medium text-foreground transition hover:border-border hover:bg-surface-elevated',
          className,
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        {label}
      </button>
    )
  }

  return (
    <Link
      href={href}
      className={cn(
        'focus-ring inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface-soft px-4 py-2 text-sm font-medium text-foreground transition hover:border-border hover:bg-surface-elevated',
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  )
}
