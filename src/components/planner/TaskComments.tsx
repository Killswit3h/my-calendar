'use client';

import { useState } from 'react';
import { useComments } from '@/src/hooks/usePlannerApi';

export default function TaskComments({ taskId, currentUserId }: { taskId: string; currentUserId: string }) {
  const { q, add } = useComments(taskId);
  const [body, setBody] = useState('');

  if (q.isLoading) return <div className="text-slate-300">Loading…</div>;
  if (q.error) return <div className="text-red-400">Failed to load comments</div>;

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {(q.data?.comments ?? []).map((c: any) => (
          <li key={c.id} className="rounded-md border border-slate-800 bg-slate-950 p-2">
            <div className="text-xs text-slate-400">
              {new Date(c.createdAt).toLocaleString()} • {c.userId}
            </div>
            <div className="mt-1 whitespace-pre-wrap text-sm text-white">{c.body}</div>
          </li>
        ))}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (body.trim()) {
            add.mutate({ userId: currentUserId, body: body.trim() });
            setBody('');
          }
        }}
        className="flex gap-2"
      >
        <textarea
          className="h-16 flex-1 resize-none rounded-md border border-slate-700 bg-slate-950 p-2 text-sm text-white outline-none"
          placeholder="Write a comment"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button className="h-9 self-end rounded-md border border-slate-700 px-3 text-slate-300 hover:bg-slate-800">
          Send
        </button>
      </form>
    </div>
  );
}
