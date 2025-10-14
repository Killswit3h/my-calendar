// src/components/shell/BackButton.tsx
"use client"

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/theme'

interface BackButtonProps {
  href?: string
  className?: string
  children?: React.ReactNode
}

export function BackButton({ href = '/dashboard', className, children }: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(href)
    }
  }

  return (
    <button
      onClick={handleClick}
      className={cn("inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-card/80 transition-colors", className)}
    >
      <ArrowLeft className="h-4 w-4" />
      {children || 'Back to Dashboard'}
    </button>
  )
}
