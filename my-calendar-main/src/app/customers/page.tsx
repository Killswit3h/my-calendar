"use client";
import useSWR from "swr";
import { useMemo, useState } from "react";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function CustomersPage() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  useMemo(() => { const id = setTimeout(() => setDebouncedQ(q), 200); return () => clearTimeout(id); }, [q]);
  const { data, mutate, isLoading } = useSWR<{ items: { id: string; name: string }[] }>(`/api/customers?search=${encodeURIComponent(debouncedQ)}&limit=50`, fetcher);
  const items = data?.items ?? [];

  async function rename(id: string, current: string) {
    const name = prompt("Rename customer", current);
    if (!name || name.trim() === current) return;
    const r = await fetch(`/api/customers/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    if (!r.ok) { alert('Rename failed'); return; }
    mutate();
  }

  async function remove(id: string) {
    if (!confirm('Delete this customer?')) return;
    const r = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
    if (!r.ok && r.status !== 204) { alert('Delete failed'); return; }
    mutate();
  }

  return (
    <main className="cal-shell">
      <div className="flex items-center justify-between mb-3">
        <h1 className="page-title">Customers</h1>
        <div className="flex gap-2">
          <button className="btn" onClick={async () => {
            const name = prompt('New customer name');
            if (!name) return;
            const r = await fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
            if (!r.ok) { alert('Create failed'); return; }
            mutate();
          }}>Add Customer</button>
          <button className="btn ghost" onClick={async () => {
            if (!confirm('Seed default customers from repository list?')) return;
            const r = await fetch('/api/customers/prefill', { method: 'POST' });
            if (!r.ok) { alert('Seed failed'); return; }
            mutate();
          }}>Seed Defaults</button>
          <Link href="/calendar/cme9wqhpe0000ht8sr5o3a6wf" className="btn">Back to Calendar</Link>
        </div>
      </div>
      <div className="surface p-4">
        <div className="form-grid" style={{ maxWidth: 680 }}>
          <label className="span-2">
            <div>Search</div>
            <input type="text" placeholder="Type a customerâ€¦" value={q} onChange={e=>setQ(e.target.value)} />
          </label>
          <div className="span-2">
            {isLoading ? <div className="muted-sm">Loadingâ€¦</div> : null}
            <ul className="space-y-2">
              {items.map(it => (
                <li key={it.id} className="flex items-center justify-between border border-[var(--border)] rounded-[10px] p-2 bg-[var(--card-2)]">
                  <span>{it.name}</span>
                  <span className="flex gap-2">
                    <button className="btn" onClick={()=>rename(it.id, it.name)}>Rename</button>
                    <button className="btn ghost" onClick={()=>remove(it.id)}>Delete</button>
                  </span>
                </li>
              ))}
              {items.length === 0 && !isLoading ? (<li className="muted-sm">No customers</li>) : null}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}


