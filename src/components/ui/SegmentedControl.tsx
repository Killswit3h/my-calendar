"use client";

import React from 'react';

type Option = { value: string; label: string };

export interface SegmentedControlProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <div role="tablist" aria-label="View" className="inline-flex p-1 rounded-pill border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_95%,transparent)] backdrop-blur-[var(--glass-blur-8)]">
      {options.map(opt => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={selected}
            className={[
              'px-3 h-9 rounded-pill transition duration-hover ease-[cubic-bezier(.2,.8,.2,1)]',
              selected ? 'bg-[var(--elevated)] border border-[var(--border)]' : 'text-[var(--fg-muted)]',
            ].join(' ')}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;

