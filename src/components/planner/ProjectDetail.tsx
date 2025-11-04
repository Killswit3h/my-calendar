// components/planner/ProjectDetail.tsx
"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";

type PlannerLabel = { id: string; name: string; color: string };
type PlannerTask = {
  id: string;
  title: string;
  progress?: string | null;
  startAt?: string | null;
  dueAt?: string | null;
  bucketId: string;
  labelList?: PlannerLabel[];
  assigneeIds?: string[];
};
type PlannerBucket = { id: string; name: string; tasks: PlannerTask[] };
type PlannerPlan = {
  id: string;
  name: string;
  description?: string | null;
  buckets: PlannerBucket[];
};

export function ProjectDetail({
  plan,
  loading,
  error,
  onRetry,
  onBack,
  mobile = false,
}: {
  plan?: PlannerPlan | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onBack?: () => void;
  mobile?: boolean;
}) {
  const [tab, setTab] = useState<"board" | "list" | "timeline">("board");

  const tasksList = useMemo(() => {
    if (!plan) return [] as Array<PlannerTask & { bucketName: string }>;
    return plan.buckets.flatMap((bucket) =>
      bucket.tasks.map((task) => ({ ...task, bucketName: bucket.name })),
    );
  }, [plan]);

  const boardBuckets = plan?.buckets ?? [];

  return (
    <section className="flex h-full w-full flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3 md:p-5">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          {mobile && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg border border-zinc-700 px-3 py-1 text-sm text-zinc-200 transition hover:border-zinc-500"
            >
              Back
            </button>
          )}
          <div>
            <h1 className="text-xl font-semibold md:text-2xl">{plan?.name ?? "Select a project"}</h1>
            {plan?.description ? (
              <p className="text-xs text-zinc-500 md:text-sm">{plan.description}</p>
            ) : (
              <p className="text-xs text-zinc-500 md:text-sm">Plan phases, tasks, and schedules in one place.</p>
            )}
          </div>
        </div>
        <nav
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-950/70 p-1",
            mobile && "sticky top-[calc(var(--safe-top)+12px)] z-10",
          )}
        >
          <Tab label="Board" active={tab === "board"} onClick={() => setTab("board")} />
          <Tab label="List" active={tab === "list"} onClick={() => setTab("list")} />
          <Tab label="Timeline" active={tab === "timeline"} onClick={() => setTab("timeline")} />
        </nav>
      </header>

      <div className="mt-4 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">Loading project…</div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-red-400">
            <span>{error}</span>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="rounded-lg border border-red-500 px-3 py-1 text-red-200 hover:bg-red-500/10"
              >
                Retry
              </button>
            ) : null}
          </div>
        ) : !plan ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            Select a project to view details.
          </div>
        ) : tab === "board" ? (
          <BoardView buckets={boardBuckets} />
        ) : tab === "list" ? (
          <ListView tasks={tasksList} />
        ) : (
          <TimelineView />
        )}
      </div>
    </section>
  );
}

function Tab({ label, active, onClick }: { label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1 text-sm transition",
        active ? "bg-emerald-600 text-white shadow" : "text-zinc-300 hover:bg-zinc-800",
      )}
    >
      {label}
    </button>
  );
}

function BoardView({ buckets }: { buckets: PlannerBucket[] }) {
  if (buckets.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-400">
        This project doesn’t have any sections yet.
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {buckets.map((bucket) => (
        <div key={bucket.id} className="rounded-xl border border-zinc-800 bg-zinc-950/60">
          <div className="border-b border-zinc-800 px-3 py-2 text-sm font-medium text-zinc-200">{bucket.name}</div>
          <ul className="space-y-2 p-3">
            {bucket.tasks.map((task) => (
              <li
                key={task.id}
                className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{task.title}</span>
                  {task.dueAt ? (
                    <span className="shrink-0 text-xs text-zinc-400">{formatDate(task.dueAt)}</span>
                  ) : null}
                </div>
                {task.labelList && task.labelList.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {task.labelList.map((label) => (
                      <span
                        key={label.id}
                        className="rounded-full px-2 py-0.5 text-[11px]"
                        style={{ backgroundColor: label.color, color: "#111" }}
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                ) : null}
                {task.assigneeIds && task.assigneeIds.length > 0 ? (
                  <div className="text-xs text-zinc-400">{task.assigneeIds.length} assignee(s)</div>
                ) : null}
              </li>
            ))}
            {bucket.tasks.length === 0 && (
              <li className="rounded-lg border border-dashed border-zinc-800 bg-zinc-900/40 px-3 py-6 text-center text-sm text-zinc-500">
                Nothing here yet.
              </li>
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}

function ListView({ tasks }: { tasks: Array<PlannerTask & { bucketName: string }> }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60">
      <table className="w-full min-w-full table-fixed text-sm">
        <thead className="bg-zinc-900 text-zinc-300">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Task</th>
            <th className="px-3 py-2 text-left font-medium">Section</th>
            <th className="px-3 py-2 text-left font-medium">Status</th>
            <th className="px-3 py-2 text-left font-medium">Due</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-3 py-6 text-center text-zinc-400">
                No tasks yet.
              </td>
            </tr>
          ) : (
            tasks.map((task) => (
              <tr key={task.id} className="border-t border-zinc-800 text-zinc-200">
                <td className="px-3 py-2">{task.title}</td>
                <td className="px-3 py-2 text-zinc-400">{task.bucketName}</td>
                <td className="px-3 py-2 capitalize text-zinc-400">{task.progress ?? "—"}</td>
                <td className="px-3 py-2 text-zinc-500">{formatDate(task.dueAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function TimelineView() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-400">
      Timeline placeholder. Integrate your calendar or Gantt here.
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
