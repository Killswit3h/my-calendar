// components/planner/ProjectsSidebar.tsx
"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";

type Project = {
  id: string;
  name: string;
  description?: string | null;
  status?: "active" | "paused" | "done";
};

const STATUS_ORDER: Record<NonNullable<Project["status"]>, number> = {
  active: 0,
  paused: 1,
  done: 2,
};

export function ProjectsSidebar({
  projects,
  selectedId,
  onSelect,
  onCreate,
  mobile = false,
}: {
  projects: Project[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  onCreate?: () => void;
  mobile?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"name" | "status">("status");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter((project) => project.name.toLowerCase().includes(term));
  }, [projects, query]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    if (sort === "name") {
      copy.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      copy.sort((a, b) => {
        const statusA = a.status ?? "active";
        const statusB = b.status ?? "active";
        const weightA = STATUS_ORDER[statusA] ?? 99;
        const weightB = STATUS_ORDER[statusB] ?? 99;
        if (weightA !== weightB) return weightA - weightB;
        return a.name.localeCompare(b.name);
      });
    }
    return copy;
  }, [filtered, sort]);

  const groups = useMemo(() => {
    const bucket = {
      Active: sorted.filter((project) => (project.status ?? "active") === "active"),
      Paused: sorted.filter((project) => project.status === "paused"),
      Done: sorted.filter((project) => project.status === "done"),
    };
    return bucket;
  }, [sorted]);

  return (
    <aside
      className={cn(
        "w-full rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur",
        mobile ? "p-3" : "p-4 space-y-4",
      )}
    >
      <div className={cn("flex w-full flex-col gap-3 md:flex-row md:items-center", mobile && "gap-2")}> 
        {mobile && <h2 className="text-lg font-semibold">Projects</h2>}
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search projects"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-emerald-500"
        />
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as typeof sort)}
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-emerald-500"
          >
            <option value="status">Sort by status</option>
            <option value="name">Sort by name</option>
          </select>
          {onCreate ? (
            <button
              type="button"
              onClick={onCreate}
              className="rounded-xl border border-emerald-600 px-3 py-2 text-sm font-medium text-emerald-400 transition hover:bg-emerald-600/10"
            >
              New
            </button>
          ) : null}
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 px-3 py-4 text-sm text-zinc-500">
          No projects yet.
        </div>
      ) : (
        Object.entries(groups)
          .filter(([label, items]) => label === "Active" || items.length > 0)
          .map(([label, items]) => (
          <div key={label} className="space-y-2">
            <div className="flex items-center justify-between text-xs uppercase tracking-wide text-zinc-400">
              <span>{label}</span>
              <span>{items.length}</span>
            </div>
            <ul className="space-y-1">
              {items.map((project) => (
                <li key={project.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(project.id)}
                    className={cn(
                      "flex w-full flex-col rounded-xl border px-3 py-2 text-left text-sm transition",
                      "border-transparent bg-zinc-950 hover:border-zinc-700",
                      project.id === selectedId && "border-emerald-700 bg-emerald-950/40 text-emerald-100",
                    )}
                  >
                    <span className="truncate font-medium">{project.name}</span>
                    {project.description ? (
                      <span className="mt-1 line-clamp-2 text-xs text-zinc-400">{project.description}</span>
                    ) : null}
                  </button>
                </li>
              ))}
              {items.length === 0 && (
                <li className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 px-3 py-3 text-xs text-zinc-500">
                  No projects
                </li>
              )}
            </ul>
          </div>
        ))
      )}
    </aside>
  );
}
