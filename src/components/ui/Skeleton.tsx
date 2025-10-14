'use client'

import { cn } from '@/lib/theme'

type SkeletonProps = {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg bg-foreground/10',
        'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent',
        className,
      )}
    />
  )
}

export function SkeletonRow({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-12 rounded-xl bg-foreground/10" />
      ))}
    </div>
  )
}

/* Shimmer keyframes */
declare global {
  interface CSSStyleDeclaration {
    '--shimmer-color'?: string
  }
}
