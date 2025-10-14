// src/components/shell/BackButton.tsx
"use client"

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
    <Button
      variant="ghost"
      onClick={handleClick}
      className={cn("gap-2", className)}
    >
      <ArrowLeft className="h-4 w-4" />
      {children || 'Back to Dashboard'}
    </Button>
  )
}
