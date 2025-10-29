import type { PlannerTaskPriority } from '@prisma/client';

type Task = {
  id: string;
  title: string;
  priority: PlannerTaskPriority;
  progress: 'NOT_STARTED'|'IN_PROGRESS'|'COMPLETED';
  dueAt: string | null;
};

const pill: Record<PlannerTaskPriority, string> = {
  URGENT: 'bg-red-600 text-white',
  IMPORTANT: 'bg-amber-600 text-white',
  MEDIUM: 'bg-slate-600 text-white',
  LOW: 'bg-teal-600 text-white',
};

export default function TaskCard({ task }: { task: Task }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-3 hover:border-slate-500">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-white">{task.title}</h4>
        <span className={`text-[10px] px-2 py-0.5 rounded ${pill[task.priority]}`}>{task.priority}</span>
      </div>
      {task.dueAt && <div className="mt-2 text-xs text-slate-300">Due {new Date(task.dueAt).toLocaleDateString()}</div>}
    </div>
  );
}
