"use client";

import type { ProjectPayItemView } from "@/app/projects/projects.models";
import { PAY_ITEM_LABEL } from "@/components/project/payApplicationConstants";

function toDateInputValue(iso?: string): string {
  if (!iso?.trim()) return "";
  const s = iso.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const t = Date.parse(s);
  if (Number.isNaN(t)) return "";
  return new Date(t).toISOString().slice(0, 10);
}

type PhasesViewProps = {
  lineSearch: string;
  onLineSearchChange: (value: string) => void;
  payLines: ProjectPayItemView[];
  onUpdateLine: (id: string, updates: Partial<ProjectPayItemView>) => void;
  onRemoveLine: (id: string) => void;
};

export function PayApplicationPhasesView({
  lineSearch,
  onLineSearchChange,
  payLines,
  onUpdateLine,
  onRemoveLine,
}: PhasesViewProps) {
  const term = lineSearch.trim().toLowerCase();
  const filtered = term
    ? payLines.filter(
        (row) =>
          row.payItemNumber.toLowerCase().includes(term) ||
          row.payItemDescription.toLowerCase().includes(term),
      )
    : payLines;

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Pay lines</p>
          <p className="text-xs text-white/60">
            One row per contract line. Installed quantities come from the calendar only.
          </p>
        </div>
        <input
          type="text"
          value={lineSearch}
          onChange={(event) => onLineSearchChange(event.target.value)}
          placeholder="Search by pay item or description…"
          className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60 md:w-72"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-left text-sm text-white">
          <thead>
            <tr className="border-b border-white/10 text-xs text-white/60">
              <th className="py-2 pr-2 font-medium">{PAY_ITEM_LABEL}</th>
              <th className="py-2 pr-2 font-medium">Description</th>
              <th className="py-2 pr-2 font-medium text-right">Contract</th>
              <th className="py-2 pr-2 font-medium text-right">Installed</th>
              <th className="py-2 pr-2 font-medium">Begin st.</th>
              <th className="py-2 pr-2 font-medium">End st.</th>
              <th className="py-2 pr-2 font-medium">Locate</th>
              <th className="py-2 pr-2 font-medium">LF/RT</th>
              <th className="py-2 pr-2 font-medium">Onsite</th>
              <th className="py-2 pr-2 font-medium">Ready</th>
              <th className="py-2 pr-2 font-medium">Status</th>
              <th className="py-2 pr-2 font-medium">St. date</th>
              <th className="py-2 pr-2 font-medium text-center">Surveyed</th>
              <th className="py-2 pr-2 font-medium">Notes</th>
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} className="border-b border-white/5 align-top">
                <td className="py-2 pr-2 font-semibold">{row.payItemNumber}</td>
                <td className="py-2 pr-2 text-white/75">{row.payItemDescription}</td>
                <td className="py-2 pr-2">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={row.contractedQuantity}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      onUpdateLine(row.id, {
                        contractedQuantity: Number.isNaN(v) || v < 0 ? 0 : v,
                      });
                    }}
                    className="w-full min-w-[4.5rem] rounded border border-white/15 bg-black/40 px-2 py-1 text-right text-white"
                  />
                </td>
                <td className="py-2 pr-2 text-right text-white/70">
                  {row.installedQuantity.toLocaleString()}
                </td>
                <td className="py-2 pr-2">
                  <input
                    value={row.beginStation ?? ""}
                    onChange={(e) => onUpdateLine(row.id, { beginStation: e.target.value })}
                    className="w-full min-w-[5rem] rounded border border-white/15 bg-black/40 px-2 py-1 text-white"
                  />
                </td>
                <td className="py-2 pr-2">
                  <input
                    value={row.endStation ?? ""}
                    onChange={(e) => onUpdateLine(row.id, { endStation: e.target.value })}
                    className="w-full min-w-[5rem] rounded border border-white/15 bg-black/40 px-2 py-1 text-white"
                  />
                </td>
                <td className="py-2 pr-2">
                  <input
                    value={row.locateTicket ?? ""}
                    onChange={(e) => onUpdateLine(row.id, { locateTicket: e.target.value })}
                    className="w-full min-w-[5rem] rounded border border-white/15 bg-black/40 px-2 py-1 text-white"
                  />
                </td>
                <td className="py-2 pr-2">
                  <input
                    value={row.lfRt ?? ""}
                    onChange={(e) => onUpdateLine(row.id, { lfRt: e.target.value })}
                    className="w-full min-w-[4rem] rounded border border-white/15 bg-black/40 px-2 py-1 text-white"
                  />
                </td>
                <td className="py-2 pr-2">
                  <input
                    value={row.onsiteReview ?? ""}
                    onChange={(e) => onUpdateLine(row.id, { onsiteReview: e.target.value })}
                    className="w-full min-w-[4rem] rounded border border-white/15 bg-black/40 px-2 py-1 text-white"
                    placeholder="—"
                  />
                </td>
                <td className="py-2 pr-2">
                  <input
                    type="date"
                    value={toDateInputValue(row.readyToWorkDate)}
                    onChange={(e) =>
                      onUpdateLine(row.id, {
                        readyToWorkDate: e.target.value ? `${e.target.value}T12:00:00.000Z` : undefined,
                      })
                    }
                    className="w-full min-w-[9rem] rounded border border-white/15 bg-black/40 px-2 py-1 text-white"
                  />
                </td>
                <td className="py-2 pr-2">
                  <input
                    value={row.status ?? ""}
                    onChange={(e) => onUpdateLine(row.id, { status: e.target.value })}
                    className="w-full min-w-[5rem] rounded border border-white/15 bg-black/40 px-2 py-1 text-white"
                  />
                </td>
                <td className="py-2 pr-2">
                  <input
                    type="date"
                    value={toDateInputValue(row.statusDate)}
                    onChange={(e) =>
                      onUpdateLine(row.id, {
                        statusDate: e.target.value ? `${e.target.value}T12:00:00.000Z` : undefined,
                      })
                    }
                    className="w-full min-w-[9rem] rounded border border-white/15 bg-black/40 px-2 py-1 text-white"
                  />
                </td>
                <td className="py-2 pr-2 text-center">
                  <input
                    type="checkbox"
                    checked={Boolean(row.surveyed)}
                    onChange={(e) => onUpdateLine(row.id, { surveyed: e.target.checked })}
                    className="h-4 w-4 rounded border-white/30"
                  />
                </td>
                <td className="py-2 pr-2">
                  <textarea
                    value={row.notes ?? ""}
                    onChange={(e) => onUpdateLine(row.id, { notes: e.target.value })}
                    rows={2}
                    className="w-full min-w-[8rem] rounded border border-white/15 bg-black/40 px-2 py-1 text-white"
                  />
                </td>
                <td className="py-2">
                  <button
                    type="button"
                    onClick={() => onRemoveLine(row.id)}
                    className="whitespace-nowrap rounded border border-red-500/40 px-2 py-1 text-xs font-semibold text-red-200 hover:bg-red-500/10"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!filtered.length ? (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
          {payLines.length ? "No lines match your search." : "No pay lines yet. Add one on the Contract tab."}
        </div>
      ) : null}
    </div>
  );
}
