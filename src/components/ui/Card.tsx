import React from 'react';

export type CardTone = 'surface' | 'elevated' | 'default' | 'glass' | 'muted';

export type CardProps<T extends React.ElementType = 'div'> = {
  as?: T;
  elevated?: boolean;
  bordered?: boolean;
  tone?: CardTone;
  className?: string;
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'className'>;

const toneStyles: Record<CardTone, string> = {
  surface: 'bg-[var(--surface)]',
  elevated: 'bg-[var(--elevated)]',
  default: 'bg-[var(--surface)]',
  glass: 'bg-[var(--glass-surface)] backdrop-blur-[var(--glass-blur-12)]',
  muted: 'bg-[var(--surface)] opacity-75',
};

export function Card<T extends React.ElementType = 'div'>(props: CardProps<T>) {
  const { as, elevated, bordered = true, tone = 'default', className = '', ...rest } = props as CardProps;
  const Comp = (as || 'div') as React.ElementType;
  return (
    <Comp
      className={[
        toneStyles[tone],
        bordered ? 'border border-[var(--border)]' : '',
        'rounded-card',
        elevated ? 'shadow-level1' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...rest}
    />
  );
}

export default Card;
