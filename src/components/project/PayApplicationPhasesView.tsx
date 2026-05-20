"use client";

import { cn } from "@/lib/theme";
import type { ProjectPayItemView } from "@/app/projects/projects.models";
import { PAY_ITEM_LABEL } from "@/components/project/payApplicationConstants";
import type {
  Phase,
  PhaseItem,
} from "@/components/project/payApplicationTypes";

function sumQtyForPayItemExcludingRow(
  phases: Phase[],
  projectPayItemId: number,
  excludePhaseId: string,
  excludeItemId: string,
): number {
  let sum = 0;
  for (const ph of phases) {
    for (const it of ph.items) {
      if (it.projectPayItemId !== projectPayItemId) continue;
      if (ph.id === excludePhaseId && it.id === excludeItemId) continue;
      const q = Number(it.quantity);
      sum += Number.isFinite(q) ? q : 0;
    }
  }
  return sum;
}

function maxQtyAllowedForRow(
  item: PhaseItem,
  phaseId: string,
  phases: Phase[],
): number {
  if (item.projectPayItemId == null) return Number.POSITIVE_INFINITY;
  const contracted = item.contractedQuantity;
  if (!Number.isFinite(contracted) || contracted < 0)
    return Number.POSITIVE_INFINITY;
  const elsewhere = sumQtyForPayItemExcludingRow(
    phases,
    item.projectPayItemId,
    phaseId,
    item.id,
  );
  return Math.max(0, contracted - elsewhere);
}

type StatusTone = {
  pill: string;
  dot: string;
  text: string;
};

function statusTone(status: string): StatusTone {
  const value = status.toLowerCase().trim();
  if (!value) {
    return {
      pill: "bg-white/10 text-white/70",
      dot: "bg-white/40",
      text: "text-white/70",
    };
  }
  if (
    value.includes("complete") ||
    value.includes("done") ||
    value.includes("approved")
  ) {
    return {
      pill: "bg-emerald-500/15 text-emerald-300",
      dot: "bg-emerald-400",
      text: "text-emerald-300",
    };
  }
  if (value.includes("pending") || value.includes("review")) {
    return {
      pill: "bg-amber-500/15 text-amber-300",
      dot: "bg-amber-400",
      text: "text-amber-300",
    };
  }
  if (
    value.includes("progress") ||
    value.includes("active") ||
    value.includes("started")
  ) {
    return {
      pill: "bg-sky-500/15 text-sky-300",
      dot: "bg-sky-400",
      text: "text-sky-300",
    };
  }
  if (
    value.includes("hold") ||
    value.includes("block") ||
    value.includes("issue")
  ) {
    return {
      pill: "bg-rose-500/15 text-rose-300",
      dot: "bg-rose-400",
      text: "text-rose-300",
    };
  }
  return {
    pill: "bg-white/10 text-white",
    dot: "bg-white/60",
    text: "text-white",
  };
}

function progressTone(percent: number) {
  if (percent >= 100)
    return { bar: "bg-emerald-400", text: "text-emerald-300" };
  if (percent >= 50) return { bar: "bg-amber-400", text: "text-amber-300" };
  return { bar: "bg-white/30", text: "text-white/55" };
}

function FieldShell({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-white/10 bg-black/25 px-2.5 py-1.5",
        className,
      )}
    >
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/45">
        {label}
      </p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}

type PhasesViewProps = {
  phaseSearch: string;
  onPhaseSearchChange: (value: string) => void;
  phases: Phase[];
  filteredPhases: Phase[];
  payLines: ProjectPayItemView[];
  onUpdatePhase: (phaseId: string, updates: Partial<Phase>) => void;
  onTogglePhaseBoolean: (
    phaseId: string,
    key: "onsiteReview" | "surveyed",
  ) => void;
  onUpdatePhaseItem: (
    phaseId: string,
    itemId: string,
    updates: Partial<PhaseItem>,
  ) => void;
  onAddPhase: () => void;
  onAddPayItemToPhase: (phaseId: string, projectPayItemId: number) => void;
  invoiceNumber: string;
};

export function PayApplicationPhasesView({
  phaseSearch,
  onPhaseSearchChange,
  phases,
  filteredPhases,
  payLines,
  onUpdatePhase,
  onTogglePhaseBoolean,
  onUpdatePhaseItem,
  onAddPhase,
  onAddPayItemToPhase,
  invoiceNumber,
}: PhasesViewProps) {
  const trimmedInvoice = invoiceNumber.trim();
  const addablePayLines = payLines.filter((line) => {
    if (line.id.startsWith("temp-")) return false;
    const id = Number(line.id);
    return Number.isInteger(id) && id > 0;
  });

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Phases</p>
          <p className="text-xs text-white/60">
            Per-phase quantities, readiness, and notes. Search by phase
            number/name.
          </p>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2">
          <input
            type="text"
            value={phaseSearch}
            onChange={(event) => onPhaseSearchChange(event.target.value)}
            placeholder="Search phases..."
            className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60 md:w-64"
          />
          <button
            type="button"
            onClick={onAddPhase}
            className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
          >
            Add Phase
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredPhases.map((phase) => {
          const tone = statusTone(phase.status);
          const totalQuantity = phase.items.reduce(
            (sum, item) => sum + (Number(item.quantity) || 0),
            0,
          );
          const totalInstalled = phase.items.reduce(
            (sum, item) => sum + (Number(item.installedQty) || 0),
            0,
          );
          const totalPct = totalQuantity
            ? Math.min(100, (totalInstalled / totalQuantity) * 100)
            : 0;
          const totalTone = progressTone(totalPct);
          const itemCount = phase.items.length;

          return (
            <div
              key={phase.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-nowrap items-center gap-2">
                    <span className="text-lg font-semibold text-white">
                      {trimmedInvoice || (
                        <span className="italic text-white/40">
                          Set invoice #
                        </span>
                      )}
                    </span>
                    <input
                      type="text"
                      value={phase.invoiceSuffix}
                      onChange={(event) =>
                        onUpdatePhase(phase.id, {
                          invoiceSuffix: event.target.value
                            .replace(/[^A-Za-z]/g, "")
                            .toUpperCase()
                            .slice(0, 3),
                        })
                      }
                      maxLength={3}
                      size={Math.max(phase.invoiceSuffix.length, 1)}
                      aria-label="Invoice letter"
                      placeholder="A"
                      className="h-7 w-auto min-w-[1.75rem] rounded-md border border-white/20 bg-black/30 px-1.5 text-center text-base font-semibold uppercase leading-none text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                    />
                  </div>
                  <p className="text-xs text-white/55">
                    Phase prerequisites and locate details
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                    tone.pill,
                  )}
                >
                  <span className={cn("size-1.5 rounded-full", tone.dot)} />
                  {phase.status?.trim() || "-"}
                </span>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <FieldShell label="Locate Ticket #" className="lg:col-span-2">
                  <input
                    value={phase.locateTicket}
                    onChange={(event) =>
                      onUpdatePhase(phase.id, {
                        locateTicket: event.target.value,
                      })
                    }
                    className="w-full bg-transparent text-[13px] leading-tight text-white placeholder:italic placeholder:text-white/40 focus:outline-none"
                    placeholder="Not set"
                  />
                </FieldShell>
                <FieldShell label="Date Created">
                  <input
                    type="date"
                    value={phase.dateCreated}
                    onChange={(event) =>
                      onUpdatePhase(phase.id, {
                        dateCreated: event.target.value,
                      })
                    }
                    className="w-full bg-transparent py-0 font-mono text-[13px] leading-tight text-white outline-none [color-scheme:dark]"
                  />
                </FieldShell>
                <FieldShell label="Ready to Work">
                  <input
                    type="date"
                    value={phase.readyToWorkDate}
                    onChange={(event) =>
                      onUpdatePhase(phase.id, {
                        readyToWorkDate: event.target.value,
                      })
                    }
                    className="w-full bg-transparent py-0 font-mono text-[13px] leading-tight text-white outline-none [color-scheme:dark]"
                  />
                </FieldShell>
                <FieldShell label="Onsite Review">
                  <button
                    type="button"
                    onClick={() =>
                      onTogglePhaseBoolean(phase.id, "onsiteReview")
                    }
                    className={cn(
                      "text-left text-[13px] font-semibold leading-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60",
                      phase.onsiteReview ? "text-emerald-300" : "text-white",
                    )}
                  >
                    {phase.onsiteReview ? "Yes" : "No"}
                  </button>
                </FieldShell>
                <FieldShell label="Surveyed">
                  <button
                    type="button"
                    onClick={() => onTogglePhaseBoolean(phase.id, "surveyed")}
                    className={cn(
                      "text-left text-[13px] font-semibold leading-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60",
                      phase.surveyed ? "text-emerald-300" : "text-white",
                    )}
                  >
                    {phase.surveyed ? "Yes" : "No"}
                  </button>
                </FieldShell>
                <FieldShell label="Status">
                  <input
                    value={phase.status}
                    onChange={(event) =>
                      onUpdatePhase(phase.id, { status: event.target.value })
                    }
                    className={cn(
                      "w-full bg-transparent text-[13px] font-semibold leading-tight focus:outline-none",
                      tone.text,
                    )}
                    placeholder="Not set"
                  />
                </FieldShell>
                <FieldShell label="Status Date">
                  <input
                    type="date"
                    value={phase.statusDate}
                    onChange={(event) =>
                      onUpdatePhase(phase.id, {
                        statusDate: event.target.value,
                      })
                    }
                    className="w-full bg-transparent py-0 font-mono text-[13px] leading-tight text-white outline-none [color-scheme:dark]"
                  />
                </FieldShell>
                <FieldShell
                  label="Notes"
                  className="sm:col-span-2 lg:col-span-4"
                >
                  <textarea
                    value={phase.notes ?? ""}
                    onChange={(event) =>
                      onUpdatePhase(phase.id, { notes: event.target.value })
                    }
                    rows={2}
                    className="w-full resize-none bg-transparent text-[13px] leading-snug text-white placeholder:italic placeholder:text-white/40 focus:outline-none"
                    placeholder="Add notes for this phase..."
                  />
                </FieldShell>
              </div>

              <div className="mt-5 border-t border-white/10 pt-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">
                    Pay Items
                  </p>
                  <p className="text-[11px] tabular-nums text-white/55">
                    {itemCount} {itemCount === 1 ? "item" : "items"} ·{" "}
                    {totalInstalled.toLocaleString()} of{" "}
                    {totalQuantity.toLocaleString()} installed
                  </p>
                </div>

                <div className="mt-3 hidden grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)_90px_90px_140px_60px] items-center gap-3 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45 md:grid">
                  <span>{PAY_ITEM_LABEL}</span>
                  <span>Description</span>
                  <span>Line Note</span>
                  <span className="text-right">Quantity</span>
                  <span className="text-right">Installed</span>
                  <span>Progress</span>
                  <span className="text-right">%</span>
                </div>

                <div className="mt-1">
                  {phase.items.map((item) => {
                    const maxQuantity = maxQtyAllowedForRow(
                      item,
                      phase.id,
                      phases,
                    );
                    const hasCap =
                      item.projectPayItemId != null &&
                      Number.isFinite(maxQuantity);
                    const currentQuantity = Number(item.quantity);
                    const safeQuantity = Number.isFinite(currentQuantity)
                      ? currentQuantity
                      : 0;
                    const installed = Number(item.installedQty) || 0;
                    const percent = safeQuantity
                      ? Math.min(100, (installed / safeQuantity) * 100)
                      : 0;
                    const itemTone = progressTone(percent);
                    const elsewhere =
                      item.projectPayItemId != null
                        ? sumQtyForPayItemExcludingRow(
                            phases,
                            item.projectPayItemId,
                            phase.id,
                            item.id,
                          )
                        : 0;
                    const allocatedTotal = elsewhere + safeQuantity;
                    const cap = item.contractedQuantity;

                    return (
                      <div
                        key={item.id}
                        className="grid grid-cols-2 items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition hover:bg-white/[0.04] md:grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)_90px_90px_140px_60px] md:gap-3 md:py-2"
                      >
                        <div className="font-mono text-[12px] font-semibold tracking-tight text-white">
                          {item.payItem}
                        </div>
                        <div
                          className="min-w-0 truncate text-[13px] text-white/85"
                          title={item.description}
                        >
                          {item.description}
                        </div>
                        <div className="col-span-2 min-w-0 md:col-span-1">
                          <label
                            className="sr-only"
                            htmlFor={`phase-line-desc-${item.id}`}
                          >
                            Phase line description for {item.payItem}
                          </label>
                          <input
                            id={`phase-line-desc-${item.id}`}
                            value={item.lineDescription ?? ""}
                            onChange={(event) =>
                              onUpdatePhaseItem(phase.id, item.id, {
                                lineDescription: event.target.value,
                              })
                            }
                            className="w-full rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[12px] text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                            placeholder="Line note"
                          />
                        </div>
                        <div className="text-right">
                          <input
                            type="number"
                            min={0}
                            max={hasCap ? maxQuantity : undefined}
                            step="0.01"
                            value={item.quantity}
                            onChange={(event) => {
                              const raw = Number(event.target.value);
                              let next = Number.isNaN(raw) ? 0 : raw;
                              if (hasCap)
                                next = Math.min(Math.max(0, next), maxQuantity);
                              else next = Math.max(0, next);
                              onUpdatePhaseItem(phase.id, item.id, {
                                quantity: next,
                              });
                            }}
                            aria-label={`Phase quantity for ${item.payItem}`}
                            className="ml-auto h-7 w-full max-w-[82px] rounded-md border border-white/10 bg-black/30 px-2 text-right text-[13px] font-semibold tabular-nums text-white placeholder:text-white/40 focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                          />
                        </div>
                        <div className="text-right text-[13px] font-semibold tabular-nums text-white">
                          {installed.toLocaleString()}
                        </div>
                        <div className="col-span-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07] md:col-span-1">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              itemTone.bar,
                            )}
                            style={{ width: `${Math.max(percent, 2)}%` }}
                            role="progressbar"
                            aria-valuenow={percent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${item.description} progress`}
                          />
                        </div>
                        <div
                          className={cn(
                            "col-span-2 text-right text-[13px] font-bold tabular-nums md:col-span-1",
                            itemTone.text,
                          )}
                        >
                          {percent.toFixed(1)}%
                        </div>
                        {item.projectPayItemId != null &&
                        Number.isFinite(cap) ? (
                          <p className="col-span-2 text-[11px] text-white/45 md:col-span-full">
                            Allocated across phases:{" "}
                            {allocatedTotal.toLocaleString()} /{" "}
                            {cap.toLocaleString()} contracted
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                  {phase.items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-white/15 bg-black/20 px-3 py-3 text-xs text-white/50">
                      No pay items in this phase yet.
                    </div>
                  ) : null}
                </div>

                {phase.items.length > 0 ? (
                  <div className="mt-2 hidden grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)_90px_90px_140px_60px] items-center gap-3 border-t border-white/10 px-3 pt-3 text-sm md:grid">
                    <div className="font-semibold text-white">Total</div>
                    <div />
                    <div />
                    <div className="text-right tabular-nums text-white">
                      {totalQuantity.toLocaleString()}
                    </div>
                    <div className="text-right tabular-nums text-white">
                      {totalInstalled.toLocaleString()}
                    </div>
                    <div />
                    <div
                      className={cn(
                        "text-right text-[13px] font-bold tabular-nums",
                        totalTone.text,
                      )}
                    >
                      {totalPct.toFixed(1)}%
                    </div>
                  </div>
                ) : null}

                <div className="mt-3 flex flex-col gap-1 border-t border-white/10 pt-3 sm:flex-row sm:items-center sm:gap-3">
                  <label
                    className="shrink-0 text-xs font-semibold text-white/60"
                    htmlFor={`add-pay-${phase.id}`}
                  >
                    Add pay item
                  </label>
                  <select
                    id={`add-pay-${phase.id}`}
                    aria-label={`Add a saved contract pay item to ${phase.name}`}
                    className="w-full max-w-md rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white focus:border-blue-400/60 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                    value=""
                    onChange={(event) => {
                      const value = event.target.value;
                      if (!value) return;
                      onAddPayItemToPhase(phase.id, Number(value));
                      event.currentTarget.selectedIndex = 0;
                    }}
                  >
                    <option value="">Choose a pay item...</option>
                    {addablePayLines
                      .filter(
                        (line) =>
                          !phase.items.some(
                            (item) => item.projectPayItemId === Number(line.id),
                          ),
                      )
                      .map((line) => (
                        <option key={line.id} value={line.id}>
                          {line.payItemNumber} -{" "}
                          {line.payItemDescription.length > 70
                            ? `${line.payItemDescription.slice(0, 70)}...`
                            : line.payItemDescription}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
        {!filteredPhases.length ? (
          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/70">
            {phases.length === 0
              ? "No phases yet. Use Add Phase to start, then Save phases when ready."
              : "No phases match your search."}
          </div>
        ) : null}
      </div>
    </div>
  );
}
