// src/components/ui/badge.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/theme"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-accent text-accent-fg hover:bg-accent/80",
        secondary: "border-transparent bg-card text-fg hover:bg-card/80",
        destructive: "border-transparent bg-danger text-white hover:bg-danger/80",
        outline: "text-fg",
        success: "border-transparent bg-accent text-accent-fg hover:bg-accent/80",
        warning: "border-transparent bg-warn text-white hover:bg-warn/80",
        info: "border-transparent bg-info text-white hover:bg-info/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
