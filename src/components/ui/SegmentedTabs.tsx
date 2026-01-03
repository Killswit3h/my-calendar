"use client";

import { cn } from "@/lib/theme";

type TabOption = {
  value: string;
  label: string;
};

type SegmentedTabsProps = {
  options: TabOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function SegmentedTabs({ options, value, onChange, className }: SegmentedTabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex rounded-full border border-white/10 bg-white/10 p-1 text-sm font-medium text-white/70 shadow-[inset_0_0_12px_rgba(0,0,0,0.25)]",
        className,
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full px-4 py-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(27,94,32,0.6)]",
              isActive ? "bg-[var(--primary)] text-white shadow" : "text-white/70 hover:text-white",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

