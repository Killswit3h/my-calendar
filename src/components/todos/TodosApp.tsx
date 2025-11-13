"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActiveView,
  GroupOption,
  PlannedGroup,
  SmartViewKey,
  SortOption,
  TodoItemModel,
  TodoListSummary,
} from "./types";
import Sidebar from "./Sidebar";
import TodoListView from "./TodoListView";
import DetailPane from "./DetailPane";
import Toolbar from "./Toolbar";
import { NewTodoInput } from "./NewTodoInput";
import SchedulePanel from "./SchedulePanel";
import { cn } from "@/lib/cn";
import { APP_TZ, formatInTimeZone } from "@/lib/timezone";

const SMART_VIEW_LABEL: Record<SmartViewKey, string> = {
  myday: "My Day",
  important: "Important",
  planned: "Planned",
};

const HIDE_COMPLETED_STORAGE_KEY = "todos:hide-completed";

function viewCacheKey(view: ActiveView): string {
  return view.type === "smart" ? `smart:${view.key}` : `list:${view.id}`;
}

async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers instanceof Headers ? Object.fromEntries(init.headers.entries()) : init?.headers),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error?.error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

type TodosResponse =
  | { todos: TodoItemModel[]; suggestions?: TodoItemModel[] }
  | { groups: PlannedGroup[] };

type TodoCreatePayload = {
  title: string;
  note?: string | null;
  listId: string;
  myDay?: boolean;
  isImportant?: boolean;
  dueAt?: string | null;
  dueDate?: string | null;
  allDay?: boolean;
};

type TodoUpdatePayload = Partial<Omit<TodoItemModel, "id" | "steps" | "createdAt" | "updatedAt">> & {
  listId?: string;
  position?: number;
};

type TodoStepUpdate = { id: string; data: Partial<{ title: string; isCompleted: boolean; position: number }> };

type TodoStepCreate = { todoId: string; title: string };

type TodoStepDelete = { id: string };

type TodoReorderInput = { id: string; position: number; listId?: string }[];

type ListSortEntry = { id: string; position: number };

type TodosHook = {
  lists: TodoListSummary[];
  listsLoading: boolean;
  createList: (data: { name: string; color?: string | null; icon?: string | null }) => Promise<void>;
  updateList: (id: string, data: { name?: string; color?: string | null; icon?: string | null }) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  reorderLists: (ids: string[]) => Promise<void>;
  todos: TodoItemModel[];
  plannedGroups?: PlannedGroup[];
  suggestions?: TodoItemModel[];
  todosLoading: boolean;
  createTodo: (payload: TodoCreatePayload) => Promise<TodoItemModel>;
  updateTodo: (id: string, payload: TodoUpdatePayload) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  reorderTodos: (input: TodoReorderInput) => Promise<void>;
  createStep: (payload: TodoStepCreate) => Promise<void>;
  updateStep: (payload: TodoStepUpdate) => Promise<void>;
  deleteStep: (payload: TodoStepDelete) => Promise<void>;
};

function useTodos(view: ActiveView): TodosHook {
  const queryClient = useQueryClient();

  const listsQuery = useQuery({
    queryKey: ["todo-lists"],
    queryFn: () => fetchJson<{ lists: TodoListSummary[] }>("/api/todos/lists"),
  });

  const todosQuery = useQuery({
    queryKey: ["todos", viewCacheKey(view)],
    queryFn: () => {
      if (view.type === "smart") {
        return fetchJson<TodosResponse>(`/api/todos/items?view=${view.key}`);
      }
      return fetchJson<TodosResponse>(`/api/todos/items?listId=${view.id}`);
    },
  });

  const invalidateLists = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["todo-lists"] }).catch(() => {});
  }, [queryClient]);

  const invalidateTodos = useCallback(
    (targetView: ActiveView) => {
      queryClient.invalidateQueries({ queryKey: ["todos", viewCacheKey(targetView)] }).catch(() => {});
    },
    [queryClient],
  );

  const createListMutation = useMutation({
    mutationFn: (body: { name: string; color?: string | null; icon?: string | null }) =>
      fetchJson<TodoListSummary>("/api/todos/lists", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => invalidateLists(),
  });

  const updateListMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; color?: string | null; icon?: string | null } }) =>
      fetchJson<TodoListSummary>(`/api/todos/lists/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["todo-lists"] });
      const prev = queryClient.getQueryData<{ lists: TodoListSummary[] }>(["todo-lists"]);
      if (prev) {
        const nextLists = prev.lists.map((list) => (list.id === id ? { ...list, ...data } : list));
        queryClient.setQueryData(["todo-lists"], { lists: nextLists });
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(["todo-lists"], context.prev);
    },
    onSettled: () => invalidateLists(),
  });

  const deleteListMutation = useMutation({
    mutationFn: (id: string) =>
      fetch("/api/todos/lists/" + id, {
        method: "DELETE",
      }).then((res) => {
        if (!res.ok) return Promise.reject(new Error("Failed to delete list"));
      }),
    onSuccess: () => invalidateLists(),
  });

  const reorderListsMutation = useMutation({
    mutationFn: (order: ListSortEntry[]) =>
      fetchJson<void>("/api/todos/lists/reorder", {
        method: "POST",
        body: JSON.stringify({ items: order }),
      }),
    onMutate: async (order) => {
      await queryClient.cancelQueries({ queryKey: ["todo-lists"] });
      const prev = queryClient.getQueryData<{ lists: TodoListSummary[] }>(["todo-lists"]);
      if (prev) {
        const map = new Map(order.map((entry) => [entry.id, entry.position] as const));
        const nextLists = [...prev.lists]
          .map((list) => (map.has(list.id) ? { ...list, position: map.get(list.id)! } : list))
          .sort((a, b) => a.position - b.position);
        queryClient.setQueryData(["todo-lists"], { lists: nextLists });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["todo-lists"], ctx.prev);
    },
    onSettled: () => invalidateLists(),
  });

  const createTodoMutation = useMutation({
    mutationFn: (payload: TodoCreatePayload) =>
      fetchJson<TodoItemModel>("/api/todos/items", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (_todo, variables) => {
      invalidateLists();
      invalidateTodos(view.type === "list" ? view : { type: "list", id: variables.listId });
      invalidateTodos(view);
    },
  });

  const updateTodoMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TodoUpdatePayload }) =>
      fetchJson<TodoItemModel>(`/api/todos/items/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["todos", viewCacheKey(view)] });
      const prev = queryClient.getQueryData<TodosResponse>(["todos", viewCacheKey(view)]);
      if (prev && "todos" in prev) {
        const updatedTodos = prev.todos.map((todo) => (todo.id === id ? { ...todo, ...data } : todo));
        queryClient.setQueryData(["todos", viewCacheKey(view)], { ...prev, todos: updatedTodos });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["todos", viewCacheKey(view)], ctx.prev);
    },
    onSettled: () => {
      invalidateTodos(view);
      invalidateLists();
    },
  });

  const deleteTodoMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/todos/items/${id}`, { method: "DELETE" }).then((res) => {
        if (!res.ok) throw new Error("Failed to delete todo");
      }),
    onSuccess: () => {
      invalidateTodos(view);
      invalidateLists();
    },
  });

  const reorderTodosMutation = useMutation({
    mutationFn: (items: TodoReorderInput) =>
      fetchJson<void>("/api/todos/items/reorder", {
        method: "POST",
        body: JSON.stringify({ items }),
      }),
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey: ["todos", viewCacheKey(view)] });
      const prev = queryClient.getQueryData<TodosResponse>(["todos", viewCacheKey(view)]);
      if (prev && "todos" in prev) {
        const positionMap = new Map(items.map((item) => [item.id, item.position] as const));
        const listMap = new Map(items.map((item) => [item.id, item.listId] as const));
        const todos = prev.todos.map((todo) =>
          positionMap.has(todo.id)
            ? {
                ...todo,
                position: positionMap.get(todo.id)!,
                listId: listMap.get(todo.id) ?? todo.listId,
              }
            : todo,
        );
        todos.sort((a, b) => a.position - b.position);
        queryClient.setQueryData(["todos", viewCacheKey(view)], { ...prev, todos });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["todos", viewCacheKey(view)], ctx.prev);
    },
    onSettled: () => {
      invalidateTodos(view);
      invalidateLists();
    },
  });

  const createStepMutation = useMutation({
    mutationFn: (payload: TodoStepCreate) =>
      fetchJson(`/api/todos/steps`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => invalidateTodos(view),
  });

  const updateStepMutation = useMutation({
    mutationFn: ({ id, data }: TodoStepUpdate) =>
      fetchJson(`/api/todos/steps/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => invalidateTodos(view),
  });

  const deleteStepMutation = useMutation({
    mutationFn: ({ id }: TodoStepDelete) =>
      fetch(`/api/todos/steps/${id}`, { method: "DELETE" }).then((res) => {
        if (!res.ok) throw new Error("Failed to delete step");
      }),
    onSuccess: () => invalidateTodos(view),
  });

  return {
    lists: listsQuery.data?.lists ?? [],
    listsLoading: listsQuery.isLoading,
    createList: async (data) => {
      await createListMutation.mutateAsync(data);
    },
    updateList: async (id, data) => {
      await updateListMutation.mutateAsync({ id, data });
    },
    deleteList: async (id) => {
      await deleteListMutation.mutateAsync(id);
    },
    reorderLists: async (ids) => {
      const order: ListSortEntry[] = ids.map((id, position) => ({ id, position }));
      await reorderListsMutation.mutateAsync(order);
    },
    todos: todosQuery.data && "todos" in todosQuery.data ? todosQuery.data.todos : [],
    plannedGroups: todosQuery.data && "groups" in todosQuery.data ? todosQuery.data.groups : undefined,
    suggestions:
      todosQuery.data && "todos" in todosQuery.data && "suggestions" in todosQuery.data
        ? (todosQuery.data.suggestions ?? [])
        : undefined,
    todosLoading: todosQuery.isLoading,
    createTodo: async (payload) => createTodoMutation.mutateAsync(payload),
    updateTodo: async (id, data) => {
      await updateTodoMutation.mutateAsync({ id, data });
    },
    deleteTodo: async (id) => {
      await deleteTodoMutation.mutateAsync(id);
    },
    reorderTodos: async (items) => {
      await reorderTodosMutation.mutateAsync(items);
    },
    createStep: async (payload) => {
      await createStepMutation.mutateAsync(payload);
    },
    updateStep: async (payload) => {
      await updateStepMutation.mutateAsync(payload);
    },
    deleteStep: async (payload) => {
      await deleteStepMutation.mutateAsync(payload);
    },
  };
}

function useBreakpoint(maxWidth: number) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [maxWidth]);
  return matches;
}

export default function TodosApp() {
  const [activeView, setActiveView] = useState<ActiveView>({ type: "smart", key: "myday" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("my-order");
  const [group, setGroup] = useState<GroupOption>("none");
  const [hideCompleted, setHideCompleted] = useState(true);

  const isMobile = useBreakpoint(640);
  const isTablet = useBreakpoint(1024);

  const {
    lists,
    listsLoading,
    createList,
    updateList,
    deleteList,
    reorderLists,
    todos,
    plannedGroups,
    suggestions,
    todosLoading,
    createTodo,
    updateTodo,
    deleteTodo,
    reorderTodos,
    createStep,
    updateStep,
    deleteStep,
  } = useTodos(activeView);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(HIDE_COMPLETED_STORAGE_KEY);
      if (stored !== null) {
        setHideCompleted(stored === "true");
      }
    } catch {
      // ignore storage read errors
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(HIDE_COMPLETED_STORAGE_KEY, hideCompleted ? "true" : "false");
    } catch {
      // ignore storage write errors
    }
  }, [hideCompleted]);

  useEffect(() => {
    if (activeView.type === "list") {
      const exists = lists.some((list) => list.id === activeView.id);
      if (!exists && lists.length > 0) {
        setActiveView({ type: "smart", key: "myday" });
      }
    }
  }, [activeView, lists]);

  const smartCounts = useMemo(() => {
    const map: Record<SmartViewKey, number> = { myday: 0, important: 0, planned: 0 };
    for (const list of lists) {
      const key = list.name.trim().toLowerCase();
      if (key === "my day") map.myday = list.incompleteCount;
      if (key === "important") map.important = list.incompleteCount;
      if (key === "planned") map.planned = list.incompleteCount;
    }
    return map;
  }, [lists]);

  const userLists = useMemo(
    () => lists.filter((list) => !list.isSmart && list.name.trim().toLowerCase() !== "tasks"),
    [lists],
  );

  const tasksList = useMemo(
    () => lists.find((list) => list.name.trim().toLowerCase() === "tasks"),
    [lists],
  );

  useEffect(() => {
    if (activeView.type === "smart" && activeView.key === "planned" && group === "none") {
      setGroup("due-date");
    }
  }, [activeView, group]);

  useEffect(() => {
    if (activeView.type === "smart" && activeView.key !== "planned" && group === "due-date") {
      setGroup("none");
    }
  }, [activeView, group]);

  const filteredTodos = useMemo(
    () => (hideCompleted ? todos.filter((todo) => !todo.isCompleted) : todos),
    [hideCompleted, todos],
  );

  const processedPlannedGroups = useMemo(() => {
    if (!plannedGroups) return undefined;
    const next = plannedGroups
      .map((group) => {
        const items = hideCompleted ? group.items.filter((item) => !item.isCompleted) : group.items;
        if (items.length === 0) return null;
        const incomplete = items.filter((item) => !item.isCompleted);
        const completed = items.filter((item) => item.isCompleted);
        return { ...group, items: [...incomplete, ...completed] };
      })
      .filter((group): group is PlannedGroup => group !== null);
    return next.length > 0 ? next : undefined;
  }, [plannedGroups, hideCompleted]);

  const sortedTodos = useMemo(() => {
    if (processedPlannedGroups) {
      return processedPlannedGroups.flatMap((group) => group.items);
    }

    const items = [...filteredTodos];

    if (sort === "importance") {
      items.sort((a, b) => Number(b.isImportant) - Number(a.isImportant));
    } else if (sort === "due-date") {
      items.sort((a, b) => {
        const aDue = a.dueAt ? Date.parse(a.dueAt) : Infinity;
        const bDue = b.dueAt ? Date.parse(b.dueAt) : Infinity;
        return aDue - bDue;
      });
    } else if (sort === "alphabetical") {
      items.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === "created") {
      items.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
    } else {
      items.sort((a, b) => a.position - b.position);
    }

    const ordered = hideCompleted
      ? items
      : [
          ...items.filter((todo) => !todo.isCompleted),
          ...items.filter((todo) => todo.isCompleted),
        ];

    if (group === "due-date") {
      const groups = groupByDueDate(ordered);
      return groups.flatMap((bucket) => bucket.items);
    }

    return ordered;
  }, [filteredTodos, group, hideCompleted, sort, processedPlannedGroups]);

  const groupedForView = useMemo(() => {
    if (processedPlannedGroups) return processedPlannedGroups;
    if (group === "due-date") {
      return groupByDueDate(sortedTodos);
    }
    return undefined;
  }, [group, processedPlannedGroups, sortedTodos]);

  const currentTitle = useMemo(() => {
    if (activeView.type === "smart") {
      return SMART_VIEW_LABEL[activeView.key];
    }
    const list = lists.find((item) => item.id === activeView.id);
    return list?.name ?? "My List";
  }, [activeView, lists]);

  const subtitle = useMemo(() => {
    if (activeView.type === "smart") {
      if (activeView.key === "planned") return "Group tasks by upcoming dates to stay ahead.";
      if (activeView.key === "important") return "Starred tasks appear here for quick focus.";
      if (activeView.key === "myday") return "Pick what you want to accomplish today.";
    }
    return "Organize tasks, drag to reorder, and capture notes.";
  }, [activeView]);

  const calendarTodos = useMemo(() => {
    if (filteredTodos.length > 0) return filteredTodos;
    if (processedPlannedGroups && processedPlannedGroups.length > 0) {
      return processedPlannedGroups.flatMap((group) => group.items);
    }
    return [] as TodoItemModel[];
  }, [filteredTodos, processedPlannedGroups]);

  const handleCreateTodo = useCallback(
    async ({ title, dueDate, dueTime }: { title: string; dueDate?: string | null; dueTime?: string | null }) => {
      const targetListId =
        activeView.type === "list"
          ? activeView.id
          : activeView.key === "myday"
            ? tasksList?.id ?? lists.find((list) => !list.isSmart)?.id
            : tasksList?.id;
      if (!targetListId) return;
      let dueAt: string | null = null;
      let allDay: boolean | undefined;
      let dueDateValue: string | null = null;
      if (dueDate) {
        if (dueTime) {
          const asIso = new Date(`${dueDate}T${dueTime}`).toISOString();
          dueAt = asIso;
          allDay = false;
        } else {
          dueDateValue = dueDate;
          allDay = true;
        }
      }
      const created = await createTodo({
        title,
        listId: targetListId,
        myDay: activeView.type === "smart" && activeView.key === "myday",
        isImportant: activeView.type === "smart" && activeView.key === "important",
        dueAt,
        dueDate: dueDateValue,
        allDay,
      });
      setSelectedId(created.id);
    },
    [activeView, createTodo, lists, tasksList],
  );

  const handleToggleComplete = useCallback(
    async (todo: TodoItemModel, value: boolean) => {
      await updateTodo(todo.id, { isCompleted: value });
    },
    [updateTodo],
  );

  const handleToggleImportant = useCallback(
    async (todo: TodoItemModel, value: boolean) => {
      await updateTodo(todo.id, { isImportant: value });
    },
    [updateTodo],
  );

  const handleToggleMyDay = useCallback(
    async (todo: TodoItemModel, value: boolean) => {
      await updateTodo(todo.id, { myDay: value });
    },
    [updateTodo],
  );

  const regenerateTodoReminders = useCallback(async (todoId: string) => {
    try {
      await fetch("/api/reminders/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType: "todo", entityId: todoId }),
      });
    } catch (error) {
      console.error("Failed to regenerate todo reminders", error);
    }
  }, []);

  const handleScheduleUpdate = useCallback(
    async (todo: TodoItemModel, next: { allDay: boolean; dueAt: string | null; dueDate: string | null }) => {
      await updateTodo(todo.id, {
        allDay: next.allDay,
        dueAt: next.allDay ? null : next.dueAt,
        dueDate: next.allDay ? next.dueDate : null,
      });
      await regenerateTodoReminders(todo.id);
    },
    [updateTodo, regenerateTodoReminders],
  );

  const handleRemindersUpdate = useCallback(
    async (todo: TodoItemModel, next: { enabled: boolean; offsets: number[] }) => {
      await updateTodo(todo.id, { reminderEnabled: next.enabled, reminderOffsets: next.offsets });
      await regenerateTodoReminders(todo.id);
    },
    [updateTodo, regenerateTodoReminders],
  );

  const handleDelete = useCallback(
    async (todo: TodoItemModel) => {
      if (todo.id === selectedId) setSelectedId(null);
      await deleteTodo(todo.id);
    },
    [deleteTodo, selectedId],
  );

  const handleMove = useCallback(
    async (todo: TodoItemModel, listId: string) => {
      await updateTodo(todo.id, { listId });
    },
    [updateTodo],
  );

  const handleCreateStep = useCallback(
    async (todoId: string, title: string) => {
      await createStep({ todoId, title });
    },
    [createStep],
  );

  const handleUpdateStep = useCallback(
    async (id: string, data: { title?: string; isCompleted?: boolean; position?: number }) => {
      await updateStep({ id, data });
    },
    [updateStep],
  );

  const handleDeleteStep = useCallback(
    async (id: string) => {
      await deleteStep({ id });
    },
    [deleteStep],
  );

  const handleSelectTodo = useCallback(
    (todo: TodoItemModel) => {
      setSelectedId(prev => (prev === todo.id ? prev : todo.id));
    },
    [],
  );

  const activeTodo = useMemo(
    () => (selectedId ? todos.find((todo) => todo.id === selectedId) ?? null : null),
    [selectedId, todos],
  );

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isMeta = event.metaKey || event.ctrlKey;

      if (isMeta && key === "k") {
        event.preventDefault();
        const target = document.getElementById("todos-search-input") as HTMLInputElement | null;
        target?.focus();
        target?.select();
        return;
      }

      if (!activeTodo) return;

      if (isMeta && event.shiftKey && key === "i") {
        event.preventDefault();
        handleToggleImportant(activeTodo, !activeTodo.isImportant).catch(() => {});
        return;
      }

      if (isMeta && !event.shiftKey && key === "d") {
        event.preventDefault();
        const today = new Date();
        today.setHours(23, 59, 59, 0);
        const { date, time } = formatInTimeZone(today, APP_TZ);
        const dueAt = `${date}T${time.slice(0, 5)}`;
        handleScheduleUpdate(activeTodo, { allDay: false, dueAt, dueDate: null }).catch(() => {});
        return;
      }

      if (!isMeta && !event.shiftKey && event.key === "Delete") {
        event.preventDefault();
        handleDelete(activeTodo).catch(() => {});
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeTodo, handleDelete, handleScheduleUpdate, handleToggleImportant]);

  const groupsForListView = groupedForView;

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col space-y-6 py-4">
      <div
        className={cn(
          "grid gap-4 overflow-hidden rounded-3xl border border-white/5 bg-black/40 p-4 backdrop-blur",
          isTablet ? "grid-cols-1" : "grid-cols-[280px,1fr,360px]",
        )}
      >
        <Sidebar
          loading={listsLoading}
          smartCounts={smartCounts}
          lists={userLists}
          tasksListId={tasksList?.id ?? null}
          tasksCount={tasksList?.incompleteCount ?? 0}
          activeView={activeView}
          onSelect={(view) => {
            setActiveView(view);
            if (isTablet) setSelectedId(null);
          }}
          onCreateList={createList}
          onRenameList={(id, name) => updateList(id, { name })}
          onUpdateList={(id, data) => updateList(id, data)}
          onDeleteList={deleteList}
          onReorderLists={reorderLists}
        />

        <section className="flex min-h-[400px] flex-col gap-4 overflow-hidden">
          <Toolbar
            title={currentTitle}
            subtitle={subtitle}
            activeView={activeView}
            sort={sort}
            group={group}
            hideCompleted={hideCompleted}
            onSortChange={setSort}
            onGroupChange={setGroup}
            onToggleHideCompleted={setHideCompleted}
            onAddToMyDay={() => {
              if (!selectedId) return;
              const todo = todos.find((item) => item.id === selectedId);
              if (todo) handleToggleMyDay(todo, true).catch(() => {});
            }}
          />
          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/40">
            <div className="border-b border-white/5 p-4">
              <NewTodoInput onSubmit={handleCreateTodo} disabled={todosLoading || listsLoading} />
            </div>
            <TodoListView
              activeView={activeView}
              todos={sortedTodos}
              groups={groupsForListView}
              suggestions={suggestions}
              loading={todosLoading}
              onToggleComplete={handleToggleComplete}
              onToggleImportant={handleToggleImportant}
              onToggleMyDay={handleToggleMyDay}
              onUpdateSchedule={handleScheduleUpdate}
              onDelete={handleDelete}
              onSelect={handleSelectTodo}
              selectedId={selectedId}
            />
          </div>
        </section>

        <DetailPane
          visible={!isTablet || !!selectedId}
          todo={activeTodo}
          lists={[tasksList, ...userLists].filter(Boolean) as TodoListSummary[]}
          onClose={() => setSelectedId(null)}
          onUpdateTitle={async (title) => {
            if (!activeTodo) return;
            await updateTodo(activeTodo.id, { title });
          }}
          onToggleImportant={async (value) => {
            if (!activeTodo) return;
            await handleToggleImportant(activeTodo, value);
          }}
          onToggleMyDay={async (value) => {
            if (!activeTodo) return;
            await handleToggleMyDay(activeTodo, value);
          }}
          onUpdateSchedule={async (next) => {
            if (!activeTodo) return;
            await handleScheduleUpdate(activeTodo, next);
          }}
          onUpdateReminders={async (next) => {
            if (!activeTodo) return;
            await handleRemindersUpdate(activeTodo, next);
          }}
          onSetRepeat={async (value) => {
            if (!activeTodo) return;
            await updateTodo(activeTodo.id, { repeatRule: value });
          }}
          onUpdateNote={async (value) => {
            if (!activeTodo) return;
            await updateTodo(activeTodo.id, { note: value });
          }}
          onToggleComplete={async (value) => {
            if (!activeTodo) return;
            await handleToggleComplete(activeTodo, value);
          }}
          onMoveToList={async (listId) => {
            if (!activeTodo) return;
            await handleMove(activeTodo, listId);
          }}
          onDelete={async () => {
            if (!activeTodo) return;
            await handleDelete(activeTodo);
          }}
          onAddStep={async (title) => {
            if (!activeTodo) return;
            await handleCreateStep(activeTodo.id, title);
          }}
          onUpdateStep={handleUpdateStep}
          onDeleteStep={handleDeleteStep}
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/5 bg-black/40 p-4">
        <SchedulePanel todos={calendarTodos} loading={todosLoading} label={currentTitle} />
      </div>
    </div>
  );
}

type DueBucket = { key: string; label: string; items: TodoItemModel[] };

function groupByDueDate(todos: TodoItemModel[]): DueBucket[] {
  const buckets: Record<string, DueBucket> = {};
  const order = [
    { key: "overdue", label: "Overdue" },
    { key: "today", label: "Today" },
    { key: "tomorrow", label: "Tomorrow" },
    { key: "this_week", label: "This week" },
    { key: "later", label: "Later" },
    { key: "no_due", label: "No due date" },
  ];
  const today = new Date();
  const startToday = new Date(today);
  startToday.setHours(0, 0, 0, 0);
  const endToday = new Date(today);
  endToday.setHours(23, 59, 59, 999);
  const tomorrowEnd = new Date(endToday);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
  const weekEnd = new Date(endToday);
  weekEnd.setDate(weekEnd.getDate() + (6 - weekEnd.getDay()));

  for (const { key, label } of order) {
    buckets[key] = { key, label, items: [] };
  }

  for (const todo of todos) {
    if (!todo.dueAt) {
      buckets["no_due"].items.push(todo);
      continue;
    }
    const due = new Date(todo.dueAt);
    if (due.getTime() < startToday.getTime()) {
      buckets["overdue"].items.push(todo);
    } else if (due.getTime() <= endToday.getTime()) {
      buckets["today"].items.push(todo);
    } else if (due.getTime() <= tomorrowEnd.getTime()) {
      buckets["tomorrow"].items.push(todo);
    } else if (due.getTime() <= weekEnd.getTime()) {
      buckets["this_week"].items.push(todo);
    } else {
      buckets["later"].items.push(todo);
    }
  }

  return order.filter((bucket) => buckets[bucket.key].items.length > 0).map((bucket) => buckets[bucket.key]);
}
