'use client';

import { useState } from 'react';
import { useAttachments } from '@/hooks/usePlannerApi';

export default function TaskAttachments({ taskId }: { taskId: string }) {
  const { q, add } = useAttachments(taskId);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [mime, setMime] = useState('');

  if (q.isLoading) return <div className="text-slate-300">Loading…</div>;
  if (q.error) return <div className="text-red-400">Failed to load attachments</div>;

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {(q.data?.attachments ?? []).map((a: any) => (
          <li
            key={a.id}
            className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950 p-2"
          >
            <div>
              <div className="text-sm text-white">{a.name}</div>
              <div className="text-xs text-slate-400">
                {a.mimeType ?? 'file'} • {a.sizeBytes ?? 0} bytes
              </div>
            </div>
            <a className="text-sm text-emerald-400 hover:underline" href={a.url} target="_blank" rel="noreferrer">
              Open
            </a>
          </li>
        ))}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || !url.trim()) return;
          add.mutate({ name: name.trim(), url: url.trim(), mimeType: mime || undefined });
          setName('');
          setUrl('');
          setMime('');
        }}
        className="grid grid-cols-3 gap-2"
      >
        <input
          className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-white"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-white"
          placeholder="URL (https://…)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <input
          className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-white"
          placeholder="MIME (optional)"
          value={mime}
          onChange={(e) => setMime(e.target.value)}
        />
        <button className="col-span-3 rounded-md border border-slate-700 px-3 py-1 text-slate-300 hover:bg-slate-800">
          Add attachment
        </button>
      </form>
    </div>
  );
}
