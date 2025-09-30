"use client";

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  help?: string;
  error?: string;
}

export function Input({ label, help, error, className = '', id, ...rest }: InputProps) {
  const inputId = id || React.useId();
  const describedBy: string[] = [];
  if (help) describedBy.push(`${inputId}-help`);
  if (error) describedBy.push(`${inputId}-error`);
  return (
    <label className="grid gap-1 text-sm text-fg">
      {label ? <div className="text-[var(--fg-muted)]">{label}</div> : null}
      <input
        id={inputId}
        className={[
          'w-full min-h-[44px] rounded-control border border-border bg-[var(--surface)] text-fg',
          'px-3 py-2 focus:outline-none focus:[box-shadow:var(--ring-outline)]',
          error ? 'border-status-danger' : '',
          className,
        ].join(' ')}
        aria-describedby={describedBy.join(' ') || undefined}
        aria-invalid={!!error || undefined}
        {...rest}
      />
      {help ? <div id={`${inputId}-help`} className="text-xs text-[var(--fg-muted)]">{help}</div> : null}
      {error ? <div id={`${inputId}-error`} className="text-xs text-status-danger">{error}</div> : null}
    </label>
  );
}

export default Input;

