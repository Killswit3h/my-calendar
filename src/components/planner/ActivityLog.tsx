'use client';
import { useActivity } from '@/hooks/usePlannerApi';

export default function ActivityLog({ planId }: { planId: string }) {
  const { data, isLoading, error } = useActivity(planId);
  if (isLoading) return <div className="text-slate-300">Loading…</div>;
  if (error) return <div className="text-red-400">Failed to load activity</div>;
  const items = data?.activity ?? [];
  return (
    <ul className="space-y-2">
      {items.map((a: any) => (
        <li key={a.id} className="rounded-md border border-slate-800 bg-slate-950 p-2 text-sm text-white">
          <div className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleString()} • {a.userId}</div>
          <div className="mt-0.5">{format(a)}</div>
        </li>
      ))}
    </ul>
  );
}
function format(a: any) {
  const meta = a.meta || {};
  switch (a.type) {
    case 'TASK_CREATED': return `Created task "${meta.title ?? a.taskId}"`;
    case 'TASK_UPDATED': return `Updated ${Array.isArray(meta.changes) ? meta.changes.join(', ') : 'fields'}`;
    case 'TASK_MOVED':   return `Moved task from ${meta.from} to ${meta.to}`;
    case 'LABEL_TOGGLED': return `${meta.added ? 'Added' : 'Removed'} label ${meta.labelId}`;
    case 'ASSIGNEE_TOGGLED': return `${meta.added ? 'Assigned' : 'Unassigned'} ${meta.assigneeId}`;
    case 'COMMENT_ADDED': return 'Added a comment';
    case 'CHECKLIST_ADDED': return `Added checklist "${meta.title}"`;
    case 'CHECKLIST_UPDATED': return 'Updated a checklist item';
    case 'CHECKLIST_DELETED': return 'Deleted a checklist item';
    case 'ATTACHMENT_ADDED': return `Attached "${meta.name}"`;
    default: return a.type;
  }
}
