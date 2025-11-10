"use client";

import type { CSSProperties, ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Star, Trash2 } from "lucide-react";
import type { TodoItemModel } from "./types";
import { cn } from "@/lib/cn";
import { APP_TZ, formatInTimeZone } from "@/lib/timezone";

type SortableListItemProps = {
  id: string;
  disabled?: boolean;
  children: ReactNode;
};

export function SortableListItem({ id, disabled, children }: SortableListItemProps) {
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    isDragging,
    transform,
    transition,
  } = useSortable({ id, disabled });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="space-y-2">
      {typeof children === "function" ? (children as any)({ setActivatorNodeRef, listeners }) : children}
    </div>
  );
}

function toYmd(iso: string | null): string | null {
  if (!iso) return null;
  try {
    const parsed = new Date(iso);
    return formatInTimeZone(parsed, APP_TZ).date;
  } catch {
    return null;
  }
}

function formatDueLabel(todo: TodoItemModel): string | null {
  try {
    if (todo.allDay) {
      const datePart = todo.dueDate ?? toYmd(todo.dueAt ?? null);
      if (!datePart) return null;
      const parsed = new Date(`${datePart}T00:00:00`);
      return formatInTimeZone(parsed, APP_TZ).date;
    }
    if (!todo.dueAt) return null;
    const parsed = new Date(todo.dueAt);
    const formatted = formatInTimeZone(parsed, APP_TZ);
    return `${formatted.date} • ${formatted.time.slice(0, 5)}`;
  } catch {
    return null;
  }
}

type TodoItemProps = {
  todo: TodoItemModel;
  selected: boolean;
  onSelect(todo: TodoItemModel): void;
  onToggleComplete(todo: TodoItemModel, value: boolean): void;
  onToggleImportant(todo: TodoItemModel, value: boolean): void;
  onDelete(todo: TodoItemModel): void;
};

export default function TodoItem({
  todo,
  selected,
  onSelect,
  onToggleComplete,
  onToggleImportant,
  onDelete,
}: TodoItemProps) {
  const dueLabel = formatDueLabel(todo);

  return (
    <div
      data-testid="todo-item"
      data-todo-id={todo.id}
      className={cn(
        "group flex items-start gap-3 rounded-2xl border border-border/60 bg-surface-soft/95 p-3 text-sm text-white transition shadow-[0_14px_32px_rgba(7,17,11,0.18)]",
        selected && "border-emerald-500/60 bg-emerald-500/10",
      )}
    >
      <button
        type="button"
        onClick={() => onToggleComplete(todo, !todo.isCompleted)}
        className={cn(
          "mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-border/70 transition",
          todo.isCompleted ? "bg-emerald-500 text-black" : "bg-surface",
        )}
        aria-label={todo.isCompleted ? "Mark incomplete" : "Mark complete"}
      >
        {todo.isCompleted ? "✓" : ""}
      </button>

      <div className="flex-1 space-y-2">
        <button
          type="button"
          className="text-left"
          onClick={() => onSelect(todo)}
          data-testid="todo-open-detail"
        >
          <p
            className={cn(
              "font-medium text-white/90",
              todo.isCompleted && "text-white/50 line-through",
            )}
          >
            {todo.title}
          </p>
        </button>

        <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
          {dueLabel ? <span className="text-white/70">Due {dueLabel}</span> : null}
          {todo.myDay ? <span className="text-emerald-200">In My Day</span> : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onToggleImportant(todo, !todo.isImportant)}
          className={cn(
            "rounded-full border border-transparent p-2 text-white/60 transition",
            todo.isImportant ? "text-amber-300" : "hover:border-amber-400 hover:text-amber-200",
          )}
          aria-label={todo.isImportant ? "Remove star" : "Mark important"}
        >
          <Star className={cn("h-4 w-4", todo.isImportant && "fill-current")} />
        </button>
        <button
          type="button"
          className="hidden rounded-full border border-border/60 p-2 text-white/40 transition hover:border-red-400 hover:text-red-300 sm:flex"
          onClick={() => onDelete(todo)}
          aria-label="Delete task"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
