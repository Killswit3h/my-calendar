"use client";

import { useMemo } from "react";
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
import { Sparkles } from "lucide-react";
import TodoItem from "./TodoItem";
import type { ActiveView, PlannedGroup, TodoItemModel } from "./types";
import { cn } from "@/lib/cn";

const SUGGEST_LIMIT = 5;

type TodoListViewProps = {
  activeView: ActiveView;
  todos: TodoItemModel[];
  groups?: PlannedGroup[];
  suggestions?: TodoItemModel[];
  loading?: boolean;
  selectedId: string | null;
  onSelect(todo: TodoItemModel): void;
  onToggleComplete(todo: TodoItemModel, value: boolean): void;
  onToggleImportant(todo: TodoItemModel, value: boolean): void;
  onToggleMyDay(todo: TodoItemModel, value: boolean): void;
  onSetDueDate(todo: TodoItemModel, value: string | null): void;
  onDelete(todo: TodoItemModel): void;
  onReorder(ids: string[]): void;
};

export default function TodoListView({
  activeView,
  todos,
  groups,
  suggestions,
  loading,
  selectedId,
  onSelect,
  onToggleComplete,
  onToggleImportant,
  onToggleMyDay,
  onSetDueDate,
  onDelete,
  onReorder,
}: TodoListViewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const canDrag = useMemo(() => !groups || groups.length === 0, [groups]);

  const handleDragEnd = (event: DragEndEvent) => {
    if (!canDrag) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const order = arrayMove(
      todos.map((todo) => todo.id),
      todos.findIndex((todo) => todo.id === active.id),
      todos.findIndex((todo) => todo.id === over.id),
    );
    onReorder(order);
  };

  const suggestionList = useMemo(() => suggestions?.slice(0, SUGGEST_LIMIT) ?? [], [suggestions]);
  const selectedTodo = useMemo(() => {
    if (!selectedId) return null;
    if (groups && groups.length > 0) {
      for (const group of groups) {
        const found = group.items.find((todo) => todo.id === selectedId);
        if (found) return found;
      }
      return null;
    }
    return todos.find((todo) => todo.id === selectedId) ?? null;
  }, [groups, selectedId, todos]);

  const quickSetDue = (offsetDays: number) => {
    if (!selectedTodo) return;
    const target = new Date();
    target.setHours(23, 59, 59, 999);
    target.setDate(target.getDate() + offsetDays);
    onSetDueDate(selectedTodo, target.toISOString());
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {activeView.type === "smart" && activeView.key === "myday" && suggestionList.length > 0 ? (
        <section className="border-b border-white/10 bg-black/20 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
            <Sparkles className="h-4 w-4 text-emerald-300" /> Suggestions
          </div>
          <div className="space-y-2">
            {suggestionList.map((todo) => (
              <div key={todo.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-white">
                <div>
                  <p className="font-medium text-white/90">{todo.title}</p>
                  {todo.dueAt ? (
                    <p className="text-xs text-white/50">Due {new Date(todo.dueAt).toLocaleDateString()}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="rounded-full border border-emerald-400 px-3 py-1 text-xs text-emerald-200 transition hover:bg-emerald-500/10"
                  onClick={() => onToggleMyDay(todo, true)}
                >
                  Add to My Day
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="space-y-4 p-4">
        {activeView.type === "smart" && activeView.key === "planned" ? (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-black/30 p-3 text-xs text-white/70">
            <span className="font-medium text-white/80">Quick set</span>
            <QuickSetButton label="Today" onClick={() => quickSetDue(0)} disabled={!selectedTodo} />
            <QuickSetButton label="Tomorrow" onClick={() => quickSetDue(1)} disabled={!selectedTodo} />
            <QuickSetButton label="Next week" onClick={() => quickSetDue(7)} disabled={!selectedTodo} />
            <QuickSetButton
              label="Clear"
              onClick={() => selectedTodo && onSetDueDate(selectedTodo, null)}
              disabled={!selectedTodo}
            />
          </div>
        ) : null}

        {loading ? (
          <div className="flex h-32 items-center justify-center text-sm text-white/60">Loading tasks…</div>
        ) : groups && groups.length > 0 ? (
          groups.map((group) => (
            <section key={group.key} className="space-y-3">
              <header className="flex items-center justify-between text-xs uppercase tracking-wide text-white/60">
                <span>{group.label}</span>
                <span>{group.items.length}</span>
              </header>
              <div className="space-y-2">
                {group.items.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    selected={selectedId === todo.id}
                    onSelect={onSelect}
                    onToggleComplete={onToggleComplete}
                    onToggleImportant={onToggleImportant}
                    onToggleMyDay={onToggleMyDay}
                    onSetDueDate={onSetDueDate}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </section>
          ))
        ) : (
          <DndContext sensors={sensors} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
            <SortableContext items={todos.map((todo) => todo.id)} strategy={verticalListSortingStrategy}>
              {todos.length === 0 ? (
                <EmptyState activeView={activeView} />
              ) : (
                <div className="space-y-2">
                  {todos.map((todo) => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      selected={selectedId === todo.id}
                      onSelect={onSelect}
                      onToggleComplete={onToggleComplete}
                      onToggleImportant={onToggleImportant}
                      onToggleMyDay={onToggleMyDay}
                      onSetDueDate={onSetDueDate}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              )}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

type EmptyStateProps = {
  activeView: ActiveView;
};

function EmptyState({ activeView }: EmptyStateProps) {
  const message = useMemo(() => {
    if (activeView.type === "smart") {
      if (activeView.key === "myday") return "You're all set for today. Add tasks to start planning.";
      if (activeView.key === "important") return "Star important work to bring it here.";
      if (activeView.key === "planned") return "Set due dates to see items planned ahead.";
    }
    return "No tasks yet. Add your first task to get going.";
  }, [activeView]);

  return (
    <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-white/5 bg-black/20 text-center text-sm text-white/60">
      {message}
    </div>
  );
}

type QuickSetButtonProps = {
  label: string;
  onClick(): void;
  disabled?: boolean;
};

function QuickSetButton({ label, onClick, disabled }: QuickSetButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-full border border-white/10 px-3 py-1.5 transition",
        disabled ? "opacity-50" : "hover:border-emerald-400 hover:text-emerald-200",
      )}
    >
      {label}
    </button>
  );
}
