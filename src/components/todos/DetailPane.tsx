"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CalendarDays, Check, Copy, ListTodo, Star, Sun, Trash2, X } from "lucide-react";
import type { TodoItemModel, TodoListSummary, TodoStepModel } from "./types";
import { SortableListItem } from "./TodoItem";
import { cn } from "@/lib/cn";

type DetailPaneProps = {
  visible: boolean;
  todo: TodoItemModel | null;
  lists: TodoListSummary[];
  onClose(): void;
  onUpdateTitle(title: string): Promise<void> | void;
  onToggleImportant(value: boolean): Promise<void> | void;
  onToggleMyDay(value: boolean): Promise<void> | void;
  onToggleComplete(value: boolean): Promise<void> | void;
  onSetDueDate(value: string | null): Promise<void> | void;
  onSetReminder(value: string | null): Promise<void> | void;
  onSetRepeat(value: string | null): Promise<void> | void;
  onUpdateNote(value: string | null): Promise<void> | void;
  onMoveToList(listId: string): Promise<void> | void;
  onDelete(): Promise<void> | void;
  onAddStep(title: string): Promise<void> | void;
  onUpdateStep(id: string, data: { title?: string; isCompleted?: boolean; position?: number }): Promise<void> | void;
  onDeleteStep(id: string): Promise<void> | void;
};

export default function DetailPane({
  visible,
  todo,
  lists,
  onClose,
  onUpdateTitle,
  onToggleImportant,
  onToggleMyDay,
  onToggleComplete,
  onSetDueDate,
  onSetReminder,
  onSetRepeat,
  onUpdateNote,
  onMoveToList,
  onDelete,
  onAddStep,
  onUpdateStep,
  onDeleteStep,
}: DetailPaneProps) {
  const [title, setTitle] = useState(todo?.title ?? "");
  const [note, setNote] = useState(todo?.note ?? "");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    setTitle(todo?.title ?? "");
    setNote(todo?.note ?? "");
  }, [todo?.id, todo?.title, todo?.note]);

  const steps = useMemo(() => todo?.steps ?? [], [todo]);

  const handleStepDragEnd = (event: DragEndEvent) => {
    if (!todo) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = arrayMove(
      steps.map((step) => step.id),
      steps.findIndex((step) => step.id === active.id),
      steps.findIndex((step) => step.id === over.id),
    );
    ids.forEach((id, index) => {
      Promise.resolve(onUpdateStep(id, { position: index })).catch(() => {});
    });
  };

  const noteRef = useRef<HTMLTextAreaElement | null>(null);

  const copyLink = () => {
    if (!todo) return;
    const url = `${window.location.origin}${window.location.pathname}#todo-${todo.id}`;
    navigator.clipboard.writeText(url).catch(() => {});
  };

  return (
    <aside
      className={cn(
        "flex h-full flex-col rounded-2xl border border-white/10 bg-black/50 p-4 transition",
        visible ? "opacity-100" : "pointer-events-none opacity-40",
      )}
    >
      <header className="mb-4 flex items-start justify-between gap-2">
        <h2 className="text-lg font-semibold text-white">Details</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={cn(
              "rounded-full border border-white/10 p-2 text-white/70 transition",
              todo?.isImportant && "border-amber-400 text-amber-200",
            )}
            onClick={() => todo && onToggleImportant(!todo.isImportant)}
          >
            <Star className={cn("h-4 w-4", todo?.isImportant && "fill-current") } />
          </button>
          <button
            type="button"
            className={cn(
              "rounded-full border border-white/10 p-2 text-white/70 transition",
              todo?.myDay && "border-emerald-400 text-emerald-200",
            )}
            onClick={() => todo && onToggleMyDay(!todo.myDay)}
          >
            <Sun className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-full border border-red-500/40 p-2 text-red-300 transition hover:bg-red-500/10"
            onClick={() => todo && onDelete()}
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-full border border-white/10 p-2 text-white/60 hover:border-white/30 hover:text-white"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {todo ? (
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          <section className="space-y-3">
            <div>
              <label className="text-xs uppercase text-white/50">Title</label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onBlur={() => onUpdateTitle(title.trim() || todo.title)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 transition",
                  todo.isCompleted ? "border-emerald-400 text-emerald-200" : "hover:border-emerald-400 hover:text-emerald-200",
                )}
                onClick={() => onToggleComplete(!todo.isCompleted)}
              >
                <Check className="h-4 w-4" /> {todo.isCompleted ? "Completed" : "Mark complete"}
              </button>
              <DuePicker label="Due date" value={todo.dueAt} onChange={onSetDueDate} />
              <DuePicker label="Reminder" value={todo.remindAt} onChange={onSetReminder} withTime />
              <RepeatInput value={todo.repeatRule} onChange={onSetRepeat} />
            </div>
          </section>

          <section className="space-y-3">
            <header className="flex items-center justify-between text-xs uppercase tracking-wide text-white/60">
              <span>Steps</span>
              <button
                type="button"
                className="rounded-full border border-white/10 px-2 py-1 text-xs text-white/70 transition hover:border-emerald-400 hover:text-emerald-200"
                onClick={() => onAddStep("New step")}
              >
                Add step
              </button>
            </header>
            <DndContext sensors={sensors} onDragEnd={handleStepDragEnd} modifiers={[restrictToVerticalAxis]}>
              <SortableContext items={steps.map((step) => step.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {steps.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/50">
                      No steps yet.
                    </div>
                  ) : (
                    steps.map((step) => (
                      <StepRow
                        key={step.id}
                        step={step}
                        onToggle={(value) => onUpdateStep(step.id, { isCompleted: value })}
                        onRename={(value) => onUpdateStep(step.id, { title: value })}
                        onDelete={() => onDeleteStep(step.id)}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </section>

          <section className="space-y-2">
            <label className="text-xs uppercase text-white/50">Notes</label>
            <textarea
              ref={noteRef}
              value={note ?? ""}
              onChange={(event) => setNote(event.target.value)}
              onBlur={() => onUpdateNote(note ? note.trim() : null)}
              rows={6}
              className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
            />
          </section>

          <section className="space-y-2 text-sm text-white/70">
            <div>
              <label className="text-xs uppercase text-white/50">Move to list</label>
              <select
                value={todo.listId}
                onChange={(event) => onMoveToList(event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
              >
                {lists.map((list) => (
                  <option key={list.id} value={list.id} className="bg-black text-white">
                    {list?.name ?? "Untitled"}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70 transition hover:border-emerald-400 hover:text-emerald-200"
              >
                <Copy className="h-4 w-4" /> Copy link
              </button>
              <button
                type="button"
                onClick={() => onDelete()}
                className="inline-flex items-center gap-2 rounded-full border border-red-500/40 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" /> Delete task
              </button>
            </div>
          </section>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-white/50">Select a task to view details.</div>
      )}
    </aside>
  );
}

type StepRowProps = {
  step: TodoStepModel;
  onToggle(value: boolean): void;
  onRename(value: string): void;
  onDelete(): void;
};

function StepRow({ step, onToggle, onRename, onDelete }: StepRowProps) {
  const [value, setValue] = useState(step.title);

  useEffect(() => {
    setValue(step.title);
  }, [step.title]);

  return (
    <SortableListItem id={step.id}>
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white">
        <button
          type="button"
          onClick={() => onToggle(!step.isCompleted)}
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full border border-white/30 text-xs",
            step.isCompleted && "bg-emerald-500 text-black",
          )}
        >
          {step.isCompleted ? "✓" : ""}
        </button>
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={() => onRename(value.trim() || step.title)}
          className="flex-1 bg-transparent text-sm outline-none"
        />
        <button
          type="button"
          className="text-xs text-white/50 hover:text-white"
          onClick={onDelete}
        >
          Remove
        </button>
      </div>
    </SortableListItem>
  );
}

type DuePickerProps = {
  label: string;
  value: string | null;
  onChange(next: string | null): void;
  withTime?: boolean;
};

function DuePicker({ label, value, onChange, withTime }: DuePickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const display = value
    ? new Date(value).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
      })
    : "Set";

  const open = () => {
    requestAnimationFrame(() => inputRef.current?.showPicker?.());
  };

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={open}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 transition hover:border-emerald-400 hover:text-emerald-200"
      >
        <CalendarDays className="h-4 w-4" /> {label}: {display}
      </button>
      <input
        ref={inputRef}
        type={withTime ? "datetime-local" : "date"}
        value={value ? (withTime ? value.slice(0, 16) : value.slice(0, 10)) : ""}
        onChange={(event) => {
          const raw = event.target.value;
          if (!raw) {
            onChange(null);
            return;
          }
          onChange(new Date(raw).toISOString());
        }}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        data-testid={`${label.toLowerCase().replace(/\s+/g, '-')}-input`}
      />
    </div>
  );
}

type RepeatInputProps = {
  value: string | null;
  onChange(next: string | null): void;
};

function RepeatInput({ value, onChange }: RepeatInputProps) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState(value ?? "");

  useEffect(() => {
    setLocal(value ?? "");
  }, [value]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 transition hover:border-emerald-400 hover:text-emerald-200"
      >
        <ListTodo className="h-4 w-4" /> Repeat: {value ? value : "Off"}
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-white/10 bg-black/80 p-3 text-xs text-white/70 shadow-xl">
          <p className="mb-2 text-white/80">Repeat rule (RRULE)</p>
          <input
            value={local}
            onChange={(event) => setLocal(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white outline-none"
            placeholder="e.g. FREQ=DAILY"
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onChange(local.trim() || null);
                setOpen(false);
              }}
              className="rounded-md bg-emerald-500 px-3 py-1 text-xs font-semibold text-black"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setLocal("");
                setOpen(false);
              }}
              className="rounded-md px-3 py-1 text-xs text-white/60 hover:text-white"
            >
              Clear
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
