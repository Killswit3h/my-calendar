"use client";

import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline' | 'default';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  loading?: boolean;
  asChild?: boolean;
}

const base =
  'inline-flex items-center justify-center select-none whitespace-nowrap rounded-control font-medium'
  + ' transition-[transform,box-shadow,background-color,color] ease-[cubic-bezier(.2,.8,.2,1)] duration-hover'
  + ' focus-visible:outline-none focus-visible:[box-shadow:var(--ring-outline)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';

const sizes: Record<Size, string> = {
  sm: 'h-7 px-3 text-sm',
  md: 'h-9 px-4 text-base',
  lg: 'h-11 px-5 text-base',
};

const variants: Record<Variant, string> = {
  primary:
    'bg-accent-500 text-white hover:bg-accent-600 shadow-level1 border border-border-subtle',
  secondary:
    'bg-surface text-fg hover:bg-elevated shadow-level1 border border-border',
  ghost:
    'bg-transparent text-fg hover:bg-elevated border border-transparent',
  destructive:
    'bg-status-danger text-white hover:brightness-105 shadow-level1 border border-border-subtle',
  outline:
    'bg-transparent text-fg hover:bg-surface border border-border shadow-level1',
  default:
    'bg-accent-500 text-white hover:bg-accent-600 shadow-level1 border border-border-subtle',
};

export function Button({ variant = 'primary', size = 'md', block, loading, asChild, className = '', children, ...rest }: ButtonProps) {
  const classes = [
    base,
    sizes[size],
    variants[variant],
    block ? 'w-full' : '',
    className,
  ].filter(Boolean).join(' ');

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      className: [classes, (children as any).props?.className].filter(Boolean).join(' '),
      ...rest,
    });
  }

  return (
    <button
      className={classes}
      {...rest}
    >
      {children}
    </button>
  );
}

export default Button;

