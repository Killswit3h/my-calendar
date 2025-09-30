"use client";

import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  help?: string;
  error?: string;
}

export function Select({ label, help, error, className = '', id, children, ...rest }: SelectProps) {
  const selectId = id || React.useId();
  const describedBy: string[] = [];
  if (help) describedBy.push(`${selectId}-help`);
  if (error) describedBy.push(`${selectId}-error`);
  return (
    <label className="grid gap-1 text-sm text-fg">
      {label ? <div className="text-[var(--fg-muted)]">{label}</div> : null}
      <select
        id={selectId}
        className={[
          'w-full min-h-[44px] rounded-control border border-border bg-[var(--surface)] text-fg',
          'px-3 py-2 focus:outline-none focus:[box-shadow:var(--ring-outline)]',
          error ? 'border-status-danger' : '',
          className,
        ].join(' ')}
        aria-describedby={describedBy.join(' ') || undefined}
        aria-invalid={!!error || undefined}
        {...rest}
      >
        {children}
      </select>
      {help ? <div id={`${selectId}-help`} className="text-xs text-[var(--fg-muted)]">{help}</div> : null}
      {error ? <div id={`${selectId}-error`} className="text-xs text-status-danger">{error}</div> : null}
    </label>
  );
}

export default Select;

