import React from 'react';

export type CardProps<T extends React.ElementType = 'div'> = {
  as?: T;
  elevated?: boolean;
  className?: string;
} & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'className'>;

export function Card<T extends React.ElementType = 'div'>(props: CardProps<T>) {
  const { as, elevated, className = '', ...rest } = props as CardProps;
  const Comp = (as || 'div') as React.ElementType;
  return (
    <Comp
      className={[
        'bg-[var(--surface)] border border-[var(--border)] rounded-card',
        elevated ? 'shadow-level1' : '',
        className,
      ].join(' ')}
      {...rest}
    />
  );
}

export default Card;
