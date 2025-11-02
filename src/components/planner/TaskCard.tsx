'use client';

type Label = { id: string; name: string; color: string };
type Task = {
  id: string;
  title: string;
  priority: 'URGENT'|'IMPORTANT'|'MEDIUM'|'LOW';
  progress: 'NOT_STARTED'|'IN_PROGRESS'|'COMPLETED';
  dueAt: string | null;
  labelList?: Label[];
  assigneeIds?: string[];
};
export default function TaskCard({ task, onOpen }: { task: Task; onOpen: (taskId: string) => void }) {
  return (
    <button onClick={() => onOpen(task.id)} className="w-full text-left">
      <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-left transition hover:border-slate-500">
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-500 text-xs text-slate-400">
          {task.progress === 'COMPLETED' ? '✓' : ''}
        </span>
        <div className="flex-1">
          <div className="text-sm font-medium text-white">{task.title}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            {task.dueAt ? <span>Due {new Date(task.dueAt).toLocaleDateString()}</span> : null}
            {task.labelList?.slice(0, 3).map((label) => (
              <span
                key={label.id}
                className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                style={{ backgroundColor: label.color, color: '#0f172a' }}
              >
                {label.name}
              </span>
            ))}
          </div>
        </div>
        <div className="flex -space-x-2">
          {(task.assigneeIds ?? []).slice(0, 3).map((assignee) => (
            <div
              key={assignee}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-900 bg-slate-600 text-[10px] font-semibold text-white"
            >
              {initials(assignee)}
            </div>
          ))}
        </div>
      </div>
    </button>
  );
}
function initials(s: string) {
  const parts = s.replace(/[@._-]+/g,' ').trim().split(' ');
  const pick = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  return pick.toUpperCase() || (s[0]?.toUpperCase() ?? '?');
}
