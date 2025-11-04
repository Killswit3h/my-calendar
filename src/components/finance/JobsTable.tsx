"use client";

import useSWR from "swr";
import { WarningsChip } from "@/components/finance/WarningsChip";
import { FinanceJobRow } from "@/lib/finance/types";

const fetcher = (url: string) => fetch(url).then(r => r.json());

type JobsResponse = { ok: true; rows: FinanceJobRow[] } | { ok: false; error?: string };

export default function JobsTable() {
  const { data, error } = useSWR<JobsResponse>("/api/finance/jobs", fetcher, {
    revalidateOnFocus: false,
  });
  if (error) return <div className="p-4 text-red-400">Failed to load jobs.</div>;
  if (!data) return <div className="p-4 text-neutral-300">Loading…</div>;
  if (!data.ok) {
    return (
      <div className="p-4 text-red-400">
        {data.error || "Unable to load jobs."}
      </div>
    );
  }
  const rows = data.rows ?? [];

  return (
    <div className="overflow-auto rounded-xl border border-neutral-800">
      <table className="min-w-full text-sm">
        <thead className="bg-neutral-900">
          <tr className="text-neutral-300">
            <th className="px-3 py-2 text-left">Job</th>
            <th className="px-3 py-2 text-left">Customer</th>
            <th className="px-3 py-2 text-right">Crew</th>
            <th className="px-3 py-2 text-right">Days</th>
            <th className="px-3 py-2 text-right">Hours</th>
            <th className="px-3 py-2 text-right">Labor Cost</th>
            <th className="px-3 py-2 text-center">Warnings</th>
            <th className="px-3 py-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {rows.map((r, idx) => (
            <tr key={r.jobId || r.jobSlug || idx} className="text-neutral-100">
              <td className="px-3 py-2">{r.jobName}</td>
              <td className="px-3 py-2">{r.customerName || "—"}</td>
              <td className="px-3 py-2 text-right">{r.crewCount}</td>
              <td className="px-3 py-2 text-right">{r.totalDays}</td>
              <td className="px-3 py-2 text-right">{r.totalHours}</td>
              <td className="px-3 py-2 text-right">${r.totalLaborCost.toLocaleString()}</td>
              <td className="px-3 py-2 text-center">
                <WarningsChip count={r.warnings.length} items={r.warnings} />
              </td>
              <td className="px-3 py-2 text-center">
                {r.detailsUrl ? (
                  <a href={r.detailsUrl} className="rounded-md bg-neutral-800 px-2 py-1 text-xs text-neutral-100 hover:bg-neutral-700">
                    View details
                  </a>
                ) : <span className="text-neutral-500">Link unavailable</span>}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="px-3 py-6 text-center text-neutral-400">No jobs found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
