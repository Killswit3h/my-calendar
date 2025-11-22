"use client";

import { useMemo } from "react";
import type { ActiveView, GroupOption, SortOption } from "./types";
import { Sun } from "lucide-react";
import { cn } from "@/lib/cn";

type ToolbarProps = {
  title: string;
  subtitle?: string;
  activeView: ActiveView;
  sort: SortOption;
  group: GroupOption;
  hideCompleted: boolean;
  onSortChange(sort: SortOption): void;
  onGroupChange(group: GroupOption): void;
  onToggleHideCompleted(value: boolean): void;
  onAddToMyDay(): void;
};

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "manual", label: "Manual (drag & drop)" },
  { value: "importance", label: "Importance" },
  { value: "due-date", label: "Due date" },
  { value: "alphabetical", label: "Alphabetical" },
  { value: "created", label: "Creation date" },
];

export default function Toolbar({
  title,
  subtitle,
  activeView,
  sort,
  group,
  hideCompleted,
  onSortChange,
  onGroupChange,
  onToggleHideCompleted,
  onAddToMyDay,
}: ToolbarProps) {
  const showGroupControl = useMemo(() => activeView.type === "smart" ? activeView.key === "planned" : true, [activeView]);

  return (
    <header className="flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white md:flex-row md:items-center">
      <div>
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        <p className="text-xs text-white/60">{subtitle ?? "Plan your tasks, drag to reorder, and keep work in flow."}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs md:justify-end">
        <label className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5">
          <span className="text-white/60">Sort</span>
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as SortOption)}
            className="bg-transparent text-white outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-black text-white">
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {showGroupControl ? (
          <label className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5">
            <span className="text-white/60">Group</span>
            <select
              value={group}
              onChange={(event) => onGroupChange(event.target.value as GroupOption)}
              className="bg-transparent text-white outline-none"
            >
              <option value="none" className="bg-black text-white">
                None
              </option>
              <option value="due-date" className="bg-black text-white">
                Due date
              </option>
            </select>
          </label>
        ) : null}
        <button
          type="button"
          aria-pressed={hideCompleted}
          onClick={() => onToggleHideCompleted(!hideCompleted)}
          className={cn(
            "inline-flex items-center rounded-full border px-3 py-1.5 text-xs transition",
            hideCompleted
              ? "border-emerald-400 text-emerald-200"
              : "border-white/10 text-white/70 hover:border-emerald-400 hover:text-emerald-200",
          )}
        >
          Hide Completed
        </button>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 transition",
            activeView.type === "smart" && activeView.key === "myday"
              ? "border-emerald-400 text-emerald-200"
              : "hover:border-emerald-400 hover:text-emerald-200",
          )}
          onClick={onAddToMyDay}
        >
          <Sun className="h-4 w-4" /> Add to My Day
        </button>
      </div>
    </header>
  );
}
