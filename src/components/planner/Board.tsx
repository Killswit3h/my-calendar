import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { PlannerTaskPriority, PlannerTaskProgress } from '@prisma/client';
import BucketColumn from './BucketColumn';
import TaskDetailSheet from './TaskDetailSheet';

type Task = {
  id: string;
  title: string;
  description?: string | null;
  priority: PlannerTaskPriority;
  progress: PlannerTaskProgress;
  dueAt: string | null;
  startAt?: string | null;
  order: number;
  bucketId: string;
};
type Bucket = { id: string; name: string; order: number; tasks: Task[] };
type Plan = { id: string; name: string; description?: string | null; color?: string | null; buckets: Bucket[] };

type BoardProps = {
  plan: Plan;
  onCreateTask: (bucketId: string, title: string) => void;
  creatingTask: boolean;
  onCreateBucket?: (name: string) => Promise<void> | void;
  creatingBucket?: boolean;
  onRenameBucket?: (bucketId: string, name: string) => Promise<void> | void;
  renamingBucket?: boolean;
  onDeleteBucket?: (bucketId: string) => Promise<void> | void;
  deletingBucket?: boolean;
};

export default function Board({
  plan,
  onCreateTask,
  creatingTask,
  onCreateBucket,
  creatingBucket = false,
  onRenameBucket,
  renamingBucket = false,
  onDeleteBucket,
  deletingBucket = false,
}: BoardProps) {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [addingBucket, setAddingBucket] = useState(false);
  const [bucketTitle, setBucketTitle] = useState('');
  const local = plan;
  const displayName = local.name === 'Planner Demo' ? 'Planner' : local.name;

  const tasksById = useMemo(() => {
    const map = new Map<string, Task>();
    plan.buckets.forEach((bucket) =>
      bucket.tasks.forEach((task) =>
        map.set(task.id, { ...task, bucketId: task.bucketId ?? bucket.id }),
      ),
    );
    return map;
  }, [plan]);

  const activeTask = activeTaskId ? tasksById.get(activeTaskId) ?? null : null;

  useEffect(() => {
    if (activeTaskId && !tasksById.has(activeTaskId)) {
      setActiveTaskId(null);
    }
  }, [activeTaskId, tasksById]);

  const handleCreateBucket = async (event: FormEvent) => {
    event.preventDefault();
    if (!onCreateBucket) return;
    const value = bucketTitle.trim();
    if (!value) return;
    try {
      await onCreateBucket(value);
      setBucketTitle('');
      setAddingBucket(false);
    } catch (err) {
      console.error('create bucket failed', err);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-slate-800 p-4">
        <h1 className="text-xl font-semibold text-white">{displayName}</h1>
        {local.description ? <p className="text-slate-300">{local.description}</p> : null}
        <div className="ml-auto flex items-center gap-2">
          <a href={`/planner/${local.id}/calendar`} className="rounded-md border border-slate-700 px-3 py-1 text-emerald-400">Calendar</a>
          <a href={`/planner/${local.id}/timeline`} className="rounded-md border border-slate-700 px-3 py-1 text-emerald-400">Timeline</a>
        </div>
      </header>
      <main className="flex-1 overflow-x-auto">
        <div className="flex gap-4 p-4">
          {plan.buckets.map((bucket) => (
            <BucketColumn
              key={bucket.id}
              bucket={bucket}
              onOpen={(taskId) => setActiveTaskId(taskId)}
              onCreateTask={onCreateTask}
              creatingTask={creatingTask}
              onRenameBucket={onRenameBucket}
              renamingBucket={renamingBucket}
              onDeleteBucket={onDeleteBucket}
              deletingBucket={deletingBucket}
            />
          ))}
          {onCreateBucket ? (
            <div className="w-80 shrink-0">
              {addingBucket ? (
                <form onSubmit={handleCreateBucket} className="space-y-3 rounded-xl border border-slate-700 bg-slate-900 p-3">
                  <input
                    autoFocus
                    value={bucketTitle}
                    onChange={(event) => setBucketTitle(event.target.value)}
                    placeholder="New section name"
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={creatingBucket}
                      className="rounded-md bg-emerald-500 px-3 py-1 text-sm font-medium text-black hover:bg-emerald-400 disabled:opacity-50"
                    >
                      Add section
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddingBucket(false);
                        setBucketTitle('');
                      }}
                      className="rounded-md px-3 py-1 text-sm text-slate-300 hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingBucket(true)}
                  className="flex w-full items-center gap-2 rounded-xl border border-dashed border-slate-600 bg-slate-900/60 px-3 py-2 text-left text-sm text-emerald-400 hover:border-emerald-400"
                >
                  <span className="text-lg leading-none">+</span>
                  <span>Add section</span>
                </button>
              )}
            </div>
          ) : null}
        </div>
      </main>
      {activeTask ? (
        <TaskDetailSheet
          planId={plan.id}
          task={activeTask}
          buckets={plan.buckets.map((b) => ({ id: b.id, name: b.name }))}
          onClose={() => setActiveTaskId(null)}
        />
      ) : null}
    </div>
  );
}
