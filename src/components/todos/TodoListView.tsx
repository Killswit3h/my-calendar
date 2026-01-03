"use client";

import { useCallback, useMemo } from "react";
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd";
import { Sparkles } from "lucide-react";
import TodoItem from "./TodoItem";
import type { ActiveView, PlannedGroup, SortOption, TodoItemModel } from "./types";
import { cn } from "@/lib/cn";
import { APP_TZ, formatInTimeZone } from "@/lib/timezone";

const SUGGEST_LIMIT = 5;

type TodoListViewProps = {
  activeView: ActiveView;
  todos: TodoItemModel[];
  groups?: PlannedGroup[];
  suggestions?: TodoItemModel[];
  loading?: boolean;
  selectedId: string | null;
  sort: SortOption;
  manualReorderEnabled?: boolean;
  orderSaving?: boolean;
  onSelect(todo: TodoItemModel): void;
  onToggleComplete(todo: TodoItemModel, value: boolean): void;
  onToggleImportant(todo: TodoItemModel, value: boolean): void;
  onToggleMyDay(todo: TodoItemModel, value: boolean): void;
  onUpdateSchedule(todo: TodoItemModel, next: { allDay: boolean; dueAt: string | null; dueDate: string | null }): void;
  onDelete(todo: TodoItemModel): void;
  onManualSortRequest?(): void;
  onManualReorder?(ordered: TodoItemModel[]): void;
};

export default function TodoListView({
  activeView,
  todos,
  groups,
  suggestions,
  loading,
  selectedId,
  sort,
  manualReorderEnabled = false,
  orderSaving = false,
  onSelect,
  onToggleComplete,
  onToggleImportant,
  onToggleMyDay,
  onUpdateSchedule,
  onDelete,
  onManualSortRequest,
  onManualReorder,
}: TodoListViewProps) {
  const manualModeActive = sort === "manual";
  const allowManualDnd = manualModeActive && manualReorderEnabled && (!groups || groups.length === 0);

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
    target.setHours(23, 59, 59, 0);
    target.setDate(target.getDate() + offsetDays);
    const { date, time } = formatInTimeZone(target, APP_TZ);
    onUpdateSchedule(selectedTodo, { allDay: false, dueAt: `${date}T${time.slice(0, 5)}`, dueDate: null });
  };

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!allowManualDnd) return;
      const { destination, source } = result;
      if (!destination) return;
      if (destination.droppableId === source.droppableId && destination.index === source.index) return;
      const ordered = Array.from(todos);
      const [moved] = ordered.splice(source.index, 1);
      ordered.splice(destination.index, 0, moved);
      onManualReorder?.(ordered);
    },
    [allowManualDnd, onManualReorder, todos],
  );

  return (
    <div className="flex-1 overflow-y-auto bg-surface-soft">
      {activeView.type === "smart" && activeView.key === "myday" && suggestionList.length > 0 ? (
        <section className="border-b border-border/60 bg-surface px-4 py-3">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
            <Sparkles className="h-4 w-4 text-emerald-300" /> Suggestions
          </div>
          <div className="space-y-2">
            {suggestionList.map((todo) => (
              <div key={todo.id} className="flex items-center justify-between rounded-xl border border-border bg-surface-soft/95 p-3 text-sm text-white shadow-sm">
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
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface-soft p-3 text-xs text-white/70 shadow-sm">
            <span className="font-medium text-white/80">Quick set</span>
            <QuickSetButton label="Today" onClick={() => quickSetDue(0)} disabled={!selectedTodo} />
            <QuickSetButton label="Tomorrow" onClick={() => quickSetDue(1)} disabled={!selectedTodo} />
            <QuickSetButton label="Next week" onClick={() => quickSetDue(7)} disabled={!selectedTodo} />
            <QuickSetButton
              label="Clear"
              onClick={() => selectedTodo && onUpdateSchedule(selectedTodo, { allDay: false, dueAt: null, dueDate: null })}
              disabled={!selectedTodo}
            />
          </div>
        ) : null}

        {loading ? (
          <div className="flex h-32 items-center justify-center rounded-2xl border border-border/60 bg-surface-soft text-sm text-white/60 shadow-inner">Loading tasks…</div>
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
                    onDelete={onDelete}
                    manualSortActive={false}
                    manualReorderEnabled={false}
                    onRequestManualSort={onManualSortRequest}
                  />
                ))}
              </div>
            </section>
          ))
        ) : todos.length === 0 ? (
          <EmptyState activeView={activeView} />
        ) : allowManualDnd ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="mb-3 flex items-center justify-between rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-xs text-white/70">
              <span>Manual ordering is active. Drag tasks to rearrange.</span>
              <span className={cn("font-medium", orderSaving ? "text-emerald-200" : "text-white/60")}>
                {orderSaving ? "Saving order…" : "Changes save automatically"}
              </span>
            </div>
            <Droppable droppableId="todo-manual-list">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                  {todos.map((todo, index) => (
                    <Draggable key={todo.id} draggableId={todo.id} index={index} isDragDisabled={!allowManualDnd}>
                      {(dragProvided, snapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          className={cn(snapshot.isDragging ? "opacity-90" : undefined)}
                        >
                          <TodoItem
                            todo={todo}
                            selected={selectedId === todo.id}
                            onSelect={onSelect}
                            onToggleComplete={onToggleComplete}
                            onToggleImportant={onToggleImportant}
                            onDelete={onDelete}
                            manualSortActive={manualModeActive}
                            manualReorderEnabled={manualReorderEnabled}
                            dragHandleProps={dragProvided.dragHandleProps ?? undefined}
                            onRequestManualSort={onManualSortRequest}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
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
                onDelete={onDelete}
                manualSortActive={manualModeActive}
                manualReorderEnabled={manualReorderEnabled}
                onRequestManualSort={onManualSortRequest}
              />
            ))}
          </div>
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
    <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-border/60 bg-surface-soft text-center text-sm text-white/60 shadow-inner">
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
        "rounded-full border border-border px-3 py-1.5 transition",
        disabled ? "opacity-40" : "hover:border-emerald-400 hover:text-emerald-200",
      )}
    >
      {label}
    </button>
  );
}
