'use client'

import { useState, type ReactNode } from 'react'
import { Plus } from 'lucide-react'

import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'
import { cn } from '@/lib/theme'

export type ActionDrawerProps = {
  triggerLabel: string
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  icon?: ReactNode
  variant?: 'primary' | 'ghost'
}

export function ActionDrawer({
  triggerLabel,
  title,
  description,
  children,
  footer,
  icon = <Plus className="h-4 w-4" />,
  variant = 'primary',
}: ActionDrawerProps) {
  const [open, setOpen] = useState(false)

  const triggerClasses =
    variant === 'primary'
      ? 'inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-[0_18px_38px_rgba(47,110,61,0.35)] transition-transform hover:-translate-y-0.5'
      : 'inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent-50'

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className={cn(triggerClasses)}
        >
          {icon}
          {triggerLabel}
        </button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <SheetBody>{children}</SheetBody>
        <SheetFooter>
          {footer ?? (
            <>
              <SheetClose asChild>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
              </SheetClose>
              <button type="button" className="btn">
                Save draft
              </button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
