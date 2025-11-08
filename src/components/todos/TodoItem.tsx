"use client";

import { useMemo, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, GripVertical, Star, Sun, Trash2 } from "lucide-react";
import type { TodoItemModel } from "./types";
import { cn } from "@/lib/cn";
import { APP_TZ, formatInTimeZone } from "@/lib/timezone";


type SortableListItemProps = {
  id: string;
  disabled?: boolean;
  children: React.ReactNode;
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

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="space-y-2">
      {typeof children === "function"
        ? (children as any)({ setActivatorNodeRef, listeners })
        : children}
    </div>
  );
}

function toDateTimeInput(iso: string | null): string | null {
  if (!iso) return null;
  try {
    const source = new Date(iso);
    const { date, time } = formatInTimeZone(source, APP_TZ);
    return `${date}T${time.slice(0, 5)}`;
  } catch {
    return null;
  }
}

function extractDatePart(iso: string | null): string | null {
  if (!iso) return null;
  try {
    const source = new Date(iso);
    return formatInTimeZone(source, APP_TZ).date;
  } catch {
    return null;
  }
}

type DueDisplayProps = {
  todo: TodoItemModel;
  onUpdate(next: { allDay: boolean; dueAt: string | null; dueDate: string | null }): void;
};

function DueDisplay({ todo, onUpdate }: DueDisplayProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const label = useMemo(() => {
    if (todo.allDay) {
      const datePart = todo.dueDate ?? extractDatePart(todo.dueAt ?? null);
      if (!datePart) return "Set date";
      const parsed = new Date(`${datePart}T00:00:00`);
      return formatInTimeZone(parsed, APP_TZ).date;
    }
    const dateTime = toDateTimeInput(todo.dueAt ?? null);
    if (!dateTime) return "Set due";
    const parsed = new Date(`${dateTime}:00`);
    const formatted = formatInTimeZone(parsed, APP_TZ);
    return `${formatted.date} • ${formatted.time.slice(0, 5)}`;
  }, [todo]);

  const handleButton = () => {
    requestAnimationFrame(() => {
      inputRef.current?.showPicker?.();
    });
  };

  const inputType = todo.allDay ? "date" : "datetime-local";
  const inputValue = todo.allDay
    ? todo.dueDate ?? extractDatePart(todo.dueAt ?? null) ?? ""
    : toDateTimeInput(todo.dueAt ?? null) ?? "";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleButton}
        className="flex items-center gap-1 rounded-full border border-border px-2 py-1 text-xs text-white/70 transition hover:border-emerald-400 hover:text-emerald-200 bg-surface/80"
      >
        <CalendarDays className="h-3.5 w-3.5" /> {label}
      </button>
      <input
        ref={inputRef}
        type={inputType}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        value={inputValue}
        onChange={(event) => {
          const raw = event.target.value;
          if (todo.allDay) {
            onUpdate({ allDay: true, dueAt: null, dueDate: raw || null });
          } else {
            onUpdate({ allDay: false, dueAt: raw || null, dueDate: null });
          }
        }}
        data-testid="todo-item-due-input"
      />
    </div>
  );
}

type TodoItemProps = {
  todo: TodoItemModel;
  selected: boolean;
  onSelect(todo: TodoItemModel): void;
  onToggleComplete(todo: TodoItemModel, value: boolean): void;
  onToggleImportant(todo: TodoItemModel, value: boolean): void;
  onToggleMyDay(todo: TodoItemModel, value: boolean): void;
  onUpdateSchedule(todo: TodoItemModel, next: { allDay: boolean; dueAt: string | null; dueDate: string | null }): void;
  onDelete(todo: TodoItemModel): void;
};

export default function TodoItem({
  todo,
  selected,
  onSelect,
  onToggleComplete,
  onToggleImportant,
  onToggleMyDay,
  onUpdateSchedule,
  onDelete,
}: TodoItemProps) {
  const { setNodeRef, setActivatorNodeRef, listeners, attributes, transform, transition, isDragging } = useSortable({ id: todo.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
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
          {todo.note ? <p className="text-xs text-white/50 line-clamp-2">{todo.note}</p> : null}
        </button>

        <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
          <DueDisplay todo={todo} onUpdate={(next) => onUpdateSchedule(todo, next)} />
          <button
            type="button"
          className={cn(
            "flex items-center gap-1 rounded-full border border-border px-2 py-1 transition",
            todo.myDay ? "border-emerald-400 text-emerald-200" : "hover:border-emerald-400 hover:text-emerald-200",
          )}
            onClick={() => onToggleMyDay(todo, !todo.myDay)}
          >
            <Sun className="h-3.5 w-3.5" /> {todo.myDay ? "In My Day" : "Add to My Day"}
          </button>
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
        <button
          ref={setActivatorNodeRef}
          {...listeners}
          type="button"
          className="h-8 w-8 cursor-grab rounded-full border border-border/60 p-1 text-white/40 transition hover:border-emerald-400 hover:text-emerald-200"
          aria-label="Drag task"
        >
          <GripVertical className="h-full w-full" />
        </button>
      </div>
    </div>
  );
}
