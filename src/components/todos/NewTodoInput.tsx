"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";

type NewTodoInputProps = {
  onSubmit(title: string): Promise<void> | void;
  disabled?: boolean;
  placeholder?: string;
};

export function NewTodoInput({ onSubmit, disabled, placeholder = "Add a task" }: NewTodoInputProps) {
  const [value, setValue] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const title = value.trim();
    if (!title || loading) return;
    setLoading(true);
    try {
      await onSubmit(title);
      setValue("");
      setExpanded(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface-soft/95 p-3 shadow-[0_16px_40px_rgba(12,32,21,0.14)]">
      <textarea
        value={value}
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
        onFocus={() => setExpanded(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSubmit();
          }
        }}
        rows={expanded ? 3 : 1}
        placeholder={placeholder}
        data-testid="new-todo-input"
        className="w-full resize-none rounded-xl border border-border/80 bg-surface px-3 py-2 text-sm text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40"
      />
      <div className="mt-2 flex items-center justify-between text-xs text-white/40">
        <span>Press Enter to add · Shift+Enter for newline</span>
        <button
          type="button"
          disabled={disabled || loading || !value.trim()}
          onClick={handleSubmit}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 transition",
            disabled || loading || !value.trim()
              ? "cursor-not-allowed opacity-60"
              : "hover:border-emerald-400 hover:text-emerald-200",
          )}
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
    </div>
  );
}

export default NewTodoInput;
