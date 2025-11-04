"use client";

import { useEffect, useMemo, useState } from "react";
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
import { GripVertical, ListTodo, Palette, Pencil, Plus, Star, Sun, CalendarDays, Trash2 } from "lucide-react";
import type { ActiveView, SmartViewKey, TodoListSummary } from "./types";
import { SortableListItem } from "./TodoItem";
import { cn } from "@/lib/cn";

const SMART_CONFIG: Array<{ key: SmartViewKey; label: string; icon: React.ComponentType<any> }> = [
  { key: "myday", label: "My Day", icon: Sun },
  { key: "important", label: "Important", icon: Star },
  { key: "planned", label: "Planned", icon: CalendarDays },
];

const COLOR_CHOICES = [
  "emerald",
  "sky",
  "violet",
  "amber",
  "rose",
  "lime",
  "cyan",
  "slate",
  "zinc",
];

type SidebarProps = {
  loading?: boolean;
  smartCounts: Record<SmartViewKey, number>;
  lists: TodoListSummary[];
  tasksListId: string | null;
  tasksCount: number;
  activeView: ActiveView;
  onSelect(view: ActiveView): void;
  onCreateList(data: { name: string; color?: string | null; icon?: string | null }): Promise<void>;
  onRenameList(id: string, name: string): Promise<void>;
  onUpdateList(id: string, data: { color?: string | null; icon?: string | null }): Promise<void>;
  onDeleteList(id: string): Promise<void>;
  onReorderLists(ids: string[]): Promise<void>;
};

export default function Sidebar({
  loading,
  smartCounts,
  lists,
  tasksListId,
  tasksCount,
  activeView,
  onSelect,
  onCreateList,
  onRenameList,
  onUpdateList,
  onDeleteList,
  onReorderLists,
}: SidebarProps) {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string | null>(null);
  const [selectedEditingId, setSelectedEditingId] = useState<string | null>(null);

  const filteredLists = useMemo(() => {
    if (!search.trim()) return lists;
    return lists.filter((list) => list.name.toLowerCase().includes(search.trim().toLowerCase()));
  }, [lists, search]);

  useEffect(() => {
    if (!creating) {
      setNewName("");
      setNewColor(null);
    }
  }, [creating]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    if (search.trim()) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const currentIndex = filteredLists.findIndex((item) => item.id === active.id);
    const overIndex = filteredLists.findIndex((item) => item.id === over.id);
    if (currentIndex === -1 || overIndex === -1) return;
    const reordered = arrayMove(filteredLists, currentIndex, overIndex).map((item) => item.id);
    await onReorderLists(reordered);
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    await onCreateList({ name, color: newColor });
    setCreating(false);
    setNewName("");
    setNewColor(null);
  };

  const onSelectSmart = (key: SmartViewKey) => {
    onSelect({ type: "smart", key });
  };

  const smartActive = (key: SmartViewKey) => activeView.type === "smart" && activeView.key === key;
  const listActive = (id: string) => activeView.type === "list" && activeView.id === id;

  return (
    <aside className="flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-white/10 bg-black/50 p-4">
      <div>
        <input
          id="todos-search-input"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search lists"
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
        />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto pr-1">
        <div>
          <p className="mb-3 text-xs uppercase tracking-wide text-white/60">Smart</p>
          <ul className="space-y-1">
            {SMART_CONFIG.map(({ key, label, icon: Icon }) => (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => onSelectSmart(key)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition",
                    smartActive(key)
                      ? "bg-emerald-500/10 text-emerald-200"
                      : "text-white/80 hover:bg-white/10",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </span>
                  <span className="text-xs text-white/60">{smartCounts[key]}</span>
                </button>
              </li>
            ))}
            {tasksListId ? (
              <li key={tasksListId}>
                <button
                  type="button"
                  onClick={() => onSelect({ type: "list", id: tasksListId })}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition",
                    listActive(tasksListId)
                      ? "bg-emerald-500/10 text-emerald-200"
                      : "text-white/80 hover:bg-white/10",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <ListTodo className="h-4 w-4" />
                    <span>Tasks</span>
                  </span>
                  <span className="text-xs text-white/60">{tasksCount}</span>
                </button>
              </li>
            ) : null}
          </ul>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-white/60">Lists</p>
            <button
              type="button"
              className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs text-white/70 transition hover:border-emerald-400 hover:text-emerald-200"
              onClick={() => setCreating((prev) => !prev)}
            >
              <Plus className="h-3 w-3" /> New list
            </button>
          </div>

          {creating ? (
            <div className="mb-3 rounded-xl border border-emerald-400/40 bg-emerald-500/5 p-3">
              <label className="block text-xs uppercase text-white/60">Name</label>
              <input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-2 py-2 text-sm text-white outline-none focus:border-emerald-400"
                autoFocus
              />
              <div className="mt-2">
                <label className="block text-xs uppercase text-white/60">Color</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {COLOR_CHOICES.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewColor(color)}
                      className={cn(
                        "h-6 w-6 rounded-full border border-white/10",
                        newColor === color ? "ring-2 ring-emerald-400" : "ring-0",
                      )}
                      style={{
                        background:
                          color === "slate"
                            ? "linear-gradient(135deg,#64748b,#94a3b8)"
                            : color === "zinc"
                              ? "linear-gradient(135deg,#71717a,#a1a1aa)"
                              : `radial-gradient(circle at 30% 30%, var(--${color}-300, rgba(255,255,255,0.3)), var(--${color}-600, rgba(255,255,255,0.1)))`,
                      }}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setNewColor(null)}
                    className={cn(
                      "flex h-6 items-center rounded-full border border-white/20 px-2 text-xs text-white/70",
                      newColor === null && "border-emerald-400 text-emerald-200",
                    )}
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCreate}
                  className="rounded-lg bg-emerald-500 px-3 py-1 text-sm font-medium text-black transition hover:bg-emerald-400"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="rounded-lg px-3 py-1 text-sm text-white/70 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          <DndContext sensors={sensors} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
            <SortableContext items={filteredLists.map((list) => list.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-1">
                {filteredLists.map((list) => (
                  <SidebarListItem
                    key={list.id}
                    list={list}
                    active={listActive(list.id)}
                    onSelect={() => onSelect({ type: "list", id: list.id })}
                    onRename={async (name) => {
                      await onRenameList(list.id, name);
                      setSelectedEditingId(null);
                    }}
                    onUpdateColor={async (color) => {
                      await onUpdateList(list.id, { color });
                    }}
                    onDelete={() => onDeleteList(list.id)}
                    editing={selectedEditingId === list.id}
                    onToggleEdit={() =>
                      setSelectedEditingId((prev) => (prev === list.id ? null : list.id))
                    }
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
      </nav>
    </aside>
  );
}

type SidebarListItemProps = {
  list: TodoListSummary;
  active: boolean;
  editing: boolean;
  onSelect(): void;
  onRename(name: string): Promise<void>;
  onUpdateColor(color: string | null): Promise<void>;
  onDelete(): Promise<void>;
  onToggleEdit(): void;
};

function SidebarListItem({
  list,
  active,
  editing,
  onSelect,
  onRename,
  onUpdateColor,
  onDelete,
  onToggleEdit,
}: SidebarListItemProps) {
  const [name, setName] = useState(list.name);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(list.name);
  }, [list.name]);

  const handleSubmit = async () => {
    if (saving) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setName(list.name);
      onToggleEdit();
      return;
    }
    setSaving(true);
    await onRename(trimmed);
    setSaving(false);
  };

  return (
    <li>
      <SortableListItem id={list.id} disabled={editing}>
        <div
          className={cn(
            "group flex items-center justify-between rounded-xl border border-white/5 bg-black/30 px-3 py-2 text-sm transition",
            active ? "border-emerald-400/60 bg-emerald-500/10 text-emerald-100" : "hover:border-emerald-400/40",
          )}
        >
          <button type="button" className="flex flex-1 items-center gap-3 text-left" onClick={onSelect}>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-xs uppercase text-white/70">
              {list.name.slice(0, 2)}
            </span>
            <span className="flex-1 truncate">
              {editing ? (
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") handleSubmit();
                    if (event.key === "Escape") onToggleEdit();
                  }}
                  className="w-full rounded-md border border-white/20 bg-black/40 px-2 py-1 text-sm text-white"
                  autoFocus
                />
              ) : (
                list.name
              )}
            </span>
          </button>
          <span className="ml-3 text-xs text-white/50">{list.incompleteCount}</span>
          <button
            type="button"
            className="ml-2 hidden h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:border-emerald-400 hover:text-emerald-200 group-hover:flex"
            onClick={onToggleEdit}
            aria-label="Edit list"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
        {editing ? (
          <div className="mt-2 space-y-2 rounded-lg border border-white/10 bg-black/30 p-3 text-xs text-white/70">
            <p className="flex items-center gap-2 text-white/80">
              <Palette className="h-4 w-4" /> Color
            </p>
            <div className="flex flex-wrap gap-2">
              {COLOR_CHOICES.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => onUpdateColor(color)}
                  className={cn(
                    "h-6 w-6 rounded-full border border-white/10",
                    list.color === color ? "ring-2 ring-emerald-400" : "ring-0",
                  )}
                  style={{
                    background:
                      color === "slate"
                        ? "linear-gradient(135deg,#64748b,#94a3b8)"
                        : color === "zinc"
                          ? "linear-gradient(135deg,#71717a,#a1a1aa)"
                          : `radial-gradient(circle at 30% 30%, var(--${color}-300, rgba(255,255,255,0.3)), var(--${color}-600, rgba(255,255,255,0.1)))`,
                  }}
                />
              ))}
              <button
                type="button"
                onClick={() => onUpdateColor(null)}
                className="flex h-6 items-center rounded-full border border-white/20 px-2 text-xs text-white/70"
              >
                Clear
              </button>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleSubmit}
                className="rounded-md bg-emerald-500 px-3 py-1 text-xs font-semibold text-black hover:bg-emerald-400"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setName(list.name);
                  onToggleEdit();
                }}
                className="rounded-md px-3 py-1 text-xs text-white/70 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                className="ml-auto inline-flex items-center gap-1 rounded-md border border-red-500/40 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
                onClick={() => onDelete()}
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            </div>
          </div>
        ) : null}
      </SortableListItem>
    </li>
  );
}
