import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'
import { forwardRef } from 'react'

import { cn } from '@/lib/theme'

export type CardTone = 'glass' | 'surface' | 'elevated' | 'muted'

export type CardProps<T extends ElementType = 'div'> = {
  as?: T
  tone?: CardTone
  bordered?: boolean
  padded?: boolean
  header?: ReactNode
  footer?: ReactNode
  className?: string
} & ComponentPropsWithoutRef<T>

const toneClassMap: Record<CardTone, string> = {
  glass: 'glass',
  surface: 'bg-surface-soft border border-border/50 shadow-card',
  elevated: 'elevated shadow-elevated',
  muted: 'bg-foreground/5 border border-border/40',
}

export const Card = forwardRef<HTMLElement, CardProps>((props, ref) => {
  const {
    as,
    tone = 'glass',
    bordered = false,
    padded = true,
    header,
    footer,
    className,
    children,
    ...rest
  } = props

  const Comp = (as || 'section') as ElementType

  return (
    <Comp
      ref={ref as any}
      className={cn(
        'relative flex flex-col gap-4 rounded-2xl transition duration-150 ease-out-soft',
        toneClassMap[tone],
        bordered ? 'border border-border/60' : '',
        padded ? 'px-6 py-5' : '',
        className,
      )}
      {...rest}
    >
      {header ? <div className="flex items-center justify-between gap-4">{header}</div> : null}
      {children}
      {footer ? <div className="mt-auto pt-2">{footer}</div> : null}
    </Comp>
  )
})

Card.displayName = 'Card'

export default Card