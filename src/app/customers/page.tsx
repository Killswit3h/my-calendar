"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";

import { PageHeader } from "@/components/ui/PageHeader";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function CustomersPage() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [limit, setLimit] = useState(100);

  useMemo(() => {
    const id = setTimeout(() => setDebouncedQ(q), 200);
    return () => clearTimeout(id);
  }, [q]);

  const { data, mutate, isLoading } = useSWR<{ items: { id: string; name: string }[] }>(
    `/api/customers?search=${encodeURIComponent(debouncedQ)}&limit=${limit}`,
    fetcher,
  );
  const items = data?.items ?? [];

  async function rename(id: string, current: string) {
    const name = prompt("Rename customer", current);
    if (!name || name.trim() === current) return;
    const r = await fetch(`/api/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!r.ok) {
      alert("Rename failed");
      return;
    }
    mutate();
  }

  async function remove(id: string) {
    if (!confirm("Delete this customer?")) return;
    const r = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    if (!r.ok && r.status !== 204) {
      alert("Delete failed");
      return;
    }
    mutate();
  }

  return (
    <main className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage your customer list, imports, and quick edits."
        actions={
          <div className="flex items-center gap-3">
            <Link
              href="/customers/import"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-contrast)] shadow hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              Import CSV
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
            >
              Back
            </Link>
          </div>
        }
      />

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-3xl border border-white/10 bg-black/40 p-4 shadow-[0_30px_80px_rgba(3,6,23,0.5)] backdrop-blur-2xl sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="w-full max-w-xl space-y-2">
              <p className="text-xs uppercase tracking-[0.28em] text-white/60">Search</p>
              <input
                type="text"
                placeholder="Type a customer"
                value={q}
                onChange={e => setQ(e.target.value)}
                className="w-full rounded-2xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/50 shadow-inner focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>
            <div className="text-sm text-white/60">
              {isLoading ? "Loading…" : `${items.length} customer${items.length === 1 ? "" : "s"}`}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="max-h-[70vh] overflow-y-auto pr-1" aria-label="Customers list" role="region">
              <ul className="space-y-2">
                {items.map(it => (
                  <li
                    key={it.id}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-3 py-2 shadow-inner"
                  >
                    <span className="font-medium text-white">{it.name}</span>
                    <span className="flex gap-2">
                      <button className="btn" onClick={() => rename(it.id, it.name)}>
                        Rename
                      </button>
                      <button className="btn ghost" onClick={() => remove(it.id)}>
                        Delete
                      </button>
                    </span>
                  </li>
                ))}
                {items.length === 0 && !isLoading ? (
                  <li className="muted-sm">No customers</li>
                ) : null}
              </ul>
            </div>

            {items.length >= limit ? (
              <div className="mt-3 flex justify-center">
                <button className="btn" onClick={() => setLimit(l => l + 200)}>
                  Load more
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/30 p-4 text-sm text-white/70 shadow-[0_30px_80px_rgba(3,6,23,0.5)] backdrop-blur-2xl sm:p-6">
          <h3 className="text-lg font-semibold text-white">Tips</h3>
          <ul className="mt-3 space-y-2 text-white/70">
            <li>Use Import CSV to bulk-create customers with IDs and names.</li>
            <li>Search is debounced automatically; keep typing to refine results.</li>
            <li>Rename and Delete actions update instantly in the list.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}

