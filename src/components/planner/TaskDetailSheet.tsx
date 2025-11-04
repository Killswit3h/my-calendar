'use client';
import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { usePlan } from '../../hooks/usePlannerApi';
import TaskChecklist from './TaskChecklist';
import TaskComments from './TaskComments';
import TaskAttachments from './TaskAttachments';
import AssigneesEditor from './AssigneesEditor';
type Task = {
  id: string; title: string; description?: string | null;
  priority: 'URGENT'|'IMPORTANT'|'MEDIUM'|'LOW';
  progress: 'NOT_STARTED'|'IN_PROGRESS'|'COMPLETED';
  startAt?: string | null; dueAt?: string | null; bucketId: string;
  assigneeIds?: string[];
};

type BucketOption = { id: string; name: string };

const SECTION_DEFAULTS = {
  details: true,
  checklist: false,
  comments: false,
  attachments: false,
  assignees: false,
} as const;
type SectionKey = keyof typeof SECTION_DEFAULTS;

export default function TaskDetailSheet({ planId, task, buckets, onClose }: { planId: string; task: Task; buckets: BucketOption[]; onClose: () => void }) {
  const { patchTask, moveTask, deleteTask } = usePlan(planId);
  const [local, setLocal] = useState<Task>(task);
  const [bucketId, setBucketId] = useState<string>(task.bucketId);
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({ ...SECTION_DEFAULTS });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const prevBodyOverflow = document.body.style.overflow;
      const prevBodyTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      return () => {
        document.body.style.overflow = prevBodyOverflow;
        document.body.style.touchAction = prevBodyTouchAction;
      };
    }
    return undefined;
  }, []);

  useEffect(() => {
    setLocal(task);
    setBucketId(task.bucketId);
    setOpenSections({ ...SECTION_DEFAULTS });
  }, [task?.id]);

  useEffect(() => {
    const h = setTimeout(() => {
      if (!local?.id) return;
      patchTask.mutate({ taskId: local.id, data: {
        title: local.title,
        description: local.description ?? '',
        priority: local.priority,
        progress: local.progress,
        startAt: local.startAt ?? null,
        dueAt: local.dueAt ?? null,
      }});
    }, 400);
    return () => clearTimeout(h);
  }, [local]);

  const setField = <K extends keyof Task>(k: K, v: Task[K]) => setLocal(p => ({ ...p, [k]: v }));

  const handleDelete = () => {
    if (deleteTask.isPending) return;
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Delete this task? This cannot be undone.');
      if (!confirmed) return;
    }
    deleteTask.mutate(
      { taskId: task.id },
      {
        onSuccess: () => onClose(),
      },
    );
  };

  const toggleSection = (key: SectionKey) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const sections: Array<{ key: SectionKey; label: string; content: React.ReactNode }> = [
    {
      key: 'details',
      label: 'Details',
      content: (
        <>
          <div className="mobile-tight flex flex-wrap items-center gap-4 text-sm text-emerald-400">
            <button type="button" onClick={() => toggleSection('assignees')} className="hover:underline">
              ⊕ Assign
            </button>
          </div>

          <div className="mobile-tight grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs text-slate-400">Bucket</label>
              <select
                value={bucketId}
                onChange={(e) => {
                  const value = e.target.value;
                  setBucketId(value);
                  if (value && value !== task.bucketId) {
                    moveTask.mutate({ taskId: task.id, toBucketId: value });
                  }
                }}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-sm text-white"
              >
                {buckets.map((bucket) => (
                  <option key={bucket.id} value={bucket.id}>
                    {bucket.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400">Progress</label>
              <select
                value={local.progress}
                onChange={(e)=>setField('progress', e.target.value as Task['progress'])}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-sm text-white"
              >
                <option value="NOT_STARTED">Not started</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          <div className="mobile-tight grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs text-slate-400">Priority</label>
              <select
                value={local.priority}
                onChange={(e)=>setField('priority', e.target.value as Task['priority'])}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-sm text-white"
              >
                <option value="URGENT">Urgent</option>
                <option value="IMPORTANT">Important</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400">Start date</label>
                <input
                  type="date"
                  value={local.startAt ? local.startAt.slice(0,10) : ''}
                  onChange={(e)=>setField('startAt', e.target.value ? new Date(e.target.value).toISOString() : null)}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400">Due date</label>
                <input
                  type="date"
                  value={local.dueAt ? local.dueAt.slice(0,10) : ''}
                  onChange={(e)=>setField('dueAt', e.target.value ? new Date(e.target.value).toISOString() : null)}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 p-2 text-sm text-white"
                />
              </div>
            </div>
          </div>

        </>
      ),
    },
    {
      key: 'checklist',
      label: 'Checklist',
      content: <TaskChecklist planId={planId} taskId={task.id} />,
    },
    {
      key: 'comments',
      label: 'Comments',
      content: <TaskComments taskId={task.id} currentUserId="demo-user" />,
    },
    {
      key: 'attachments',
      label: 'Attachments',
      content: <TaskAttachments taskId={task.id} />,
    },
    {
      key: 'assignees',
      label: 'Assignees',
      content: <AssigneesEditor planId={planId} taskId={task.id} assignees={task.assigneeIds || []} />,
    },
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[560px] border-l border-slate-800 bg-slate-900 shadow-xl md:w-[560px]">
      <div className="flex items-center justify-between border-b border-slate-800 p-4">
        <input
          value={local.title}
          onChange={(e)=>setField('title', e.target.value)}
          className="w-full bg-transparent text-lg font-semibold text-white outline-none"
        />
        <div className="ml-3 flex items-center gap-2">
          <button
            onClick={handleDelete}
            disabled={deleteTask.isPending}
            className="rounded-md border border-red-500 px-3 py-1 text-sm font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
          >
            {deleteTask.isPending ? 'Deleting…' : 'Delete'}
          </button>
          <button onClick={onClose} className="rounded-md border border-slate-700 px-2 py-1 text-slate-300 hover:bg-slate-800">Esc</button>
        </div>
      </div>

      <div
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'auto' }}
      >
        <div className="space-y-3 p-4 pb-24">
          {sections.map(section => {
            const open = openSections[section.key];
            return (
              <div key={section.key} className="rounded-xl border border-slate-800 bg-slate-950">
                <button
                  type="button"
                  onClick={() => toggleSection(section.key)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-white"
                >
                  {section.label}
                  <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open ? <div className="space-y-4 border-t border-slate-800 p-4 text-sm text-slate-200">{section.content}</div> : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
