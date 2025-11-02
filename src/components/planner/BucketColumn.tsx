import { FormEvent, useEffect, useState } from 'react';
import { Check, Pencil, Trash2, X } from 'lucide-react';
import TaskCard from './TaskCard';

type Label = { id: string; name: string; color: string };
type Task = {
  id: string;
  title: string;
  priority: 'URGENT' | 'IMPORTANT' | 'MEDIUM' | 'LOW';
  progress: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  dueAt: string | null;
  order: number;
  labelList?: Label[];
  assigneeIds?: string[];
};
type Bucket = { id: string; name: string; order: number; tasks: Task[] };

export default function BucketColumn({
  bucket,
  onOpen,
  onCreateTask,
  creatingTask,
  onRenameBucket,
  renamingBucket,
  onDeleteBucket,
  deletingBucket,
}: {
  bucket: Bucket;
  onOpen: (taskId: string) => void;
  onCreateTask: (bucketId: string, title: string) => void;
  creatingTask: boolean;
  onRenameBucket?: (bucketId: string, name: string) => Promise<void> | void;
  renamingBucket?: boolean;
  onDeleteBucket?: (bucketId: string) => Promise<void> | void;
  deletingBucket?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [bucketName, setBucketName] = useState(bucket.name);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const value = title.trim();
    if (!value) return;
    onCreateTask(bucket.id, value);
    setTitle('');
    setAdding(false);
  };

  useEffect(() => {
    if (!renaming) {
      setBucketName(bucket.name);
    }
  }, [bucket.name, renaming]);

  const handleRename = async (event: FormEvent) => {
    event.preventDefault();
    const next = bucketName.trim();
    if (!next) return;
    if (next === bucket.name) {
      setRenaming(false);
      return;
    }
    if (!onRenameBucket) {
      setRenaming(false);
      return;
    }
    try {
      await onRenameBucket(bucket.id, next);
      setRenaming(false);
    } catch (err) {
      console.error('rename bucket failed', err);
    }
  };

  const handleDelete = async () => {
    if (!onDeleteBucket) return;
    let confirmed = true;
    if (typeof window !== 'undefined') {
      confirmed = window.confirm('Delete this section and its tasks?');
    }
    if (!confirmed) return;
    try {
      await onDeleteBucket(bucket.id);
    } catch (err) {
      console.error('delete bucket failed', err);
    }
  };

  return (
    <div className="w-80 shrink-0">
      <div className="mb-3 flex items-center justify-between gap-2">
        {renaming ? (
          <form onSubmit={handleRename} className="flex flex-1 items-center gap-2">
            <input
              autoFocus
              value={bucketName}
              onChange={(event) => setBucketName(event.target.value)}
              className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-white outline-none"
              placeholder="Section name"
              disabled={renamingBucket}
            />
            <button
              type="submit"
              disabled={renamingBucket}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-emerald-500 text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setRenaming(false);
                setBucketName(bucket.name);
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <div className="flex flex-1 items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-white">{bucket.name}</h3>
            <div className="flex items-center gap-1">
              {onRenameBucket ? (
                <button
                  type="button"
                  onClick={() => {
                    setRenaming(true);
                    setBucketName(bucket.name);
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              ) : null}
              {onDeleteBucket ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={Boolean(deletingBucket)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-500 text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>
      <div className="space-y-3">
        {adding ? (
          <form onSubmit={handleSubmit} className="rounded-xl border border-slate-700 bg-slate-900 p-3">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task name"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
            />
            <div className="mt-3 flex items-center gap-2">
              <button
                type="submit"
                disabled={creatingTask}
                className="rounded-md bg-emerald-500 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-400 disabled:opacity-50"
              >
                Add task
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  setTitle('');
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
            onClick={() => setAdding(true)}
            className="flex w-full items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-left text-sm text-emerald-400 hover:border-slate-500 hover:text-emerald-300"
          >
            <span className="text-lg leading-none">+</span>
            <span>Add task</span>
          </button>
        )}
        {bucket.tasks.map(task => (
          <TaskCard key={task.id} task={task} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}
