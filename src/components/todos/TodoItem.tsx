"use client";

import { useMemo, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, GripVertical, Star, Sun, Trash2 } from "lucide-react";
import type { TodoItemModel } from "./types";
import { cn } from "@/lib/cn";


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

type DueDisplayProps = {
  value: string | null;
  onChange(next: string | null): void;
};

function DueDisplay({ value, onChange }: DueDisplayProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const label = useMemo(() => {
    if (!value) return "Set due";
    const date = new Date(value);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }, [value]);

  const handleButton = () => {
    requestAnimationFrame(() => {
      inputRef.current?.showPicker?.();
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleButton}
        className="flex items-center gap-1 rounded-full border border-white/10 px-2 py-1 text-xs text-white/70 transition hover:border-emerald-400 hover:text-emerald-200"
      >
        <CalendarDays className="h-3.5 w-3.5" /> {label}
      </button>
      <input
        ref={inputRef}
        type="date"
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        value={value ? value.slice(0, 10) : ""}
        onChange={(event) => {
          const val = event.target.value ? new Date(event.target.value).toISOString() : null;
          onChange(val);
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
  onSetDueDate(todo: TodoItemModel, value: string | null): void;
  onDelete(todo: TodoItemModel): void;
};

export default function TodoItem({
  todo,
  selected,
  onSelect,
  onToggleComplete,
  onToggleImportant,
  onToggleMyDay,
  onSetDueDate,
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
        "group flex items-start gap-3 rounded-2xl border border-white/5 bg-black/40 p-3 text-sm text-white transition",
        selected && "border-emerald-500/50 bg-emerald-500/10",
      )}
    >
      <button
        type="button"
        onClick={() => onToggleComplete(todo, !todo.isCompleted)}
        className={cn(
          "mt-0.5 flex h-5 w-5 items-center justify.center rounded-full border border-white/30 transition",
          todo.isCompleted ? "bg-emerald-500 text-black" : "bg-black/30",
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
          <DueDisplay value={todo.dueAt} onChange={(next) => onSetDueDate(todo, next)} />
          <button
            type="button"
            className={cn(
              "flex items-center gap-1 rounded-full border border-white/10 px-2 py-1 transition",
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
          className="hidden rounded-full border border-white/10 p-2 text-white/40 transition hover:border-red-400 hover:text-red-300 sm:flex"
          onClick={() => onDelete(todo)}
          aria-label="Delete task"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <button
          ref={setActivatorNodeRef}
          {...listeners}
          type="button"
          className="h-8 w-8 cursor-grab rounded-full border border-white/10 p-1 text-white/40 transition hover:border-emerald-400 hover:text-emerald-200"
          aria-label="Drag task"
        >
          <GripVertical className="h-full w-full" />
        </button>
      </div>
    </div>
  );
}
